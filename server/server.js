import express from "express";
import cors from "cors";
import "dotenv/config";
import cookieParser from "cookie-parser";
import compression from "compression";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { connect } from "mongoose";
import connectDB from './config/mongodb.js';
import authRouter from './routes/authRoutes.js';
import userRouter from "./routes/userRoutes.js";
// Tasks removed; using notes instead
import noteRouter from './routes/noteRoutes.js';
import studyRouter from './routes/studyRoutes.js';
import subjectRouter from './routes/subjectRoutes.js';
import lessonRouter from './routes/lessonRoutes.js';
import adminRouter from './routes/adminRoutes.js';
import streakRouter from './routes/streakRoutes.js';
import fileRouter from './routes/fileRoutes.js';
import swaggerUi from 'swagger-ui-express';
import apiSpec from './docs/openapi.js';
import path from 'path';

const app = express();
const port = process.env.PORT || 4000;
connectDB();

// Performance middleware
app.use(compression()); // Compress responses
app.use(helmet()); // Security headers

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

const allowedOrigins = [
    'http://localhost:5173',
    process.env.FRONTEND_URL
].filter(Boolean);

// Logging middleware (only in development)
if (process.env.NODE_ENV === 'development') {
  app.use((req,res,next)=>{
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`)
    next()
  })
}

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Serve uploaded files statically (respect UPLOADS_DIR for persistent disk)
const uploadsDir = process.env.UPLOADS_DIR ? path.resolve(process.env.UPLOADS_DIR) : path.resolve('server/uploads');
app.use('/uploads', express.static(uploadsDir));
app.use(cors({
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Swagger setup (separate spec)
const spec = { ...apiSpec, servers: [{ url: 'http://localhost:' + port }] };
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(spec));

// Caching middleware
app.use((req, res, next) => {
  // Cache static assets for 1 year
  if (req.url.match(/\.(css|js|png|jpg|jpeg|gif|ico|svg)$/)) {
    res.setHeader('Cache-Control', 'public, max-age=31536000');
  }
  // Cache API responses for 5 minutes
  else if (req.url.startsWith('/api/v1/subjects') || req.url.startsWith('/api/v1/lessons')) {
    res.setHeader('Cache-Control', 'public, max-age=300');
  }
  // No cache for dynamic data
  else if (req.url.startsWith('/api/v1/study') || req.url.startsWith('/api/v1/streak')) {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  }
  next();
});

// API Endpoints
app.get('/', (req, res) => res.send("API WORKING"));
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/user', userRouter);
app.use('/api/v1/notes', noteRouter);
app.use('/api/v1/study', studyRouter);
app.use('/api/v1/subjects', subjectRouter);
app.use('/api/v1/lessons', lessonRouter);
app.use('/api/v1/admin', adminRouter);
app.use('/api/v1/streak', streakRouter);
app.use('/api/v1/files', fileRouter);

app.listen(port, () => console.log(`Server started on PORT:${port}`));