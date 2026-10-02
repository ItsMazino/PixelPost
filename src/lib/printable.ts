import { PDFDocument, PrintScaling, Duplex } from "pdf-lib";

/** One landscape postcard per page, in PDF points (72 points = one inch). */
export async function createPostcardPdf(
  front: Uint8Array,
  back: Uint8Array,
  title: string,
) {
  const pdf = await PDFDocument.create();
  pdf.setTitle(`${title || "Postcard"} — printable postcard`);
  pdf.setCreator("PixelPost");
  pdf.setSubject(
    "6 × 4 inch postcard. Page 1: front. Page 2: note. Print at actual size, double-sided, flip on short edge.",
  );
  const preferences = pdf.catalog.getOrCreateViewerPreferences();
  preferences.setPrintScaling(PrintScaling.None);
  preferences.setDuplex(Duplex.DuplexFlipShortEdge);
  for (const image of [front, back]) {
    const embedded = await pdf.embedPng(image);
    const page = pdf.addPage([432, 288]);
    page.drawImage(embedded, { x: 0, y: 0, width: 432, height: 288 });
  }
  return pdf.save();
}
