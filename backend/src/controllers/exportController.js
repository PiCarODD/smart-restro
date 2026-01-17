const exportHelper = require('../utils/exportHelper');

class ExportController {
    /**
     * Export tenants
     * GET /api/saas/export/tenants
     */
    async exportTenants(req, res, next) {
        try {
            const { format = 'csv', startDate, endDate, status, tier, columns } = req.query;

            if (format === 'pdf') {
                return res.status(501).json({
                    error: 'PDF export not yet implemented',
                    message: 'Please use CSV format for now'
                });
            }

            const filters = {
                startDate,
                endDate,
                status,
                tier,
                columns: columns ? columns.split(',') : undefined
            };

            const csvContent = await exportHelper.exportTenants(filters);

            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', `attachment; filename="tenants_${new Date().toISOString().split('T')[0]}.csv"`);
            res.send(csvContent);
        } catch (error) {
            next(error);
        }
    }

    /**
     * Export users
     * GET /api/saas/export/users
     */
    async exportUsers(req, res, next) {
        try {
            const { format = 'csv', startDate, endDate, role, tenantId, isActive, columns } = req.query;

            if (format === 'pdf') {
                return res.status(501).json({
                    error: 'PDF export not yet implemented',
                    message: 'Please use CSV format for now'
                });
            }

            const filters = {
                startDate,
                endDate,
                role,
                tenantId,
                isActive,
                columns: columns ? columns.split(',') : undefined
            };

            const csvContent = await exportHelper.exportUsers(filters);

            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', `attachment; filename="users_${new Date().toISOString().split('T')[0]}.csv"`);
            res.send(csvContent);
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new ExportController();
