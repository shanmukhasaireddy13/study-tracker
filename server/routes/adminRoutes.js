import express from 'express';
import userAuth from '../middleware/userAuth.js';
import { isAdmin, createAdmin } from '../middleware/adminAuth.js';
import userModel from '../models/usermodel.js';
import { 
    getSubjects, 
    getSubject, 
    createSubject, 
    updateSubject, 
    deleteSubject,
    initializeSubjects 
} from '../controllers/subjectController.js';
import { 
    getLessons, 
    getLesson, 
    createLesson, 
    updateLesson, 
    deleteLesson,
    getLessonsBySubject 
} from '../controllers/lessonController.js';
import { getStudyStats } from '../controllers/studyController.js';
import { getAllStudentPerformance, getStudentDetailedPerformance, getSystemAnalytics } from '../controllers/adminController.js';
import { z } from 'zod';
import { validate } from '../middleware/validate.js';

const router = express.Router();

// All routes require authentication
router.use(userAuth);

// Admin-only routes
router.use(isAdmin);

// Validation schemas
const createSubjectSchema = {
    body: z.object({
        name: z.string().min(1),
        totalMarks: z.number().min(1),
        color: z.string().optional(),
        icon: z.string().optional(),
        description: z.string().optional(),
        type: z.enum(['language', 'maths', 'science', 'social', 'general']).optional()
    })
};

const updateSubjectSchema = {
    params: z.object({ id: z.string().min(1) }),
    body: z.object({
        name: z.string().min(1).optional(),
        totalMarks: z.number().min(1).optional(),
        color: z.string().optional(),
        icon: z.string().optional(),
        description: z.string().optional(),
        type: z.enum(['language', 'maths', 'science', 'social', 'general']).optional()
    })
};

const createLessonSchema = {
    body: z.object({
        subject: z.string().min(1),
        name: z.string().min(1),
        chapterNumber: z.number().optional(),
        description: z.string().optional()
    })
};

const updateLessonSchema = {
    params: z.object({ id: z.string().min(1) }),
    body: z.object({
        name: z.string().min(1).optional(),
        chapterNumber: z.number().optional(),
        description: z.string().optional(),
        isActive: z.boolean().optional()
    })
};

const createAdminSchema = {
    body: z.object({
        name: z.string().min(1),
        email: z.string().email(),
        password: z.string().min(6)
    })
};

const idParams = { params: z.object({ id: z.string().min(1) }) };

// Admin setup routes
router.post('/setup/admin', validate(createAdminSchema), createAdmin);
router.get('/setup/subjects', initializeSubjects);

// Subject management
router.get('/subjects', getSubjects);
router.get('/subjects/:id', validate(idParams), getSubject);
router.post('/subjects', validate(createSubjectSchema), createSubject);
router.put('/subjects/:id', validate(updateSubjectSchema), updateSubject);
router.delete('/subjects/:id', validate(idParams), deleteSubject);

// Lesson management
router.get('/lessons', getLessons);
router.get('/lessons/by-subject', getLessonsBySubject);
router.get('/lessons/:id', validate(idParams), getLesson);
router.post('/lessons', validate(createLessonSchema), createLesson);
router.put('/lessons/:id', validate(updateLessonSchema), updateLesson);
router.delete('/lessons/:id', validate(idParams), deleteLesson);

// Student progress overview
router.get('/stats', getStudyStats);

// Student performance analytics
router.get('/students/performance', getAllStudentPerformance);
router.get('/students/:studentId/performance', getStudentDetailedPerformance);
router.get('/analytics', getSystemAnalytics);

// Admin profile management
router.get('/profile', async (req, res) => {
    try {
        const admin = await userModel.findById(req.user.id).select('-password');
        res.json({ success: true, data: admin });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to get admin profile' });
    }
});

router.put('/profile', async (req, res) => {
    try {
        const { name, email, password } = req.body;
        const updateData = { name };
        
        if (password && password.length >= 6) {
            const bcrypt = await import('bcryptjs');
            updateData.password = await bcrypt.hash(password, 10);
        }
        
        const admin = await userModel.findByIdAndUpdate(
            req.user.id, 
            updateData, 
            { new: true }
        ).select('-password');
        
        res.json({ success: true, data: admin, message: 'Profile updated successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to update profile' });
    }
});

export default router;
