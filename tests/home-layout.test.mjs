import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const read = (file) => readFileSync(join(root, file), 'utf8');

const index = read('src/pages/index.astro');

assert.match(index, /HomeSidebarLayout/, 'home page should use the dedicated sidebar layout wrapper');
assert.match(index, /<aside[^>]+id="home-left-sidebar"/, 'home page should render a left sidebar');
assert.match(index, /<aside[^>]+id="home-right-sidebar"/, 'home page should render a right sidebar');
assert.match(index, /<main[^>]+id="home-feed"/, 'home page should render a central article feed');

for (const component of [
  'src/components/ProfileCard.astro',
  'src/components/SiteStatsCard.astro',
  'src/components/PostCalendarCard.astro',
]) {
  assert.ok(existsSync(join(root, component)), `${component} should exist`);
}

assert.match(index, /<ProfileCard\s*\/>/, 'left sidebar should include profile card');
assert.match(index, /<Announcement[^>]+variant="sidebar"/, 'left sidebar should include sidebar announcement');
assert.match(index, /<MusicPlayer[^>]+variant="sidebar"/, 'left sidebar should include sidebar music player');
assert.match(index, /<SettingsPanel[^>]+variant="sidebar"/, 'right sidebar should include sidebar settings panel');
assert.match(index, /<SiteStatsCard\s*\/>/, 'right sidebar should include site statistics');
assert.match(index, /<PostCalendarCard\s*\/>/, 'right sidebar should include post calendar');
assert.match(
  index,
  /<SiteStatsCard\s*\/>[\s\S]*<PostCalendarCard\s*\/>[\s\S]*<SettingsPanel[^>]+variant="sidebar"/,
  'right sidebar should show stats and the calendar before the tall settings panel'
);

const calendar = read('src/components/PostCalendarCard.astro');
for (const pattern of [
  /id="post-calendar-card"/,
  /class="calendar-header"/,
  /class="calendar-weekdays"/,
  /class:list=\{\[\s*'calendar-day'/,
  /data-post-count=\{day.count\}/,
  /id="calendar-prev-month"/,
  /id="calendar-next-month"/,
  /data-calendar-month/,
]) {
  assert.match(calendar, pattern, `calendar should include ${pattern}`);
}

const music = read('src/components/MusicPlayer.astro');
assert.match(music, /interface Props[\s\S]*variant\?: 'floating' \| 'sidebar'/, 'music player should support floating and sidebar variants');
assert.match(music, /const isSidebar = variant === 'sidebar'/, 'music player should branch on sidebar variant');
assert.match(music, /music\.163\.com\/outchain\/player/, 'music player should use NetEase official iframe player');
assert.match(music, /id="netease-player-frame"/, 'music player should render a NetEase iframe');
assert.doesNotMatch(music, /new Audio\(/, 'music player should not rely on unstable NetEase mp3 direct links');

const announcement = read('src/components/Announcement.astro');
assert.match(announcement, /interface Props[\s\S]*variant\?: 'floating' \| 'sidebar'/, 'announcement should support floating and sidebar variants');

const settings = read('src/components/SettingsPanel.astro');
assert.match(settings, /interface Props[\s\S]*variant\?: 'floating' \| 'sidebar'/, 'settings panel should support floating and sidebar variants');
assert.match(settings, /const isSidebar = variant === 'sidebar'/, 'settings panel should branch on sidebar variant');

const header = read('src/components/Header.astro');
assert.match(header, /id="search-modal"/, 'header should include a real search modal');
assert.match(header, /data-nav-link/, 'header nav links should use stable nav selectors');
assert.match(header, /data-active="true"/, 'header should preserve active nav state');
assert.match(header, /localStorage\.setItem\('theme'/, 'theme button should persist theme');
assert.match(header, /searchInput\.addEventListener\('input'/, 'search input should filter posts');

const theme = read('src/lib/theme.ts');
assert.match(theme, /setGlassMode/, 'settings should toggle glass styling instead of hiding the board');
assert.doesNotMatch(theme, /toggleElement\('#board', settings\.showGlass\)/, 'showGlass must not hide the entire home board');
assert.match(theme, /particlesBg/, 'settings should control particle background API');

const featuredPosts = read('src/components/FeaturedPosts.astro');
assert.match(featuredPosts, /id="featured-posts"/, 'featured posts should expose a layout target');
assert.match(featuredPosts, /layout-change/, 'featured posts should respond to layout-change events');
assert.match(featuredPosts, /data-post-layout/, 'featured posts should keep the current post layout in DOM');

console.log('home layout structure tests passed');
