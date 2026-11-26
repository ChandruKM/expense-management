import { WalletState, BUCKET_LABELS, BucketKey } from "@/types";
import { isoDateString } from "@/utils/currency";

function formatRs(amount: number): string {
  const num = new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 0,
  }).format(Math.abs(amount));
  return `${amount < 0 ? "-" : ""}Rs. ${num}`;
}

function pdfEscape(text: string): string {
  // Strip non-ASCII characters (like emojis/₹) for Type1 Helvetica safety
  const ascii = text.replace(/[^\x20-\x7E]/g, "").trim();
  return ascii
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)");
}

interface TextLine {
  text: string;
  x: number;
  y: number;
  size: number;
  bold?: boolean;
}

function buildPdfBlob(pagesLines: TextLine[][]): Blob {
  const objects: string[] = [];
  const addObj = (body: string) => {
    objects.push(body);
    return objects.length; // 1-based object ID
  };

  // 1: Catalog (placeholder, updated later)
  const catalogId = addObj("");
  // 2: Pages (placeholder, updated later)
  const pagesId = addObj("");
  // 3: Regular Font
  const fontRegId = addObj(
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>"
  );
  // 4: Bold Font
  const fontBoldId = addObj(
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>"
  );

  const pageIds: number[] = [];

  for (const lines of pagesLines) {
    const streamParts: string[] = [];
    for (const line of lines) {
      const font = line.bold ? "/F2" : "/F1";
      streamParts.push(
        `BT ${font} ${line.size} Tf ${line.x} ${line.y} Td (${pdfEscape(line.text)}) Tj ET`
      );
    }
    const streamContent = streamParts.join("\n");
    const contentId = addObj(
      `<< /Length ${streamContent.length} >>\nstream\n${streamContent}\nendstream`
    );
    const pageId = addObj(
      `<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 ${fontRegId} 0 R /F2 ${fontBoldId} 0 R >> >> /Contents ${contentId} 0 R >>`
    );
    pageIds.push(pageId);
  }

  objects[catalogId - 1] = `<< /Type /Catalog /Pages ${pagesId} 0 R >>`;
  objects[pagesId - 1] = `<< /Type /Pages /Kids [${pageIds
    .map((id) => `${id} 0 R`)
    .join(" ")}] /Count ${pageIds.length} >>`;

  let pdf = "%PDF-1.4\n";
  const offsets: number[] = [0];

  for (let i = 0; i < objects.length; i++) {
    offsets.push(pdf.length);
    pdf += `${i + 1} 0 obj\n${objects[i]}\nendobj\n`;
  }

  const xrefPos = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += "0000000000 65535 f \n";
  for (let i = 1; i <= objects.length; i++) {
    pdf += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root ${catalogId} 0 R >>\nstartxref\n${xrefPos}\n%%EOF`;

  return new Blob([pdf], { type: "application/pdf" });
}

export function exportWalletPDF(state: WalletState): void {
  const pages: TextLine[][] = [];
  let current: TextLine[] = [];
  let y = 790;

  const pushPage = () => {
    pages.push(current);
    current = [];
    y = 790;
  };

  const addLine = (text: string, x = 48, size = 10, bold = false, gap = 16) => {
    if (y < 60) {
      pushPage();
    }
    current.push({ text, x, y, size, bold });
    y -= gap;
  };

  const today = isoDateString(new Date());
  const netWorth = state.buckets.needs + state.buckets.spend + state.buckets.savings;

  // Header
  addLine("FlowWallet - Financial Statement", 48, 18, true, 22);
  addLine(`Generated: ${today}   |   Currency: INR`, 48, 10, false, 24);

  // Summary
  addLine("BUCKET SUMMARY", 48, 11, true, 18);
  addLine(`Net Balance: ${formatRs(netWorth)}`, 48, 11, true, 18);
  (["needs", "spend", "savings"] as BucketKey[]).forEach((k) => {
    addLine(
      `${BUCKET_LABELS[k]} (${state.bucketSplit[k]}%): ${formatRs(state.buckets[k])}`,
      56,
      10,
      false,
      15
    );
  });

  y -= 10;

  // Auto-Rules
  addLine("ACTIVE AUTO-DEDUCT RULES", 48, 11, true, 18);
  const activeRules = state.autoRules.filter((r) => r.enabled);
  if (activeRules.length === 0) {
    addLine("No active auto-deduct rules.", 56, 10, false, 15);
  } else {
    activeRules.forEach((r) => {
      const freq = r.frequency === "monthly" ? `Monthly (Day ${r.dayOfMonth})` : "Daily";
      addLine(
        `- ${r.name}: ${formatRs(r.amount)} | ${freq} | ${BUCKET_LABELS[r.bucket]}`,
        56,
        10,
        false,
        15
      );
    });
  }

  y -= 10;

  // Transactions
  addLine("TRANSACTION HISTORY", 48, 11, true, 18);
  addLine("DATE          TYPE        NOTE                         AMOUNT", 48, 9, true, 16);

  const sorted = [...state.transactions].sort((a, b) =>
    a.date < b.date ? 1 : a.date > b.date ? -1 : 0
  );

  if (sorted.length === 0) {
    addLine("No transactions recorded.", 56, 10, false, 15);
  } else {
    for (const tx of sorted) {
      const dateCol = tx.date.padEnd(13, " ");
      const typeCol = tx.type.toUpperCase().padEnd(11, " ");
      const cleanNote = tx.note.replace(/[^\x20-\x7E]/g, "").slice(0, 26).padEnd(28, " ");
      const amtCol = `${tx.amount > 0 ? "+" : ""}${formatRs(tx.amount)}`;
      addLine(`${dateCol} ${typeCol} ${cleanNote} ${amtCol}`, 48, 9, false, 14);
    }
  }

  if (current.length > 0) {
    pages.push(current);
  }

  const blob = buildPdfBlob(pages);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `flowwallet-statement-${today}.pdf`;
  a.click();
  URL.revokeObjectURL(url);
}
