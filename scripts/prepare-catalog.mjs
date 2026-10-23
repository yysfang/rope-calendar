import { readFile, writeFile, mkdir, rename } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { catalogSchema } from '../src/lib/catalog.ts';

function verifyFile(bytes, format) {
  if (bytes.length < 100 || bytes.length > 99_000_000) throw new Error('Invalid document file size');
  if (format === 'PDF' && bytes.subarray(0, 5).toString() !== '%PDF-') throw new Error('Invalid PDF file');
  if (format === 'DOCX' && bytes.subarray(0, 2).toString() !== 'PK') throw new Error('Invalid DOCX file');
  if (format === 'DOC' && bytes.subarray(0, 8).toString('hex') !== 'd0cf11e0a1b11ae1') throw new Error('Invalid DOC file');
  if (format === 'HTML' && (!/官方网页存档|通知截图存档/.test(bytes.toString('utf8')) || /<script\b/i.test(bytes.toString('utf8')))) throw new Error('Invalid HTML document archive');
}

async function existingFile(path) {
  try { return await readFile(path); } catch (error) { if (error.code !== 'ENOENT') throw error; return null; }
}

async function writeChanged(path, bytes) {
  if ((await existingFile(path))?.equals(bytes)) return false;
  await mkdir(resolve(path, '..'), { recursive: true });
  await writeFile(path + '.tmp', bytes);
  await rename(path + '.tmp', path);
  return true;
}

export async function prepareCatalog({ catalogFile, publicDir, fetchDocument = fetch }) {
  const catalog = catalogSchema.parse(JSON.parse(await readFile(catalogFile, 'utf8')));
  if (!catalog.events.length) throw new Error('Empty catalog: keep the previous complete publication');
  const files = new Map();
  let references = 0;
  for (const event of catalog.events) {
    for (let index = 0; index < event.documents.length; index++) {
      const doc = event.documents[index];
      const filename = doc.localPath?.split('/').at(-1) || `${event.id}-${index + 1}.${doc.format.toLowerCase()}`;
      if (!/^[a-zA-Z0-9_-][a-zA-Z0-9_.-]*\.(pdf|docx?|html)$/i.test(filename)) throw new Error('Unsafe document filename');
      let bytes = files.get(filename) || await existingFile(join(publicDir, 'regulations', filename));
      if (!bytes) {
        if (new URL(doc.url).hostname.endsWith('.chatgpt.site')) throw new Error('Retired site is not an official document source');
        const response = await fetchDocument(doc.url, { signal: AbortSignal.timeout(120_000) });
        if (!response.ok) throw new Error(`HTTP ${response.status} downloading official document`);
        bytes = Buffer.from(await response.arrayBuffer());
      }
      verifyFile(bytes, doc.format);
      files.set(filename, bytes);
      doc.localPath = '/regulations/' + filename;
      references++;
    }
  }
  // Publish derived data only after every referenced regulation has been checked.
  let changed = false;
  for (const [filename, bytes] of files) changed = await writeChanged(join(publicDir, 'regulations', filename), bytes) || changed;
  changed = await writeChanged(catalogFile, Buffer.from(JSON.stringify(catalog, null, 2) + '\n')) || changed;
  changed = await writeChanged(join(publicDir, 'catalog.json'), Buffer.from(JSON.stringify({ catalog }, null, 2) + '\n')) || changed;
  return { events: catalog.events.length, documentReferences: references, localFiles: files.size, changed };
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  console.log(JSON.stringify(await prepareCatalog({ catalogFile: resolve('src/data/seed.json'), publicDir: resolve('public') })));
}
