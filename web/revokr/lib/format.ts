const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

export function formatDuration(ms: number): string {
  if (ms < MINUTE) return `${Math.max(1, Math.round(ms / 1000))}s`;
  if (ms < HOUR) return `${Math.round(ms / MINUTE)}m`;
  if (ms < DAY) {
    const hours = Math.floor(ms / HOUR);
    const minutes = Math.floor((ms % HOUR) / MINUTE);
    return minutes ? `${hours}h ${minutes}m` : `${hours}h`;
  }
  return `${Math.floor(ms / DAY)}d`;
}

const DATE_TIME = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "UTC",
});

export function formatDateTime(iso: string): string {
  return `${DATE_TIME.format(new Date(iso))} UTC`;
}

const TIME = new Intl.DateTimeFormat("en-GB", {
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false,
  timeZone: "UTC",
});

export function formatTime(iso: string): string {
  return TIME.format(new Date(iso));
}

export function timeAgo(iso: string, now = Date.now()): string {
  const ms = now - new Date(iso).getTime();
  return ms < MINUTE ? "just now" : `${formatDuration(ms)} ago`;
}
