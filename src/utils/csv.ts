import { YarnSkein } from '../types';

/**
 * Converts an array of YarnSkein elements to a downloadable CSV string.
 */
export function convertSkeinsToCSV(skeins: YarnSkein[]): string {
  const headers = [
    'Brand',
    'Line/Name',
    'Colorway',
    'Color Hex Code',
    'Recommended Hook/Needle Sizes',
    'Meterage (per skein)',
    'Stash Quantity',
    'Custom Notes',
    'Created At'
  ];

  const rows = skeins.map(s => [
    s.brand,
    s.name,
    s.color,
    s.colorHex || '',
    s.hookSizes || '',
    s.meters,
    s.quantity,
    s.notes || '',
    s.createdAt || ''
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(row => 
      row.map(val => {
        const str = String(val ?? '');
        // Escape standard quotes inside column content
        const escaped = str.replace(/"/g, '""');
        // Wrap cell in quotes if it has list commas, line breaks or raw quotes
        if (escaped.includes(',') || escaped.includes('\n') || escaped.includes('\r') || escaped.includes('"')) {
          return `"${escaped}"`;
        }
        return escaped;
      }).join(',')
    )
  ].join('\n');

  return csvContent;
}

/**
 * Parses raw CSV content text back into an array of insertable YarnSkein templates.
 */
export function parseCSVToSkeins(csvText: string): Omit<YarnSkein, 'id' | 'createdAt'>[] {
  const lines: string[] = [];
  let currentLine = '';
  let inQuotes = false;

  for (let i = 0; i < csvText.length; i++) {
    const char = csvText[i];
    if (char === '"') {
      inQuotes = !inQuotes;
      currentLine += char;
    } else if ((char === '\n' || char === '\r') && !inQuotes) {
      if (currentLine.trim()) {
        lines.push(currentLine);
      }
      currentLine = '';
    } else {
      currentLine += char;
    }
  }
  if (currentLine.trim()) {
    lines.push(currentLine);
  }

  if (lines.length < 2) return [];

  // Decode top header line
  const headerLine = lines[0];
  const headers = parseCSVLine(headerLine);

  const result: any[] = [];
  for (let i = 1; i < lines.length; i++) {
    const rowValues = parseCSVLine(lines[i]);
    if (rowValues.length === 0 || rowValues.every(v => v.trim() === '')) continue;

    const item: any = {};
    headers.forEach((header, index) => {
      const val = rowValues[index] !== undefined ? rowValues[index].trim() : '';
      const hNorm = header.toLowerCase().replace(/[^a-z0-9]/g, '');

      // Flexibly map column aliases
      if (hNorm.includes('brand')) {
        item.brand = val;
      } else if (hNorm.includes('line') || hNorm.includes('name')) {
        item.name = val;
      } else if (hNorm.includes('colorway') || hNorm.includes('color')) {
        if (hNorm.includes('hex')) {
          item.colorHex = val;
        } else {
          item.color = val;
        }
      } else if (hNorm.includes('hook') || hNorm.includes('needle') || hNorm.includes('size')) {
        item.hookSizes = val;
      } else if (hNorm.includes('meter') || hNorm.includes('yard') || hNorm.includes('len')) {
        item.meters = Number(val) || 0;
      } else if (hNorm.includes('qty') || hNorm.includes('quantity') || hNorm.includes('stash') || hNorm.includes('count')) {
        item.quantity = Number(val) || 0;
      } else if (hNorm.includes('note') || hNorm.includes('desc')) {
        item.notes = val;
      }
    });

    // Provide robust defaults if some columns were not found
    if (!item.brand) item.brand = 'Generic';
    if (!item.name) item.name = 'Yarn Option';
    if (!item.color) item.color = 'Multicolor';
    if (!item.colorHex) item.colorHex = '#D38E75';
    if (item.meters === undefined) item.meters = 150;
    if (item.quantity === undefined) item.quantity = 1;
    if (!item.hookSizes) item.hookSizes = '4.0,5.0';

    result.push(item);
  }

  return result;
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let currentVal = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
      // Skip the quote character itself in parsed output
    } else if (char === ',' && !inQuotes) {
      result.push(currentVal);
      currentVal = '';
    } else {
      currentVal += char;
    }
  }
  result.push(currentVal);
  return result;
}
