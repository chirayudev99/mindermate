# Mindermate Backend API

Node.js/Express backend API for the Mindermate task management application.

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create a `.env` file in the root directory:

```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/mindermate
JWT_SECRET=your_jwt_secret_key_here_change_in_production
FRONTEND_URL=http://localhost:5173
GEMINI_API_KEY=your_gemini_api_key_here
FIREBASE_SERVICE_ACCOUNT={"type":"service_account","project_id":"your-project-id",...}
```

3. Make sure MongoDB is running on your system.

4. Start the server:

```bash
npm start
```

For development with auto-reload:

```bash
npm run dev
```

## Environment Variables

- `PORT` - Server port (default: 5000)
- `MONGODB_URI` - MongoDB connection string
- `JWT_SECRET` - Secret key for JWT token signing
- `FRONTEND_URL` - Frontend URL for CORS
- `GEMINI_API_KEY` - Google Gemini API key for AI scheduler feature
- `FIREBASE_SERVICE_ACCOUNT` - Firebase service account JSON (as string) for FCM push notifications

## API Endpoints

### Authentication

- `POST /api/auth/signup` - Create new account
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user (requires auth)
- `POST /api/auth/logout` - Logout (requires auth)

### Tasks

- `POST /api/tasks` - Create task (requires auth)
- `GET /api/tasks?date=YYYY-MM-DD` - Get tasks by date (requires auth)
- `PATCH /api/tasks/:id` - Update task (requires auth)
- `DELETE /api/tasks/:id` - Delete task (requires auth)

### AI Scheduler

- `POST /api/ai-scheduler/parse` - Parse user prompt and create tasks (requires auth token)
  - Headers: `Authorization: Bearer <token>`
  - Body: `{ prompt: string, date: string (YYYY-MM-DD), defaultType?: string }`
  - Returns: `{ message: string, tasks: Task[] }`

### Notifications (FCM)

- `POST /api/notifications/register-token` - Register FCM token (requires auth token)

  - Headers: `Authorization: Bearer <token>`
  - Body: `{ fcmToken: string }`
  - Returns: `{ message: string }`

- `POST /api/notifications/unregister-token` - Unregister FCM token (requires auth token)

  - Headers: `Authorization: Bearer <token>`
  - Body: `{ fcmToken: string }`
  - Returns: `{ message: string }`

- `POST /api/notifications/test` - Send test notification (requires auth token)

  - Headers: `Authorization: Bearer <token>`
  - Returns: `{ success: boolean, ... }`

- `POST /api/notifications/schedule/:taskId` - Manually trigger notification for a task (requires auth token)
  - Headers: `Authorization: Bearer <token>`
  - Returns: `{ success: boolean, ... }`

## Authentication

All protected routes require a JWT token in the Authorization header:

```
Authorization: Bearer <token>
```
