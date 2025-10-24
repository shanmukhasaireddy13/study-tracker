import mongoose from 'mongoose';

const lessonSchema = new mongoose.Schema({
    subject: { type: mongoose.Schema.Types.ObjectId, ref: 'subject', required: true },
    name: { type: String, required: true },
    chapterNumber: { type: Number },
    description: { type: String },
    isActive: { type: Boolean, default: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'user', required: true }
}, { timestamps: true });

// Index for efficient queries
lessonSchema.index({ subject: 1, chapterNumber: 1 });
lessonSchema.index({ subject: 1, isActive: 1 });

const lessonModel = mongoose.models.lesson || mongoose.model('lesson', lessonSchema);
export default lessonModel;
