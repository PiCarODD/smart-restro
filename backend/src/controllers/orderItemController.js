const { OrderItem, Order, MenuItem } = require('../models');
const { NotFoundError } = require('../utils/errors');
const orderService = require('../services/orderService');

class OrderItemController {
  /**
   * Add item to order
   * POST /api/orders/:id/items
   */
  async addItem(req, res, next) {
    try {
      const { id: orderId } = req.params;
      const itemData = req.body;

      const order = await Order.findOne({
        where: { id: orderId, restaurantId: req.restaurantId }
      });

      if (!order) {
        throw new NotFoundError('Order');
      }

      if (['completed', 'cancelled'].includes(order.status)) {
        return res.status(400).json({
          error: 'Cannot add items to completed or cancelled order'
        });
      }

      const menuItem = await MenuItem.findByPk(itemData.menuItemId);
      if (!menuItem) {
        throw new NotFoundError('Menu item');
      }

      const variant = itemData.variantName 
        ? menuItem.variants?.find(v => v.name === itemData.variantName)
        : null;
      
      const unitPrice = variant ? parseFloat(variant.price) : parseFloat(menuItem.basePrice);
      
      // Calculate modifiers total
      let modifiersTotal = 0;
      if (itemData.modifiers && Array.isArray(itemData.modifiers)) {
        modifiersTotal = itemData.modifiers.reduce((sum, mod) => sum + parseFloat(mod.price || 0), 0);
      }

      const totalPrice = (unitPrice * itemData.quantity) + modifiersTotal;

      const orderItem = await OrderItem.create({
        orderId,
        menuItemId: itemData.menuItemId,
        itemName: menuItem.name,
        variantName: itemData.variantName || null,
        quantity: itemData.quantity,
        unitPrice,
        totalPrice,
        modifiers: itemData.modifiers || [],
        modifiersTotal,
        notes: itemData.notes,
        kdsStation: itemData.kdsStation || menuItem.kdsStation,
        course: itemData.course || 1,
        fireAt: itemData.fireAt || null
      });

      // Recalculate order totals
      await orderService.calculateOrderTotals(orderId);

      res.status(201).json({
        message: 'Item added to order successfully',
        orderItem
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update order item
   * PUT /api/orders/:id/items/:itemId
   */
  async updateItem(req, res, next) {
    try {
      const { id: orderId, itemId } = req.params;

      const order = await Order.findOne({
        where: { id: orderId, restaurantId: req.restaurantId }
      });

      if (!order) {
        throw new NotFoundError('Order');
      }

      const orderItem = await OrderItem.findOne({
        where: { id: itemId, orderId }
      });

      if (!orderItem) {
        throw new NotFoundError('Order item');
      }

      await orderItem.update(req.body);

      // Recalculate order totals if price-related fields changed
      if (req.body.quantity || req.body.unitPrice || req.body.modifiers) {
        await orderService.calculateOrderTotals(orderId);
      }

      res.json({
        message: 'Order item updated successfully',
        orderItem
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Remove item from order
   * DELETE /api/orders/:id/items/:itemId
   */
  async removeItem(req, res, next) {
    try {
      const { id: orderId, itemId } = req.params;

      const order = await Order.findOne({
        where: { id: orderId, restaurantId: req.restaurantId }
      });

      if (!order) {
        throw new NotFoundError('Order');
      }

      const orderItem = await OrderItem.findOne({
        where: { id: itemId, orderId }
      });

      if (!orderItem) {
        throw new NotFoundError('Order item');
      }

      await orderItem.destroy();

      // Recalculate order totals
      await orderService.calculateOrderTotals(orderId);

      res.json({
        message: 'Item removed from order successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update order item status (KDS)
   * PUT /api/orders/:id/items/:itemId/status
   */
  async updateItemStatus(req, res, next) {
    try {
      const { id: orderId, itemId } = req.params;
      const { status } = req.body;

      const orderItem = await OrderItem.findOne({
        where: { id: itemId, orderId },
        include: [{ model: Order, as: 'order' }]
      });

      if (!orderItem) {
        throw new NotFoundError('Order item');
      }

      const statusUpdates = { status };

      if (status === 'preparing') {
        statusUpdates.startedAt = new Date();
      } else if (status === 'ready') {
        statusUpdates.readyAt = new Date();
      }

      await orderItem.update(statusUpdates);

      // Check if all items are ready, update order status
      const allItems = await OrderItem.findAll({ where: { orderId } });
      const allReady = allItems.every(item => 
        ['ready', 'served', 'cancelled'].includes(item.status)
      );

      if (allReady && orderItem.order.status === 'preparing') {
        await orderItem.order.update({ status: 'ready', readyAt: new Date() });

        // Emit order ready event
        if (req.app.get('io')) {
          req.app.get('io').to(`waiter:${orderItem.order.waiterId}`).emit('order:ready', {
            orderId,
            tableId: orderItem.order.tableId,
            orderNumber: orderItem.order.orderNumber
          });
        }
      }

      // Emit item status change event
      if (req.app.get('io')) {
        req.app.get('io').to(`kds:${req.restaurantId}`).emit('order:item_updated', {
          orderId,
          itemId,
          status,
          orderItem
        });
      }

      res.json({
        message: 'Order item status updated successfully',
        orderItem
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new OrderItemController();

