/**
 * Test Google Drive connection and authentication
 */

const { google } = require('googleapis');
const fs = require('fs');

async function testGoogleDriveConnection() {
  console.log('🧪 Testing Google Drive connection...\n');
  
  try {
    // Check if credentials file exists
    const credentialsPath = './google-credentials.json';
    if (!fs.existsSync(credentialsPath)) {
      console.error('❌ Google credentials file not found:', credentialsPath);
      return;
    }
    console.log('✅ Google credentials file found');
    
    // Load credentials
    const credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));
    console.log('✅ Credentials loaded successfully');
    console.log('   Service Account Email:', credentials.client_email);
    console.log('   Project ID:', credentials.project_id);
    
    // Initialize auth
    const auth = new google.auth.GoogleAuth({
      keyFile: credentialsPath,
      scopes: ['https://www.googleapis.com/auth/drive.file'],
    });
    
    // Create Drive client
    const drive = google.drive({ version: 'v3', auth });
    console.log('✅ Google Drive client created');
    
    // Test connection by listing files in shared drive
    const sharedDriveId = process.env.GOOGLE_SHARED_DRIVE_ID || '0AFQWz1r63gdsUk9PVA';
    console.log('🔍 Testing access to shared drive:', sharedDriveId);
    
    const response = await drive.files.list({
      pageSize: 5,
      fields: 'files(id, name, mimeType)',
      driveId: sharedDriveId,
      corpora: 'drive',
      includeItemsFromAllDrives: true,
      supportsAllDrives: true
    });
    
    console.log('✅ Successfully connected to Google Drive!');
    console.log('📁 Files in shared drive:');
    response.data.files.forEach(file => {
      console.log(`   - ${file.name} (${file.mimeType})`);
    });
    
    // Test creating a folder
    console.log('\n🧪 Testing folder creation...');
    const testFolderName = `Test Folder - ${new Date().toISOString()}`;
    
    const folderResponse = await drive.files.create({
      requestBody: {
        name: testFolderName,
        mimeType: 'application/vnd.google-apps.folder',
        parents: [sharedDriveId],
        driveId: sharedDriveId
      },
      fields: 'id, name, webViewLink',
      supportsAllDrives: true
    });
    
    console.log('✅ Test folder created successfully!');
    console.log('   Folder ID:', folderResponse.data.id);
    console.log('   Folder Name:', folderResponse.data.name);
    console.log('   View Link:', folderResponse.data.webViewLink);
    
    // Clean up test folder
    await drive.files.delete({
      fileId: folderResponse.data.id,
      supportsAllDrives: true
    });
    console.log('🗑️ Test folder cleaned up');
    
    console.log('\n🎉 Google Drive integration is working perfectly!');
    
  } catch (error) {
    console.error('\n❌ Google Drive test failed:');
    console.error('   Error:', error.message);
    
    if (error.message.includes('insufficient')) {
      console.error('\n💡 Possible solutions:');
      console.error('   1. Make sure the service account email is added to the shared drive');
      console.error('   2. Give the service account "Content manager" or "Manager" permissions');
      console.error('   3. Check that the shared drive ID is correct');
    }
    
    if (error.message.includes('Invalid grant')) {
      console.error('\n💡 Possible solutions:');
      console.error('   1. The service account key might be expired');
      console.error('   2. Create a new key in Google Cloud Console');
      console.error('   3. Update the google-credentials.json file');
    }
  }
}

// Run the test
testGoogleDriveConnection().catch(console.error);
