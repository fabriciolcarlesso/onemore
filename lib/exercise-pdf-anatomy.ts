import { PDFParse } from "pdf-parse";
import path from "node:path";

PDFParse.setWorker(path.join(process.cwd(), "node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs"));

export type MuscleRole = "principal" | "auxiliar" | "sinergista" | "estabilizador";

export function normalizeText(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

export async function extractPdfAnatomy(content: Buffer) {
  const parser = new PDFParse({ data: content });
  try {
    const result = await parser.getText();
    return result.text;
  } finally {
    await parser.destroy();
  }
}
