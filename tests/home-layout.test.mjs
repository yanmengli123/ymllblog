import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const read = (file) => readFileSync(join(root, file), 'utf8');
const index = read('src/pages/index.astro');
const header = read('src/components/Header.astro');
const card = read('src/components/PostCard.astro');
const styles = read('src/styles/global.css');
const motionStyles = read('src/styles/motion.css');
const postLayout = read('src/layouts/PostLayout.astro');

assert.match(index, /id="main-content"/, 'home page should expose a skip-link target');
assert.match(index, /写代码，也写下/, 'home hero should communicate the author positioning');
assert.match(index, /Selected writing/, 'home should include editorially selected writing');
assert.match(index, /Latest notes/, 'home should include recent posts');
assert.match(index, /Browse by field/, 'home should expose category exploration');
assert.match(index, /<MusicPlayer\s*\/>/, 'home should include the official music section');
assert.doesNotMatch(index, /ParticlesBg|SettingsPanel/, 'home should avoid distracting novelty widgets');

const music = read('src/components/MusicPlayer.astro');
assert.match(music, /music\.163\.com\/outchain\/player/, 'music section should use the NetEase official player');
assert.match(music, /auto=0/, 'music should not autoplay');
assert.match(music, /PUBLIC_NETEASE_PLAYLIST_ID/, 'playlist should be configurable without source edits');

assert.match(styles, /--brand:/, 'design system should use semantic brand tokens');
assert.match(styles, /prefers-reduced-motion/, 'design system should respect reduced motion');
assert.match(motionStyles, /prefers-reduced-motion/, 'motion system should respect reduced motion');
assert.match(styles, /article-prose/, 'article typography should have a dedicated reading system');

assert.match(header, /aria-label="主导航"/, 'header navigation should be labelled');
assert.match(header, /aria-current=/, 'active navigation should be announced');
assert.match(header, /placeholder="搜索文章、标签、摘要"/, 'search should have a useful prompt');
assert.match(header, /localStorage\.setItem\('theme'/, 'theme should persist');
assert.match(header, /searchInput\?\.addEventListener\('input'/, 'search input should be interactive');
assert.doesNotMatch(header, /searchResults\.innerHTML\s*=/, 'search results should use safe DOM construction');

assert.match(card, /<article/, 'post cards should use article semantics');
assert.match(card, /loading=\{featured \? 'eager' : 'lazy'\}/, 'non-featured images should be lazy-loaded');
assert.match(card, /category\?: string/, 'cards should expose article category');
assert.match(card, /motion-card/, 'cards should share the motion design system');

assert.match(postLayout, /id="reading-progress"/, 'article pages should include reading progress');
assert.match(postLayout, /aria-label="文章目录"/, 'article contents should be labelled');
assert.match(postLayout, /navigator\.share/, 'article sharing should use the native sharing API when available');
assert.match(postLayout, /<MermaidSupport\s*\/>/, 'article layout should retain Mermaid support');

console.log('enterprise layout tests passed');
