import { createServer } from 'node:http';
import { createHmac, randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';
import { promises as fs } from 'node:fs';
import { dirname, extname, join, resolve, sep } from 'node:path';
import { promisify } from 'node:util';
import { parse as parseYaml, stringify as stringifyYaml } from 'yaml';

const scrypt = promisify(scryptCallback);
const port = Number(process.env.ADMIN_PORT || 8787);
const host = process.env.ADMIN_HOST || '127.0.0.1';
const production = process.env.NODE_ENV === 'production';
const mode = process.env.CONTENT_BACKEND || (production ? 'github' : 'local');
const username = process.env.ADMIN_USERNAME || (production ? '' : 'admin');
const passwordHash = process.env.ADMIN_PASSWORD_HASH || '';
const devPassword = process.env.ADMIN_DEV_PASSWORD || '';
const sessionSecret = process.env.SESSION_SECRET || (!production ? 'local-development-secret-change-before-production' : '');
const sessionTtlSeconds = Math.max(900, Number(process.env.SESSION_TTL_SECONDS || 43_200));
const repository = process.env.GITHUB_REPOSITORY || 'yanmengli123/ymllblog';
const branch = process.env.GITHUB_BRANCH || 'main';
const githubToken = process.env.GITHUB_TOKEN || '';
const projectRoot = resolve(process.env.PROJECT_ROOT || process.cwd());
const postsDir = resolve(projectRoot, 'src/content/blog');
const uploadsDir = resolve(projectRoot, 'public/uploads');
const cookieName = production ? '__Host-ymll_admin' : 'ymll_admin';
const loginAttempts = new Map();
const maxJsonBytes = 2 * 1024 * 1024;
const maxUploadBytes = 5 * 1024 * 1024;
const editableFields = ['title', 'description', 'pubDate', 'updatedDate', 'author', 'tags', 'category', 'cover', 'draft', 'featured', 'lang'];

if (!username || !sessionSecret || (production && !passwordHash)) {
  throw new Error('生产环境必须配置 ADMIN_USERNAME、ADMIN_PASSWORD_HASH 和 SESSION_SECRET');
}
if (production && sessionSecret.length < 32) throw new Error('SESSION_SECRET 至少需要 32 个字符');
if (mode === 'github' && !githubToken) throw new Error('GitHub 内容后端必须配置 GITHUB_TOKEN');

function json(res, status, body, extraHeaders = {}) {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
    ...extraHeaders,
  });
  res.end(JSON.stringify(body));
}

function textResponse(res, status, body) {
  res.writeHead(status, { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(body);
}

function parseCookies(header = '') {
  return Object.fromEntries(header.split(';').map((item) => item.trim()).filter(Boolean).map((item) => {
    const index = item.indexOf('=');
    return [decodeURIComponent(item.slice(0, index)), decodeURIComponent(item.slice(index + 1))];
  }));
}

const encode = (value) => Buffer.from(value).toString('base64url');
const sign = (value) => createHmac('sha256', sessionSecret).update(value).digest('base64url');

function createSession() {
  const payload = encode(JSON.stringify({ sub: username, exp: Math.floor(Date.now() / 1000) + sessionTtlSeconds, csrf: randomBytes(24).toString('base64url') }));
  return `${payload}.${sign(payload)}`;
}

function readSession(req) {
  const token = parseCookies(req.headers.cookie)[cookieName];
  if (!token) return null;
  const [payload, signature] = token.split('.');
  if (!payload || !signature) return null;
  const expected = Buffer.from(sign(payload));
  const actual = Buffer.from(signature);
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) return null;
  try {
    const session = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    return session.sub === username && session.exp > Date.now() / 1000 ? session : null;
  } catch {
    return null;
  }
}

function sessionCookie(value, maxAge = sessionTtlSeconds) {
  return `${cookieName}=${value}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${maxAge}${production ? '; Secure' : ''}`;
}

async function readJson(req, limit = maxJsonBytes) {
  const chunks = [];
  let length = 0;
  for await (const chunk of req) {
    length += chunk.length;
    if (length > limit) throw Object.assign(new Error('请求内容过大'), { status: 413 });
    chunks.push(chunk);
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}');
  } catch {
    throw Object.assign(new Error('JSON 格式无效'), { status: 400 });
  }
}

