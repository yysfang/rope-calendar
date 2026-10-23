import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile, mkdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { prepareCatalog } from './prepare-catalog.mjs';
import { eventPresentation } from '../src/lib/catalog.ts';

const original = {
  events: [{
    id: 'cancelled-station', title: '全国跳绳联赛（测试站）', level: '全国', system: '体育',
    province: '广西', city: '罗城', venue: '待公布', startDate: null, endDate: null,
    dateStatus: 'planned', dateLabel: '已取消', registrationDeadline: null,
    organizer: '赛事主办方', summary: '已取消。', eligibility: '以通知为准。',
    sourceName: '赛事主办方', sourceUrl: 'https://www.sport.gov.cn/notice', status: 'cancelled',
    documents: [{ title: '竞赛规程', url: 'https://www.sport.gov.cn/rules.pdf', localPath: '/regulations/rules.pdf', format: 'PDF', kind: 'regulation' }], year: 2026,
  }],
  sources: [], reviewedAt: '2026-10-23T04:00:00Z', updateNote: '核查完成', coverageNote: '',
  schedule: { enabled: true, time: '09:00', timezone: 'Asia/Shanghai' },
};
const pdf = Buffer.from('%PDF-1.7\n' + 'document '.repeat(20));

async function fixture(t) {
  const dir = await mkdtemp(join(tmpdir(), 'rope-pages-'));
  const publicDir = join(dir, 'public');
  const catalogFile = join(dir, 'seed.json');
  await mkdir(join(publicDir, 'regulations'), { recursive: true });
  await writeFile(catalogFile, JSON.stringify(original));
  t.after(() => rm(dir, { recursive: true, force: true }));
  return { catalogFile, publicDir };
}

test('publishes repository data and local regulations without any network dependency', async t => {
  const settings = await fixture(t);
  await writeFile(join(settings.publicDir, 'regulations/rules.pdf'), pdf);
  const result = await prepareCatalog({ ...settings, fetchDocument: () => { throw new Error('Offline'); } });
  const saved = JSON.parse(await readFile(join(settings.publicDir, 'catalog.json'), 'utf8')).catalog;
  assert.equal(saved.events[0].status, 'cancelled');
  assert.equal(saved.reviewedAt, original.reviewedAt);
  assert.equal(saved.events[0].documents[0].localPath, '/regulations/rules.pdf');
  assert.deepEqual(await readFile(join(settings.publicDir, 'regulations/rules.pdf')), pdf);
  assert.doesNotMatch(JSON.stringify(eventPresentation(saved.events[0])), /cancelled-station|system/);
  assert.equal(result.localFiles, 1);
  assert.equal((await prepareCatalog({ ...settings, fetchDocument: () => { throw new Error('Offline'); } })).changed, false);
});

test('downloads a missing regulation from its official source and records its local path', async t => {
  const settings = await fixture(t);
  const catalog = structuredClone(original);
  delete catalog.events[0].documents[0].localPath;
  await writeFile(settings.catalogFile, JSON.stringify(catalog));
  const requests = [];
  await prepareCatalog({ ...settings, fetchDocument: async url => { requests.push(String(url)); return new Response(pdf); } });
  const saved = JSON.parse(await readFile(settings.catalogFile, 'utf8'));
  assert.deepEqual(requests, ['https://www.sport.gov.cn/rules.pdf']);
  assert.equal(saved.events[0].documents[0].url, 'https://www.sport.gov.cn/rules.pdf');
  assert.equal(saved.events[0].documents[0].localPath, '/regulations/cancelled-station-1.pdf');
  assert.deepEqual(await readFile(join(settings.publicDir, 'regulations/cancelled-station-1.pdf')), pdf);
});

test('invalid documents cannot replace the last complete catalog or normalize the source', async t => {
  const settings = await fixture(t);
  await writeFile(join(settings.publicDir, 'regulations/rules.pdf'), pdf);
  await prepareCatalog(settings);
  const before = await readFile(join(settings.publicDir, 'catalog.json'), 'utf8');
  const catalog = structuredClone(original);
  delete catalog.events[0].documents[0].localPath;
  const source = JSON.stringify(catalog);
  await writeFile(settings.catalogFile, source);
  await assert.rejects(prepareCatalog({ ...settings, fetchDocument: async () => new Response('<html>Service unavailable</html>'.repeat(10)) }), /PDF/);
  assert.equal(await readFile(join(settings.publicDir, 'catalog.json'), 'utf8'), before);
  assert.equal(await readFile(settings.catalogFile, 'utf8'), source);
});

test('a missing document cannot fall back to the retired site', async t => {
  const settings = await fixture(t);
  const catalog = structuredClone(original);
  catalog.events[0].documents[0].url = 'https://retired.chatgpt.site/api/files/rules.pdf';
  await writeFile(settings.catalogFile, JSON.stringify(catalog));
  await assert.rejects(prepareCatalog({ ...settings, fetchDocument: () => { throw new Error('Unexpected network'); } }), /retired|official/i);
});
