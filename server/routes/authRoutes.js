import express from 'express'
import { isAuthenticated, login, logout, register, googleLogin } from '../controllers/authController.js';
import { z } from 'zod';
import { validate } from '../middleware/validate.js';
import userAuth from '../middleware/userAuth.js';

const authRouter = express.Router();

/**
 * @openapi
 * tags:
 *   - name: Auth
 *     description: Authentication APIs
 */

/**
 * @openapi
 * /api/v1/auth/register:
 *   post:
 *     tags: [Auth]
 *     summary: Register a new user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, password]
 *             properties:
 *               name: { type: string }
 *               email: { type: string }
 *               password: { type: string }
 *     responses:
 *       200:
 *         description: Registered
 */
const registerSchema = { body: z.object({ name: z.string().min(1), email: z.string().email(), password: z.string().min(6) }) };
authRouter.post('/register', validate(registerSchema), register);

/**
 * @openapi
 * /api/v1/auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Login
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string }
 *               password: { type: string }
 *     responses:
 *       200:
 *         description: Logged in
 */
const loginSchema = { body: z.object({ email: z.string().email(), password: z.string().min(6) }) };
authRouter.post('/login', validate(loginSchema), login);

/**
 * @openapi
 * /api/v1/auth/logout:
 *   post:
 *     tags: [Auth]
 *     summary: Logout
 *     responses:
 *       200:
 *         description: Logged out
 */
authRouter.post('/logout', logout);

/**
 * @openapi
 * /api/v1/auth/is-auth:
 *   get:
 *     tags: [Auth]
 *     summary: Check auth state
 *     responses:
 *       200:
 *         description: Authenticated/Not
 */
authRouter.get('/is-auth',userAuth,isAuthenticated);

// Google SSO
const googleSchema = { body: z.object({ idToken: z.string().min(10) }) };
authRouter.post('/google', validate(googleSchema), googleLogin);

export default authRouter;

