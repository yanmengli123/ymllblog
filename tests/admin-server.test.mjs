import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawn } from 'node:child_process';
import test from 'node:test';

const root = process.cwd();
const password = 'local-test-password-2026';
const port = 18787;
const base = `http://127.0.0.1:${port}/admin-api`;

function requestCookie(response) {
  return response.headers.get('set-cookie')?.split(';')[0] || '';
}

test('username/password session protects CRUD and persists Markdown', async (t) => {
  const project = await mkdtemp(join(tmpdir(), 'ymllblog-admin-'));
  await mkdir(join(project, 'src/content/blog'), { recursive: true });
  await mkdir(join(project, 'src/content/projects'), { recursive: true });
  await mkdir(join(project, 'src/content/research'), { recursive: true });
  await mkdir(join(project, 'public/uploads'), { recursive: true });
  const child = spawn(process.execPath, ['server/admin-server.mjs'], {
    cwd: root,
    env: { ...process.env, ADMIN_PORT: String(port), ADMIN_HOST: '127.0.0.1', ADMIN_DEV_PASSWORD: password, ADMIN_USERNAME: 'admin', CONTENT_BACKEND: 'local', PROJECT_ROOT: project },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  t.after(async () => { child.kill(); await rm(project, { recursive: true, force: true }); });
  await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('admin server did not start')), 5000);
    child.stdout.on('data', (chunk) => { if (String(chunk).includes('listening')) { clearTimeout(timer); resolve(); } });
    child.stderr.on('data', (chunk) => { if (String(chunk).includes('Error')) reject(new Error(String(chunk))); });
  });

  const unauthorized = await fetch(`${base}/posts`);
  assert.equal(unauthorized.status, 401);

  const badLogin = await fetch(`${base}/login`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ username: 'admin', password: 'wrong' }) });
  assert.equal(badLogin.status, 401);

  const login = await fetch(`${base}/login`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ username: 'admin', password }) });
  assert.equal(login.status, 200);
  const auth = await login.json();
  const cookie = requestCookie(login);
  assert.ok(auth.csrfToken);
  assert.match(cookie, /^ymll_admin=/);

  const post = { slug: 'test-post', title: '测试文章', description: '用于验证管理员 CRUD。', pubDate: '2026-08-12T12:00', author: 'YMLL', tags: ['测试'], category: '开发工具', draft: true, featured: false, lang: 'zh-CN', body: '## 正文\n\n第一版。' };
  const create = await fetch(`${base}/posts`, { method: 'POST', headers: { cookie, 'content-type': 'application/json', 'x-csrf-token': auth.csrfToken }, body: JSON.stringify(post) });
  assert.equal(create.status, 201);
  assert.match(await readFile(join(project, 'src/content/blog/test-post.md'), 'utf8'), /第一版/);

  const list = await fetch(`${base}/posts`, { headers: { cookie } });
  assert.equal(list.status, 200);
  assert.equal((await list.json()).posts[0].title, '测试文章');

  post.title = '更新后的标题';
  post.body = '第二版。';
  const update = await fetch(`${base}/posts/test-post`, { method: 'PUT', headers: { cookie, 'content-type': 'application/json', 'x-csrf-token': auth.csrfToken }, body: JSON.stringify(post) });
  assert.equal(update.status, 200);
  assert.match(await readFile(join(project, 'src/content/blog/test-post.md'), 'utf8'), /更新后的标题/);

  const garden = { status: 'researching', timezone: 'Asia/Shanghai', headline: '测试首页动态状态', summary: '由管理员接口写入的动态首页数据。', exploring: ['Astro'], building: { title: '数字花园', detail: '测试构建', progress: 80 }, reading: { title: '测试书籍', detail: '测试阅读', progress: 35 } };
  const saveGarden = await fetch(`${base}/garden`, { method: 'PUT', headers: { cookie, 'content-type': 'application/json', 'x-csrf-token': auth.csrfToken }, body: JSON.stringify(garden) });
  assert.equal(saveGarden.status, 200);
  assert.match(await readFile(join(project, 'src/content/garden.yml'), 'utf8'), /测试首页动态状态/);

  const projectEntry = { slug: 'test-project', title: '测试项目', summary: '验证项目完整 CRUD。', status: 'active', technologies: ['Astro'], updatedAt: '2026-08-13', order: 1, featured: true, body: '项目正文。' };
  const createProject = await fetch(`${base}/projects`, { method: 'POST', headers: { cookie, 'content-type': 'application/json', 'x-csrf-token': auth.csrfToken }, body: JSON.stringify(projectEntry) });
  assert.equal(createProject.status, 201);
  assert.match(await readFile(join(project, 'src/content/projects/test-project.md'), 'utf8'), /测试项目/);

  const researchEntry = { slug: 'test-research', title: '测试研究问题', topic: '内容模型', status: 'exploring', date: '2026-08-13', body: '研究正文。' };
  const createResearch = await fetch(`${base}/research`, { method: 'POST', headers: { cookie, 'content-type': 'application/json', 'x-csrf-token': auth.csrfToken }, body: JSON.stringify(researchEntry) });
  assert.equal(createResearch.status, 201);

  const shelf = { reading: [{ id: 'test-book', title: '测试书籍', creator: 'Test Author', kind: 'book', status: 'reading', progress: 50 }] };
  const saveShelf = await fetch(`${base}/reading`, { method: 'PUT', headers: { cookie, 'content-type': 'application/json', 'x-csrf-token': auth.csrfToken }, body: JSON.stringify(shelf) });
  assert.equal(saveShelf.status, 200);
  assert.match(await readFile(join(project, 'src/content/reading.yml'), 'utf8'), /test-book/);

  const noCsrf = await fetch(`${base}/posts/test-post`, { method: 'DELETE', headers: { cookie } });
  assert.equal(noCsrf.status, 403);
  const remove = await fetch(`${base}/posts/test-post`, { method: 'DELETE', headers: { cookie, 'x-csrf-token': auth.csrfToken } });
  assert.equal(remove.status, 200);
  const removeProject = await fetch(`${base}/projects/test-project`, { method: 'DELETE', headers: { cookie, 'x-csrf-token': auth.csrfToken } });
  assert.equal(removeProject.status, 200);
  const removeResearch = await fetch(`${base}/research/test-research`, { method: 'DELETE', headers: { cookie, 'x-csrf-token': auth.csrfToken } });
  assert.equal(removeResearch.status, 200);
});
