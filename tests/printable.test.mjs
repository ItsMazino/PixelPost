import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PDFDocument, Duplex, PrintScaling } from 'pdf-lib';
import { createPostcardPdf } from '../src/lib/printable.ts';

test('printable postcard contains two exact 6 by 4 inch pages and duplex hints', async () => {
  const front = await readFile(new URL('../docs/example-front.png', import.meta.url));
  const back = await readFile(new URL('../docs/example-back.png', import.meta.url));
  const pdf = await PDFDocument.load(await createPostcardPdf(front, back, 'Summer'));
  assert.equal(pdf.getPageCount(), 2);
  for (const page of pdf.getPages()) assert.deepEqual(page.getSize(), {width:432,height:288});
  const preferences = pdf.catalog.getOrCreateViewerPreferences();
  assert.equal(preferences.getPrintScaling(), PrintScaling.None);
  assert.equal(preferences.getDuplex(), Duplex.DuplexFlipShortEdge);
  assert.match(pdf.getTitle(), /Summer/);
});

test('invalid image bytes reject instead of producing a partial postcard PDF', async () => {
  await assert.rejects(createPostcardPdf(new Uint8Array([1,2,3]),new Uint8Array([4]),'Broken'));
});
