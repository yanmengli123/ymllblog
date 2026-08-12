import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const read = (file) => readFileSync(join(root, file), 'utf8');
const layout = read('src/layouts/Layout.astro');
const postLayout = read('src/layouts/PostLayout.astro');
const motionRoot = read('src/components/motion/MotionRoot.astro');
const motionScript = read('src/scripts/motion.ts');
const motionStyles = read('src/styles/motion.css');
const header = read('src/components/Header.astro');
const adminHtml = read('public/admin/index.html');

assert.match(layout, /motion\?: 'expressive' \| 'standard' \| 'reading' \| 'none'/, 'layout should expose explicit motion levels');
assert.match(layout, /meta name="view-transition" content="same-origin"/, 'public pages should opt into native cross-document transitions');
assert.match(layout, /motion !== 'none' && <MotionRoot/, 'motion root should be removable for isolated surfaces');
assert.match(postLayout, /<Layout motion="reading"/, 'article pages should use the restrained reading motion level');
assert.match(postLayout, /style\.transform = `scaleX/, 'reading progress should use a compositor-friendly transform');

assert.match(motionRoot, /initializeMotion/, 'motion root should initialize one shared runtime');
assert.equal((motionScript.match(/new IntersectionObserver/g) || []).length, 1, 'motion runtime should share one IntersectionObserver');
assert.match(motionScript, /requestAnimationFrame/, 'pointer and scroll work should be frame scheduled');
assert.match(motionScript, /prefers-reduced-motion: reduce/, 'runtime should react to reduced-motion changes');
assert.match(motionScript, /childElementCount >= 8/, 'transient click effects should have a strict DOM cap');

assert.match(motionStyles, /--motion-fast:/, 'motion durations should use shared tokens');
assert.match(motionStyles, /--ease-standard:/, 'motion easing should use shared tokens');
assert.match(motionStyles, /@view-transition/, 'motion CSS should define native navigation transitions');
assert.match(motionStyles, /@media \(hover: hover\) and \(pointer: fine\)/, 'hover motion should only run on precise pointing devices');
assert.match(motionStyles, /@media \(prefers-reduced-motion: reduce\)/, 'motion CSS should provide a reduced-motion mode');
assert.match(header, /data-site-header/, 'header should expose its compact scroll state');
assert.match(header, /nav-active-indicator/, 'navigation should have a persistent active indicator');

assert.doesNotMatch(adminHtml, /MotionRoot|motion\.css|motion\.ts|view-transition/, 'admin UI should remain isolated from the public motion system');
for (const dependency of ['gsap', 'framer-motion', 'three', 'lenis']) {
  assert.doesNotMatch(read('package.json'), new RegExp(`"${dependency}"`), `motion should not add ${dependency}`);
}

console.log('motion design system tests passed');
