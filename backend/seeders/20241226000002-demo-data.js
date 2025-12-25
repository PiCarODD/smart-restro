'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const { v4: uuidv4 } = require('uuid');
    const now = new Date();

    // Get demo restaurant
    const [restaurants] = await queryInterface.sequelize.query(
      "SELECT id FROM restaurants WHERE slug = 'smart-resto-downtown' LIMIT 1"
    );

    if (restaurants.length === 0) {
      console.log('⚠️  Demo restaurant not found. Run tenant seeder first.');
      return;
    }

    const restaurantId = restaurants[0].id;

    // Check if sections already exist
    const existingSections = await queryInterface.sequelize.query(
      "SELECT id FROM sections WHERE restaurant_id = :restaurantId AND name IN ('Main Dining', 'Outdoor Patio', 'VIP Section')",
      {
        replacements: { restaurantId },
        type: Sequelize.QueryTypes.SELECT,
      }
    );

    let sectionIds = [];
    if (existingSections && existingSections.length > 0) {
      sectionIds = existingSections.map(s => s.id);
      console.log('ℹ️  Demo sections already exist, using existing sections');
    } else {
      // Create Sections
      const sections = [
        {
          id: uuidv4(),
          restaurant_id: restaurantId,
          name: 'Main Dining',
          description: 'Main dining area',
          color: '#3b82f6',
          icon: 'dining-room',
          display_order: 1,
          is_active: true,
          created_at: now,
          updated_at: now,
        },
        {
          id: uuidv4(),
          restaurant_id: restaurantId,
          name: 'Outdoor Patio',
          description: 'Outdoor seating area',
          color: '#10b981',
          icon: 'outdoor',
          display_order: 2,
          is_active: true,
          created_at: now,
          updated_at: now,
        },
        {
          id: uuidv4(),
          restaurant_id: restaurantId,
          name: 'VIP Section',
          description: 'Private VIP area',
          color: '#f59e0b',
          icon: 'vip',
          display_order: 3,
          is_active: true,
          created_at: now,
          updated_at: now,
        },
      ];

      await queryInterface.bulkInsert('sections', sections);
      sectionIds = sections.map(s => s.id);
      console.log('✅ Created demo sections');
    }

    // Check if tables already exist
    const existingTablesCheck = await queryInterface.sequelize.query(
      "SELECT id FROM tables WHERE restaurant_id = :restaurantId LIMIT 1",
      {
        replacements: { restaurantId },
        type: Sequelize.QueryTypes.SELECT,
      }
    );

    if (!existingTablesCheck || existingTablesCheck.length === 0) {
      // Create Tables
      const tables = [];
      let tableNumber = 1;

      // Main Dining - 10 tables
      for (let i = 0; i < 10; i++) {
        tables.push({
          id: uuidv4(),
          restaurant_id: restaurantId,
          section_id: sectionIds[0],
          table_number: `T${tableNumber.toString().padStart(2, '0')}`,
          name: `Table ${tableNumber}`,
          section: 'Main Dining',
          floor: 1,
          capacity: tableNumber <= 5 ? 4 : 6,
          shape: 'square',
          status: i < 3 ? 'occupied' : 'available',
          position_x: (i % 5) * 150 + 50,
          position_y: Math.floor(i / 5) * 150 + 50,
          width: 80,
          height: 80,
          rotation: 0,
          created_at: now,
          updated_at: now,
        });
        tableNumber++;
      }

      // Outdoor Patio - 6 tables
      for (let i = 0; i < 6; i++) {
        tables.push({
          id: uuidv4(),
          restaurant_id: restaurantId,
          section_id: sectionIds[1],
          table_number: `T${tableNumber.toString().padStart(2, '0')}`,
          name: `Table ${tableNumber}`,
          section: 'Outdoor Patio',
          floor: 0,
          capacity: 4,
          shape: 'round',
          status: 'available',
          position_x: (i % 3) * 120 + 50,
          position_y: Math.floor(i / 3) * 120 + 50,
          width: 70,
          height: 70,
          rotation: 0,
          created_at: now,
          updated_at: now,
        });
        tableNumber++;
      }

      // VIP Section - 4 tables
      for (let i = 0; i < 4; i++) {
        tables.push({
          id: uuidv4(),
          restaurant_id: restaurantId,
          section_id: sectionIds[2],
          table_number: `T${tableNumber.toString().padStart(2, '0')}`,
          name: `VIP Table ${i + 1}`,
          section: 'VIP Section',
          floor: 1,
          capacity: 8,
          shape: 'round',
          status: 'available',
          position_x: (i % 2) * 200 + 50,
          position_y: Math.floor(i / 2) * 200 + 50,
          width: 100,
          height: 100,
          rotation: 0,
          created_at: now,
          updated_at: now,
        });
        tableNumber++;
      }

      await queryInterface.bulkInsert('tables', tables);
      console.log(`✅ Created ${tables.length} demo tables`);
    } else {
      console.log('ℹ️  Demo tables already exist');
    }

    // Check if tax already exists
    const existingTaxes = await queryInterface.sequelize.query(
      "SELECT id FROM taxes WHERE restaurant_id = :restaurantId AND name = 'Sales Tax'",
      {
        replacements: { restaurantId },
        type: Sequelize.QueryTypes.SELECT,
      }
    );

    if (!existingTaxes || existingTaxes.length === 0) {
      await queryInterface.bulkInsert('taxes', [
        {
          id: uuidv4(),
          restaurant_id: restaurantId,
          name: 'Sales Tax',
          rate: 8.0,
          type: 'percentage',
          is_active: true,
          created_at: now,
          updated_at: now,
        },
      ]);
      console.log('✅ Created demo tax');
    } else {
      console.log('ℹ️  Demo tax already exists');
    }

    // Check if menu categories already exist
    const existingCategories = await queryInterface.sequelize.query(
      "SELECT id FROM menu_categories WHERE restaurant_id = :restaurantId AND name IN ('Appetizers', 'Main Courses', 'Desserts', 'Beverages')",
      {
        replacements: { restaurantId },
        type: Sequelize.QueryTypes.SELECT,
      }
    );

    let categoryIds = [];
    if (existingCategories && existingCategories.length > 0) {
      categoryIds = existingCategories.map(c => c.id);
      console.log('ℹ️  Demo menu categories already exist, using existing categories');
    } else {
      // Create Menu Categories
      const categories = [
        {
          id: uuidv4(),
          restaurant_id: restaurantId,
          parent_id: null,
          name: 'Appetizers',
          description: 'Start your meal right',
          display_order: 1,
          color: '#ef4444',
          icon: 'appetizer',
          is_active: true,
          created_at: now,
          updated_at: now,
        },
        {
          id: uuidv4(),
          restaurant_id: restaurantId,
          parent_id: null,
          name: 'Main Courses',
          description: 'Our signature dishes',
          display_order: 2,
          color: '#f59e0b',
          icon: 'main-course',
          is_active: true,
          created_at: now,
          updated_at: now,
        },
        {
          id: uuidv4(),
          restaurant_id: restaurantId,
          parent_id: null,
          name: 'Desserts',
          description: 'Sweet endings',
          display_order: 3,
          color: '#8b5cf6',
          icon: 'dessert',
          is_active: true,
          created_at: now,
          updated_at: now,
        },
        {
          id: uuidv4(),
          restaurant_id: restaurantId,
          parent_id: null,
          name: 'Beverages',
          description: 'Drinks and refreshments',
          display_order: 4,
          color: '#3b82f6',
          icon: 'beverage',
          is_active: true,
          created_at: now,
          updated_at: now,
        },
      ];

      await queryInterface.bulkInsert('menu_categories', categories);
      categoryIds = categories.map(c => c.id);
      console.log('✅ Created demo menu categories');
    }

    // Check if menu items already exist
    const existingMenuItemsCheck = await queryInterface.sequelize.query(
      "SELECT id FROM menu_items WHERE restaurant_id = :restaurantId LIMIT 1",
      {
        replacements: { restaurantId },
        type: Sequelize.QueryTypes.SELECT,
      }
    );

    if (!existingMenuItemsCheck || existingMenuItemsCheck.length === 0) {
      // Create Menu Items
      const menuItems = [
        // Appetizers
        {
          id: uuidv4(),
          restaurant_id: restaurantId,
          category_id: categoryIds[0],
          name: 'Caesar Salad',
          description: 'Fresh romaine lettuce with caesar dressing, parmesan cheese, and croutons',
          base_price: 8.99,
          display_order: 1,
          is_featured: true,
          is_available: true,
          is_active: true,
          prep_time_minutes: 5,
          calories: 250,
          dietary_tags: ['vegetarian'],
          track_inventory: true,
          created_at: now,
          updated_at: now,
        },
        {
          id: uuidv4(),
          restaurant_id: restaurantId,
          category_id: categoryIds[0],
          name: 'Buffalo Wings',
          description: 'Spicy chicken wings served with blue cheese dip',
          base_price: 12.99,
          variants: JSON.stringify([
            { name: '6 pieces', price: 12.99 },
            { name: '12 pieces', price: 22.99 },
          ]),
          display_order: 2,
          is_featured: true,
          is_available: true,
          is_active: true,
          prep_time_minutes: 15,
          calories: 450,
          allergens: ['dairy'],
          track_inventory: true,
          created_at: now,
          updated_at: now,
        },
        // Main Courses
        {
          id: uuidv4(),
          restaurant_id: restaurantId,
          category_id: categoryIds[1],
          name: 'Grilled Salmon',
          description: 'Fresh Atlantic salmon with lemon butter sauce, served with vegetables',
          base_price: 24.99,
          display_order: 1,
          is_featured: true,
          is_available: true,
          is_active: true,
          prep_time_minutes: 20,
          calories: 580,
          dietary_tags: ['gluten-free'],
          track_inventory: true,
          created_at: now,
          updated_at: now,
        },
        {
          id: uuidv4(),
          restaurant_id: restaurantId,
          category_id: categoryIds[1],
          name: 'Ribeye Steak',
          description: 'Prime ribeye steak cooked to perfection, served with mashed potatoes',
          base_price: 32.99,
          modifiers: JSON.stringify([
            { name: 'Extra Sauce', price: 2.00 },
            { name: 'Side Salad', price: 3.00 },
          ]),
          display_order: 2,
          is_featured: true,
          is_available: true,
          is_active: true,
          prep_time_minutes: 25,
          calories: 850,
          track_inventory: true,
          created_at: now,
          updated_at: now,
        },
        {
          id: uuidv4(),
          restaurant_id: restaurantId,
          category_id: categoryIds[1],
          name: 'Vegetarian Pasta',
          description: 'Penne pasta with seasonal vegetables in marinara sauce',
          base_price: 16.99,
          display_order: 3,
          is_featured: false,
          is_available: true,
          is_active: true,
          prep_time_minutes: 15,
          calories: 420,
          dietary_tags: ['vegetarian'],
          track_inventory: true,
          created_at: now,
          updated_at: now,
        },
        // Desserts
        {
          id: uuidv4(),
          restaurant_id: restaurantId,
          category_id: categoryIds[2],
          name: 'Chocolate Lava Cake',
          description: 'Warm chocolate cake with molten center, served with vanilla ice cream',
          base_price: 9.99,
          display_order: 1,
          is_featured: true,
          is_available: true,
          is_active: true,
          prep_time_minutes: 12,
          calories: 520,
          allergens: ['gluten', 'dairy', 'eggs'],
          track_inventory: true,
          created_at: now,
          updated_at: now,
        },
        // Beverages
        {
          id: uuidv4(),
          restaurant_id: restaurantId,
          category_id: categoryIds[3],
          name: 'Coca Cola',
          description: 'Classic cola',
          base_price: 2.99,
          variants: JSON.stringify([
            { name: 'Small', price: 2.99 },
            { name: 'Medium', price: 3.49 },
            { name: 'Large', price: 3.99 },
          ]),
          display_order: 1,
          is_featured: false,
          is_available: true,
          is_active: true,
          prep_time_minutes: 1,
          track_inventory: true,
          created_at: now,
          updated_at: now,
        },
        {
          id: uuidv4(),
          restaurant_id: restaurantId,
          category_id: categoryIds[3],
          name: 'Fresh Orange Juice',
          description: 'Freshly squeezed orange juice',
          base_price: 4.99,
          display_order: 2,
          is_featured: false,
          is_available: true,
          is_active: true,
          prep_time_minutes: 3,
          dietary_tags: ['vegan', 'gluten-free'],
          track_inventory: true,
          created_at: now,
          updated_at: now,
        },
      ];

      await queryInterface.bulkInsert('menu_items', menuItems);
      console.log(`✅ Created ${menuItems.length} demo menu items`);
    } else {
      console.log('ℹ️  Demo menu items already exist');
    }

    console.log('\n✅ Demo data seeding completed successfully!\n');
  },

  async down(queryInterface, Sequelize) {
    // Get demo restaurant
    const restaurants = await queryInterface.sequelize.query(
      "SELECT id FROM restaurants WHERE slug = 'smart-resto-downtown' LIMIT 1",
      {
        type: Sequelize.QueryTypes.SELECT,
      }
    );

    if (!restaurants || restaurants.length === 0) {
      return;
    }

    const restaurantId = restaurants[0].id;

    await queryInterface.bulkDelete('menu_items', { restaurant_id: restaurantId });
    await queryInterface.bulkDelete('menu_categories', { restaurant_id: restaurantId });
    await queryInterface.bulkDelete('taxes', { restaurant_id: restaurantId });
    await queryInterface.bulkDelete('tables', { restaurant_id: restaurantId });
    await queryInterface.bulkDelete('sections', { restaurant_id: restaurantId });
  },
};
