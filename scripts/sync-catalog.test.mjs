import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { mkdtemp, readFile, rm, readdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { syncCatalog } from './sync-catalog.mjs';
import { eventPresentation } from '../src/lib/catalog.ts';

const original = {
  events: [{
    id: 'cancelled-station', title: '全国跳绳联赛（测试站）', level: '全国', system: '体育',
    province: '广西', city: '罗城', venue: '待公布', startDate: null, endDate: null,
    dateStatus: 'planned', dateLabel: '已取消', registrationDeadline: null,
    organizer: '赛事主办方', summary: '已取消。', eligibility: '以通知为准。',
    sourceName: '赛事主办方', sourceUrl: 'https://www.sport.gov.cn/notice', status: 'cancelled',
    documents: [{ title: '竞赛规程', url: 'https://www.sport.gov.cn/rules.pdf', localPath: '/api/files/rules.pdf', format: 'PDF', kind: 'regulation' }], year: 2026,
  }],
  sources: [], reviewedAt: '2026-10-23T04:00:00Z', updateNote: '核查完成', coverageNote: '',
  schedule: { enabled: true, time: '09:00', timezone: 'Asia/Shanghai' },
};

async function fixture(t) {
  const dir = await mkdtemp(join(tmpdir(), 'rope-pages-'));
  const state = { catalog: structuredClone(original), broken: false };
  const pdf = Buffer.from('%PDF-1.7\n' + 'document '.repeat(20));
  const server = createServer((req, res) => {
    if (req.url === '/api/catalog') {
      res.setHeader('Content-Type', 'application/json');
      return res.end(JSON.stringify({ catalog: state.catalog }));
    }
    if (req.url.startsWith('/api/files/')) {
      res.setHeader('Content-Type', state.broken ? 'text/html' : 'application/pdf');
      return res.end(state.broken ? '<html>Service unavailable</html>' : pdf);
    }
    res.writeHead(404).end();
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const origin = `http://127.0.0.1:${server.address().port}`;
  t.after(async () => {
    await new Promise(resolve => server.close(resolve));
    await rm(dir, { recursive: true, force: true });
  });
  return { dir, origin, state, pdf };
}

test('static export includes local rules and keeps cancellations and internal keys out of presentation', async t => {
  const { dir, origin, pdf } = await fixture(t);
  await syncCatalog({ origin, publicDir: dir, pageUrl: 'https://example.github.io/rope-calendar/' });
  const saved = JSON.parse(await readFile(join(dir, 'catalog.json'), 'utf8'));
  assert.equal(saved.catalog.events[0].status, 'cancelled');
  assert.equal(saved.catalog.events[0].documents[0].localPath, '/regulations/rules.pdf');
  assert.deepEqual(await readFile(join(dir, 'regulations/rules.pdf')), pdf);
  assert.equal(saved.catalog.schedule.enabled, true);
  assert.doesNotMatch(JSON.stringify(eventPresentation(saved.catalog.events[0])), /cancelled-station/);
  assert.deepEqual((await readdir(dir)).sort(), ['catalog.json', 'regulations']);
});

test('failed rule download preserves the last complete catalog', async t => {
  const { dir, origin, state } = await fixture(t);
  const settings = { origin, publicDir: dir, pageUrl: 'https://example.github.io/rope-calendar/' };
  await syncCatalog(settings);
  const before = await readFile(join(dir, 'catalog.json'), 'utf8');
  state.catalog.events[0].documents[0].localPath = '/api/files/broken.pdf';
  state.broken = true;
  await assert.rejects(syncCatalog(settings), /PDF|file|document/i);
  assert.equal(await readFile(join(dir, 'catalog.json'), 'utf8'), before);
});
