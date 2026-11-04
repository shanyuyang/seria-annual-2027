export const EVENT_START = Date.parse('2026-12-25T00:00:00+08:00');
export const EVENT_END = Date.parse('2026-12-26T00:00:00+08:00');
export function countdown(now = Date.now()) {
  let seconds = Math.max(0, Math.floor((EVENT_START - now) / 1000));
  const days = Math.floor(seconds / 86400); seconds %= 86400;
  const hours = Math.floor(seconds / 3600); seconds %= 3600;
  return { days, hours, minutes: Math.floor(seconds / 60), seconds: seconds % 60 };
}
export function eventState(now = Date.now()) {
  return now < EVENT_START ? 'upcoming' : now < EVENT_END ? 'today' : 'past';
}

export function readReceiptState(storage,key,fallback) {
  try {
    const value=JSON.parse(storage.getItem(key)||'null');
    return typeof value?.receipt==='string' && /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value.receipt) ? value : fallback;
  } catch {return fallback;}
}
