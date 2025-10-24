import lessonModel from '../models/lessonModel.js';
import subjectModel from '../models/subjectModel.js';

// Get lessons for a subject
export const getLessons = async (req, res) => {
    try {
        const { subject } = req.query;
        const query = { isActive: true };
        
        if (subject) {
            query.subject = subject;
        }

        const lessons = await lessonModel
            .find(query)
            .populate('subject', 'name icon color')
            .populate('createdBy', 'name')
            .sort({ chapterNumber: 1 });

        res.json({ success: true, data: lessons });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// Get lesson by ID
export const getLesson = async (req, res) => {
    try {
        const lesson = await lessonModel
            .findById(req.params.id)
            .populate('subject', 'name icon color')
            .populate('createdBy', 'name');
        
        if (!lesson) {
            return res.status(404).json({ success: false, message: 'Lesson not found' });
        }

        res.json({ success: true, data: lesson });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// Create lesson (admin only)
export const createLesson = async (req, res) => {
    try {
        const { subject, name, chapterNumber, description } = req.body;
        
        if (!subject || !name) {
            return res.status(400).json({ 
                success: false, 
                message: 'Subject and lesson name are required' 
            });
        }

        // Check if subject exists
        const subjectExists = await subjectModel.findById(subject);
        if (!subjectExists) {
            return res.status(400).json({ 
                success: false, 
                message: 'Subject not found' 
            });
        }

        const lesson = await lessonModel.create({
            subject,
            name,
            chapterNumber: chapterNumber || 0,
            description: description || '',
            createdBy: req.user.id
        });

        const populatedLesson = await lessonModel
            .findById(lesson._id)
            .populate('subject', 'name icon color')
            .populate('createdBy', 'name');

        res.status(201).json({ success: true, data: populatedLesson });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// Update lesson
export const updateLesson = async (req, res) => {
    try {
        const { name, chapterNumber, description, isActive } = req.body;
        
        const lesson = await lessonModel.findById(req.params.id);
        if (!lesson) {
            return res.status(404).json({ success: false, message: 'Lesson not found' });
        }

        if (name) lesson.name = name;
        if (chapterNumber !== undefined) lesson.chapterNumber = chapterNumber;
        if (description !== undefined) lesson.description = description;
        if (isActive !== undefined) lesson.isActive = isActive;

        await lesson.save();

        const populatedLesson = await lessonModel
            .findById(lesson._id)
            .populate('subject', 'name icon color')
            .populate('createdBy', 'name');

        res.json({ success: true, data: populatedLesson });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// Delete lesson
export const deleteLesson = async (req, res) => {
    try {
        const lesson = await lessonModel.findById(req.params.id);
        if (!lesson) {
            return res.status(404).json({ success: false, message: 'Lesson not found' });
        }

        await lessonModel.deleteOne({ _id: req.params.id });
        res.json({ success: true, message: 'Lesson deleted successfully' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// Get lessons grouped by subject
export const getLessonsBySubject = async (req, res) => {
    try {
        const subjects = await subjectModel.find().sort({ name: 1 });
        const result = [];

        for (const subject of subjects) {
            const lessons = await lessonModel
                .find({ subject: subject._id, isActive: true })
                .sort({ chapterNumber: 1 });

            result.push({
                subject: {
                    _id: subject._id,
                    name: subject.name,
                    icon: subject.icon,
                    color: subject.color,
                    totalMarks: subject.totalMarks
                },
                lessons: lessons
            });
        }

        res.json({ success: true, data: result });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
