# CareerForge 🚀

CareerForge is a career-guidance and skill-tracking platform for BTech/engineering students. It helps students choose a career domain, follow a structured roadmap, track progress, attempt assessments, earn badges, and get guided by an AI career agent.

## Tech Stack
- **Frontend**: React.js, Tailwind CSS (v4), React Router, Axios, Recharts
- **Backend**: Node.js, Express.js
- **Database**: MongoDB & Mongoose
- **Authentication**: JWT (JSON Web Tokens)
- **AI Integration**: OpenAI (Configurable API Key)

## Project Structure

- `/client` - Frontend React application (Vite)
- `/server` - Backend Node/Express API

## Features
- **14 Career Domains**: Comprehensive roadmaps from Web Dev to Data Science.
- **Progress Tracking**: Heatmaps, topic completion, phase-wise tracking.
- **Assessments & Badges**: HackerRank certification integration and custom badges.
- **AI Career Mentor**: Get personalized advice based on your domain and progress.
- **Admin Dashboard**: Manage domains, phases, topics, users, and resources.

## Prerequisites
- Node.js (v18+)
- MongoDB running locally or a MongoDB Atlas URI

## Setup Instructions

### 1. Backend Setup

```bash
cd server
npm install
```

Copy the `.env.example` to `.env` and fill in your details:
```bash
cp .env.example .env
```
Ensure you provide a valid `MONGODB_URI` and `JWT_SECRET`. If you have an OpenAI API key, add it to `AI_API_KEY`.

Start the backend:
```bash
npm run dev
```

### 2. Database Seeding

An operator with database access can insert missing default curriculum and resources into a non-production database. Set `NODE_ENV` to `development` or `test` and provide `SEED_MONGODB_URI` in the operator's process environment, including the target database name. Use credentials scoped to that database. The CLI does not load application `.env` files.

```bash
cd server
npm run seed -- --confirm-non-production
```

Startup and HTTP requests no longer seed data. To use seeded data in local development, point the app at the same persistent development database. Existing records keep their IDs and values. Run only one seed process at a time because some curriculum keys lack unique indexes. If a run fails partway through, correct the cause and rerun against the same target.

Production seeding is blocked and there is no force or user reset option. Remove any scheduled calls to the former HTTP seed endpoint. If the JWT signing secret was passed in a seed URL, treat it as exposed and rotate it through the deployment secret manager. Audit any previously seeded administrator account and rotate its password or disable legacy password access if applicable.

### 3. Frontend Setup

```bash
cd client
npm install
```

Start the frontend development server:
```bash
npm run dev
```

## Roles
- **Admin**: The non-production seed can optionally provision a new administrator when both `ADMIN_EMAIL` and `ADMIN_PASSWORD` are supplied in the operator's environment. Use a unique password of at least 16 characters and at most 72 UTF-8 bytes. Existing accounts are untouched. The sample problem seed requires an existing administrator or one provisioned during the run.
- **Student**: Any new user that registers via the UI will be a student by default.

## License
MIT
