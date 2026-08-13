import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from 'yaml';

const root = process.cwd();
const read = (file) => readFileSync(join(root, file), 'utf8');
const garden = parse(read('src/content/garden.yml'));
const reading = parse(read('src/content/reading.yml'));
const aggregator = read('src/lib/garden.ts');
const config = read('src/content.config.ts');

assert.equal(garden[0].id, 'dashboard');
assert.ok(garden[0].building.progress >= 0 && garden[0].building.progress <= 100);
assert.ok(reading.every((item) => item.progress >= 0 && item.progress <= 100));
assert.match(config, /maturity: z\.enum\(\['seedling', 'growing', 'evergreen'\]\)/);
assert.match(config, /growthLog:/);
assert.match(aggregator, /buildActivity/);
assert.match(aggregator, /aggregateTopics/);
assert.match(aggregator, /getGardenDashboard/);

console.log('dynamic garden data tests passed');
