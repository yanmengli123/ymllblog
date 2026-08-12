(() => {
  'use strict';
  const basePrefix = location.pathname.startsWith('/ymllblog/') ? '/ymllblog' : '';
  const apiBase = `${basePrefix}/admin-api`;
  const $ = (selector) => document.querySelector(selector);
  const state = { csrf: '', posts: [], activeSlug: '', isNew: false, dirty: false, busy: false };
  const elements = {
    loginView: $('#login-view'), appView: $('#app-view'), loginForm: $('#login-form'), loginError: $('#login-error'), loginSubmit: $('#login-submit'),
    form: $('#post-form'), empty: $('#empty-state'), list: $('#post-list'), count: $('#post-count'), search: $('#post-search'),
    save: $('#save-post'), remove: $('#delete-post'), view: $('#view-post'), heading: $('#editor-heading'), kicker: $('#editor-kicker'),
    status: $('#save-status'), toast: $('#toast'), dialog: $('#delete-dialog'), sidebar: $('#sidebar'),
    fields: {
      title: $('#post-title'), slug: $('#post-slug'), pubDate: $('#post-date'), updatedDate: $('#post-updated'), description: $('#post-description'), body: $('#post-body'),
      draft: $('#post-draft'), featured: $('#post-featured'), category: $('#post-category'), tags: $('#post-tags'), cover: $('#post-cover'), author: $('#post-author'), lang: $('#post-lang'),
    },
  };

  async function request(path, options = {}) {
    const headers = { ...(options.body ? { 'Content-Type': 'application/json' } : {}), ...(options.headers || {}) };
    if (options.method && options.method !== 'GET') headers['X-CSRF-Token'] = state.csrf;
    const response = await fetch(`${apiBase}${path}`, { credentials: 'same-origin', ...options, headers });
    const data = await response.json().catch(() => ({ error: '服务器返回了无效响应' }));
    if (response.status === 401 && path !== '/login') showLogin();
    if (!response.ok) throw new Error(data.error || `请求失败 (${response.status})`);
    return data;
  }

  function showLogin() {
    state.csrf = '';
    elements.appView.hidden = true;
    elements.loginView.hidden = false;
    $('#login-password').value = '';
  }

  async function showApp(session) {
    state.csrf = session.csrfToken;
    $('#session-user').textContent = session.username;
    elements.loginView.hidden = true;
    elements.appView.hidden = false;
    await loadPosts();
  }

  function toast(message, error = false) {
    elements.toast.textContent = message;
    elements.toast.classList.toggle('error', error);
    elements.toast.hidden = false;
    clearTimeout(toast.timer);
    toast.timer = setTimeout(() => { elements.toast.hidden = true; }, 3600);
  }

  function formatDate(value) {
    if (!value) return '未设置日期';
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? String(value).slice(0, 10) : new Intl.DateTimeFormat('zh-CN', { year: 'numeric', month: 'short', day: 'numeric' }).format(date);
  }

  function toLocalInput(value) {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value).slice(0, 16);
    const offset = date.getTimezoneOffset() * 60_000;
    return new Date(date.getTime() - offset).toISOString().slice(0, 16);
  }

  function renderList() {
    const query = elements.search.value.trim().toLowerCase();
    const posts = state.posts.filter((post) => `${post.title} ${post.category} ${post.slug}`.toLowerCase().includes(query));
    elements.list.replaceChildren(...posts.map((post) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = `post-item${post.slug === state.activeSlug ? ' is-active' : ''}`;
      button.dataset.slug = post.slug;
      const title = document.createElement('strong');
      title.textContent = post.title;
      const meta = document.createElement('span');
      const dot = document.createElement('i');
      if (post.draft) dot.className = 'draft';
      meta.append(dot, document.createTextNode(`${post.draft ? '草稿' : '已发布'} · ${formatDate(post.pubDate)}`));
      button.append(title, meta);
      return button;
    }));
    elements.count.textContent = String(posts.length);
  }

  async function loadPosts() {
    try {
      const data = await request('/posts');
      state.posts = data.posts;
      renderList();
    } catch (error) { toast(error.message, true); }
  }

  function setDirty(value) {
    state.dirty = value;
    elements.status.textContent = value ? '有未保存更改' : '已保存';
    elements.status.style.color = value ? '#9a6d1b' : '#176b52';
  }

  function showEditor(post, isNew = false) {
    state.isNew = isNew;
    state.activeSlug = isNew ? '' : post.slug;
    elements.empty.hidden = true;
    elements.form.hidden = false;
    elements.save.hidden = false;
    elements.remove.hidden = isNew;
    elements.view.hidden = isNew || post.draft;
    elements.heading.textContent = isNew ? '新建文章' : post.title;
    elements.kicker.textContent = isNew ? 'NEW ARTICLE' : 'EDITING';
    elements.fields.title.value = post.title || '';
    elements.fields.slug.value = post.slug || '';
    elements.fields.slug.readOnly = !isNew;
    elements.fields.pubDate.value = toLocalInput(post.pubDate || new Date());
    elements.fields.updatedDate.value = toLocalInput(post.updatedDate);
    elements.fields.description.value = post.description || '';
    elements.fields.body.value = post.body || '';
    elements.fields.draft.checked = Boolean(post.draft);
    elements.fields.featured.checked = Boolean(post.featured);
    elements.fields.category.value = post.category || '';
    elements.fields.tags.value = Array.isArray(post.tags) ? post.tags.join(', ') : '';
    elements.fields.cover.value = post.cover || '';
    elements.fields.author.value = post.author || 'YMLL';
    elements.fields.lang.value = post.lang || 'zh-CN';
    elements.view.href = `${basePrefix}/blog/${post.slug}`;
    updateCoverPreview();
    updateBodyStats();
    setDirty(false);
    renderList();
    closeSidebar();
  }

  function newPost() {
    if (!confirmDiscard()) return;
    showEditor({ draft: true, featured: false, author: 'YMLL', lang: 'zh-CN', tags: [] }, true);
    elements.fields.title.focus();
  }

  async function openPost(slug) {
    if (slug === state.activeSlug || !confirmDiscard()) return;
    try {
      elements.heading.textContent = '正在载入…';
      const { post } = await request(`/posts/${encodeURIComponent(slug)}`);
      showEditor(post);
    } catch (error) { toast(error.message, true); }
  }

  function collectPost() {
    const f = elements.fields;
    return {
      slug: f.slug.value.trim(), title: f.title.value.trim(), description: f.description.value.trim(),
      pubDate: f.pubDate.value, updatedDate: f.updatedDate.value || undefined, author: f.author.value.trim() || 'YMLL',
      tags: f.tags.value.split(',').map((tag) => tag.trim()).filter(Boolean), category: f.category.value || undefined,
      cover: f.cover.value.trim() || undefined, draft: f.draft.checked, featured: f.featured.checked, lang: f.lang.value, body: f.body.value,
    };
  }

  async function savePost(event) {
    event.preventDefault();
    if (state.busy || !elements.form.reportValidity()) return;
    const post = collectPost();
    state.busy = true;
    elements.save.disabled = true;
    elements.save.textContent = '保存中…';
    try {
      const path = state.isNew ? '/posts' : `/posts/${encodeURIComponent(state.activeSlug)}`;
      await request(path, { method: state.isNew ? 'POST' : 'PUT', body: JSON.stringify(post) });
      state.activeSlug = post.slug;
      state.isNew = false;
      elements.fields.slug.readOnly = true;
      elements.remove.hidden = false;
      elements.view.hidden = post.draft;
      elements.view.href = `${basePrefix}/blog/${post.slug}`;
      elements.heading.textContent = post.title;
      setDirty(false);
      await loadPosts();
      toast('文章已保存，发布流程已触发');
    } catch (error) { toast(error.message, true); }
    finally { state.busy = false; elements.save.disabled = false; elements.save.textContent = '保存文章'; }
  }

  async function removePost() {
    if (!state.activeSlug || state.busy) return;
    state.busy = true;
    try {
      await request(`/posts/${encodeURIComponent(state.activeSlug)}`, { method: 'DELETE' });
      elements.dialog.close();
      state.activeSlug = '';
      state.dirty = false;
      elements.form.hidden = true;
      elements.empty.hidden = false;
      elements.save.hidden = elements.remove.hidden = elements.view.hidden = true;
      elements.heading.textContent = '选择一篇文章';
      await loadPosts();
      toast('文章已删除，可通过 Git 历史恢复');
    } catch (error) { toast(error.message, true); }
    finally { state.busy = false; }
  }

  async function uploadCover(event) {
    const file = event.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) return toast('图片不能超过 5MB', true);
    try {
      toast('正在上传封面…');
      const content = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result).split(',')[1]);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      const data = await request('/media', { method: 'POST', body: JSON.stringify({ name: file.name, contentType: file.type, content }) });
      elements.fields.cover.value = `${basePrefix}${data.path}`;
      updateCoverPreview();
      setDirty(true);
      toast('封面上传成功');
    } catch (error) { toast(error.message, true); }
    event.target.value = '';
  }

  function updateCoverPreview() {
    const box = $('#cover-preview');
    const value = elements.fields.cover.value.trim();
    box.hidden = !value;
    if (value) box.querySelector('img').src = value;
  }

  function updateBodyStats() {
    const body = elements.fields.body.value.trim();
    const count = body.replace(/\s/g, '').length;
    $('#body-stats').textContent = `${count.toLocaleString('zh-CN')} 字 · 约 ${Math.max(1, Math.ceil(count / 450))} 分钟阅读`;
  }

  function confirmDiscard() {
    return !state.dirty || window.confirm('当前更改尚未保存，确定离开吗？');
  }

  const closeSidebar = () => elements.sidebar.classList.remove('is-open');

  elements.loginForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    elements.loginError.hidden = true;
    elements.loginSubmit.disabled = true;
    elements.loginSubmit.textContent = '正在验证…';
    try {
      const data = await request('/login', { method: 'POST', body: JSON.stringify({ username: $('#login-username').value, password: $('#login-password').value }) });
      await showApp(data);
    } catch (error) { elements.loginError.textContent = error.message; elements.loginError.hidden = false; }
    finally { elements.loginSubmit.disabled = false; elements.loginSubmit.textContent = '安全登录'; }
  });
  $('#toggle-password').addEventListener('click', () => { const input = $('#login-password'); input.type = input.type === 'password' ? 'text' : 'password'; $('#toggle-password').textContent = input.type === 'password' ? '显示' : '隐藏'; });
  $('#logout').addEventListener('click', async () => { try { await request('/logout', { method: 'POST' }); } finally { showLogin(); } });
  elements.list.addEventListener('click', (event) => { const item = event.target.closest('[data-slug]'); if (item) openPost(item.dataset.slug); });
  elements.search.addEventListener('input', renderList);
  $('#new-post').addEventListener('click', newPost);
  $('[data-new-post]').addEventListener('click', newPost);
  elements.form.addEventListener('submit', savePost);
  elements.form.addEventListener('input', () => setDirty(true));
  elements.fields.body.addEventListener('input', updateBodyStats);
  elements.fields.cover.addEventListener('input', updateCoverPreview);
  $('#cover-upload').addEventListener('change', uploadCover);
  elements.remove.addEventListener('click', () => elements.dialog.showModal());
  $('#confirm-delete').addEventListener('click', (event) => { event.preventDefault(); removePost(); });
  $('#open-sidebar').addEventListener('click', () => elements.sidebar.classList.add('is-open'));
  $('#close-sidebar').addEventListener('click', closeSidebar);
  addEventListener('beforeunload', (event) => { if (state.dirty) event.preventDefault(); });

  request('/session').then(showApp).catch(showLogin);
})();
