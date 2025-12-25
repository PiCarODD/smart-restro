const { uploadSingle } = require('../middleware/upload');
const path = require('path');

class UploadController {
  /**
   * Upload image and return URL
   * POST /api/upload/image
   */
  async uploadImage(req, res, next) {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      // Return the URL path where the file can be accessed
      // The file is served statically from /api/uploads directory
      const imageUrl = `/api/uploads/menu-items/${req.file.filename}`;

      res.json({
        imageUrl,
        filename: req.file.filename
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new UploadController();

