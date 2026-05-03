import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { seatLockManager } from '../config/redis';
import { logger } from '../utils/logger';

export function setupSocket(io: Server): void {
  // Authentication middleware
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;
    if (token) {
      try {
        const decoded = jwt.verify(token as string, config.jwt.secret) as { userId: string };
        (socket as any).userId = decoded.userId;
      } catch {
        // Allow unauthenticated connections for viewing
      }
    }
    next();
  });

  io.on('connection', (socket: Socket) => {
    const userId = (socket as any).userId;
    logger.debug(`Socket connected: ${socket.id} (user: ${userId || 'anonymous'})`);

    // Join showtime room for real-time seat updates
    socket.on('showtime:join', (showtimeId: string) => {
      socket.join(`showtime:${showtimeId}`);
      logger.debug(`Socket ${socket.id} joined showtime:${showtimeId}`);
    });

    socket.on('showtime:leave', (showtimeId: string) => {
      socket.leave(`showtime:${showtimeId}`);
    });

    // Seat locking
    socket.on('seat:lock', async (data: { showtimeId: string; seatId: string }) => {
      if (!userId) {
        socket.emit('error', { message: 'Authentication required' });
        return;
      }

      const success = await seatLockManager.lockSeat(data.showtimeId, data.seatId, userId);
      if (success) {
        io.to(`showtime:${data.showtimeId}`).emit('seat:locked', {
          showtimeId: data.showtimeId,
          seatId: data.seatId,
          userId,
        });
      } else {
        socket.emit('seat:lockFailed', {
          seatId: data.seatId,
          message: 'Seat is already locked by another user',
        });
      }
    });

    // Seat unlocking
    socket.on('seat:unlock', async (data: { showtimeId: string; seatId: string }) => {
      if (!userId) return;

      const success = await seatLockManager.unlockSeat(data.showtimeId, data.seatId, userId);
      if (success) {
        io.to(`showtime:${data.showtimeId}`).emit('seat:unlocked', {
          showtimeId: data.showtimeId,
          seatId: data.seatId,
        });
      }
    });

    // Get current locks
    socket.on('seats:getLocks', async (showtimeId: string) => {
      const locks = await seatLockManager.getSeatLocks(showtimeId);
      socket.emit('seats:currentLocks', { showtimeId, locks });
    });

    // Disconnect
    socket.on('disconnect', () => {
      logger.debug(`Socket disconnected: ${socket.id}`);
    });
  });
}
