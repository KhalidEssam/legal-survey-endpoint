# Survey API with MongoDB Atlas

A Node.js Express API for collecting and storing multilingual survey responses in MongoDB Atlas.

## Features

- ✅ RESTful API endpoint for survey submission
- ✅ MongoDB Atlas integration with Mongoose
- ✅ Data validation
- ✅ CORS enabled
- ✅ Multilingual support (9 languages)
- ✅ Analytics endpoint
- ✅ Pagination support

## Setup Instructions

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure MongoDB Atlas

1. Create a free account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a new cluster
3. Click "Connect" and select "Connect your application"
4. Copy your connection string
5. Create a `.env` file in the root directory:
```env
MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/survey-db?retryWrites=true&w=majority
PORT=3000
```

Replace `username`, `password`, and cluster URL with your actual credentials.

### 3. Whitelist IP Address

In MongoDB Atlas:
- Go to "Network Access"
- Click "Add IP Address"
- Select "Allow Access from Anywhere" (for development) or add your specific IP

### 4. Create Database User

In MongoDB Atlas:
- Go to "Database Access"
- Click "Add New Database User"
- Create username and password
- Grant "Read and write to any database" permissions

### 5. Run the Server

Development mode with auto-reload:
```bash
npm run dev
```

Production mode:
```bash
npm start
```

## API Endpoints

### Submit Survey
**POST** `/api/survey/submit`

Request body example:
```json
{
  "surveySource": "Facebook",
  "surveySourceOther": null,
  "nationality": "Egyptian",
  "residenceYears": "1-3 years",
  "age": "26-35 years",
  "income": "4,000-8,000 SAR",
  "legalIssues": "Yes",
  "mainBarrier": "High cost",
  "quickDecision": "Yes, immediately",
  "giveawayInterest": "Yes, I would",
  "email": "[email protected]",
  "phone": "0512345678",
  "legalTechServices": "No",
  "legalTechServiceName": null,
  "legalTechConsideration": "Yes",
  "language": "en"
}
```

Response:
```json
{
  "success": true,
  "message": "Survey submitted successfully",
  "data": {
    "id": "507f1f77bcf86cd799439011",
    "submittedAt": "2025-10-22T10:30:00.000Z"
  }
}
```

### Get All Surveys (Admin)
**GET** `/api/survey/all?page=1&limit=50`

### Get Survey by ID
**GET** `/api/survey/:id`

### Get Analytics
**GET** `/api/survey/analytics/summary`

## Project Structure
```
survey-api/
├── models/
│   └── Survey.js          # Mongoose schema
├── routes/
│   └── surveyRoutes.js    # API routes
├── .env                   # Environment variables (create this)
├── .env.example           # Example env file
├── package.json           # Dependencies
├── server.js              # Main server file
└── README.md              # Documentation
```

## Testing with Postman/cURL
```bash
curl -X POST http://localhost:3000/api/survey/submit \
  -H "Content-Type: application/json" \
  -d '{
    "surveySource": "Facebook",
    "nationality": "Egyptian",
    "residenceYears": "1-3 years",
    "age": "26-35 years",
    "income": "4,000-8,000 SAR",
    "legalIssues": "Yes",
    "mainBarrier": "High cost",
    "quickDecision": "Yes, immediately",
    "giveawayInterest": "Yes",
    "language": "en"
  }'
```

## Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| MONGODB_URI | MongoDB Atlas connection string | mongodb+srv://user:pass@cluster.mongodb.net/dbname |
| PORT | Server port | 3000 |

## Supported Languages

- Arabic (ar)
- English (en)
- Tagalog (tl)
- Urdu (ur)
- Bengali (bn)
- Malay (ms)
- Chinese (zh)
- Somali (so)
- Hindi (hi)

## License

MIT