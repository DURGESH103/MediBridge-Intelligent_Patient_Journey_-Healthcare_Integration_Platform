// The backend stores clinic wall-clock times (doctor availability, slots,
// appointment times) as UTC without any real per-hospital timezone concept -
// "09:00" always means "9am at the clinic", not "9am UTC converted to the
// viewer's local time". So every formatter here pins timeZone: 'UTC' to
// display the literal stored value instead of shifting it to the browser's
// local timezone.
const dateFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
  timeZone: 'UTC',
});
const timeFormatter = new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit', timeZone: 'UTC' });
const dateTimeFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
  timeZone: 'UTC',
});

export function formatDate(iso: string): string {
  return dateFormatter.format(new Date(iso));
}

export function formatTime(iso: string): string {
  return timeFormatter.format(new Date(iso));
}

export function formatDateTime(iso: string): string {
  return dateTimeFormatter.format(new Date(iso));
}

export function todayDateString(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Builds the UTC ISO datetime string the backend expects from a clinic-local date + "HH:MM" slot time. */
export function toScheduledAtUtc(date: string, time: string): string {
  return `${date}T${time}:00Z`;
}
