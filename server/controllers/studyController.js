import mongoose from 'mongoose';
import studyEntryModel from '../models/studyEntryModel.js';
import subjectModel from '../models/subjectModel.js';
import lessonModel from '../models/lessonModel.js';
import progressModel from '../models/progressModel.js';

// Create a new study entry (simplified form)
export const createStudyEntry = async (req, res) => {
    try {
        const { 
            subject, 
            lesson, 
            reading, 
            grammar, 
            writing, 
            mathPractice, 
            sciencePractice, 
            socialPractice,
            confidence,
            totalTime 
        } = req.body;
        
        if (!subject) {
            return res.status(400).json({ 
                success: false, 
                message: 'Subject is required' 
            });
        }

        // Check if there's already an entry for this subject today
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const existingEntry = await studyEntryModel.findOne({
            student: req.user.id,
            subject: subject,
            date: { $gte: today, $lt: tomorrow }
        });

        let studyEntry;
        if (existingEntry) {
            // Update existing entry
            if (reading) existingEntry.reading = { ...existingEntry.reading, ...reading };
            if (grammar) existingEntry.grammar = { ...existingEntry.grammar, ...grammar };
            if (writing) existingEntry.writing = { ...existingEntry.writing, ...writing };
            if (mathPractice) existingEntry.mathPractice = { ...existingEntry.mathPractice, ...mathPractice };
            if (sciencePractice) existingEntry.sciencePractice = { ...existingEntry.sciencePractice, ...sciencePractice };
            if (socialPractice) existingEntry.socialPractice = { ...existingEntry.socialPractice, ...socialPractice };
            if (confidence) existingEntry.confidence = confidence;
            if (totalTime) existingEntry.totalTime = totalTime;
            if (lesson) existingEntry.lesson = lesson;

            await existingEntry.save();
            studyEntry = existingEntry;
        } else {
            // Create new entry
            studyEntry = await studyEntryModel.create({
                student: req.user.id,
                subject,
                lesson: lesson || null,
                reading: reading || { completed: false },
                grammar: grammar || { completed: false },
                writing: writing || { completed: false },
                mathPractice: mathPractice || { completed: false },
                sciencePractice: sciencePractice || { completed: false },
                socialPractice: socialPractice || { completed: false },
                confidence: confidence || 3,
                totalTime: totalTime || 0
            });
        }

        // Update daily progress
        await updateDailyProgress(req.user.id, subject, studyEntry);

        // Update streak data
        try {
            const { updateStreak } = await import('./streakController.js');
            await updateStreak({ 
                user: { id: req.user.id }, 
                body: { 
                    studyEntry: {
                        subject: studyEntry.subject,
                        lesson: studyEntry.lesson,
                        confidence: studyEntry.confidence,
                        totalTime: studyEntry.totalTime
                    }
                } 
            }, { json: () => {} });
        } catch (error) {
            console.error('Failed to update streak:', error);
        }

        const populatedEntry = await studyEntryModel
            .findById(studyEntry._id)
            .populate('subject', 'name totalMarks color icon')
            .populate('lesson', 'name chapterNumber');

        res.status(201).json({ success: true, data: populatedEntry });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// Get study entries for a student
export const getStudyEntries = async (req, res) => {
    try {
        const { subject, lesson, date } = req.query;
        const query = { student: req.user.id };
        
        console.log('Getting study entries for student:', req.user.id, 'query:', req.query);

        if (subject) query.subject = subject;
        if (lesson) query.lesson = lesson;
        if (date) {
            const startDate = new Date(date);
            const endDate = new Date(date);
            endDate.setDate(endDate.getDate() + 1);
            query.createdAt = { $gte: startDate, $lt: endDate };
        }
        
        const entries = await studyEntryModel
            .find(query)
            .populate('subject', 'name totalMarks color icon')
            .populate('lesson', 'name chapterNumber')
            .sort({ createdAt: -1 });

        console.log('Found', entries.length, 'study entries');

        res.json({ 
            success: true, 
            data: entries
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// Get study entry by ID
export const getStudyEntry = async (req, res) => {
    try {
        const entry = await studyEntryModel
            .findById(req.params.id)
            .populate('subject', 'name totalMarks color icon');
        
        if (!entry) {
            return res.status(404).json({ success: false, message: 'Study entry not found' });
        }
        
        if (entry.student.toString() !== req.user.id) {
            return res.status(403).json({ success: false, message: 'Access denied' });
        }

        res.json({ success: true, data: entry });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// Update study entry
export const updateStudyEntry = async (req, res) => {
    try {
        const { workType, topic, description, duration, difficulty, confidence, notes, attachments } = req.body;
        
        const entry = await studyEntryModel.findById(req.params.id);
        if (!entry) {
            return res.status(404).json({ success: false, message: 'Study entry not found' });
        }
        
        if (entry.student.toString() !== req.user.id) {
            return res.status(403).json({ success: false, message: 'Access denied' });
        }

        // Update fields
        if (workType) entry.workType = workType;
        if (topic) entry.topic = topic;
        if (description) entry.description = description;
        if (duration) entry.duration = parseInt(duration);
        if (difficulty) entry.difficulty = difficulty;
        if (confidence) entry.confidence = parseInt(confidence);
        if (notes !== undefined) entry.notes = notes;
        if (attachments) entry.attachments = attachments;

        await entry.save();

        // Update daily progress
        await updateDailyProgress(req.user.id, entry.subject, entry);

        res.json({ success: true, data: entry });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// Delete study entry
export const deleteStudyEntry = async (req, res) => {
    try {
        const entry = await studyEntryModel.findById(req.params.id);
        if (!entry) {
            return res.status(404).json({ success: false, message: 'Study entry not found' });
        }
        
        if (entry.student.toString() !== req.user.id) {
            return res.status(403).json({ success: false, message: 'Access denied' });
        }

        await studyEntryModel.deleteOne({ _id: req.params.id });

        // Update daily progress
        await updateDailyProgress(req.user.id, entry.subject);

        res.json({ success: true, message: 'Study entry deleted successfully' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// Get study statistics
export const getStudyStats = async (req, res) => {
    try {
        const { period = 'week' } = req.query; // week, month, year
        const studentId = req.user.id;
        
        console.log('Getting study stats for student:', studentId, 'period:', period);
        console.log('Student ID type:', typeof studentId);
        console.log('Student ID value:', studentId);
        console.log('Converted to ObjectId:', new mongoose.Types.ObjectId(studentId));

        // For now, let's get all data regardless of period to debug
        const allEntries = await studyEntryModel.find({ student: studentId });
        console.log('All study entries found:', allEntries.length);
        if (allEntries.length > 0) {
            console.log('Sample entry:', allEntries[0]);
        }

        let startDate;
        const endDate = new Date();

        switch (period) {
            case 'week':
                startDate = new Date();
                startDate.setDate(startDate.getDate() - 7);
                break;
            case 'month':
                startDate = new Date();
                startDate.setMonth(startDate.getMonth() - 1);
                break;
            case 'year':
                startDate = new Date();
                startDate.setFullYear(startDate.getFullYear() - 1);
                break;
            default:
                startDate = new Date();
                startDate.setDate(startDate.getDate() - 7);
        }

        // Get total study time - simplified to get all data first
        const totalStudyTime = await studyEntryModel.aggregate([
            {
                $match: {
                    student: new mongoose.Types.ObjectId(studentId)
                }
            },
            {
                $group: {
                    _id: null,
                    totalTime: { $sum: '$totalTime' },
                    totalEntries: { $sum: 1 },
                    avgConfidence: { $avg: '$confidence' }
                }
            }
        ]);

        console.log('Total study time aggregation result:', totalStudyTime);

        // Get study time by subject - simplified
        const studyBySubject = await studyEntryModel.aggregate([
            {
                $match: {
                    student: new mongoose.Types.ObjectId(studentId)
                }
            },
            {
                $group: {
                    _id: '$subject',
                    totalTime: { $sum: '$totalTime' },
                    entriesCount: { $sum: 1 },
                    avgConfidence: { $avg: '$confidence' }
                }
            },
            {
                $lookup: {
                    from: 'subjects',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'subject'
                }
            },
            {
                $unwind: '$subject'
            }
        ]);

        console.log('Study by subject aggregation result:', studyBySubject);

        // Get study time by activity type (reading, grammar, writing, etc.) - simplified
        const studyByWorkType = await studyEntryModel.aggregate([
            {
                $match: {
                    student: new mongoose.Types.ObjectId(studentId)
                }
            },
            {
                $project: {
                    totalTime: 1,
                    activities: {
                        $concatArrays: [
                            { $cond: [{ $eq: ['$reading.completed', true] }, ['Reading'], []] },
                            { $cond: [{ $eq: ['$grammar.completed', true] }, ['Grammar'], []] },
                            { $cond: [{ $eq: ['$writing.completed', true] }, ['Writing'], []] },
                            { $cond: [{ $eq: ['$mathPractice.completed', true] }, ['Math Practice'], []] },
                            { $cond: [{ $eq: ['$sciencePractice.completed', true] }, ['Science Practice'], []] },
                            { $cond: [{ $eq: ['$socialPractice.completed', true] }, ['Social Practice'], []] }
                        ]
                    }
                }
            },
            {
                $unwind: '$activities'
            },
            {
                $group: {
                    _id: '$activities',
                    totalTime: { $sum: '$totalTime' },
                    entriesCount: { $sum: 1 }
                }
            }
        ]);

        console.log('Study by work type aggregation result:', studyByWorkType);

        res.json({
            success: true,
            data: {
                period,
                totalStudyTime: totalStudyTime[0]?.totalTime || 0,
                totalEntries: totalStudyTime[0]?.totalEntries || 0,
                averageConfidence: totalStudyTime[0]?.avgConfidence || 0,
                studyBySubject,
                studyByWorkType
            }
        });
        
        console.log('Stats response:', {
            period,
            totalStudyTime: totalStudyTime[0]?.totalTime || 0,
            totalEntries: totalStudyTime[0]?.totalEntries || 0,
            averageConfidence: totalStudyTime[0]?.avgConfidence || 0,
            studyBySubjectCount: studyBySubject.length,
            studyByWorkTypeCount: studyByWorkType.length
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// Helper function to update daily progress
const updateDailyProgress = async (studentId, subjectId, entry = null) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        let progress = await progressModel.findOne({
            student: studentId,
            subject: subjectId,
            date: today
        });

        if (!progress) {
            progress = new progressModel({
                student: studentId,
                subject: subjectId,
                date: today
            });
        }

        // Recalculate daily stats
        const dailyEntries = await studyEntryModel.find({
            student: studentId,
            subject: subjectId,
            date: { $gte: today, $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000) }
        });

        progress.totalStudyTime = dailyEntries.reduce((sum, e) => sum + e.duration, 0);
        progress.entriesCount = dailyEntries.length;
        progress.averageConfidence = dailyEntries.length > 0 
            ? dailyEntries.reduce((sum, e) => sum + e.confidence, 0) / dailyEntries.length 
            : 0;
        progress.topicsCovered = [...new Set(dailyEntries.map(e => e.topic))];
        progress.workTypes = [...new Set(dailyEntries.map(e => e.workType))];
        progress.goalAchieved = progress.totalStudyTime >= progress.dailyGoal;

        await progress.save();
    } catch (err) {
        console.error('Error updating daily progress:', err);
    }
};

// Get study statistics for admin (specific student)
export const getStudyStatsForAdmin = async (req, res) => {
    try {
        const { studentId } = req.query;
        const studentIdToUse = studentId || req.user.id;
        
        console.log('Getting study stats for student:', studentIdToUse);

        // Get total study time
        const totalStudyTime = await studyEntryModel.aggregate([
            { $match: { student: new mongoose.Types.ObjectId(studentIdToUse) } },
            { $group: { _id: null, totalTime: { $sum: '$totalTime' } } }
        ]);

        // Get total entries
        const totalEntries = await studyEntryModel.countDocuments({ 
            student: new mongoose.Types.ObjectId(studentIdToUse) 
        });

        // Get average confidence
        const avgConfidence = await studyEntryModel.aggregate([
            { $match: { student: new mongoose.Types.ObjectId(studentIdToUse) } },
            { $group: { _id: null, avgConfidence: { $avg: '$confidence' } } }
        ]);

        // Get subject-wise breakdown
        const subjectBreakdown = await studyEntryModel.aggregate([
            { $match: { student: new mongoose.Types.ObjectId(studentIdToUse) } },
            {
                $group: {
                    _id: '$subject',
                    totalTime: { $sum: '$totalTime' },
                    entryCount: { $sum: 1 },
                    avgConfidence: { $avg: '$confidence' }
                }
            },
            {
                $lookup: {
                    from: 'subjects',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'subjectDetails'
                }
            },
            { $unwind: '$subjectDetails' },
            {
                $project: {
                    _id: 0,
                    subject: '$subjectDetails.name',
                    icon: '$subjectDetails.icon',
                    totalTime: 1,
                    entryCount: 1,
                    avgConfidence: 1
                }
            }
        ]);

        res.json({
            success: true,
            data: {
                totalStudyTime: totalStudyTime[0]?.totalTime || 0,
                totalEntries,
                averageConfidence: avgConfidence[0]?.avgConfidence || 0,
                subjectBreakdown
            }
        });
    } catch (error) {
        console.error('Get study stats error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};
