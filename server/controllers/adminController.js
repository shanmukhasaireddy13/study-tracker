import studyEntryModel from '../models/studyEntryModel.js';
import streakModel from '../models/streakModel.js';
import userModel from '../models/usermodel.js';
import subjectModel from '../models/subjectModel.js';
import lessonModel from '../models/lessonModel.js';
import progressModel from '../models/progressModel.js';
import mongoose from 'mongoose';

// Get comprehensive student performance data
export const getAllStudentPerformance = async (req, res) => {
    try {
        // Get all students (non-admin users)
        const students = await userModel.find({ 
            email: { $ne: 'admin@tracker.com' } 
        }).select('name email createdAt lastLogin');

        // Get performance data for each student
        const studentPerformance = await Promise.all(students.map(async (student) => {
            // Get study entries for this student
            const studyEntries = await studyEntryModel.find({ 
                student: student._id 
            }).populate('subject lesson').sort({ createdAt: -1 });

            // Get streak data
            const streakData = await streakModel.findOne({ user: student._id });

            // Get progress data
            const progressData = await progressModel.find({ 
                user: student._id 
            }).populate('subject lesson');

            // Calculate statistics
            const totalStudyTime = studyEntries.reduce((sum, entry) => sum + (entry.totalTime || 0), 0);
            const totalEntries = studyEntries.length;
            const averageConfidence = studyEntries.length > 0 
                ? studyEntries.reduce((sum, entry) => sum + (entry.confidence || 0), 0) / studyEntries.length 
                : 0;

            // Get recent activity (last 7 days)
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
            const recentEntries = studyEntries.filter(entry => 
                new Date(entry.createdAt) >= sevenDaysAgo
            );

            // Get subject-wise performance
            const subjectPerformance = {};
            studyEntries.forEach(entry => {
                if (entry.subject) {
                    const subjectId = entry.subject._id.toString();
                    if (!subjectPerformance[subjectId]) {
                        subjectPerformance[subjectId] = {
                            subject: entry.subject,
                            totalTime: 0,
                            entries: 0,
                            averageConfidence: 0,
                            lastStudied: null
                        };
                    }
                    subjectPerformance[subjectId].totalTime += entry.totalTime || 0;
                    subjectPerformance[subjectId].entries += 1;
                    subjectPerformance[subjectId].lastStudied = entry.createdAt;
                }
            });

            // Calculate average confidence per subject
            Object.keys(subjectPerformance).forEach(subjectId => {
                const subjectEntries = studyEntries.filter(entry => 
                    entry.subject && entry.subject._id.toString() === subjectId
                );
                if (subjectEntries.length > 0) {
                    subjectPerformance[subjectId].averageConfidence = 
                        subjectEntries.reduce((sum, entry) => sum + (entry.confidence || 0), 0) / subjectEntries.length;
                }
            });

            return {
                student: {
                    id: student._id,
                    name: student.name,
                    email: student.email,
                    joinedDate: student.createdAt,
                    lastLogin: student.lastLogin
                },
                performance: {
                    totalStudyTime,
                    totalEntries,
                    averageConfidence: Math.round(averageConfidence * 10) / 10,
                    currentStreak: streakData?.currentStreak || 0,
                    longestStreak: streakData?.longestStreak || 0,
                    totalStudyDays: streakData?.totalStudyDays || 0,
                    recentActivity: recentEntries.length,
                    lastStudyDate: studyEntries.length > 0 ? studyEntries[0].createdAt : null
                },
                subjectPerformance: Object.values(subjectPerformance),
                recentEntries: recentEntries.slice(0, 5),
                progressData: progressData.length
            };
        }));

        // Sort by total study time (most active first)
        studentPerformance.sort((a, b) => b.performance.totalStudyTime - a.performance.totalStudyTime);

        res.json({
            success: true,
            data: {
                students: studentPerformance,
                summary: {
                    totalStudents: students.length,
                    totalStudyTime: studentPerformance.reduce((sum, student) => sum + student.performance.totalStudyTime, 0),
                    totalEntries: studentPerformance.reduce((sum, student) => sum + student.performance.totalEntries, 0),
                    averageConfidence: studentPerformance.length > 0 
                        ? studentPerformance.reduce((sum, student) => sum + student.performance.averageConfidence, 0) / studentPerformance.length 
                        : 0
                }
            }
        });
    } catch (error) {
        console.error('Error fetching student performance:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get detailed performance for a specific student
export const getStudentDetailedPerformance = async (req, res) => {
    try {
        const { studentId } = req.params;

        // Get student info
        const student = await userModel.findById(studentId).select('name email createdAt lastLogin');
        if (!student) {
            return res.status(404).json({ success: false, message: 'Student not found' });
        }

        // Get all study entries
        const studyEntries = await studyEntryModel.find({ 
            student: studentId 
        }).populate('subject lesson').sort({ createdAt: -1 });

        // Get streak data
        const streakData = await streakModel.findOne({ user: studentId });

        // Get progress data
        const progressData = await progressModel.find({ 
            user: studentId 
        }).populate('subject lesson');

        // Get all subjects for reference
        const subjects = await subjectModel.find();

        // Calculate daily activity for the last 30 days
        const dailyActivity = {};
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        studyEntries.forEach(entry => {
            const date = new Date(entry.createdAt).toISOString().split('T')[0];
            if (!dailyActivity[date]) {
                dailyActivity[date] = {
                    date,
                    totalTime: 0,
                    entries: 0,
                    subjects: new Set()
                };
            }
            dailyActivity[date].totalTime += entry.totalTime || 0;
            dailyActivity[date].entries += 1;
            if (entry.subject) {
                dailyActivity[date].subjects.add(entry.subject.name);
            }
        });

        // Convert to array and sort by date
        const dailyActivityArray = Object.values(dailyActivity).map(day => ({
            ...day,
            subjects: Array.from(day.subjects)
        })).sort((a, b) => new Date(b.date) - new Date(a.date));

        // Calculate subject-wise detailed performance
        const subjectDetails = {};
        subjects.forEach(subject => {
            const subjectEntries = studyEntries.filter(entry => 
                entry.subject && entry.subject._id.toString() === subject._id.toString()
            );
            
            const totalTime = subjectEntries.reduce((sum, entry) => sum + (entry.totalTime || 0), 0);
            const averageConfidence = subjectEntries.length > 0 
                ? subjectEntries.reduce((sum, entry) => sum + (entry.confidence || 0), 0) / subjectEntries.length 
                : 0;

            subjectDetails[subject._id] = {
                subject,
                totalTime,
                entries: subjectEntries.length,
                averageConfidence: Math.round(averageConfidence * 10) / 10,
                lastStudied: subjectEntries.length > 0 ? subjectEntries[0].createdAt : null,
                entries: subjectEntries.slice(0, 10) // Last 10 entries for this subject
            };
        });

        res.json({
            success: true,
            data: {
                student,
                performance: {
                    totalStudyTime: studyEntries.reduce((sum, entry) => sum + (entry.totalTime || 0), 0),
                    totalEntries: studyEntries.length,
                    averageConfidence: studyEntries.length > 0 
                        ? Math.round(studyEntries.reduce((sum, entry) => sum + (entry.confidence || 0), 0) / studyEntries.length * 10) / 10 
                        : 0,
                    currentStreak: streakData?.currentStreak || 0,
                    longestStreak: streakData?.longestStreak || 0,
                    totalStudyDays: streakData?.totalStudyDays || 0
                },
                dailyActivity: dailyActivityArray,
                subjectDetails: Object.values(subjectDetails),
                recentEntries: studyEntries.slice(0, 20),
                progressData: progressData.length
            }
        });
    } catch (error) {
        console.error('Error fetching detailed student performance:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get system-wide analytics
export const getSystemAnalytics = async (req, res) => {
    try {
        // Get total students
        const totalStudents = await userModel.countDocuments({ 
            email: { $ne: 'admin@tracker.com' } 
        });

        // Get total study entries
        const totalEntries = await studyEntryModel.countDocuments();

        // Get total study time
        const totalStudyTimeResult = await studyEntryModel.aggregate([
            { $group: { _id: null, totalTime: { $sum: '$totalTime' } } }
        ]);
        const totalStudyTime = totalStudyTimeResult.length > 0 ? totalStudyTimeResult[0].totalTime : 0;

        // Get average confidence
        const avgConfidenceResult = await studyEntryModel.aggregate([
            { $group: { _id: null, avgConfidence: { $avg: '$confidence' } } }
        ]);
        const averageConfidence = avgConfidenceResult.length > 0 ? avgConfidenceResult[0].avgConfidence : 0;

        // Get most active students (last 7 days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        
        const activeStudents = await studyEntryModel.aggregate([
            { $match: { createdAt: { $gte: sevenDaysAgo } } },
            { $group: { 
                _id: '$student', 
                totalTime: { $sum: '$totalTime' },
                entries: { $sum: 1 }
            }},
            { $lookup: {
                from: 'users',
                localField: '_id',
                foreignField: '_id',
                as: 'student'
            }},
            { $unwind: '$student' },
            { $project: {
                studentName: '$student.name',
                studentEmail: '$student.email',
                totalTime: 1,
                entries: 1
            }},
            { $sort: { totalTime: -1 } },
            { $limit: 10 }
        ]);

        // Get subject popularity
        const subjectPopularity = await studyEntryModel.aggregate([
            { $group: { 
                _id: '$subject', 
                totalTime: { $sum: '$totalTime' },
                entries: { $sum: 1 }
            }},
            { $lookup: {
                from: 'subjects',
                localField: '_id',
                foreignField: '_id',
                as: 'subject'
            }},
            { $unwind: '$subject' },
            { $project: {
                subjectName: '$subject.name',
                subjectIcon: '$subject.icon',
                totalTime: 1,
                entries: 1
            }},
            { $sort: { totalTime: -1 } }
        ]);

        res.json({
            success: true,
            data: {
                overview: {
                    totalStudents,
                    totalEntries,
                    totalStudyTime,
                    averageConfidence: Math.round(averageConfidence * 10) / 10
                },
                activeStudents,
                subjectPopularity
            }
        });
    } catch (error) {
        console.error('Error fetching system analytics:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};
