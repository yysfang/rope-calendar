import { readFile, writeFile, mkdir, rename } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { catalogSchema } from '../src/lib/catalog.ts';

function verifyFile(bytes, format) {
  if (bytes.length < 100 || bytes.length > 99_000_000) throw new Error('Invalid document file size');
  if (format === 'PDF' && bytes.subarray(0, 5).toString() !== '%PDF-') throw new Error('Invalid PDF file');
  if (format === 'DOCX' && bytes.subarray(0, 2).toString() !== 'PK') throw new Error('Invalid DOCX file');
  if (format === 'DOC' && bytes[0] !== 0xd0) throw new Error('Invalid DOC file');
  if (format === 'HTML' && (!/官方网页存档|通知截图存档/.test(bytes.toString('utf8')) || /<script\b/i.test(bytes.toString('utf8')))) throw new Error('Invalid HTML document archive');
}

async function existingFile(path) {
  try { return await readFile(path); } catch (error) { if (error.code !== 'ENOENT') throw error; return null; }
}

async function writeChanged(path, bytes) {
  const previous = await existingFile(path);
  if (previous?.equals(bytes)) return false;
  await mkdir(resolve(path, '..'), { recursive: true });
  await writeFile(path + '.tmp', bytes);
  await rename(path + '.tmp', path);
  return true;
}

async function get(url) {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(120_000) });
      if (!response.ok) throw new Error(`HTTP ${response.status} downloading document or catalog`);
      return response;
    } catch (error) {
      if (attempt === 2) throw error;
    }
  }
}

export async function syncCatalog({ origin, publicDir, pageUrl, cacheDir, seedFile }) {
  const response = await get(new URL('/api/catalog', origin));
  const incoming = await response.json();
  const catalog = catalogSchema.parse(incoming.catalog);
  if (!catalog.events.length) throw new Error('Empty catalog: keep the previous complete publication');
  const folder = join(publicDir, 'regulations');
  await mkdir(folder, { recursive: true });
  const files = new Set();
  let added = false;
  let references = 0;
  const relocateSource = value => {
    const url = new URL(value);
    if (url.origin === new URL(origin).origin && /^\/(?:api\/files|regulations)\/[a-zA-Z0-9_.-]+$/.test(url.pathname)) {
      return new URL('regulations/' + url.pathname.split('/').at(-1), pageUrl).href;
    }
    return value;
  };
  for (const event of catalog.events) {
    for (let index = 0; index < event.documents.length; index++) {
      const doc = event.documents[index];
      const filename = doc.localPath?.split('/').at(-1) || `${event.id}-${index + 1}.${doc.format.toLowerCase()}`;
      if (!/^[a-zA-Z0-9_-][a-zA-Z0-9_.-]*\.(pdf|docx?|html)$/.test(filename)) throw new Error('Unsafe document filename');
      if (!files.has(filename)) {
        const path = join(folder, filename);
        let bytes = await existingFile(path);
        if (!bytes && cacheDir) bytes = await existingFile(join(cacheDir, filename));
        if (!bytes) {
          const url = doc.localPath ? new URL(doc.localPath, origin).href : doc.url;
          bytes = Buffer.from(await (await get(url)).arrayBuffer());
        }
        verifyFile(bytes, doc.format);
        added = (await writeChanged(path, bytes)) || added;
        files.add(filename);
      }
      doc.localPath = '/regulations/' + filename;
      doc.url = relocateSource(doc.url);
      references++;
    }
    event.sourceUrl = relocateSource(event.sourceUrl);
  }
  for (const source of catalog.sources) source.url = relocateSource(source.url);
  const checked = catalogSchema.parse(catalog);
  const json = Buffer.from(JSON.stringify({ catalog: checked }, null, 2) + '\n');
  const changed = (await writeChanged(join(publicDir, 'catalog.json'), json)) || added;
  if (seedFile) await writeChanged(seedFile, Buffer.from(JSON.stringify(checked, null, 2) + '\n'));
  return { events: checked.events.length, documentReferences: references, localFiles: files.size, changed };
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const config = JSON.parse(await readFile(new URL('../sync.config.json', import.meta.url), 'utf8'));
  console.log(JSON.stringify(await syncCatalog({ ...config, publicDir: resolve('public'), seedFile: resolve('src/data/seed.json'), cacheDir: process.env.REGULATIONS_CACHE })));
}