function safeStringEqual(left, right) {
  const a = Buffer.from(String(left));
  const b = Buffer.from(String(right));
  return a.length === b.length && timingSafeEqual(a, b);
}

async function verifyPassword(password) {
  if (!production && !passwordHash) return Boolean(devPassword) && safeStringEqual(password, devPassword);
  const [algorithm, parameters, salt64, digest64] = passwordHash.split('$');
  if (algorithm !== 'scrypt' || !parameters || !salt64 || !digest64) return false;
  const options = Object.fromEntries(parameters.split(',').map((item) => item.split('=')));
  const salt = Buffer.from(salt64, 'base64url');
  const expected = Buffer.from(digest64, 'base64url');
  const actual = await scrypt(password, salt, expected.length, { N: Number(options.N), r: Number(options.r), p: Number(options.p), maxmem: 64 * 1024 * 1024 });
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

const clientKey = (req) => String(req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown').split(',')[0].trim();

function canAttemptLogin(req) {
  const key = clientKey(req);
  const now = Date.now();
  const state = loginAttempts.get(key) || { count: 0, startedAt: now, blockedUntil: 0 };
  if (state.blockedUntil > now) return { ok: false, retryAfter: Math.ceil((state.blockedUntil - now) / 1000) };
  if (now - state.startedAt > 15 * 60_000) loginAttempts.delete(key);
  return { ok: true, key };
}

function recordLoginFailure(key) {
  const now = Date.now();
  const state = loginAttempts.get(key) || { count: 0, startedAt: now, blockedUntil: 0 };
  state.count += 1;
  if (state.count >= 5) state.blockedUntil = now + 15 * 60_000;
  loginAttempts.set(key, state);
}

function requireAuth(req, res, write = false) {
  const session = readSession(req);
  if (!session) {
    json(res, 401, { error: '请先登录' });
    return null;
  }
  if (write && !safeStringEqual(req.headers['x-csrf-token'] || '', session.csrf)) {
    json(res, 403, { error: '安全令牌已失效，请刷新页面后重试' });
    return null;
  }
  return session;
}

function normalizeSlug(value) {
  const slug = String(value || '').trim().toLowerCase();
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || slug.length > 100) {
    throw Object.assign(new Error('文件标识只能使用小写英文字母、数字和连字符'), { status: 400 });
  }
  return slug;
}

function parsePost(source, fallbackSlug = '') {
  if (!source.startsWith('---')) throw new Error('文章缺少 YAML Frontmatter');
  const boundary = source.indexOf('\n---', 3);
  if (boundary === -1) throw new Error('文章 Frontmatter 未闭合');
  const data = parseYaml(source.slice(3, boundary).trim()) || {};
  const body = source.slice(boundary + 4).replace(/^\r?\n/, '');
  return { slug: fallbackSlug, ...data, body };
}

function serializePost(input) {
  const data = {};
  for (const field of editableFields) {
    const value = input[field];
    if (value !== undefined && value !== '' && value !== null) data[field] = value;
  }
  data.title = String(data.title || '').trim();
  data.description = String(data.description || '').trim();
  data.author = String(data.author || 'YMLL').trim();
  data.tags = Array.isArray(data.tags) ? data.tags.map(String).map((tag) => tag.trim()).filter(Boolean) : [];
  data.draft = Boolean(data.draft);
  data.featured = Boolean(data.featured);
  data.lang = String(data.lang || 'zh-CN');
  if (!data.title || !data.description || !data.pubDate) throw Object.assign(new Error('标题、摘要和发布日期为必填项'), { status: 400 });
  return `---\n${stringifyYaml(data, { lineWidth: 0 }).trim()}\n---\n\n${String(input.body || '').trim()}\n`;
}

const summary = (post) => ({
  slug: post.slug,
  title: post.title || post.slug,
  description: post.description || '',
  pubDate: post.pubDate || '',
  updatedDate: post.updatedDate || '',
  draft: Boolean(post.draft),
  featured: Boolean(post.featured),
  category: post.category || '',
});

async function github(path, options = {}) {
  const response = await fetch(`https://api.github.com/repos/${repository}/${path}`, {
    ...options,
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${githubToken}`,
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'ymllblog-admin',
      ...options.headers,
    },
  });
  if (response.status === 404) return null;
  if (!response.ok) {
    const details = await response.json().catch(() => ({}));
    throw Object.assign(new Error(details.message || `GitHub API 返回 ${response.status}`), { status: response.status });
  }
  return response.status === 204 ? null : response.json();
}

async function listPosts() {
  if (mode === 'local') {
    const files = (await fs.readdir(postsDir)).filter((file) => /\.mdx?$/.test(file));
    return Promise.all(files.map(async (file) => summary(parsePost(await fs.readFile(join(postsDir, file), 'utf8'), file.replace(/\.mdx?$/, '')))));
  }
  const items = await github(`contents/src/content/blog?ref=${encodeURIComponent(branch)}`) || [];
  return Promise.all(items.filter((item) => item.type === 'file' && /\.mdx?$/.test(item.name)).map(async (item) => {
    const file = await github(`contents/${item.path}?ref=${encodeURIComponent(branch)}`);
    return summary(parsePost(Buffer.from(file.content, 'base64').toString('utf8'), item.name.replace(/\.mdx?$/, '')));
  }));
}

async function getPost(slug) {
  if (mode === 'local') return parsePost(await fs.readFile(join(postsDir, `${slug}.md`), 'utf8'), slug);
  const file = await github(`contents/src/content/blog/${slug}.md?ref=${encodeURIComponent(branch)}`);
  if (!file) return null;
  return { ...parsePost(Buffer.from(file.content, 'base64').toString('utf8'), slug), sha: file.sha };
}

async function savePost(slug, source, existingSha) {
  if (mode === 'local') {
    await fs.mkdir(postsDir, { recursive: true });
    await fs.writeFile(join(postsDir, `${slug}.md`), source, { encoding: 'utf8', flag: existingSha ? 'w' : 'wx' });
    return;
  }
  await github(`contents/src/content/blog/${slug}.md`, {
    method: 'PUT',
    body: JSON.stringify({ message: `content: ${existingSha ? '更新' : '新建'}文章 “${slug}”`, content: Buffer.from(source).toString('base64'), branch, ...(existingSha ? { sha: existingSha } : {}) }),
  });
}

async function deletePost(slug, sha) {
  if (mode === 'local') return fs.unlink(join(postsDir, `${slug}.md`));
  await github(`contents/src/content/blog/${slug}.md`, { method: 'DELETE', body: JSON.stringify({ message: `content: 删除文章 “${slug}”`, sha, branch }) });
}

function safeUploadName(name) {
  const clean = String(name || '').normalize('NFKC').replace(/[^a-zA-Z0-9._-]/g, '-').replace(/-+/g, '-').replace(/^[-.]+/, '');
  const allowed = new Set(['.png', '.jpg', '.jpeg', '.gif', '.webp']);
  if (!clean || !allowed.has(extname(clean).toLowerCase())) throw Object.assign(new Error('只支持 PNG、JPG、GIF 或 WebP 图片'), { status: 400 });
  return `${Date.now()}-${clean}`;
}

async function uploadMedia(name, content, contentType) {
  if (!/^image\/(png|jpeg|gif|webp)$/.test(contentType || '')) throw Object.assign(new Error('文件类型不是受支持的图片'), { status: 400 });
  const buffer = Buffer.from(String(content || ''), 'base64');
  if (!buffer.length || buffer.length > maxUploadBytes) throw Object.assign(new Error('图片不能为空且不能超过 5MB'), { status: 413 });
  const filename = safeUploadName(name);
  const date = new Date().toISOString().slice(0, 10);
  const relative = `uploads/${date}/${filename}`;
  if (mode === 'local') {
    const target = resolve(uploadsDir, date, filename);
    if (!target.startsWith(`${uploadsDir}${sep}`)) throw new Error('无效上传路径');
    await fs.mkdir(dirname(target), { recursive: true });
    await fs.writeFile(target, buffer, { flag: 'wx' });
  } else {
    await github(`contents/public/${relative}`, { method: 'PUT', body: JSON.stringify({ message: `content: 上传媒体 ${relative}`, content: buffer.toString('base64'), branch }) });
  }
  return `/${relative}`;
}

async function handler(req, res) {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const path = url.pathname.replace(/^\/ymllblog/, '');
  if (!path.startsWith('/admin-api/')) return textResponse(res, 404, 'Not found');
  try {
    if (req.method === 'GET' && path === '/admin-api/health') return json(res, 200, { ok: true });
    if (req.method === 'POST' && path === '/admin-api/login') {
      const attempt = canAttemptLogin(req);
      if (!attempt.ok) return json(res, 429, { error: '登录尝试过多，请稍后再试' }, { 'Retry-After': String(attempt.retryAfter) });
      const input = await readJson(req, 16 * 1024);
      const validUser = safeStringEqual(String(input.username || ''), username);
      const validPassword = await verifyPassword(String(input.password || ''));
      if (!validUser || !validPassword) {
        recordLoginFailure(attempt.key);
        return json(res, 401, { error: '用户名或密码错误' });
      }
      loginAttempts.delete(attempt.key);
      const token = createSession();
      const session = JSON.parse(Buffer.from(token.split('.')[0], 'base64url').toString('utf8'));
      return json(res, 200, { authenticated: true, username, csrfToken: session.csrf }, { 'Set-Cookie': sessionCookie(token) });
    }
    if (req.method === 'GET' && path === '/admin-api/session') {
      const session = requireAuth(req, res);
      if (!session) return;
      return json(res, 200, { authenticated: true, username: session.sub, csrfToken: session.csrf, expiresAt: new Date(session.exp * 1000).toISOString() });
    }
    if (req.method === 'POST' && path === '/admin-api/logout') {
      if (!requireAuth(req, res, true)) return;
      return json(res, 200, { ok: true }, { 'Set-Cookie': sessionCookie('', 0) });
    }
    if (req.method === 'GET' && path === '/admin-api/posts') {
      if (!requireAuth(req, res)) return;
      const posts = await listPosts();
      posts.sort((a, b) => String(b.pubDate).localeCompare(String(a.pubDate)));
      return json(res, 200, { posts });
    }
    const match = path.match(/^\/admin-api\/posts\/([a-z0-9-]+)$/);
    if (req.method === 'GET' && match) {
      if (!requireAuth(req, res)) return;
      const post = await getPost(normalizeSlug(match[1]));
      return post ? json(res, 200, { post }) : json(res, 404, { error: '文章不存在' });
    }
    if ((req.method === 'POST' && path === '/admin-api/posts') || (req.method === 'PUT' && match)) {
      if (!requireAuth(req, res, true)) return;
      const input = await readJson(req);
      const slug = normalizeSlug(match ? match[1] : input.slug);
      const existing = await getPost(slug).catch((error) => error.code === 'ENOENT' ? null : Promise.reject(error));
      if (req.method === 'POST' && existing) return json(res, 409, { error: '该文件标识已经存在' });
      if (req.method === 'PUT' && !existing) return json(res, 404, { error: '文章不存在' });
      await savePost(slug, serializePost(input), existing ? (existing.sha || true) : undefined);
      return json(res, req.method === 'POST' ? 201 : 200, { ok: true, slug });
    }
    if (req.method === 'DELETE' && match) {
      if (!requireAuth(req, res, true)) return;
      const slug = normalizeSlug(match[1]);
      const existing = await getPost(slug).catch((error) => error.code === 'ENOENT' ? null : Promise.reject(error));
      if (!existing) return json(res, 404, { error: '文章不存在' });
      await deletePost(slug, existing.sha);
      return json(res, 200, { ok: true });
    }
    if (req.method === 'POST' && path === '/admin-api/media') {
      if (!requireAuth(req, res, true)) return;
      const input = await readJson(req, 7 * 1024 * 1024);
      return json(res, 201, { path: await uploadMedia(input.name, input.content, input.contentType) });
    }
    return json(res, 404, { error: '接口不存在' });
  } catch (error) {
    console.error(`[admin-api] ${req.method} ${path}:`, error);
    const status = Number(error.status) || (error.code === 'ENOENT' ? 404 : 500);
    return json(res, status, { error: status < 500 ? error.message : '服务器处理失败，请稍后重试' });
  }
}

const server = createServer(handler);
server.listen(port, host, () => {
  console.log(`YMLL admin API listening on http://${host}:${port} (${mode} backend)`);
  if (!production && !passwordHash && !devPassword) console.warn('ADMIN_DEV_PASSWORD 未设置，登录将被拒绝');
});

process.on('SIGTERM', () => server.close());
process.on('SIGINT', () => server.close());
