(() => {
  'use strict';
  document.documentElement.dataset.gardenAdmin = 'loading';
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const state = { initialized: false, section: 'articles', projects: [], research: [], projectNew: false, researchNew: false };

  const value = (selector) => $(selector)?.value.trim() || '';
  const csv = (selector) => value(selector).split(',').map((item) => item.trim()).filter(Boolean);
  const setValue = (selector, next = '') => { const element = $(selector); if (element) element.value = String(next ?? ''); };
  const setChecked = (selector, next = false) => { const element = $(selector); if (element) element.checked = Boolean(next); };
  const today = () => new Date().toISOString().slice(0, 10);

  function element(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function field(label, input) {
    const wrapper = element('label', 'field reading-field');
    wrapper.append(element('span', '', label), input);
    return wrapper;
  }

  function updateHeader(section) {
    const labels = {
      garden: ['LIVE GARDEN', '首页动态状态'], projects: ['COLLECTION', '项目管理'],
      research: ['RESEARCH', '研究日志'], reading: ['LIBRARY', '阅读书架'],
    };
    const articleMode = section === 'articles';
    $('.header-actions').hidden = !articleMode;
    $('#article-sidebar').hidden = !articleMode;
    if (!articleMode) {
      $('#editor-kicker').textContent = labels[section][0];
      $('#editor-heading').textContent = labels[section][1];
    } else if (!$('#post-form').hidden) {
      $('#editor-kicker').textContent = 'EDITING';
      $('#editor-heading').textContent = $('#post-title').value || '编辑文章';
    } else {
      $('#editor-kicker').textContent = 'EDITOR';
      $('#editor-heading').textContent = '选择一篇文章';
    }
  }

  async function switchSection(section) {
    state.section = section;
    $$('[data-admin-section]').forEach((button) => button.classList.toggle('is-active', button.dataset.adminSection === section));
    $$('.admin-section').forEach((panel) => {
      const panelSection = panel.id === 'articles-section' ? 'articles' : panel.dataset.section;
      panel.hidden = panelSection !== section;
    });
    updateHeader(section);
    window.ymllAdmin.closeSidebar();
    try {
      if (section === 'garden') await loadGarden();
      if (section === 'projects') await loadManaged('projects');
      if (section === 'research') await loadManaged('research');
      if (section === 'reading') await loadReading();
    } catch (error) { window.ymllAdmin.toast(error.message, true); }
  }

  async function loadGarden() {
    const { garden } = await window.ymllAdmin.request('/garden');
    if (!garden) return;
    setValue('#garden-status', garden.status);
    setValue('#garden-timezone', garden.timezone);
    setValue('#garden-headline', garden.headline);
    setValue('#garden-summary', garden.summary);
    setValue('#garden-exploring', Array.isArray(garden.exploring) ? garden.exploring.join(', ') : '');
    setValue('#garden-building-title', garden.building?.title);
    setValue('#garden-building-detail', garden.building?.detail);
    setValue('#garden-building-progress', garden.building?.progress);
    setValue('#garden-reading-title', garden.reading?.title);
    setValue('#garden-reading-detail', garden.reading?.detail);
    setValue('#garden-reading-progress', garden.reading?.progress);
  }

  async function saveGarden(event) {
    event.preventDefault();
    if (!event.currentTarget.reportValidity()) return;
    const payload = {
      status: value('#garden-status'), timezone: value('#garden-timezone'), headline: value('#garden-headline'), summary: value('#garden-summary'), exploring: csv('#garden-exploring'),
      building: { title: value('#garden-building-title'), detail: value('#garden-building-detail'), progress: Number(value('#garden-building-progress')) },
      reading: { title: value('#garden-reading-title'), detail: value('#garden-reading-detail'), progress: Number(value('#garden-reading-progress')) },
    };
    await window.ymllAdmin.request('/garden', { method: 'PUT', body: JSON.stringify(payload) });
    window.ymllAdmin.toast('首页动态状态已保存');
  }

  function renderManagedList(kind) {
    const list = $(`#${kind === 'projects' ? 'project' : 'research'}-list`);
    const entries = state[kind];
    list.replaceChildren(...entries.map((entry) => {
      const button = element('button', 'collection-item');
      button.type = 'button';
      button.dataset.entrySlug = entry.slug;
      button.append(element('strong', '', entry.title), element('span', '', kind === 'projects' ? `${entry.status} · ${(entry.technologies || []).slice(0, 2).join(' / ')}` : `${entry.status} · ${String(entry.date).slice(0, 10)}`));
      return button;
    }));
    if (!entries.length) list.append(element('p', 'collection-empty', '还没有内容，点击右上角＋创建。'));
  }

  async function loadManaged(kind) {
    const data = await window.ymllAdmin.request(`/${kind}`);
    state[kind] = data[kind];
    renderManagedList(kind);
  }

  function openProject(project = {}, isNew = false) {
    state.projectNew = isNew;
    $('#project-form').hidden = false;
    $('#project-heading').textContent = isNew ? '新建项目' : project.title;
    setValue('#project-slug', project.slug);
    $('#project-slug').readOnly = !isNew;
    setValue('#project-title', project.title);
    setValue('#project-summary', project.summary);
    setValue('#project-status', project.status || 'building');
    setValue('#project-technologies', Array.isArray(project.technologies) ? project.technologies.join(', ') : '');
    setValue('#project-order', project.order ?? 99);
    setValue('#project-repository', project.repository);
    setValue('#project-website', project.website);
    setValue('#project-related-post', project.relatedPost);
    setValue('#project-body', project.body);
    setChecked('#project-featured', project.featured !== false);
    $('#delete-project').hidden = isNew;
  }

  async function saveProject(event) {
    event.preventDefault();
    if (!event.currentTarget.reportValidity()) return;
    const slug = value('#project-slug');
    const payload = {
      slug, title: value('#project-title'), summary: value('#project-summary'), status: value('#project-status'), technologies: csv('#project-technologies'),
      order: Number(value('#project-order') || 99), repository: value('#project-repository') || undefined, website: value('#project-website') || undefined,
      relatedPost: value('#project-related-post') || undefined, body: value('#project-body'), featured: $('#project-featured').checked, updatedAt: new Date().toISOString(),
    };
    await window.ymllAdmin.request(state.projectNew ? '/projects' : `/projects/${encodeURIComponent(slug)}`, { method: state.projectNew ? 'POST' : 'PUT', body: JSON.stringify(payload) });
    state.projectNew = false;
    $('#project-slug').readOnly = true;
    $('#delete-project').hidden = false;
    await loadManaged('projects');
    window.ymllAdmin.toast('项目已保存');
  }

  function openResearch(entry = {}, isNew = false) {
    state.researchNew = isNew;
    $('#research-form').hidden = false;
    $('#research-heading').textContent = isNew ? '新建研究日志' : entry.title;
    setValue('#research-slug', entry.slug);
    $('#research-slug').readOnly = !isNew;
    setValue('#research-title', entry.title);
    setValue('#research-date', String(entry.date || today()).slice(0, 10));
    setValue('#research-topic', entry.topic);
    setValue('#research-status', entry.status || 'exploring');
    setValue('#research-related-post', entry.relatedPost);
    setValue('#research-body', entry.body);
    $('#delete-research').hidden = isNew;
  }

  async function saveResearch(event) {
    event.preventDefault();
    if (!event.currentTarget.reportValidity()) return;
    const slug = value('#research-slug');
    const payload = { slug, title: value('#research-title'), date: value('#research-date'), topic: value('#research-topic'), status: value('#research-status'), relatedPost: value('#research-related-post') || undefined, body: value('#research-body') };
    await window.ymllAdmin.request(state.researchNew ? '/research' : `/research/${encodeURIComponent(slug)}`, { method: state.researchNew ? 'POST' : 'PUT', body: JSON.stringify(payload) });
    state.researchNew = false;
    $('#research-slug').readOnly = true;
    $('#delete-research').hidden = false;
    await loadManaged('research');
    window.ymllAdmin.toast('研究日志已保存');
  }

  async function deleteEntry(kind) {
    const singular = kind === 'projects' ? 'project' : 'research';
    const slug = value(`#${singular}-slug`);
    if (!slug || !confirm(`确定删除“${value(`#${singular}-title`)}”吗？可从 Git 历史恢复。`)) return;
    await window.ymllAdmin.request(`/${kind}/${encodeURIComponent(slug)}`, { method: 'DELETE' });
    $(`#${singular}-form`).hidden = true;
    await loadManaged(kind);
    window.ymllAdmin.toast(kind === 'projects' ? '项目已删除' : '研究日志已删除');
  }

  function select(kind, selected) {
    const entry = state[kind].find((item) => item.slug === selected);
    if (!entry) return;
    if (kind === 'projects') openProject(entry);
    else openResearch(entry);
  }

  function readingInput(type, fieldName, current, options) {
    const input = document.createElement(type === 'select' ? 'select' : 'input');
    input.dataset.readingField = fieldName;
    if (type === 'number') { input.type = 'number'; input.min = '0'; input.max = '100'; }
    if (type === 'url') input.type = 'url';
    if (options) options.forEach(([optionValue, label]) => {
      const option = element('option', '', label);
      option.value = optionValue;
      input.append(option);
    });
    input.value = String(current ?? '');
    return input;
  }

  function readingRow(item = {}) {
    const row = element('article', 'reading-editor-item');
    row.append(
      field('文件标识', readingInput('text', 'id', item.id)),
      field('名称', readingInput('text', 'title', item.title)),
      field('作者 / 来源', readingInput('text', 'creator', item.creator)),
      field('类型', readingInput('select', 'kind', item.kind || 'book', [['book', '书籍'], ['paper', '论文'], ['course', '课程'], ['documentation', '文档']])),
      field('状态', readingInput('select', 'status', item.status || 'reading', [['reading', '正在读'], ['queued', '待读'], ['completed', '已完成']])),
      field('进度', readingInput('number', 'progress', item.progress ?? 0)),
      field('链接', readingInput('url', 'url', item.url)),
      field('短注', readingInput('text', 'note', item.note)),
    );
    const remove = element('button', 'reading-remove', '移除');
    remove.type = 'button';
    remove.addEventListener('click', () => row.remove());
    row.append(remove);
    return row;
  }

  async function loadReading() {
    const { reading } = await window.ymllAdmin.request('/reading');
    $('#reading-list').replaceChildren(...reading.map(readingRow));
  }

  async function saveReading(event) {
    event.preventDefault();
    const reading = $$('.reading-editor-item').map((row) => {
      const data = {};
      $$('[data-reading-field]', row).forEach((input) => { data[input.dataset.readingField] = input.value.trim(); });
      data.progress = Number(data.progress || 0);
      return data;
    });
    await window.ymllAdmin.request('/reading', { method: 'PUT', body: JSON.stringify({ reading }) });
    window.ymllAdmin.toast('阅读书架已保存');
  }

  function bind() {
    if (state.initialized || !window.ymllAdmin) return false;
    state.initialized = true;
    document.documentElement.dataset.gardenAdmin = 'ready';
    document.addEventListener('click', (event) => {
      const button = event.target.closest('[data-admin-section]');
      if (button) switchSection(button.dataset.adminSection);
    });
    $('#garden-form').addEventListener('submit', (event) => saveGarden(event).catch((error) => window.ymllAdmin.toast(error.message, true)));
    $('#project-form').addEventListener('submit', (event) => saveProject(event).catch((error) => window.ymllAdmin.toast(error.message, true)));
    $('#research-form').addEventListener('submit', (event) => saveResearch(event).catch((error) => window.ymllAdmin.toast(error.message, true)));
    $('#reading-form').addEventListener('submit', (event) => saveReading(event).catch((error) => window.ymllAdmin.toast(error.message, true)));
    $('#new-project').addEventListener('click', () => openProject({}, true));
    $('#new-research').addEventListener('click', () => openResearch({}, true));
    $('#project-list').addEventListener('click', (event) => { const item = event.target.closest('[data-entry-slug]'); if (item) select('projects', item.dataset.entrySlug); });
    $('#research-list').addEventListener('click', (event) => { const item = event.target.closest('[data-entry-slug]'); if (item) select('research', item.dataset.entrySlug); });
    $('#delete-project').addEventListener('click', () => deleteEntry('projects').catch((error) => window.ymllAdmin.toast(error.message, true)));
    $('#delete-research').addEventListener('click', () => deleteEntry('research').catch((error) => window.ymllAdmin.toast(error.message, true)));
    $('#add-reading').addEventListener('click', () => $('#reading-list').append(readingRow()));
    return true;
  }

  addEventListener('ymll-admin-ready', bind);
  function boot() {
    if (!bind()) window.setTimeout(boot, 50);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})();
