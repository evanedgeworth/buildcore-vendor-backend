const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const multer = require('multer');
require('dotenv').config();

const mondayAPI = require('./api/monday');
const { transformFormData } = require('./utils/transformer');
const { validateVendorData, isCoreFieldsComplete } = require('./utils/validator');
const { sendConfirmationEmail, sendTeamNotification } = require('./utils/email');
const { getPacificTimestamp, getPacificISO } = require('./utils/timezone');

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

// Body parsing - Multer handles multipart, these handle JSON/urlencoded
// Note: Do NOT use app.use() for these - it interferes with multer
// Apply these only to specific routes that need them

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100
});
app.use('/api/', limiter);

// File upload configuration
const upload = multer({
  storage: multer.memoryStorage(), // Store files in memory for Monday.com upload
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
    timestamp: getPacificTimestamp(),
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

// Main vendor application endpoint with file upload support
app.post('/api/vendor-application',
  upload.fields([
    { name: 'w9Form', maxCount: 1 },
    { name: 'glInsurance', maxCount: 1 },
    { name: 'wcInsurance', maxCount: 1 },
    { name: 'businessLicense', maxCount: 1 }
  ]),
  async (req, res) => {
      console.log('📥 Received vendor application:', {
        vendorName: req.body.vendorName,
        email: req.body.mainContactEmail,
        timestamp: getPacificTimestamp()
      });
      
      // Debug: Log all received data
      console.log('📋 Full request body (raw):', JSON.stringify(req.body, null, 2));
      
      // Normalize checkbox arrays - multer doesn't automatically convert multiple values to arrays
      // Convert fields with multiple values into arrays
      const multiValueFields = ['services', 'serviceLicense', 'serviceLine', 'secondaryMarkets'];
      multiValueFields.forEach(fieldName => {
        if (req.body[fieldName] && !Array.isArray(req.body[fieldName])) {
          req.body[fieldName] = [req.body[fieldName]];
        }
      });
      
      console.log('📋 Normalized request body:', JSON.stringify(req.body, null, 2));
      console.log('🚀 Backend version: 2025-10-08-licensed-trades-fix');

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

      // 3. Check if core required fields are complete
      const isComplete = isCoreFieldsComplete(req.body);
      console.log(`📋 Submission completeness: ${isComplete ? 'COMPLETE' : 'INCOMPLETE'}`);
      
      // 4. Transform data for Monday.com
      const transformedData = transformFormData(req.body);

      // 5. Check if vendor already exists (by Tax ID)
      let mondayItem;
      const existingItem = await mondayAPI.findVendorByTaxId(req.body.taxId);
      
      if (existingItem) {
        console.log('🔄 Updating existing vendor item:', existingItem.id);
        
        // Update existing item with new data
        await mondayAPI.updateVendorItem(existingItem.id, transformedData);
        
        // Check if we need to update the name (remove or add Incomplete tag at front)
        const cleanName = req.body.vendorName || 'Unnamed Vendor';
        const currentName = existingItem.name;
        const hasIncompleteTag = currentName.startsWith('(Incomplete) ');
        
        if (isComplete && hasIncompleteTag) {
          // Remove (Incomplete) tag from front
          console.log('✅ Removing (Incomplete) tag from:', currentName);
          await mondayAPI.updateItemName(existingItem.id, cleanName);
        } else if (!isComplete && !hasIncompleteTag) {
          // Add (Incomplete) tag to front
          console.log('⚠️ Adding (Incomplete) tag to:', currentName);
          await mondayAPI.updateItemName(existingItem.id, `(Incomplete) ${cleanName}`);
        }
        
        mondayItem = { id: existingItem.id, name: cleanName };
      } else {
        // Create new item
        console.log('📊 Transformed column values being sent to Monday.com:');
        console.log(JSON.stringify(transformedData, null, 2));
        
        mondayItem = await mondayAPI.createVendorItem(
          req.body.vendorName || 'Unnamed Vendor',
          transformedData,
          isComplete
        );
        
        console.log(`✅ Created Monday.com item: ${mondayItem.id} ${isComplete ? '' : '(Incomplete)'}`);
      }

      // 6. Handle file uploads to Google Drive
      if (req.files && Object.keys(req.files).length > 0) {
        console.log('📎 Files received:', Object.keys(req.files));
        console.log('📎 File details:', Object.entries(req.files).map(([key, files]) => ({
          field: key,
          count: files.length,
          filenames: files.map(f => f.originalname)
        })));
        
        // Check if Google Drive is configured
        if (!process.env.GOOGLE_SERVICE_ACCOUNT_KEY_FILE || !process.env.GOOGLE_SHARED_DRIVE_ID) {
          console.error('⚠️ Google Drive not configured! Missing GOOGLE_SERVICE_ACCOUNT_KEY_FILE or GOOGLE_SHARED_DRIVE_ID');
          console.log('📝 Files will NOT be uploaded to Google Drive');
        } else {
          console.log('📎 Uploading files to Google Drive...');
          try {
            const { uploadFilesToDrive } = require('./utils/googleDrive');
            const driveResults = await uploadFilesToDrive(req.body.vendorName, req.files);
            console.log('✅ Files uploaded to Google Drive:', driveResults.length, 'files');
            console.log('📝 Upload results:', driveResults);
            
            // Add file links to Monday.com Files column
            await mondayAPI.addFileLinksToFilesColumn(mondayItem.id, driveResults);
            console.log('✅ File links added to Monday.com Files column');
          } catch (error) {
            console.error('❌ File upload failed (non-fatal):', error.message);
            console.error('🔴 Full error:', error);
            // Don't fail the whole submission if file upload fails
          }
        }
      } else {
        console.log('📝 No files uploaded with this submission');
      }

      // 7. Send confirmation email (if enabled)
      if (process.env.ENABLE_AUTO_EMAIL === 'true' && process.env.SEND_EMAILS === 'true') {
        await sendConfirmationEmail(req.body.mainContactEmail, req.body.vendorName);
        await sendTeamNotification(req.body, mondayItem.id);
      }

      // 8. Return success response
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
