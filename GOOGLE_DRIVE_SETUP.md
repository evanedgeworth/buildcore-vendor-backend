# Google Drive Integration Setup Guide

This guide walks you through setting up Google Drive file uploads for the vendor application form.

## Overview

Files uploaded through the form will be:
1. Uploaded to your Google Workspace "Vendors" shared drive
2. Organized in folders by vendor name and date
3. Links added to Monday.com Notes column for easy access

## Prerequisites

- Google Workspace account with admin access
- "Vendors" shared drive already created in Google Drive

## Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Select a project" → "NEW PROJECT"
3. Project name: `BuildCore Vendor Files`
4. Click "CREATE"

## Step 2: Enable Google Drive API

1. In your new project, go to "APIs & Services" → "Library"
2. Search for "Google Drive API"
3. Click "Google Drive API" → Click "ENABLE"

## Step 3: Create Service Account

1. Go to "APIs & Services" → "Credentials"
2. Click "CREATE CREDENTIALS" → "Service Account"
3. Service account details:
   - Name: `vendor-file-uploader`
   - ID: `vendor-file-uploader` (auto-generated)
   - Description: "Uploads vendor application files to Google Drive"
4. Click "CREATE AND CONTINUE"
5. Grant role: "Editor" (or custom role with Drive write permissions)
6. Click "CONTINUE" → "DONE"

## Step 4: Create Service Account Key

1. Click on the service account you just created
2. Go to "KEYS" tab
3. Click "ADD KEY" → "Create new key"
4. Key type: **JSON**
5. Click "CREATE"
6. A JSON file will download (e.g., `buildcore-vendor-files-abc123.json`)
7. **Save this file securely!** It contains credentials.

## Step 5: Move Key File to Backend

1. Rename the downloaded file to `google-credentials.json`
2. Move it to your backend folder:
   ```bash
   mv ~/Downloads/buildcore-vendor-files-*.json backend/google-credentials.json
   ```
3. **IMPORTANT:** Add to `.gitignore` if not already there:
   ```
   google-credentials.json
   ```

## Step 6: Share Drive with Service Account

1. Open the downloaded JSON file and find the `client_email` field
   - It looks like: `vendor-file-uploader@buildcore-vendor-files.iam.gserviceaccount.com`
2. Go to Google Drive → Find your "Vendors" shared drive
3. Click "Manage members"
4. Add the service account email as a member
5. Give it "Content manager" or "Manager" permissions
6. Click "Send"

## Step 7: Get Shared Drive ID

1. In Google Drive, open your "Vendors" shared drive
2. Look at the URL in your browser:
   ```
   https://drive.google.com/drive/folders/0AJxxxxxxxxxxx
   ```
3. The ID is the part after `/folders/`: `0AJxxxxxxxxxxx`
4. Copy this ID

## Step 8: Update Environment Variables

Add these to your `backend/.env` file:

```bash
# Google Drive Configuration
GOOGLE_SERVICE_ACCOUNT_KEY_FILE=./google-credentials.json
GOOGLE_SHARED_DRIVE_ID=0AJxxxxxxxxxxx
```

Replace `0AJxxxxxxxxxxx` with your actual shared drive ID from Step 7.

## Step 9: Install Google APIs Package

```bash
cd backend
npm install googleapis
```

## Step 10: Test the Integration

1. Restart your backend server
2. Submit a test application with files
3. Check terminal for:
   ```
   📎 Uploading files to Google Drive...
   📤 Uploading W9 Form to Google Drive...
   ✅ Uploaded W9 Form: w9.pdf
   ✅ Files uploaded to Google Drive
   ✅ Added file links to Monday.com Notes
   ```
4. Check your "Vendors" shared drive for the new folder
5. Check Monday.com Notes column for Drive links

## Folder Structure

Files will be organized as:
```
Vendors (Shared Drive)
└── Vendor Name - 2025-10-07/
    ├── w9.pdf
    ├── Test COI.pdf
    ├── Workers Comp.pdf
    └── Troubleshooting_FAQ_EN.pdf
```

## Security Notes

- Service account key file contains sensitive credentials
- Never commit `google-credentials.json` to git
- Keep the key file secure and backed up
- Rotate keys periodically for security
- Service account only has access to what you explicitly share

## Troubleshooting

### "Error: ENOENT: no such file or directory"
- Check that `google-credentials.json` exists in `backend/` folder
- Verify path in `.env` file is correct

### "Error: Insufficient Permission"
- Make sure you shared the "Vendors" drive with the service account email
- Give it "Content manager" or "Manager" permissions

### "Error: Invalid grant"
- Service account key might be expired or invalid
- Create a new key and update the file

### Files not appearing in Drive
- Check shared drive ID is correct
- Verify service account has write permissions
- Look for error messages in terminal

## Production Deployment

For Heroku or other cloud platforms:

1. **Don't upload the JSON file** - Use environment variables instead
2. Set environment variable with the entire JSON content:
   ```bash
   heroku config:set GOOGLE_SERVICE_ACCOUNT_KEY='{"type":"service_account","project_id":...}'
   ```
3. Update code to parse from env var if file doesn't exist

---

**Last Updated**: October 7, 2025  
**Status**: Ready for configuration

