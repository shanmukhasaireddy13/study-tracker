import express from 'express';
import userAuth from '../middleware/userAuth.js';
import { getStreakData, updateStreak, getRevisionPlan, refreshStreak } from '../controllers/streakController.js';

const router = express.Router();

// All routes require authentication
router.use(userAuth);

// Get user's streak data
router.get('/', getStreakData);

// Update streak (called when study entry is created)
router.post('/update', updateStreak);

// Get revision plan and recommendations
router.get('/revision-plan', getRevisionPlan);

// Refresh streak data
router.post('/refresh', refreshStreak);

export default router;
