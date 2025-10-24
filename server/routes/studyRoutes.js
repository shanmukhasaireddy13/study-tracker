import express from 'express';
import userAuth from '../middleware/userAuth.js';
import { 
    createStudyEntry, 
    getStudyEntries, 
    getStudyEntry, 
    updateStudyEntry, 
    deleteStudyEntry,
    getStudyStats 
} from '../controllers/studyController.js';
import { z } from 'zod';
import { validate } from '../middleware/validate.js';

const router = express.Router();

// All routes require authentication
router.use(userAuth);

// Validation schemas
const createEntrySchema = {
    body: z.object({
        subject: z.string().min(1),
        lesson: z.string().optional(),
        reading: z.object({
            completed: z.boolean().optional(),
            notes: z.string().optional()
        }).optional(),
        grammar: z.object({
            completed: z.boolean().optional(),
            topic: z.string().optional(),
            photos: z.array(z.string()).optional(),
            notes: z.string().optional()
        }).optional(),
        writing: z.object({
            completed: z.boolean().optional(),
            type: z.enum(['questions', 'letters', 'essays', 'other']).optional(),
            topic: z.string().optional(),
            photos: z.array(z.string()).optional(),
            notes: z.string().optional()
        }).optional(),
        mathPractice: z.object({
            completed: z.boolean().optional(),
            formulas: z.array(z.string()).optional(),
            problemsSolved: z.number().optional(),
            photos: z.array(z.string()).optional(),
            notes: z.string().optional()
        }).optional(),
        sciencePractice: z.object({
            completed: z.boolean().optional(),
            diagrams: z.boolean().optional(),
            questionsAnswered: z.number().optional(),
            photos: z.array(z.string()).optional(),
            notes: z.string().optional()
        }).optional(),
        socialPractice: z.object({
            completed: z.boolean().optional(),
            questionsAnswered: z.number().optional(),
            photos: z.array(z.string()).optional(),
            notes: z.string().optional()
        }).optional(),
        confidence: z.number().min(1).max(5).optional(),
        totalTime: z.number().min(0).optional()
    })
};

const updateEntrySchema = {
    params: z.object({ id: z.string().min(1) }),
    body: z.object({
        subject: z.string().min(1).optional(),
        lesson: z.string().optional(),
        reading: z.object({
            completed: z.boolean().optional(),
            notes: z.string().optional()
        }).optional(),
        grammar: z.object({
            completed: z.boolean().optional(),
            topic: z.string().optional(),
            photos: z.array(z.string()).optional(),
            notes: z.string().optional()
        }).optional(),
        writing: z.object({
            completed: z.boolean().optional(),
            type: z.enum(['questions', 'letters', 'essays', 'other']).optional(),
            topic: z.string().optional(),
            photos: z.array(z.string()).optional(),
            notes: z.string().optional()
        }).optional(),
        mathPractice: z.object({
            completed: z.boolean().optional(),
            formulas: z.array(z.string()).optional(),
            problemsSolved: z.number().optional(),
            photos: z.array(z.string()).optional(),
            notes: z.string().optional()
        }).optional(),
        sciencePractice: z.object({
            completed: z.boolean().optional(),
            diagrams: z.boolean().optional(),
            questionsAnswered: z.number().optional(),
            photos: z.array(z.string()).optional(),
            notes: z.string().optional()
        }).optional(),
        socialPractice: z.object({
            completed: z.boolean().optional(),
            questionsAnswered: z.number().optional(),
            photos: z.array(z.string()).optional(),
            notes: z.string().optional()
        }).optional(),
        confidence: z.number().min(1).max(5).optional(),
        totalTime: z.number().min(0).optional()
    })
};

const idParams = { params: z.object({ id: z.string().min(1) }) };

// Routes
router.post('/', validate(createEntrySchema), createStudyEntry);
router.get('/', getStudyEntries);
router.get('/stats', getStudyStats);
router.get('/:id', validate(idParams), getStudyEntry);
router.put('/:id', validate(updateEntrySchema), updateStudyEntry);
router.delete('/:id', validate(idParams), deleteStudyEntry);

export default router;
