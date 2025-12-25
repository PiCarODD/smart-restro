const { Table } = require('../models');
const { NotFoundError } = require('../utils/errors');
const crypto = require('crypto');

/**
 * Generate unique external token for table
 */
function generateExternalToken() {
  return crypto.randomBytes(32).toString('hex');
}

class TableController {

  /**
   * List tables for restaurant
   * GET /api/tables
   */
  async list(req, res, next) {
    try {
      const { sectionId, status } = req.query;
      const where = {
        restaurantId: req.restaurantId // Only from JWT token, never from client
      };

      if (sectionId) {
        where.sectionId = sectionId;
      }
      if (status) {
        where.status = status;
      }

      const tables = await Table.findAll({
        where,
        include: [
          { model: require('../models').Restaurant, as: 'restaurant', attributes: ['id', 'name'] },
          { model: require('../models').Section, as: 'sectionData', attributes: ['id', 'name', 'color'] }
        ],
        order: [['tableNumber', 'ASC']]
      });

      res.json({ tables });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get table by ID with current order
   * GET /api/tables/:id
   */
  async getById(req, res, next) {
    try {
      const { id } = req.params;
      const table = await Table.findOne({
        where: { id, restaurantId: req.restaurantId },
        include: [
          { model: require('../models').Restaurant, as: 'restaurant', attributes: ['id', 'name'] },
          { model: require('../models').Section, as: 'sectionData', attributes: ['id', 'name', 'color'] }
        ]
      });

      if (!table) {
        throw new NotFoundError('Table');
      }

      // If table has a current order, include it
      let currentOrder = null;
      if (table.currentOrderId) {
        // Order model will be available in later phases
        // For now, just include the order ID
        currentOrder = { id: table.currentOrderId };
      }

      res.json({
        table: {
          ...table.toJSON(),
          currentOrder
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create table
   * POST /api/tables
   */
  async create(req, res, next) {
    try {
      const {
        tableNumber,
        name,
        sectionId,
        section,
        floor,
        capacity,
        shape,
        positionX,
        positionY,
        width,
        height,
        rotation
      } = req.body;

      // Generate external token for QR code/waiter app access
      const externalToken = generateExternalToken();

      const table = await Table.create({
        restaurantId: req.restaurantId,
        tableNumber,
        name: name || null, // Convert empty string to null
        sectionId,
        section,
        floor: floor || 1,
        capacity: capacity || 4,
        shape: shape || 'square',
        positionX: positionX || 0,
        positionY: positionY || 0,
        width: width || 100,
        height: height || 100,
        rotation: rotation || 0,
        externalToken,
        status: 'available'
      });

      res.status(201).json({
        message: 'Table created successfully',
        table
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update table
   * PUT /api/tables/:id
   */
  async update(req, res, next) {
    try {
      const { id } = req.params;
      const {
        tableNumber,
        name,
        sectionId,
        section,
        floor,
        capacity,
        shape,
        positionX,
        positionY,
        width,
        height,
        rotation
      } = req.body;

      const table = await Table.findOne({
        where: { id, restaurantId: req.restaurantId }
      });

      if (!table) {
        throw new NotFoundError('Table');
      }

      await table.update({
        tableNumber,
        name: name !== undefined ? (name || null) : table.name, // Convert empty string to null
        sectionId,
        section,
        floor,
        capacity,
        shape,
        positionX,
        positionY,
        width,
        height,
        rotation
      });

      res.json({
        message: 'Table updated successfully',
        table
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete table
   * DELETE /api/tables/:id
   */
  async delete(req, res, next) {
    try {
      const { id } = req.params;

      const table = await Table.findOne({
        where: { id, restaurantId: req.restaurantId }
      });

      if (!table) {
        throw new NotFoundError('Table');
      }

      // Check if table is occupied
      if (table.status === 'occupied' || table.currentOrderId) {
        return res.status(400).json({
          error: 'Cannot delete occupied table',
          message: 'Please close the current order and set table status to available first'
        });
      }

      await table.destroy();

      res.json({
        message: 'Table deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update table status
   * PUT /api/tables/:id/status
   */
  async updateStatus(req, res, next) {
    try {
      const { id } = req.params;
      const { status, guestCount, orderId } = req.body;

      const table = await Table.findOne({
        where: { id, restaurantId: req.restaurantId }
      });

      if (!table) {
        throw new NotFoundError('Table');
      }

      const updateData = { status };

      if (status === 'occupied') {
        updateData.occupiedAt = new Date();
        updateData.currentOrderId = orderId || table.currentOrderId;
        if (guestCount !== undefined) {
          updateData.guestCount = guestCount;
        }
      } else if (status === 'available') {
        updateData.currentOrderId = null;
        updateData.occupiedAt = null;
        updateData.guestCount = null;
      }

      await table.update(updateData);

      // Emit real-time update via Socket.IO (will be implemented in sockets)
      // io.to(`restaurant:${req.restaurantId}`).emit('table:status_changed', {
      //   tableId: id,
      //   status,
      //   orderId: updateData.currentOrderId,
      //   guestCount: updateData.guestCount
      // });

      res.json({
        message: 'Table status updated successfully',
        table
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get table order history
   * GET /api/tables/:id/orders
   */
  async getOrderHistory(req, res, next) {
    try {
      const { id } = req.params;

      const table = await Table.findOne({
        where: { id, restaurantId: req.restaurantId }
      });

      if (!table) {
        throw new NotFoundError('Table');
      }

      // Order history will be implemented in Phase 7 (Order Management)
      // For now, return empty array
      res.json({
        orders: []
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Generate QR code URL for table
   * GET /api/tables/:id/qr-code
   */
  async getQRCode(req, res, next) {
    try {
      const { id } = req.params;

      const table = await Table.findOne({
        where: { id, restaurantId: req.restaurantId },
        attributes: ['id', 'externalToken', 'tableNumber']
      });

      if (!table) {
        throw new NotFoundError('Table');
      }

      // Generate QR code URL (in production, use a QR code service)
      const qrCodeUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/waiter/table/${table.externalToken}`;

      // Update table with QR code URL if not set
      if (!table.qrCodeUrl) {
        await table.update({ qrCodeUrl });
      }

      res.json({
        qrCodeUrl,
        externalToken: table.externalToken,
        tableNumber: table.tableNumber
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new TableController();

