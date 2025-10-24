import mongoose from 'mongoose';

const progressSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'user', required: true },
    subject: { type: mongoose.Schema.Types.ObjectId, ref: 'subject', required: true },
    lesson: { type: mongoose.Schema.Types.ObjectId, ref: 'lesson', required: true },
    firstStudied: { type: Date, default: Date.now },
    lastStudied: { type: Date, default: Date.now },
    studyCount: { type: Number, default: 1 },
    masteryLevel: { type: Number, default: 1, min: 1, max: 5 }, // 1=New, 2=Learning, 3=Good, 4=Great, 5=Mastered
    confidence: { type: Number, default: 3, min: 1, max: 5 },
    totalTimeSpent: { type: Number, default: 0 }, // in minutes
    revisionHistory: [{
        date: { type: Date, required: true },
        confidence: { type: Number, required: true },
        timeSpent: { type: Number, default: 0 },
        notes: String
    }],
    nextReviewDate: { type: Date, default: null }, // Spaced repetition
    difficulty: { type: Number, default: 2.5, min: 1, max: 5 }, // For spaced repetition algorithm
    interval: { type: Number, default: 1 }, // Days until next review
    repetitions: { type: Number, default: 0 },
    easeFactor: { type: Number, default: 2.5 }
}, { timestamps: true });

// Indexes for efficient queries
progressSchema.index({ user: 1, subject: 1 });
progressSchema.index({ user: 1, lesson: 1 });
progressSchema.index({ nextReviewDate: 1 });
progressSchema.index({ masteryLevel: 1 });

const progressModel = mongoose.models.progress || mongoose.model('progress', progressSchema);
export default progressModel;