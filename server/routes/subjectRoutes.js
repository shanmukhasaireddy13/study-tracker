import express from 'express';
import { 
    getSubjects, 
    getSubject, 
    createSubject, 
    updateSubject, 
    deleteSubject,
    initializeSubjects 
} from '../controllers/subjectController.js';
import { z } from 'zod';
import { validate } from '../middleware/validate.js';

const router = express.Router();

// Validation schemas
const createSubjectSchema = {
    body: z.object({
        name: z.string().min(1),
        totalMarks: z.number().min(1),
        color: z.string().optional(),
        icon: z.string().optional(),
        description: z.string().optional()
    })
};

const updateSubjectSchema = {
    params: z.object({ id: z.string().min(1) }),
    body: z.object({
        name: z.string().min(1).optional(),
        totalMarks: z.number().min(1).optional(),
        color: z.string().optional(),
        icon: z.string().optional(),
        description: z.string().optional()
    })
};

const idParams = { params: z.object({ id: z.string().min(1) }) };

// Routes
router.get('/', getSubjects);
router.get('/init', initializeSubjects); // Initialize default subjects
router.get('/:id', validate(idParams), getSubject);
router.post('/', validate(createSubjectSchema), createSubject);
router.put('/:id', validate(updateSubjectSchema), updateSubject);
router.delete('/:id', validate(idParams), deleteSubject);

export default router;
