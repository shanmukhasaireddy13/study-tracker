import subjectModel from '../models/subjectModel.js';

// Get all subjects
export const getSubjects = async (req, res) => {
    try {
        const subjects = await subjectModel.find().sort({ name: 1 });
        res.json({ success: true, data: subjects });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// Get subject by ID
export const getSubject = async (req, res) => {
    try {
        const subject = await subjectModel.findById(req.params.id);
        if (!subject) {
            return res.status(404).json({ success: false, message: 'Subject not found' });
        }
        res.json({ success: true, data: subject });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// Create subject (admin only - for initial setup)
export const createSubject = async (req, res) => {
    try {
        const { name, totalMarks, color, icon, description } = req.body;
        
        if (!name || !totalMarks) {
            return res.status(400).json({ 
                success: false, 
                message: 'Name and total marks are required' 
            });
        }

        const subject = await subjectModel.create({
            name,
            totalMarks: parseInt(totalMarks),
            color: color || '#3B82F6',
            icon: icon || '📚',
            description: description || ''
        });

        res.status(201).json({ success: true, data: subject });
    } catch (err) {
        if (err.code === 11000) {
            return res.status(400).json({ 
                success: false, 
                message: 'Subject with this name already exists' 
            });
        }
        res.status(500).json({ success: false, message: err.message });
    }
};

// Update subject
export const updateSubject = async (req, res) => {
    try {
        const { name, totalMarks, color, icon, description } = req.body;
        
        const subject = await subjectModel.findById(req.params.id);
        if (!subject) {
            return res.status(404).json({ success: false, message: 'Subject not found' });
        }

        if (name) subject.name = name;
        if (totalMarks) subject.totalMarks = parseInt(totalMarks);
        if (color) subject.color = color;
        if (icon) subject.icon = icon;
        if (description !== undefined) subject.description = description;

        await subject.save();
        res.json({ success: true, data: subject });
    } catch (err) {
        if (err.code === 11000) {
            return res.status(400).json({ 
                success: false, 
                message: 'Subject with this name already exists' 
            });
        }
        res.status(500).json({ success: false, message: err.message });
    }
};

// Delete subject
export const deleteSubject = async (req, res) => {
    try {
        const subject = await subjectModel.findById(req.params.id);
        if (!subject) {
            return res.status(404).json({ success: false, message: 'Subject not found' });
        }

        await subjectModel.deleteOne({ _id: req.params.id });
        res.json({ success: true, message: 'Subject deleted successfully' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// Initialize default subjects for 10th class
export const initializeSubjects = async (req, res) => {
    try {
        const defaultSubjects = [
            { name: 'Telugu', totalMarks: 100, color: '#EF4444', icon: '📖', description: 'Telugu Language and Literature' },
            { name: 'Hindi', totalMarks: 100, color: '#F97316', icon: '📚', description: 'Hindi Language and Literature' },
            { name: 'English', totalMarks: 100, color: '#3B82F6', icon: '📝', description: 'English Language and Literature' },
            { name: 'Maths', totalMarks: 100, color: '#8B5CF6', icon: '🔢', description: 'Mathematics' },
            { name: 'Social Studies', totalMarks: 100, color: '#10B981', icon: '🌍', description: 'History, Geography, Civics, Economics' },
            { name: 'Biology', totalMarks: 50, color: '#8B5CF6', icon: '🧬', description: 'Life Sciences and Biology' },
            { name: 'Physical Science', totalMarks: 50, color: '#06B6D4', icon: '⚗️', description: 'Physics and Chemistry' }
        ];

        const createdSubjects = [];
        
        for (const subjectData of defaultSubjects) {
            const existingSubject = await subjectModel.findOne({ name: subjectData.name });
            if (!existingSubject) {
                const subject = await subjectModel.create(subjectData);
                createdSubjects.push(subject);
            } else {
                createdSubjects.push(existingSubject);
            }
        }

        res.json({ 
            success: true, 
            message: 'Subjects initialized successfully',
            data: createdSubjects
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
