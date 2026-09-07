function toMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

function toTimeString(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60)
    .toString()
    .padStart(2, '0');
  const minutes = (totalMinutes % 60).toString().padStart(2, '0');
  return `${hours}:${minutes}`;
}

/**
 * Generates fixed-size slot start/end times between startTime and endTime.
 * A trailing partial slot (shorter than slotDurationMinutes) is dropped.
 */
export function generateSlots(
  startTime: string,
  endTime: string,
  slotDurationMinutes: number
): { startTime: string; endTime: string }[] {
  const slots: { startTime: string; endTime: string }[] = [];
  const rangeStart = toMinutes(startTime);
  const rangeEnd = toMinutes(endTime);

  for (let slotStart = rangeStart; slotStart + slotDurationMinutes <= rangeEnd; slotStart += slotDurationMinutes) {
    slots.push({
      startTime: toTimeString(slotStart),
      endTime: toTimeString(slotStart + slotDurationMinutes),
    });
  }

  return slots;
}
