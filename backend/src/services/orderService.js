const { Order, OrderItem, MenuItem, Restaurant, Table } = require('../models');
const { NotFoundError } = require('../utils/errors');
const { sequelize } = require('../models');
const inventoryService = require('./inventoryService');

class OrderService {
  /**
   * Generate unique order number
   */
  async generateOrderNumber(restaurantId) {
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0].replace(/-/g, '');
    
    // Get last order number for today
    const lastOrder = await Order.findOne({
      where: {
        restaurantId,
        orderNumber: {
          [require('sequelize').Op.like]: `${dateStr}%`
        }
      },
      order: [['orderNumber', 'DESC']],
      limit: 1
    });

    let sequence = 1;
    if (lastOrder) {
      const lastSeq = parseInt(lastOrder.orderNumber.slice(-4)) || 0;
      sequence = lastSeq + 1;
    }

    return `${dateStr}${sequence.toString().padStart(4, '0')}`;
  }

  /**
   * Calculate order totals
   */
  async calculateOrderTotals(orderId, transaction = null) {
    const order = await Order.findByPk(orderId, {
      include: [
        { model: OrderItem, as: 'orderItems' },
        { model: Restaurant, as: 'restaurant' }
      ],
      transaction
    });

    if (!order) {
      throw new NotFoundError('Order');
    }

    // Calculate subtotal from items
    // Note: item.totalPrice already includes modifiers, so we don't add modifiersTotal separately
    let subtotal = 0;
    for (const item of order.orderItems) {
      subtotal += parseFloat(item.totalPrice || 0);
    }

    // Check if auto-apply tax is enabled (default: false - tax not applied by default)
    const autoApplyTax = order.restaurant?.settings?.operations?.autoApplyTax === true;

    // Calculate tax amount using simple tax rate from restaurant settings
    let taxAmount = 0;
    if (autoApplyTax) {
      const taxRate = order.restaurant?.settings?.operations?.taxRate || 0;
      taxAmount = (subtotal * taxRate) / 100;
    }
    // If autoApplyTax is false, taxAmount remains 0

    // Get service charge rate
    const serviceChargeRate = order.restaurant?.settings?.operations?.serviceCharge || 0;
    const serviceCharge = (subtotal * serviceChargeRate) / 100;

    // Calculate total
    const totalAmount = subtotal + taxAmount + serviceCharge - parseFloat(order.discountAmount || 0);

    // Update order (use transaction if provided)
    await order.update({
      subtotal,
      taxAmount,
      serviceCharge,
      totalAmount
    }, { transaction });

    return {
      subtotal,
      taxAmount,
      serviceCharge,
      discountAmount: parseFloat(order.discountAmount || 0),
      totalAmount
    };
  }

  /**
   * Create order
   */
  async createOrder(orderData, userId, restaurantId) {
    const dbTransaction = await sequelize.transaction();

    try {
      const orderNumber = await this.generateOrderNumber(restaurantId);

      const order = await Order.create({
        restaurantId,
        orderNumber,
        orderType: orderData.orderType || 'dine_in',
        tableId: orderData.tableId,
        waiterId: orderData.waiterId || userId,
        customerName: orderData.customerName,
        customerPhone: orderData.customerPhone,
        customerEmail: orderData.customerEmail,
        guestCount: orderData.guestCount || 1,
        status: 'pending',
        source: orderData.source || 'pos',
        notes: orderData.notes,
        kitchenNotes: orderData.kitchenNotes
      }, { transaction: dbTransaction });

      // Create order items
      if (orderData.items && orderData.items.length > 0) {
        for (const itemData of orderData.items) {
          const menuItem = await MenuItem.findByPk(itemData.menuItemId);
          if (!menuItem) continue;

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

          await OrderItem.create({
            orderId: order.id,
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
          }, { transaction: dbTransaction });
        }
      }

      // Calculate totals (pass transaction so it can find the order)
      await this.calculateOrderTotals(order.id, dbTransaction);

      await dbTransaction.commit();

      // Return order with items
      const createdOrder = await Order.findByPk(order.id, {
        include: [
          { model: OrderItem, as: 'orderItems' },
          { model: Table, as: 'table' },
          { model: require('../models').User, as: 'waiter', attributes: ['id', 'firstName', 'lastName'] }
        ]
      });

      return createdOrder;
    } catch (error) {
      await dbTransaction.rollback();
      throw error;
    }
  }

  /**
   * Update order status
   */
  async updateOrderStatus(orderId, newStatus, userId, restaurantId) {
    const order = await Order.findOne({
      where: { id: orderId, restaurantId }
    });

    if (!order) {
      throw new NotFoundError('Order');
    }

    const statusUpdates = {
      status: newStatus
    };

    // Update status-specific timestamps
    const now = new Date();
    switch (newStatus) {
      case 'confirmed':
        statusUpdates.confirmedAt = now;
        break;
      case 'preparing':
        statusUpdates.confirmedAt = order.confirmedAt || now; // Set confirmedAt if not already set
        break;
      case 'ready':
        statusUpdates.readyAt = now;
        break;
      case 'served':
        statusUpdates.servedAt = now;
        break;
      case 'completed':
        statusUpdates.completedAt = now;
        // Deduct stock if not already done
        if (!order.stockDeducted) {
          await inventoryService.deductStockForOrder(orderId, userId);
        }
        break;
      case 'cancelled':
        statusUpdates.cancelledAt = now;
        break;
    }

    await order.update(statusUpdates);

    return order;
  }

  /**
   * Split order
   */
  async splitOrder(orderId, splitData, restaurantId) {
    const dbTransaction = await sequelize.transaction();

    try {
      const originalOrder = await Order.findByPk(orderId, {
        include: [{ model: OrderItem, as: 'orderItems' }],
        transaction: dbTransaction
      });

      if (!originalOrder || originalOrder.restaurantId !== restaurantId) {
        throw new NotFoundError('Order');
      }

      const newOrderNumber = await this.generateOrderNumber(restaurantId);
      
      // Create new order
      const newOrder = await Order.create({
        restaurantId: originalOrder.restaurantId,
        orderNumber: newOrderNumber,
        orderType: originalOrder.orderType,
        tableId: originalOrder.tableId,
        waiterId: originalOrder.waiterId,
        customerName: originalOrder.customerName,
        status: 'pending',
        source: originalOrder.source
      }, { transaction: dbTransaction });

      // Move items to new order
      for (const itemId of splitData.itemIds) {
        const item = originalOrder.orderItems.find(i => i.id === itemId);
        if (item) {
          await item.update({ orderId: newOrder.id }, { transaction: dbTransaction });
        }
      }

      // Recalculate totals for both orders (pass transaction)
      await this.calculateOrderTotals(originalOrder.id, dbTransaction);
      await this.calculateOrderTotals(newOrder.id, dbTransaction);

      await dbTransaction.commit();

      return {
        originalOrder: await Order.findByPk(originalOrder.id, {
          include: [{ model: OrderItem, as: 'orderItems' }]
        }),
        newOrder: await Order.findByPk(newOrder.id, {
          include: [{ model: OrderItem, as: 'orderItems' }]
        })
      };
    } catch (error) {
      await dbTransaction.rollback();
      throw error;
    }
  }

  /**
   * Transfer order to another table
   */
  async transferOrder(orderId, newTableId, restaurantId) {
    const order = await Order.findOne({
      where: { id: orderId, restaurantId }
    });

    if (!order) {
      throw new NotFoundError('Order');
    }

    await order.update({ tableId: newTableId });

    // Update table status if needed
    const { Table } = require('../models');
    await Table.update(
      { currentOrderId: null },
      { where: { currentOrderId: orderId } }
    );
    await Table.update(
      { currentOrderId: orderId, status: 'occupied' },
      { where: { id: newTableId } }
    );

    return order;
  }

  /**
   * Merge orders
   */
  async mergeOrders(orderIds, targetOrderId, restaurantId) {
    const dbTransaction = await sequelize.transaction();

    try {
      const targetOrder = await Order.findByPk(targetOrderId, {
        transaction: dbTransaction
      });

      if (!targetOrder || targetOrder.restaurantId !== restaurantId) {
        throw new NotFoundError('Target order');
      }

      // Move items from source orders to target order
      for (const sourceOrderId of orderIds) {
        if (sourceOrderId === targetOrderId) continue;

        const sourceOrder = await Order.findByPk(sourceOrderId, {
          include: [{ model: OrderItem, as: 'orderItems' }],
          transaction: dbTransaction
        });

        if (!sourceOrder || sourceOrder.restaurantId !== restaurantId) continue;

        // Move items
        for (const item of sourceOrder.orderItems) {
          await item.update({ orderId: targetOrderId }, { transaction: dbTransaction });
        }

        // Cancel source order
        await sourceOrder.update({ 
          status: 'cancelled',
          cancelledAt: new Date()
        }, { transaction: dbTransaction });
      }

      // Recalculate totals (pass transaction)
      await this.calculateOrderTotals(targetOrderId, dbTransaction);

      await dbTransaction.commit();

      return await Order.findByPk(targetOrderId, {
        include: [{ model: OrderItem, as: 'orderItems' }]
      });
    } catch (error) {
      await dbTransaction.rollback();
      throw error;
    }
  }
}

module.exports = new OrderService();

