const reportService = require('../services/reportService');

class ReportController {
  /**
   * Get daily sales report
   * GET /api/reports/sales/daily
   */
  async getDailySales(req, res, next) {
    try {
      const { startDate, endDate } = req.query;
      
      const end = endDate ? new Date(endDate) : new Date();
      const start = startDate ? new Date(startDate) : new Date();
      start.setDate(start.getDate() - 30); // Default to last 30 days

      const sales = await reportService.getDailySales(
        req.restaurantId,
        start,
        end
      );

      res.json({ sales });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get hourly sales report
   * GET /api/reports/sales/hourly
   */
  async getHourlySales(req, res, next) {
    try {
      const { date } = req.query;
      const targetDate = date ? new Date(date) : new Date();

      const sales = await reportService.getHourlySales(
        req.restaurantId,
        targetDate
      );

      res.json({ sales });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get sales by category
   * GET /api/reports/sales/by-category
   */
  async getSalesByCategory(req, res, next) {
    try {
      const { startDate, endDate } = req.query;
      
      const end = endDate ? new Date(endDate) : new Date();
      const start = startDate ? new Date(startDate) : new Date();
      start.setDate(start.getDate() - 30); // Default to last 30 days

      const categories = await reportService.getSalesByCategory(
        req.restaurantId,
        start,
        end
      );

      res.json({ categories });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get top selling items
   * GET /api/reports/sales/by-item
   */
  async getTopSellingItems(req, res, next) {
    try {
      const { startDate, endDate, limit = 10 } = req.query;
      
      const end = endDate ? new Date(endDate) : new Date();
      const start = startDate ? new Date(startDate) : new Date();
      start.setDate(start.getDate() - 30); // Default to last 30 days

      const items = await reportService.getTopSellingItems(
        req.restaurantId,
        start,
        end,
        parseInt(limit)
      );

      res.json({ items });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get staff performance
   * GET /api/reports/staff/performance
   */
  async getStaffPerformance(req, res, next) {
    try {
      const { startDate, endDate } = req.query;
      
      const end = endDate ? new Date(endDate) : new Date();
      const start = startDate ? new Date(startDate) : new Date();
      start.setDate(start.getDate() - 30); // Default to last 30 days

      const staff = await reportService.getStaffPerformance(
        req.restaurantId,
        start,
        end
      );

      res.json({ staff });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get payment methods breakdown
   * GET /api/reports/payments/by-method
   */
  async getPaymentMethods(req, res, next) {
    try {
      const { startDate, endDate } = req.query;
      
      const end = endDate ? new Date(endDate) : new Date();
      const start = startDate ? new Date(startDate) : new Date();
      start.setDate(start.getDate() - 30); // Default to last 30 days

      const methods = await reportService.getPaymentMethods(
        req.restaurantId,
        start,
        end
      );

      res.json({ methods });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get inventory usage report
   * GET /api/reports/inventory/usage
   */
  async getInventoryUsage(req, res, next) {
    try {
      const { startDate, endDate } = req.query;
      
      const end = endDate ? new Date(endDate) : new Date();
      const start = startDate ? new Date(startDate) : new Date();
      start.setDate(start.getDate() - 30); // Default to last 30 days

      const usage = await reportService.getInventoryUsage(
        req.restaurantId,
        start,
        end
      );

      res.json({ usage });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get summary statistics
   * GET /api/reports/summary
   */
  async getSummary(req, res, next) {
    try {
      const { startDate, endDate } = req.query;
      
      const end = endDate ? new Date(endDate) : new Date();
      const start = startDate ? new Date(startDate) : new Date();
      start.setDate(start.getDate() - 30); // Default to last 30 days

      const stats = await reportService.getSummaryStats(
        req.restaurantId,
        start,
        end
      );

      res.json({ stats });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ReportController();

