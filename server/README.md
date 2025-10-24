# Backend API Server

Express.js REST API with Google SSO authentication and personal notes.

## Features
- User authentication with JWT cookies
- Google Single Sign-On (SSO)
- Notes CRUD operations
- Input validation with Zod
- Swagger documentation
- MongoDB with Mongoose

## Tech Stack
- Node.js + Express
- MongoDB + Mongoose
- JWT for authentication
- bcrypt for password hashing
- Zod for validation
- Swagger for API docs

## Environment Variables
Create `.env` file:
```
PORT=4000
MONGODB_URI=mongodb://localhost:27017
JWT_SECRET=your_jwt_secret_here
GOOGLE_CLIENT_ID=your_google_oauth_client_id

# (No admin features)
```

## Installation & Setup
```bash
npm install
npm run server  # Development with nodemon
npm start       # Production
```

## API Documentation
- **Swagger UI**: Visit `http://localhost:4000/api-docs` for interactive API documentation
- **Postman Collection**: Import `postman-collection.json` for complete API testing

## API Endpoints

### Authentication (`/api/v1/auth`)
- `POST /register` - Register new user
- `POST /login` - Login user
- `POST /logout` - Logout user
- `GET /is-auth` - Check authentication status

### User (`/api/v1/user`)
- `GET /data` - Get current user data

### Notes (`/api/v1/notes`)
- `GET /` - List current user's notes
- `POST /` - Create note
- `GET /:id` - Get note by ID
- `PUT /:id` - Update note
- `DELETE /:id` - Delete note

### Google SSO (`/api/v1/auth`)
- `POST /google` - Exchange Google ID token for a session (JWT cookie)

## Security Features
- Password hashing with bcrypt
- JWT tokens in HTTP-only cookies
- Input validation with Zod

## Project Structure
```
server/
├── config/          # Database configuration
├── controllers/      # Route handlers
├── docs/           # Swagger/OpenAPI specs
├── middleware/      # Auth, validation, RBAC
├── models/         # Mongoose schemas
├── routes/         # Express routes
├── seed/           # Database seeding scripts
└── server.js       # Entry point
```
