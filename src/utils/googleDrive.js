/**
 * Google Drive file upload utility
 * Uploads vendor application files to Google Workspace shared drive
 */

const { google } = require('googleapis');
const stream = require('stream');

// Initialize Google Drive API client
function getDriveClient() {
  let auth;
  
  // Try environment variable first (Heroku), then keyFile (local)
  if (process.env.GOOGLE_SERVICE_ACCOUNT_KEY) {
    const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY);
    auth = new google.auth.GoogleAuth({
      credentials: credentials,
      scopes: ['https://www.googleapis.com/auth/drive.file'],
    });
  } else if (process.env.GOOGLE_SERVICE_ACCOUNT_KEY_FILE) {
    auth = new google.auth.GoogleAuth({
      keyFile: process.env.GOOGLE_SERVICE_ACCOUNT_KEY_FILE,
      scopes: ['https://www.googleapis.com/auth/drive.file'],
    });
  } else {
    throw new Error('Google Drive credentials not configured. Set GOOGLE_SERVICE_ACCOUNT_KEY or GOOGLE_SERVICE_ACCOUNT_KEY_FILE');
  }
  
  return google.drive({ version: 'v3', auth });
}

/**
 * Upload files to Google Drive shared drive
 * @param {string} vendorName - Name of the vendor (for folder organization)
 * @param {object} files - Multer files object
 * @returns {Promise<Array>} - Array of upload results with Drive URLs
 */
async function uploadFilesToDrive(vendorName, files) {
  const drive = getDriveClient();
  const results = [];
  const sharedDriveId = process.env.GOOGLE_SHARED_DRIVE_ID; // ID of "Vendors" shared drive
  
  const fileMapping = {
    'w9Form': 'W9 Form',
    'glInsurance': 'General Liability Insurance',
    'wcInsurance': 'Workers Compensation Insurance',
    'businessLicense': 'Business License'
  };
  
  // Create or find vendor folder in shared drive
  const vendorFolderId = await createVendorFolder(drive, vendorName, sharedDriveId);
  
  // Upload each file
  console.log('📁 Files received for upload:', Object.keys(files));
  
  for (const [fieldName, fileArray] of Object.entries(files)) {
    if (!fileArray || fileArray.length === 0) {
      console.log(`⚠️ No files for field: ${fieldName}`);
      continue;
    }
    
    const file = fileArray[0];
    const friendlyName = fileMapping[fieldName] || fieldName;
    
    console.log(`📤 Processing field: ${fieldName}, file: ${file.originalname}, size: ${file.size}`);
    
    try {
      console.log(`📤 Uploading ${friendlyName} to Google Drive...`);
      
      // Create readable stream from buffer
      const bufferStream = new stream.PassThrough();
      bufferStream.end(file.buffer);
      
      // Upload file to Google Drive
      const response = await drive.files.create({
        requestBody: {
          name: file.originalname,
          parents: [vendorFolderId],
          // If using shared drive, include this
          ...(sharedDriveId && { driveId: sharedDriveId })
        },
        media: {
          mimeType: file.mimetype,
          body: bufferStream
        },
        fields: 'id, name, webViewLink, webContentLink',
        // Required for shared drives
        ...(sharedDriveId && { supportsAllDrives: true })
      });
      
      const driveFile = response.data;
      
      results.push({
        fieldName,
        friendlyName,
        filename: file.originalname,
        fileId: driveFile.id,
        viewLink: driveFile.webViewLink,
        downloadLink: driveFile.webContentLink,
        size: file.size,
        success: true
      });
      
      console.log(`✅ Uploaded ${friendlyName}: ${file.originalname}`);
      console.log(`   View: ${driveFile.webViewLink}`);
      
    } catch (error) {
      console.error(`❌ Failed to upload ${friendlyName}:`, error.message);
      results.push({
        fieldName,
        friendlyName,
        filename: file.originalname,
        error: error.message,
        success: false
      });
    }
  }
  
  return results;
}

/**
 * Create or find vendor folder in shared drive
 * @param {object} drive - Google Drive API client
 * @param {string} vendorName - Name of vendor
 * @param {string} sharedDriveId - Shared drive ID
 * @returns {Promise<string>} - Folder ID
 */
async function createVendorFolder(drive, vendorName, sharedDriveId) {
  const folderName = `${vendorName} - ${new Date().toISOString().split('T')[0]}`;
  
  try {
    // Search for existing folder with same name
    const searchResponse = await drive.files.list({
      q: `name='${folderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
      fields: 'files(id, name)',
      ...(sharedDriveId && {
        driveId: sharedDriveId,
        corpora: 'drive',
        includeItemsFromAllDrives: true,
        supportsAllDrives: true
      })
    });
    
    if (searchResponse.data.files && searchResponse.data.files.length > 0) {
      console.log(`📁 Using existing folder: ${folderName}`);
      return searchResponse.data.files[0].id;
    }
    
    // Create new folder
    const folderMetadata = {
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder',
      ...(sharedDriveId && { parents: [sharedDriveId] })
    };
    
    const folderResponse = await drive.files.create({
      requestBody: folderMetadata,
      fields: 'id, name',
      ...(sharedDriveId && { supportsAllDrives: true })
    });
    
    console.log(`📁 Created new folder: ${folderName}`);
    return folderResponse.data.id;
    
  } catch (error) {
    console.error('Error creating/finding folder:', error.message);
    // Return shared drive root as fallback
    return sharedDriveId;
  }
}

/**
 * Format file upload results for Monday.com Notes
 * @param {Array} results - Upload results from uploadFilesToDrive
 * @returns {string} - Formatted text for Notes column
 */
function formatDriveLinksForNotes(results) {
  const lines = ['Files uploaded to Google Drive:'];
  
  results.forEach(result => {
    if (result.success) {
      lines.push(`${result.friendlyName}: ${result.filename}`);
      lines.push(`  View: ${result.viewLink}`);
    } else {
      lines.push(`${result.friendlyName}: Upload failed - ${result.error}`);
    }
  });
  
  return lines.join('\n');
}

module.exports = {
  uploadFilesToDrive,
  formatDriveLinksForNotes
};

