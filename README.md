# BuildCore Vendor Application Backend

This backend service handles vendor application submissions and integrates with Monday.com.

## 🚀 Quick Start

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Configure Environment
```bash
# Copy the example environment file
cp .env.example .env

# Edit .env and add your Monday.com credentials
```

### 3. Get Monday.com Credentials
1. Log into [Monday.com](https://monday.com)
2. Click your avatar (bottom left) → "Developers"
3. Create an API token with these permissions:
   - `boards:read`
   - `boards:write`
   - `files:write`

### 4. Find Your Board ID
Run this in the Monday.com API playground:
```graphql
query {
  boards(limit: 50) {
    id
    name
  }
}
```
Look for "Onboarding/Pending Vendors" and copy its ID.

### 5. Start the Server
```bash
# Development mode (with auto-reload)
npm run dev

# Production mode
npm start
```

### 6. Test the Integration
```bash
# In a new terminal
npm test
```

## 📝 API Endpoints

### Health Check
```
GET /health
```
Returns server status and configuration info.

### Test Monday.com Connection
```
GET /api/test-connection
```
Verifies Monday.com API credentials and returns board info.

### Submit Vendor Application
```
POST /api/vendor-application
Content-Type: multipart/form-data
```
Submits vendor application to Monday.com.

## 🔧 Configuration

Edit `.env` file:

```env
# Required
MONDAY_API_KEY=your_api_token
MONDAY_BOARD_ID=your_board_id

# Optional
PORT=3001
NODE_ENV=development
ENABLE_DUPLICATE_CHECK=true
```

## 📁 Project Structure

```
backend/
├── src/
│   ├── api/
│   │   └── monday.js        # Monday.com API integration
│   ├── utils/
│   │   ├── transformer.js   # Data transformation logic
│   │   ├── validator.js     # Input validation
│   │   └── email.js         # Email notifications
│   ├── server.js            # Express server
│   └── test-integration.js  # Integration test script
├── .env.example             # Environment template
├── .gitignore              # Git ignore rules
├── package.json            # Dependencies
└── README.md              # This file
```

## 🧪 Testing

### Test Integration
```bash
npm test
```
This will:
1. Check server health
2. Test Monday.com connection
3. Create a test vendor (with today's date in the name)

### Manual Testing with cURL
```bash
# Test health
curl http://localhost:3001/health

# Test Monday connection
curl http://localhost:3001/api/test-connection
```

## 🚨 Troubleshooting

### "Monday.com connection failed"
- Check your `MONDAY_API_KEY` in `.env`
- Verify the API token has correct permissions
- Make sure `MONDAY_BOARD_ID` is correct

### "Column not found" errors
- The column mappings in `transformer.js` need to match your board
- Run `/api/test-connection` to see actual column IDs
- Update `COLUMN_MAPPINGS` in `transformer.js`

### "Rate limit exceeded"
- Monday.com has API rate limits
- Wait a few minutes and try again
- Consider implementing caching for read operations

## 🔄 Next Steps

1. **Update Column Mappings**: 
   - Get actual column IDs from your board
   - Update `transformer.js` with correct IDs

2. **Enable Email Notifications**:
   - Set up SendGrid or similar service
   - Update email configuration in `.env`

3. **Add File Storage**:
   - Configure AWS S3 or similar
   - Update file upload handling

4. **Deploy to Production**:
   - Deploy to Vercel, Heroku, or AWS
   - Set production environment variables
   - Enable HTTPS

## 📚 Resources

- [Monday.com API Docs](https://developer.monday.com/api-reference/docs)
- [Monday.com API Playground](https://monday.com/developers/v2/try-it-yourself)
- [Express.js Docs](https://expressjs.com/)

## 🤝 Support

For issues or questions:
- Check the troubleshooting section above
- Review Monday.com API documentation
- Contact BuildCore development team
