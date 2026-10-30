export interface ParsedDocumentResult {
  title: string;
  rawContent: string;
  wordCount: number;
  extractedMetadata?: Record<string, any>;
}

async function extractPdfText(buffer: Buffer): Promise<{ text: string; title?: string }> {
  try {
    const pdfModule = await import("pdf-parse");
    if (typeof (pdfModule as any).PDFParse === "function") {
      const parser = new (pdfModule as any).PDFParse({ data: buffer });
      await parser.load();
      const textResult = await parser.getText();
      let info = null;
      try {
        if (typeof parser.getInfo === "function") {
          info = await parser.getInfo();
        }
      } catch {
        // ignore info extraction error
      }
      const extractedText = typeof textResult === "string" ? textResult : (textResult?.text || "");
      return {
        text: extractedText,
        title: info?.Title || info?.title,
      };
    } else if (typeof (pdfModule as any).default === "function") {
      const data = await (pdfModule as any).default(buffer);
      return { text: data.text || "", title: data.info?.Title };
    }
  } catch (err) {
    console.warn("[fileParser] PDF parser standard pass warning, using text stream extraction:", err);
  }

  // Resilient fallback: extract stream text and ASCII representations
  const str = buffer.toString("binary");
  const textChunks: string[] = [];
  const streamRegex = /stream[\r\n]+([\s\S]*?)[\r\n]+endstream/g;
  let match;
  while ((match = streamRegex.exec(str)) !== null) {
    const chunk = match[1].replace(/[^\x20-\x7E\n\r\t]/g, " ").trim();
    if (chunk.length > 25) {
      textChunks.push(chunk);
    }
  }

  if (textChunks.length > 0) {
    return { text: textChunks.join("\n\n") };
  }

  return { text: buffer.toString("utf-8").replace(/[^\x20-\x7E\n\r\t]/g, " ") };
}

export async function parseFileBuffer(
  buffer: Buffer,
  fileName: string,
  mimetype: string
): Promise<ParsedDocumentResult> {
  const ext = fileName.split(".").pop()?.toLowerCase() || "";

  let rawContent = "";
  let extractedTitle = cleanFileNameToTitle(fileName);

  if (mimetype === "application/pdf" || ext === "pdf") {
    const pdfData = await extractPdfText(buffer);
    rawContent = pdfData.text || "";
    if (pdfData.title && pdfData.title.trim().length > 3) {
      extractedTitle = pdfData.title.trim();
    } else {
      const lines = rawContent
        .split("\n")
        .map((l) => l.trim())
        .filter((l) => l.length > 5);
      if (lines.length > 0 && lines[0].length < 150) {
        extractedTitle = lines[0].replace(/^#+\s*/, "");
      }
    }
  } else if (ext === "csv" || mimetype === "text/csv") {
    const text = buffer.toString("utf-8");
    rawContent = formatCsvToReadableText(text);
    extractedTitle = `Dataset Analysis: ${cleanFileNameToTitle(fileName)}`;
  } else {
    // Markdown or Plain Text
    rawContent = buffer.toString("utf-8");
    const lines = rawContent
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l.length > 3);
    if (lines.length > 0 && lines[0].startsWith("#")) {
      extractedTitle = lines[0].replace(/^#+\s*/, "").trim();
    } else if (lines.length > 0 && lines[0].length < 120) {
      extractedTitle = lines[0];
    }
  }

  // Normalize whitespace
  rawContent = rawContent.replace(/\r\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
  const wordCount = rawContent.split(/\s+/).filter(Boolean).length;

  return {
    title: extractedTitle,
    rawContent: rawContent.length > 0 ? rawContent : "No extractable text content found.",
    wordCount,
  };
}

function cleanFileNameToTitle(fileName: string): string {
  const base = fileName.replace(/\.[^/.]+$/, "");
  return base
    .replace(/[_-]+/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function formatCsvToReadableText(csvContent: string): string {
  const lines = csvContent.split("\n").filter((l) => l.trim().length > 0);
  if (lines.length === 0) return "Empty CSV dataset.";

  const header = lines[0].split(",").map((c) => c.trim().replace(/^["']|["']$/g, ""));
  const rowCount = lines.length - 1;

  let text = `CSV Dataset Overview:\nColumns: ${header.join(" | ")}\nTotal Rows: ${rowCount}\n\nSample Records:\n`;
  const sampleLimit = Math.min(lines.length, 25);

  for (let i = 1; i < sampleLimit; i++) {
    const cols = lines[i].split(",").map((c) => c.trim().replace(/^["']|["']$/g, ""));
    const rowObj = header.map((h, idx) => `${h}: ${cols[idx] || "N/A"}`).join(", ");
    text += `Row ${i}: ${rowObj}\n`;
  }

  if (lines.length > sampleLimit) {
    text += `\n... and ${lines.length - sampleLimit} additional rows included in statistical analysis.`;
  }

  return text;
}
