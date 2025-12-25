const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '../../uploads');
const logosDir = path.join(uploadsDir, 'logos');

[uploadsDir, logosDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Create menu items directory
const menuItemsDir = path.join(uploadsDir, 'menu-items');
if (!fs.existsSync(menuItemsDir)) {
  fs.mkdirSync(menuItemsDir, { recursive: true });
}

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Determine upload directory based on route path
    // Check req.originalUrl which should be available
    const originalUrl = req.originalUrl || req.url || req.path || '';
    
    if (originalUrl.includes('logo')) {
      cb(null, logosDir);
    } else if (originalUrl.includes('/upload/') || originalUrl.includes('/upload')) {
      // Images uploaded via /api/upload/image should go to menu-items
      cb(null, menuItemsDir);
    } else if (originalUrl.includes('menu') || originalUrl.includes('items')) {
      cb(null, menuItemsDir);
    } else {
      // Default to menu-items for image uploads
      cb(null, menuItemsDir);
    }
  },
  filename: (req, file, cb) => {
    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

// File filter
const fileFilter = (req, file, cb) => {
  // Allow images only
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'), false);
  }
};

// Multer configuration
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  },
  fileFilter: fileFilter
});

module.exports = {
  upload,
  uploadSingle: (fieldName) => upload.single(fieldName),
  uploadLogo: upload.single('logo'),
  uploadMenuItemImage: upload.single('image')
};
