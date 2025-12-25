import { Table } from '@/types';

export const mockTables: Table[] = [
  // Main Floor
  {
    id: '1',
    tableNumber: '1',
    name: 'Window Seat',
    section: 'Main Floor',
    capacity: 2,
    status: 'available',
  },
  {
    id: '2',
    tableNumber: '2',
    section: 'Main Floor',
    capacity: 4,
    status: 'occupied',
    currentOrderId: 'order-1',
    guestCount: 3,
    occupiedAt: new Date(Date.now() - 45 * 60000), // 45 mins ago
  },
  {
    id: '3',
    tableNumber: '3',
    section: 'Main Floor',
    capacity: 4,
    status: 'available',
  },
  {
    id: '4',
    tableNumber: '4',
    section: 'Main Floor',
    capacity: 6,
    status: 'occupied',
    currentOrderId: 'order-2',
    guestCount: 5,
    occupiedAt: new Date(Date.now() - 20 * 60000), // 20 mins ago
  },
  {
    id: '5',
    tableNumber: '5',
    name: 'Corner Booth',
    section: 'Main Floor',
    capacity: 4,
    status: 'reserved',
  },
  {
    id: '6',
    tableNumber: '6',
    section: 'Main Floor',
    capacity: 2,
    status: 'cleaning',
  },

  // Patio
  {
    id: '7',
    tableNumber: '7',
    section: 'Patio',
    capacity: 4,
    status: 'available',
  },
  {
    id: '8',
    tableNumber: '8',
    section: 'Patio',
    capacity: 4,
    status: 'occupied',
    currentOrderId: 'order-3',
    guestCount: 4,
    occupiedAt: new Date(Date.now() - 60 * 60000), // 1 hour ago
  },
  {
    id: '9',
    tableNumber: '9',
    section: 'Patio',
    capacity: 6,
    status: 'available',
  },
  {
    id: '10',
    tableNumber: '10',
    section: 'Patio',
    capacity: 2,
    status: 'available',
  },

  // Private Room
  {
    id: '11',
    tableNumber: '11',
    name: 'VIP Room',
    section: 'Private Room',
    capacity: 10,
    status: 'reserved',
  },
  {
    id: '12',
    tableNumber: '12',
    name: 'Party Room',
    section: 'Private Room',
    capacity: 12,
    status: 'available',
  },
];

