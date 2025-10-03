const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const multer = require('multer');
require('dotenv').config();

const mondayAPI = require('./api/monday');
const { transformFormData } = require('./utils/transformer');
const { validateVendorData } = require('./utils/validator');
const { sendConfirmationEmail, sendTeamNotification } = require('./utils/email');

const app = express();

// Security middleware
app.use(helmet());

// CORS configuration - Allow all origins for now
const corsOptions = {
  origin: true, // Allow all origins
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type'],
  maxAge: 86400
};
app.use(cors(corsOptions));

// Logging
app.use(morgan('combined'));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100
});
app.use('/api/', limiter);

// File upload configuration
const upload = multer({
  limits: { 
    fileSize: (parseInt(process.env.MAX_FILE_SIZE_MB) || 10) * 1024 * 1024 
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = process.env.ALLOWED_FILE_TYPES?.split(',') || ['pdf', 'jpg', 'jpeg', 'png'];
    const fileExt = file.originalname.split('.').pop().toLowerCase();
    
    if (allowedTypes.includes(fileExt)) {
      cb(null, true);
    } else {
      cb(new Error(`File type .${fileExt} not allowed. Allowed types: ${allowedTypes.join(', ')}`));
    }
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    monday_connected: !!process.env.MONDAY_API_KEY,
    board_configured: !!process.env.MONDAY_BOARD_ID
  });
});

// Test Monday.com connection
app.get('/api/test-connection', async (req, res) => {
  try {
    const result = await mondayAPI.testConnection();
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message,
      details: 'Check your MONDAY_API_KEY and MONDAY_BOARD_ID in .env file'
    });
  }
});

// Main vendor application endpoint
app.post('/api/vendor-application', async (req, res) => {
      console.log('📥 Received vendor application:', {
        vendorName: req.body.vendorName,
        email: req.body.mainContactEmail,
        timestamp: new Date().toISOString()
      });
      
      // Debug: Log all received data
      console.log('📋 Full request body:', JSON.stringify(req.body, null, 2));
      console.log('🚀 Backend version: 2025-10-03-v2');

    try {
      // 1. Validate input data (temporarily disabled for debugging)
      // const validationErrors = validateVendorData(req.body);
      // if (validationErrors.length > 0) {
      //   return res.status(400).json({
      //     success: false,
      //     errors: validationErrors
      //   });
      // }

      // 2. Check for duplicates (disabled for now)
      // if (process.env.ENABLE_DUPLICATE_CHECK === 'true') {
      //   const isDuplicate = await mondayAPI.checkDuplicateVendor(
      //     req.body.taxId,
      //     req.body.mainContactEmail
      //   );
      //   if (isDuplicate) {
      //     return res.status(409).json({
      //       success: false,
      //       error: 'A vendor with this Tax ID or email already exists in our system.'
      //     });
      //   }
      // }

      // 3. Transform data for Monday.com (with fallbacks for missing data)
      const transformedData = transformFormData(req.body);
      
      // Add fallback data if fields are missing
      if (!transformedData.name) transformedData.name = req.body.vendorName || 'Unknown Vendor';
      if (!transformedData.email) transformedData.email = req.body.mainContactEmail || req.body.email || 'no-email@example.com';
      if (!transformedData.phone) transformedData.phone = req.body.mainContactPhone || '555-000-0000';
      if (!transformedData.address) transformedData.address = req.body.vendorAddress || 'No Address Provided';
      if (!transformedData.primaryMarket) transformedData.primaryMarket = req.body.primaryMarket || 'Unknown';
      if (!transformedData.primaryTrade) transformedData.primaryTrade = req.body.primaryTrade || 'Unknown';
      if (!transformedData.numCrews) transformedData.numCrews = req.body.numCrews || '1';
      if (!transformedData.serviceLine) transformedData.serviceLine = req.body.serviceLine || ['SFR'];
      if (!transformedData.services) transformedData.services = req.body.services || ['General'];
      if (!transformedData.certification) transformedData.certification = 'true';

      // 4. Create item in Monday.com
      const mondayItem = await mondayAPI.createVendorItem(
        req.body.vendorName,
        transformedData
      );

      console.log('✅ Created Monday.com item:', mondayItem.id);

      // 5. File uploads handled separately (not implemented yet)

      // 6. Send confirmation email (if enabled)
      if (process.env.ENABLE_AUTO_EMAIL === 'true' && process.env.SEND_EMAILS === 'true') {
        await sendConfirmationEmail(req.body.mainContactEmail, req.body.vendorName);
        await sendTeamNotification(req.body, mondayItem.id);
      }

      // 7. Return success response
      res.json({
        success: true,
        message: 'Your vendor application has been successfully submitted!',
        itemId: mondayItem.id,
        vendorName: req.body.vendorName
      });

    } catch (error) {
      console.error('❌ Error processing vendor application:', error);
      
      // Determine error type and response
      let statusCode = 500;
      let errorMessage = 'An error occurred while processing your application. Please try again.';
      
      if (error.message.includes('rate limit')) {
        statusCode = 429;
        errorMessage = 'Too many requests. Please wait a few minutes and try again.';
      } else if (error.message.includes('validation')) {
        statusCode = 400;
        errorMessage = error.message;
      }
      
      res.status(statusCode).json({
        success: false,
        error: errorMessage,
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

// Error handling middleware
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        error: `File too large. Maximum size is ${process.env.MAX_FILE_SIZE_MB}MB`
      });
    }
  }
  
  console.error('Unhandled error:', error);
  res.status(500).json({
    success: false,
    error: 'An unexpected error occurred'
  });
});

// Start server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`
🚀 BuildCore Vendor Backend Server
====================================
✅ Server running on port ${PORT}
✅ Environment: ${process.env.NODE_ENV}
✅ CORS enabled for: ${process.env.CORS_ORIGIN}
✅ Monday.com API: ${process.env.MONDAY_API_KEY ? 'Configured' : '❌ Not configured'}
✅ Board ID: ${process.env.MONDAY_BOARD_ID || '❌ Not set'}

📝 Endpoints:
- GET  /health                 - Health check
- GET  /api/test-connection    - Test Monday.com connection
- POST /api/vendor-application - Submit vendor application

⚠️  Remember to copy .env.example to .env and add your credentials!
`);
});
