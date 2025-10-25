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
        const { name, totalMarks, color, icon, description, type } = req.body;
        
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
            description: description || '',
            type: type || 'general'
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
        const { name, totalMarks, color, icon, description, type } = req.body;
        
        const subject = await subjectModel.findById(req.params.id);
        if (!subject) {
            return res.status(404).json({ success: false, message: 'Subject not found' });
        }

        if (name) subject.name = name;
        if (totalMarks) subject.totalMarks = parseInt(totalMarks);
        if (color) subject.color = color;
        if (icon) subject.icon = icon;
        if (description !== undefined) subject.description = description;
        if (type) subject.type = type;

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

// Initialize subjects - now completely dynamic
export const initializeSubjects = async (req, res) => {
    try {
        // Check if any subjects exist
        const existingSubjects = await subjectModel.find();
        
        if (existingSubjects.length > 0) {
            return res.json({ 
                success: true, 
                message: 'Subjects already exist',
                data: existingSubjects 
            });
        }

        // If no subjects exist, return empty array
        // Admin will need to create subjects manually
        res.json({ 
            success: true, 
            message: 'No subjects found. Please create subjects using the admin panel.',
            data: [] 
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
