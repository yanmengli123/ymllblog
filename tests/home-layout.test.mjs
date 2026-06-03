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

const music = read('src/components/MusicPlayer.astro');
assert.match(music, /interface Props[\s\S]*variant\?: 'floating' \| 'sidebar'/, 'music player should support floating and sidebar variants');
assert.match(music, /const isSidebar = variant === 'sidebar'/, 'music player should branch on sidebar variant');

const announcement = read('src/components/Announcement.astro');
assert.match(announcement, /interface Props[\s\S]*variant\?: 'floating' \| 'sidebar'/, 'announcement should support floating and sidebar variants');

const settings = read('src/components/SettingsPanel.astro');
assert.match(settings, /interface Props[\s\S]*variant\?: 'floating' \| 'sidebar'/, 'settings panel should support floating and sidebar variants');
assert.match(settings, /const isSidebar = variant === 'sidebar'/, 'settings panel should branch on sidebar variant');

console.log('home layout structure tests passed');
