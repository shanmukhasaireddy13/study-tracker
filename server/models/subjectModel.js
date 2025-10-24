import mongoose from 'mongoose';

const subjectSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true },
    totalMarks: { type: Number, required: true },
    color: { type: String, default: '#3B82F6' }, // Default blue color for UI
    icon: { type: String, default: '📚' }, // Default book emoji
    description: { type: String, default: '' }
}, { timestamps: true });

const subjectModel = mongoose.models.subject || mongoose.model('subject', subjectSchema);
export default subjectModel;
