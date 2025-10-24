import mongoose from 'mongoose';

const streakSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'user', required: true },
    currentStreak: { type: Number, default: 0 },
    longestStreak: { type: Number, default: 0 },
    lastStudyDate: { type: Date, default: null },
    streakStartDate: { type: Date, default: null },
    totalStudyDays: { type: Number, default: 0 },
    studyCalendar: [{
        date: { type: Date, required: true },
        subjectsStudied: [{ type: mongoose.Schema.Types.ObjectId, ref: 'subject' }],
        lessonsStudied: [{ type: mongoose.Schema.Types.ObjectId, ref: 'lesson' }],
        totalTime: { type: Number, default: 0 },
        confidence: { type: Number, default: 0 }
    }],
    achievements: [{
        type: { type: String, required: true }, // 'streak_7', 'streak_30', 'subject_master', etc.
        earnedAt: { type: Date, default: Date.now },
        description: String
    }]
}, { timestamps: true });

// Index for efficient queries
streakSchema.index({ user: 1 });
streakSchema.index({ 'studyCalendar.date': 1 });

const streakModel = mongoose.models.streak || mongoose.model('streak', streakSchema);
export default streakModel;
