import express from 'express';
import userAuth from '../middleware/userAuth.js';
import { 
    getLessons, 
    getLesson, 
    createLesson, 
    updateLesson, 
    deleteLesson,
    getLessonsBySubject 
} from '../controllers/lessonController.js';
import { z } from 'zod';
import { validate } from '../middleware/validate.js';

const router = express.Router();

// All routes require authentication
router.use(userAuth);

// Validation schemas
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

const idParams = { params: z.object({ id: z.string().min(1) }) };

// Routes
router.get('/', getLessons);
router.get('/by-subject', getLessonsBySubject);
router.get('/:id', validate(idParams), getLesson);
router.post('/', validate(createLessonSchema), createLesson);
router.put('/:id', validate(updateLessonSchema), updateLesson);
router.delete('/:id', validate(idParams), deleteLesson);

export default router;
