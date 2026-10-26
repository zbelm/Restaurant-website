import site from '../content/site.json';

export type Range = { label?: string; open: string; close: string };
export type DayHours = { day: string; closed?: boolean; ranges?: Range[] };

export const hours = site.hours as DayHours[];

/** "17:30" -> "5:30 pm", "17:00" -> "5 pm" */
export function fmtTime(t: string): string {
  const [h, m] = t.split(':').map(Number);
  const suffix = h >= 12 ? 'pm' : 'am';
  const hr = h % 12 === 0 ? 12 : h % 12;
  return m ? `${hr}:${String(m).padStart(2, '0')} ${suffix}` : `${hr} ${suffix}`;
}

export function fmtRanges(day: DayHours): string {
  if (day.closed || !day.ranges?.length) return 'Closed';
  return day.ranges.map((r) => `${fmtTime(r.open)} – ${fmtTime(r.close)}`).join(' · ');
}

export const price = (n: number) => `$${n}`;

export const addressLine = `${site.address.street}, ${site.address.city}, ${site.address.region} ${site.address.postalCode}`;

export const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addressLine)}`;
