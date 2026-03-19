export interface TimestampResult {
  utc: string;
  local: string;
  iso: string;
  relative: string;
  date: Date;
}

export function timestampToDate(timestamp: number, isMilliseconds: boolean = false): TimestampResult {
  const ms = isMilliseconds ? timestamp : timestamp * 1000;
  const date = new Date(ms);
  if (isNaN(date.getTime())) {
    throw new Error("Invalid timestamp");
  }
  return {
    utc: date.toUTCString(),
    local: date.toLocaleString(),
    iso: date.toISOString(),
    relative: getRelativeTime(date),
    date,
  };
}

export function dateToTimestamp(dateStr: string): { seconds: number; milliseconds: number } {
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) {
    throw new Error("Invalid date");
  }
  const ms = date.getTime();
  return {
    seconds: Math.floor(ms / 1000),
    milliseconds: ms,
  };
}

export function nowTimestamp(): { seconds: number; milliseconds: number } {
  const ms = Date.now();
  return {
    seconds: Math.floor(ms / 1000),
    milliseconds: ms,
  };
}

function getRelativeTime(date: Date): string {
  const now = Date.now();
  const diffMs = now - date.getTime();
  const absDiff = Math.abs(diffMs);
  const isPast = diffMs > 0;

  const seconds = Math.floor(absDiff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const months = Math.floor(days / 30);
  const years = Math.floor(days / 365);

  let value: string;
  if (seconds < 60) value = `${seconds} second${seconds !== 1 ? "s" : ""}`;
  else if (minutes < 60) value = `${minutes} minute${minutes !== 1 ? "s" : ""}`;
  else if (hours < 24) value = `${hours} hour${hours !== 1 ? "s" : ""}`;
  else if (days < 30) value = `${days} day${days !== 1 ? "s" : ""}`;
  else if (months < 12) value = `${months} month${months !== 1 ? "s" : ""}`;
  else value = `${years} year${years !== 1 ? "s" : ""}`;

  return isPast ? `${value} ago` : `in ${value}`;
}
