# 🎯 Step-by-Step Setup Instructions

## ✅ Phase 1: COMPLETED - Backend Created!

I've created your complete backend structure with:
- Express server with full error handling
- Monday.com API integration
- Data transformation for all 60+ columns
- Input validation
- File upload support
- Test scripts

---

## 📋 Phase 2: Get Your Monday.com Credentials (10 minutes)

### Step 1: Get Your API Token

1. **Open Monday.com**: https://monday.com
2. **Access Developer Settings**:
   - Click your profile avatar (bottom-left corner)
   - Select "Developers" or "Admin" → "API"
   
3. **Create New Token**:
   - Click "API v2 Token"
   - Name it: "BuildCore Vendor Integration"
   - Select these scopes:
     - ✅ boards:read
     - ✅ boards:write  
     - ✅ files:write
   - Click "Save"
   - **COPY THE TOKEN** (you'll only see it once!)

### Step 2: Find Your Board ID

1. **Option A - Easy Way (Board URL)**:
   - Open your "Onboarding/Pending Vendors" board
   - Look at the URL: `https://buildcore.monday.com/boards/1234567890`
   - The numbers after `/boards/` is your Board ID
   
2. **Option B - API Playground**:
   - Go to: https://monday.com/developers/v2/try-it-yourself
   - Paste this query:
   ```graphql
   query {
     boards(limit: 50) {
       id
       name
     }
   }
   ```
   - Click "Run"
   - Find "Onboarding/Pending Vendors" and copy its ID

### Step 3: Set Up Your Environment

1. **Open Terminal in your project**:
   ```bash
   cd "/Users/evanedge/Documents/Cursor Projects/Vendor Application/backend"
   ```

2. **Create your .env file**:
   ```bash
   cp .env.example .env
   ```

3. **Edit .env file** with your credentials:
   ```env
   # Replace these with your actual values
   MONDAY_API_KEY=eyJhbGciOiJIUzI1NiJ9.eyJ0aWQiOjM3MDc3M...
   MONDAY_BOARD_ID=1234567890
   
   # Leave these as-is for now
   PORT=3001
   NODE_ENV=development
   CORS_ORIGIN=http://localhost:8080,https://buildcore-vendor-application.netlify.app
   ```

---

## 🚀 Phase 3: Install & Test (5 minutes)

### Step 1: Install Dependencies
```bash
# In the backend folder
npm install
```

### Step 2: Start the Server
```bash
# This starts your backend
npm start
```

You should see:
```
🚀 BuildCore Vendor Backend Server
====================================
✅ Server running on port 3001
✅ Environment: development
✅ Monday.com API: Configured
✅ Board ID: 1234567890
```

### Step 3: Test the Connection
**Open a new terminal** (keep server running) and run:
```bash
cd "/Users/evanedge/Documents/Cursor Projects/Vendor Application/backend"
npm test
```

This will:
1. Check server health ✅
2. Test Monday.com connection ✅
3. Create a test vendor in your board ✅

---

## ✨ Phase 4: Connect Your Form (2 minutes)

I'll update your form to submit to the backend. Just tell me when you're ready!

---

## 🎉 Success Checklist

- [ ] Got Monday.com API token
- [ ] Found Board ID
- [ ] Created .env file with credentials
- [ ] Installed dependencies (`npm install`)
- [ ] Server starts without errors (`npm start`)
- [ ] Test passes (`npm test`)
- [ ] Test vendor appears in Monday.com

---

## 🆘 Troubleshooting

### "Cannot find module" error
```bash
# Make sure you're in the backend folder
cd backend
npm install
```

### "Monday.com connection failed"
- Double-check your API token (no extra spaces)
- Verify Board ID is just numbers (e.g., 1234567890)
- Make sure token has all required permissions

### "EADDRINUSE: Port 3001 already in use"
```bash
# Kill the existing process
lsof -i :3001
kill -9 [PID]
# Or use a different port in .env
PORT=3002
```

### Test vendor not appearing in Monday
- Check you're looking at the right board
- Refresh Monday.com page
- Check the bottom of your board (new items appear at bottom)

---

## 📞 Next Steps

Once you've completed the checklist above:
1. Let me know the test passed
2. I'll update the column mappings with your actual column IDs
3. We'll connect your frontend form
4. Deploy to production!

**Current Status**: Waiting for you to get Monday.com credentials and run the test!
