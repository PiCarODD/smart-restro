/**
 * Socket.IO handlers for real-time table updates
 * This will be integrated in app.js when Socket.IO is set up
 */

module.exports = (io) => {
  const tableNamespace = io.of('/tables');

  tableNamespace.on('connection', (socket) => {
    const { restaurantId } = socket.handshake.query;

    if (!restaurantId) {
      socket.disconnect();
      return;
    }

    // Join restaurant room
    socket.join(`restaurant:${restaurantId}`);

    // Handle table status updates
    socket.on('table:subscribe', ({ tableId }) => {
      socket.join(`table:${tableId}`);
    });

    socket.on('table:unsubscribe', ({ tableId }) => {
      socket.leave(`table:${tableId}`);
    });

    socket.on('disconnect', () => {
      // Cleanup handled automatically by Socket.IO
    });
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

