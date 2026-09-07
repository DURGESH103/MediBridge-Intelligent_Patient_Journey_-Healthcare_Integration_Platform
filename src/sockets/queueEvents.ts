import { tryGetSocketServer } from './index';
import { QueueEntry } from '../modules/queue/queue.types';

function doctorQueueRoom(doctorId: number): string {
  return `doctor:${doctorId}:queue`;
}

export function emitQueueUpdated(doctorId: number, entries: QueueEntry[]): void {
  tryGetSocketServer()?.to(doctorQueueRoom(doctorId)).emit('queue:updated', { doctorId, entries });
}

export function emitPatientCalled(doctorId: number, entry: QueueEntry): void {
  tryGetSocketServer()?.to(doctorQueueRoom(doctorId)).emit('queue:patient-called', { doctorId, entry });
}
