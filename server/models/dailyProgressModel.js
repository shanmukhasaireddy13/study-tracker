import mongoose from 'mongoose';

// Daily per-student, per-subject progress snapshot used by studyController.updateDailyProgress
const dailyProgressSchema = new mongoose.Schema({
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'user', required: true },
    subject: { type: mongoose.Schema.Types.ObjectId, ref: 'subject', required: true },
    date: { type: Date, required: true },

    // Aggregated metrics for the day
    totalStudyTime: { type: Number, default: 0 },
    entriesCount: { type: Number, default: 0 },
    averageConfidence: { type: Number, default: 0 },
    topicsCovered: [{ type: String }],
    workTypes: [{ type: String }],

    // Simple goal tracking (optional)
    dailyGoal: { type: Number, default: 60 }, // minutes
    goalAchieved: { type: Boolean, default: false }
}, { timestamps: true, strict: true });

dailyProgressSchema.index({ student: 1, subject: 1, date: 1 }, { unique: true });

const dailyProgressModel = mongoose.models.daily_progress || mongoose.model('daily_progress', dailyProgressSchema);
export default dailyProgressModel;


