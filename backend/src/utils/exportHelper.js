/**
 * Export Helper Utility
 * Provides CSV and PDF export functionality for tenants and users
 */

const { Tenant, User, Restaurant } = require('../models');
const { Op } = require('sequelize');

class ExportHelper {
    /**
     * Generate CSV content from data array
     */
    generateCSV(data, columns) {
        if (!data || data.length === 0) {
            return '';
        }

        // Use provided columns or all keys from first object
        const headers = columns || Object.keys(data[0]);
        
        // Create CSV header row
        const headerRow = headers.map(col => this.escapeCSVValue(col)).join(',');
        
        // Create data rows
        const dataRows = data.map(row => {
            return headers.map(col => {
                const value = row[col];
                return this.escapeCSVValue(value);
            }).join(',');
        });

        return [headerRow, ...dataRows].join('\n');
    }

    /**
     * Escape CSV value (handle commas, quotes, newlines)
     */
    escapeCSVValue(value) {
        if (value === null || value === undefined) {
            return '';
        }

        const stringValue = String(value);
        
        // If value contains comma, quote, or newline, wrap in quotes and escape internal quotes
        if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
            return `"${stringValue.replace(/"/g, '""')}"`;
        }
        
        return stringValue;
    }

    /**
     * Format date for export
     */
    formatDate(date) {
        if (!date) return '';
        const d = new Date(date);
        return d.toISOString().split('T')[0];
    }

    /**
     * Format currency for export
     */
    formatCurrency(amount, currency = 'USD') {
        if (amount === null || amount === undefined) return '';
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency
        }).format(amount);
    }

    /**
     * Export tenants to CSV
     */
    async exportTenants(filters = {}) {
        const where = {};
        
        if (filters.status) {
            where.subscriptionStatus = filters.status;
        }
        
        if (filters.tier) {
            where.subscriptionTier = filters.tier;
        }
        
        if (filters.startDate || filters.endDate) {
            where.created_at = {};
            if (filters.startDate) {
                where.created_at[Op.gte] = new Date(filters.startDate);
            }
            if (filters.endDate) {
                where.created_at[Op.lte] = new Date(filters.endDate);
            }
        }

        const tenants = await Tenant.findAll({
            where,
            include: [
                {
                    model: Restaurant,
                    as: 'restaurants',
                    attributes: ['id', 'name'],
                    required: false
                },
                {
                    model: User,
                    as: 'users',
                    attributes: ['id'],
                    required: false
                }
            ],
            order: [['created_at', 'DESC']]
        });

        // Transform to export format
        const exportData = tenants.map(tenant => ({
            'Tenant ID': tenant.id,
            'Name': tenant.name,
            'Slug': tenant.slug,
            'Tier': tenant.subscriptionTier,
            'Status': tenant.subscriptionStatus,
            'Owner Email': tenant.ownerEmail,
            'Billing Email': tenant.billingEmail || tenant.ownerEmail,
            'Phone': tenant.phone || '',
            'Restaurant Count': tenant.restaurants?.length || 0,
            'User Count': tenant.users?.length || 0,
            'Max Restaurants': tenant.maxRestaurants,
            'Max Users': tenant.maxUsers,
            'Max Menu Items': tenant.maxMenuItems,
            'Start Date': this.formatDate(tenant.subscriptionStartDate),
            'End Date': this.formatDate(tenant.subscriptionEndDate),
            'Created': this.formatDate(tenant.created_at),
            'Updated': this.formatDate(tenant.updated_at)
        }));

        const columns = filters.columns || Object.keys(exportData[0] || {});
        return this.generateCSV(exportData, columns);
    }

    /**
     * Export users to CSV
     */
    async exportUsers(filters = {}) {
        const where = {};
        
        if (filters.role) {
            where.role = filters.role;
        }
        
        if (filters.tenantId) {
            where.tenantId = filters.tenantId;
        }
        
        if (filters.isActive !== undefined && filters.isActive !== null) {
            where.isActive = filters.isActive === 'true' || filters.isActive === true;
        }
        
        if (filters.startDate || filters.endDate) {
            where.created_at = {};
            if (filters.startDate) {
                where.created_at[Op.gte] = new Date(filters.startDate);
            }
            if (filters.endDate) {
                where.created_at[Op.lte] = new Date(filters.endDate);
            }
        }

        const users = await User.findAll({
            where,
            attributes: [
                'id', 'email', 'firstName', 'lastName', 'role', 'isActive',
                'tenantId', 'restaurantId', 'phone', 'created_at', 'updated_at'
            ],
            include: [
                {
                    model: Tenant,
                    as: 'tenant',
                    attributes: ['id', 'name', 'slug'],
                    required: false
                },
                {
                    model: Restaurant,
                    as: 'restaurant',
                    attributes: ['id', 'name'],
                    required: false
                }
            ],
            order: [['created_at', 'DESC']]
        });

        // Transform to export format
        const exportData = users.map(user => ({
            'User ID': user.id,
            'Email': user.email,
            'First Name': user.firstName,
            'Last Name': user.lastName,
            'Full Name': `${user.firstName} ${user.lastName}`,
            'Role': user.role,
            'Status': user.isActive ? 'Active' : 'Inactive',
            'Tenant ID': user.tenantId || '',
            'Tenant Name': user.tenant?.name || '',
            'Restaurant ID': user.restaurantId || '',
            'Restaurant Name': user.restaurant?.name || '',
            'Phone': user.phone || '',
            'Created': this.formatDate(user.created_at),
            'Updated': this.formatDate(user.updated_at)
        }));

        const columns = filters.columns || Object.keys(exportData[0] || {});
        return this.generateCSV(exportData, columns);
    }

    /**
     * Generate PDF (placeholder - would use library like pdfkit or puppeteer)
     * For now, returns CSV as PDF would require additional dependencies
     */
    async exportToPDF(data, title) {
        // TODO: Implement PDF generation using pdfkit or puppeteer
        // For now, return null to indicate PDF not implemented
        throw new Error('PDF export not yet implemented. Please use CSV format.');
    }
}

module.exports = new ExportHelper();
