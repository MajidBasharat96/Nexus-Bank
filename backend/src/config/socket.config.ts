import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import { config } from './app.config';
import { logger } from './logger.config';

export function setupSocketHandlers(io: Server): void {
  // Auth middleware for sockets
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error('Authentication required'));
    }
    try {
      const decoded = jwt.verify(token, config.jwt.secret) as any;
      socket.data.user = decoded;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.data.user?.id;
    logger.info(`Socket connected: ${socket.id} | User: ${userId}`);

    // Join user's personal room
    if (userId) {
      socket.join(`user:${userId}`);
    }

    // Join tenant room for broadcast
    const tenantId = socket.data.user?.tenantId;
    if (tenantId) {
      socket.join(`tenant:${tenantId}`);
    }

    socket.on('join:account', (accountId: string) => {
      socket.join(`account:${accountId}`);
    });

    socket.on('leave:account', (accountId: string) => {
      socket.leave(`account:${accountId}`);
    });

    socket.on('disconnect', () => {
      logger.info(`Socket disconnected: ${socket.id}`);
    });
  });
}

// Emit to specific user
export function emitToUser(io: Server, userId: string, event: string, data: any): void {
  io.to(`user:${userId}`).emit(event, data);
}

// Emit to tenant
export function emitToTenant(io: Server, tenantId: string, event: string, data: any): void {
  io.to(`tenant:${tenantId}`).emit(event, data);
}

// Broadcast transaction update
export function broadcastTransactionUpdate(io: Server, accountId: string, data: any): void {
  io.to(`account:${accountId}`).emit('transaction:update', data);
}
