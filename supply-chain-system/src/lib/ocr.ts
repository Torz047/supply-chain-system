import Tesseract from 'tesseract.js';

export async function extractTextFromImage(file: File): Promise<string> {
  const { data } = await Tesseract.recognize(file, 'eng', {
    logger: (m) => console.log(m),
  });
  return data.text;
}

export function parseOrderFromText(text: string) {
  const orderNumberMatch = text.match(/(?:Order|PO|Ref)[#:\s]*([A-Z0-9-]+)/i);
  const customerMatch = text.match(/(?:Customer|Bill To|Sold To)[:\s]*(.+)/i);
  const dateMatch = text.match(/\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}/);

  const itemRegex = /(\d+)\s+([A-Z0-9-]{3,})\s+(.+?)\s+([\d,.]+)/g;
  const items: { quantity: number; sku: string; description: string; unit_price: number }[] = [];
  let m;
  while ((m = itemRegex.exec(text)) !== null) {
    items.push({
      quantity: parseInt(m[1]),
      sku: m[2],
      description: m[3].trim(),
      unit_price: parseFloat(m[4].replace(/,/g, '')),
    });
  }

  return {
    order_number: orderNumberMatch?.[1] || `OCR-${Date.now()}`,
    customer: customerMatch?.[1]?.trim() || 'Unknown',
    order_date: dateMatch?.[0] || new Date().toISOString().split('T')[0],
    items,
    raw_text: text,
  };
}
