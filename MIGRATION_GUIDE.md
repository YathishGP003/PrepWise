# PrepWise Migration Guide: Firebase to PostgreSQL

## Setup Instructions

### 1. Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/prepwise?schema=public"

# JWT Secret (generate a secure random string)
JWT_SECRET="your-secure-jwt-secret-key-here"

# VAPI Configuration (from your existing setup)
NEXT_PUBLIC_VAPI_WEB_TOKEN="your-vapi-web-token"
NEXT_PUBLIC_VAPI_WORKFLOW_ID="your-vapi-workflow-id"

# Node Environment
NODE_ENV="development"
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Generate Prisma Client

```bash
npm run prisma:generate
```

### 4. Push Database Schema

This will create all the necessary tables in your PostgreSQL database:

```bash
npm run prisma:push
```

### 5. Run the Application

```bash
npm run dev
```

## Database Schema Overview

The application now uses three main tables:

1. **users** - Stores user authentication and profile information
2. **interviews** - Stores interview sessions with questions and metadata
3. **feedback** - Stores AI-generated feedback for completed interviews

## Key Changes from Firebase

1. **Authentication**: Now uses JWT tokens stored in HTTP-only cookies instead of Firebase Auth
2. **Database**: PostgreSQL with Prisma ORM instead of Firestore
3. **Password Storage**: Passwords are hashed using bcrypt before storage
4. **Session Management**: 7-day session duration with JWT tokens

## Notes

- Make sure PostgreSQL is running before starting the application
- The JWT_SECRET should be a long, random string in production
- All timestamps are now handled by PostgreSQL (createdAt, updatedAt)
