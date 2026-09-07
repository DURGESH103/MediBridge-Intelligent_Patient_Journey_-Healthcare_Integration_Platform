import { Server as HttpServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { env } from '../config/env';
import { logger } from '../config/logger';
import { verifyAccessToken } from '../utils/jwt';
import { UserRole } from '../types/roles';
import { patientsRepository } from '../modules/patients/patients.repository';
import { queueRepository } from '../modules/queue/queue.repository';
import { todayDateString } from '../utils/dateOnly';

const STAFF_ROLES = new Set<UserRole>([
  UserRole.ADMIN,
  UserRole.RECEPTIONIST,
  UserRole.DOCTOR,
  UserRole.LAB_STAFF,
  UserRole.BILLING_STAFF,
]);

async function canJoinDoctorQueueRoom(user: { userId: number; role: UserRole }, doctorId: number): Promise<boolean> {
  if (STAFF_ROLES.has(user.role)) {
    return true;
  }
  const patient = await patientsRepository.findByUserId(user.userId);
  if (!patient) {
    return false;
  }
  return queueRepository.hasActiveEntryForPatient(patient.id, doctorId, todayDateString());
}

let io: SocketIOServer | undefined;

export function initSocketServer(httpServer: HttpServer): SocketIOServer {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: env.corsOrigin,
      credentials: true,
    },
  });

  io.use((socket: Socket, next) => {
    const token = socket.handshake.auth?.token as string | undefined;
    if (!token) {
      next(new Error('Authentication token was not provided'));
      return;
    }
    try {
      const payload = verifyAccessToken(token);
      socket.data.user = payload;
      next();
    } catch {
      next(new Error('Invalid or expired authentication token'));
    }
  });

  io.on('connection', (socket: Socket) => {
    const user = socket.data.user as { userId: number; role: UserRole } | undefined;
    logger.debug(`Socket connected: ${socket.id} (user ${user?.userId ?? 'unknown'})`);

    void (async () => {
      if (!user) {
        return;
      }
      // Every authenticated socket auto-joins a personal room so notification-style
      // events (lab reports, appointment updates, etc.) can target a user directly.
      socket.join(`user:${user.userId}`);
      if (user.role === UserRole.PATIENT) {
        const patient = await patientsRepository.findByUserId(user.userId);
        if (patient) {
          socket.join(`patient:${patient.id}`);
        }
      }
    })();

    socket.on('queue:join', async (payload: { doctorId?: number }, ack?: (result: { ok: boolean; error?: string }) => void) => {
      const doctorId = Number(payload?.doctorId);
      if (!user || !doctorId) {
        ack?.({ ok: false, error: 'A valid doctorId is required' });
        return;
      }
      const allowed = await canJoinDoctorQueueRoom(user, doctorId);
      if (!allowed) {
        ack?.({ ok: false, error: 'You are not authorized to watch this queue' });
        return;
      }
      socket.join(`doctor:${doctorId}:queue`);
      ack?.({ ok: true });
    });

    socket.on('disconnect', () => {
      logger.debug(`Socket disconnected: ${socket.id}`);
    });
  });

  return io;
}

export function getSocketServer(): SocketIOServer {
  if (!io) {
    throw new Error('Socket.IO server has not been initialized yet');
  }
  return io;
}

/**
 * Best-effort accessor for emitters: real-time delivery is a nice-to-have on
 * top of the persisted state, never a dependency the core business flow
 * (booking, check-in, lab completion, ...) should fail because of - e.g. in
 * tests, or if the socket layer isn't running for some other reason.
 */
export function tryGetSocketServer(): SocketIOServer | undefined {
  return io;
}
