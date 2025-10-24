import express from 'express';
import userAuth from '../middleware/userAuth.js';
import { createNote, deleteNote, getNote, listNotes, updateNote } from '../controllers/noteController.js';
import { z } from 'zod';
import { validate } from '../middleware/validate.js';

const router = express.Router();

router.use(userAuth);
router.get('/', listNotes);
const createSchema = { body: z.object({ content: z.string().min(1) }) };
router.post('/', validate(createSchema), createNote);
const idParams = { params: z.object({ id: z.string().min(1) }) };
const updateSchema = { ...idParams, body: z.object({ content: z.string().min(1).optional() }) };
router.get('/:id', validate(idParams), getNote);
router.put('/:id', validate(updateSchema), updateNote);
router.delete('/:id', validate(idParams), deleteNote);

export default router;




