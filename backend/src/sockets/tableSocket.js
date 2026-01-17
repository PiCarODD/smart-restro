/**
 * Socket.IO handlers for real-time table updates
 * This will be integrated in app.js when Socket.IO is set up
 */

const jwt = require('jsonwebtoken');
const { AuthenticationError } = require('../utils/errors');

module.exports = (io) => {
  const tableNamespace = io.of('/tables');

  tableNamespace.on('connection', async (socket) => {
    try {
      const authHeader = socket.handshake.auth?.authorization || socket.handshake.headers?.authorization;

      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        socket.disconnect();
        return;
      }

      const token = authHeader.split(' ')[1];
      let decoded;

      try {
        decoded = jwt.verify(token, process.env.JWT_SECRET);
      } catch (err) {
        socket.disconnect();
        return;
      }

      const restaurantId = decoded.restaurantId || decoded.restaurantId;
      if (!restaurantId) {
        socket.disconnect();
        return;
      }

      socket.join(`restaurant:${restaurantId}`);

      socket.on('table:subscribe', ({ tableId }) => {
        socket.join(`table:${tableId}`);
      });

      socket.on('table:unsubscribe', ({ tableId }) => {
        socket.leave(`table:${tableId}`);
      });

      socket.on('disconnect', () => {
      });
    } catch (error) {
      socket.disconnect();
    }
  });

  /**
   * Helper function to emit table status changes
   */
  const emitTableStatusChange = (restaurantId, tableData) => {
    io.of('/tables').to(`restaurant:${restaurantId}`).emit('table:status_changed', tableData);
    if (tableData.tableId) {
      io.of('/tables').to(`table:${tableData.tableId}`).emit('table:status_changed', tableData);
    }
  };

  /**
   * Helper function to emit table updates
   */
  const emitTablesUpdated = (restaurantId) => {
    io.of('/tables').to(`restaurant:${restaurantId}`).emit('tables:updated');
  };

  return {
    emitTableStatusChange,
    emitTablesUpdated
  };
};

