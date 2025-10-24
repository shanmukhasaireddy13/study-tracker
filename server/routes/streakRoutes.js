import express from 'express';
import userAuth from '../middleware/userAuth.js';
import { getStreakData, updateStreak, getRevisionPlan, refreshStreak, rebuildStudyCalendar } from '../controllers/streakController.js';

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

// Rebuild study calendar (for fixing historical data)
router.post('/rebuild-calendar', async (req, res) => {
    try {
        const userId = req.user.id;
        await rebuildStudyCalendar(userId);
        res.json({ success: true, message: 'Study calendar rebuilt successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

export default router;
