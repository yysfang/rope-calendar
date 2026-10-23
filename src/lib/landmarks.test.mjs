import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';

const module = await import('./landmarks.ts').catch(() => ({}));
const seed = JSON.parse(await readFile(new URL('../data/seed.json', import.meta.url), 'utf8'));

test('every catalog event has a local, attributed image without changing event data', async () => {
 assert.equal(typeof module.eventCover, 'function', 'eventCover must exist');
 const original = JSON.stringify(seed);
 for (const event of seed.events) {
  const cover = module.eventCover(event);
  assert.match(cover.src, /^\.\/landmarks\/[a-z0-9-]+\.webp$/);
  assert.ok(cover.author && cover.license && cover.sourceUrl && cover.title);
  assert.ok((await stat(new URL('../../public/' + cover.src.slice(2), import.meta.url))).size < 180_000);
  assert.ok((await stat(new URL('../../public/' + cover.mobileSrc.slice(2), import.meta.url))).size < 100_000);
 }
 assert.equal(JSON.stringify(seed), original);
});

test('precise cities win over province and ambiguous or online locations never invent a city', () => {
 assert.equal(typeof module.eventCover, 'function', 'eventCover must exist');
 assert.equal(module.eventCover({province:'河北',city:'雄安新区'}).place, '雄安新区');
 assert.equal(module.eventCover({province:'河北',city:'保定'}).place, '保定');
 for (const event of [{province:'全国',city:'线上'},{province:'广东',city:'全省线上'},{province:'安徽',city:''},{province:'广东',city:'各有关地级市'},{province:'境外',city:'地点待公布'}]) {
  assert.equal(module.eventCover(event).kind, 'sport');
 }
});

test('published photo credits contain readable labels and public license links', () => {
 assert.ok(module.landmarkPhotos?.length > 40);
 for (const photo of module.landmarkPhotos) {
  assert.ok(photo.title && photo.author);
  assert.match(photo.sourceUrl, photo.generated ? /^https:\/\/github\.com\/yysfang\/rope-calendar\/blob\/main\/public\/landmarks\// : /^https:\/\/commons\.wikimedia\.org\/wiki\/File:/);
  assert.match(photo.licenseUrl, /^https:\/\/(creativecommons\.org|www\.gnu\.org)\//);
  assert.doesNotMatch(photo.title, /[a-f0-9]{32}|internal|UUID/i);
  assert.doesNotMatch(photo.author, /\.(?:jpe?g|png|webp)|[a-f0-9]{32}/i);
 }
});

test('a distinctive venue image applies only to events at that venue', () => {
 const atVenue=module.eventCover({province:'江苏',city:'江阴',venue:'江阴飞马水城文体馆'});
 assert.match(atVenue.title,/飞马水城/);
 assert.equal(module.eventCover({province:'江苏',city:'江阴',venue:'江阴市体育中心'}).key,'jiangyin');
 assert.equal(module.eventCover({province:'江苏',city:'江阴'}).key,'jiangyin');
});
