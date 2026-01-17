'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Add QR code fields to tables table
    await queryInterface.addColumn('tables', 'qr_code_token', {
      type: Sequelize.UUID,
      allowNull: true,
      unique: true
    });

    await queryInterface.addColumn('tables', 'qr_code_generated_at', {
      type: Sequelize.DATE,
      allowNull: true
    });

    await queryInterface.addColumn('tables', 'qr_code_expires_at', {
      type: Sequelize.DATE,
      allowNull: true
    });

    // Add index for QR token lookups
    await queryInterface.addIndex('tables', ['qr_code_token'], {
      name: 'idx_tables_qr_code_token',
      unique: true
    });

    // Ensure orders table has source field that can accept 'qr_code'
    // Check if source column exists, if not add it (should already exist based on schema)
    const tableDescription = await queryInterface.describeTable('orders');
    if (!tableDescription.source) {
      await queryInterface.addColumn('orders', 'source', {
        type: Sequelize.STRING(50),
        allowNull: true,
        defaultValue: 'pos'
      });
    }

    // Ensure payment_status exists (should already exist)
    if (!tableDescription.payment_status) {
      await queryInterface.addColumn('orders', 'payment_status', {
        type: Sequelize.STRING(50),
        allowNull: false,
        defaultValue: 'unpaid'
      });
    }
  },

  async down(queryInterface, Sequelize) {
    // Remove QR code fields
    await queryInterface.removeIndex('tables', 'idx_tables_qr_code_token');
    await queryInterface.removeColumn('tables', 'qr_code_token');
    await queryInterface.removeColumn('tables', 'qr_code_generated_at');
    await queryInterface.removeColumn('tables', 'qr_code_expires_at');
  }
};
