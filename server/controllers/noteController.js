import noteModel from '../models/noteModel.js';

export const createNote = async (req, res) => {
    try {
        const { content } = req.body;
        if (!content) return res.status(400).json({ success: false, message: 'Content required' });
        const note = await noteModel.create({ content, owner: req.user.id });
        res.status(201).json({ success: true, data: note });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
}

export const listNotes = async (req, res) => {
    try {
        const notes = await noteModel.find({ owner: req.user.id }).sort({ createdAt: -1 });
        res.json({ success: true, data: notes });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
}

export const getNote = async (req, res) => {
    try {
        const note = await noteModel.findById(req.params.id);
        if (!note) return res.status(404).json({ success: false, message: 'Not found' });
        if (note.owner.toString() !== req.user.id) return res.status(403).json({ success: false, message: 'Forbidden' });
        res.json({ success: true, data: note });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
}

export const updateNote = async (req, res) => {
    try {
        const note = await noteModel.findById(req.params.id);
        if (!note) return res.status(404).json({ success: false, message: 'Not found' });
        if (note.owner.toString() !== req.user.id) return res.status(403).json({ success: false, message: 'Forbidden' });
        const { content } = req.body;
        if (content !== undefined) note.content = content;
        await note.save();
        res.json({ success: true, data: note });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
}

export const deleteNote = async (req, res) => {
    try {
        const note = await noteModel.findById(req.params.id);
        if (!note) return res.status(404).json({ success: false, message: 'Not found' });
        if (note.owner.toString() !== req.user.id) return res.status(403).json({ success: false, message: 'Forbidden' });
        await note.deleteOne();
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
}




