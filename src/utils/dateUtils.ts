/**
 * Formats a Date object as YYYYMMDD string.
 */
export function formatToYYYYMMDD(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}${m}${d}`;
}

/**
 * Returns set of allowed date strings (YYYYMMDD) for news filtering.
 * Includes today, yesterday, and if today is Monday, also includes Saturday and Sunday.
 */
export function getAllowedDates(referenceDate: Date = new Date()): Set<string> {
  const dates = new Set<string>();
  const today = new Date(referenceDate);
  dates.add(formatToYYYYMMDD(today));

  // Include yesterday by default
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  dates.add(formatToYYYYMMDD(yesterday));

  const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday

  if (dayOfWeek === 1) {
    const saturday = new Date(today);
    saturday.setDate(today.getDate() - 2);
    dates.add(formatToYYYYMMDD(saturday));
  }

  return dates;
}

/**
 * Futunn's news list only shows a bare time (HH:MM) for items published "today",
 * or "MM/DD HH:MM" for older items. Normalizes into dateRaw and dateYYYYMMDD.
 */
export function normalizeFutunnTime(rawText: string): {
  dateRaw: string | null;
  dateYYYYMMDD: string | null;
} {
  const text = rawText.trim();
  const now = new Date();

  // Case 1: "HH:MM" -> today's date
  const timeOnlyMatch = text.match(/^(\d{1,2}):(\d{2})$/);
  if (timeOnlyMatch) {
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    const d = String(now.getDate()).padStart(2, "0");
    const hh = timeOnlyMatch[1].padStart(2, "0");
    const mm = timeOnlyMatch[2];
    return {
      dateRaw: `${y}/${m}/${d} ${hh}:${mm}`,
      dateYYYYMMDD: `${y}${m}${d}`,
    };
  }

  // Case 2: "MM/DD HH:MM" -> older items
  const monthDayTimeMatch = text.match(
    /^(\d{2})\/(\d{2})\s+(\d{1,2}):(\d{2})$/,
  );
  if (monthDayTimeMatch) {
    const [, m, d, hh, mm] = monthDayTimeMatch;
    let y = now.getFullYear();

    const candidate = new Date(y, Number(m) - 1, Number(d));
    if (candidate.getTime() > now.getTime()) {
      y -= 1;
    }

    const hhPadded = hh.padStart(2, "0");
    return {
      dateRaw: `${y}/${m}/${d} ${hhPadded}:${mm}`,
      dateYYYYMMDD: `${y}${m}${d}`,
    };
  }

  return { dateRaw: null, dateYYYYMMDD: null };
}
