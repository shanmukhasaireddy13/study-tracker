import streakModel from '../models/streakModel.js';
import progressModel from '../models/progressModel.js';
import studyEntryModel from '../models/studyEntryModel.js';
import subjectModel from '../models/subjectModel.js';
import lessonModel from '../models/lessonModel.js';
import { getIndianTime, getIndianDateString, getIndianDateStartOfDay, formatIndianDateTime } from '../utils/timezone.js';

// Get user's streak data
export const getStreakData = async (req, res) => {
    try {
        const userId = req.user.id;
        
        let streak = await streakModel.findOne({ user: userId });
        
        if (!streak) {
            // Create new streak record
            streak = await streakModel.create({
                user: userId,
                currentStreak: 0,
                longestStreak: 0,
                lastStudyDate: null,
                streakStartDate: null,
                totalStudyDays: 0,
                studyCalendar: [],
                achievements: []
            });
        }

        // Always recalculate streak to ensure it's up to date
        await calculateStreak(userId);

        // Get updated streak data
        const updatedStreak = await streakModel.findOne({ user: userId });
        
        res.json({ success: true, data: updatedStreak });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Refresh streak data (manual trigger)
export const refreshStreak = async (req, res) => {
    try {
        const userId = req.user.id;
        
        console.log(`Manual streak refresh requested for user: ${userId}`);
        
        // Recalculate streak
        await calculateStreak(userId);
        
        // Get updated streak data
        const updatedStreak = await streakModel.findOne({ user: userId });
        
        console.log(`Refreshed streak data:`, updatedStreak);
        
        res.json({ success: true, data: updatedStreak, message: 'Streak refreshed successfully' });
    } catch (error) {
        console.error('Refresh streak error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Update streak when study entry is created
export const updateStreak = async (req, res) => {
    try {
        const userId = req.user.id;
        const { studyEntry } = req.body;

        // Check if streak needs to be updated for today (Indian time)
        const todayIST = getIndianDateStartOfDay();
        const dateStr = getIndianDateString();
        
        const streak = await streakModel.findOne({ user: userId });
        if (!streak) {
            await calculateStreak(userId);
        } else {
            // Check if we already have a calendar entry for today
            const existingCalendarEntry = streak.studyCalendar.find(entry => 
                getIndianDateString(entry.date) === dateStr
            );
            
            // Only recalculate streak if this is the first entry for today
            if (!existingCalendarEntry) {
                await calculateStreak(userId);
            }
        }

        await updateStudyCalendar(userId, studyEntry);
        await updateProgress(userId, studyEntry);
        await checkAchievements(userId);

        res.json({ success: true, message: 'Streak updated successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get revision recommendations
export const getRevisionPlan = async (req, res) => {
    try {
        const userId = req.user.id;
        const today = new Date();
        
        // Get all progress records that need review
        const dueForReview = await progressModel.find({
            user: userId,
            nextReviewDate: { $lte: today }
        }).populate('subject lesson').sort({ nextReviewDate: 1 });

        // Get subjects not studied recently (more than 3 days)
        const threeDaysAgo = new Date(today.getTime() - 3 * 24 * 60 * 60 * 1000);
        const staleSubjects = await progressModel.find({
            user: userId,
            lastStudied: { $lt: threeDaysAgo }
        }).populate('subject').distinct('subject');

        // Get weak areas (low mastery level)
        const weakAreas = await progressModel.find({
            user: userId,
            masteryLevel: { $lt: 3 }
        }).populate('subject lesson').sort({ masteryLevel: 1, lastStudied: 1 });

        // Get all subjects for overview
        const allSubjects = await subjectModel.find().sort({ name: 1 });
        const subjectProgress = await Promise.all(allSubjects.map(async (subject) => {
            const progress = await progressModel.find({ user: userId, subject: subject._id });
            const lastStudied = progress.length > 0 ? 
                Math.max(...progress.map(p => new Date(p.lastStudied).getTime())) : null;
            
            return {
                subject,
                lastStudied: lastStudied ? new Date(lastStudied) : null,
                daysSinceLastStudy: lastStudied ? 
                    Math.floor((today.getTime() - lastStudied) / (1000 * 60 * 60 * 24)) : null,
                totalLessons: progress.length,
                masteredLessons: progress.filter(p => p.masteryLevel >= 4).length,
                averageConfidence: progress.length > 0 ? 
                    progress.reduce((sum, p) => sum + p.confidence, 0) / progress.length : 0
            };
        }));

        res.json({
            success: true,
            data: {
                dueForReview: dueForReview.slice(0, 10), // Top 10 most urgent
                staleSubjects: staleSubjects.slice(0, 5), // Top 5 stale subjects
                weakAreas: weakAreas.slice(0, 10), // Top 10 weak areas
                subjectProgress,
                recommendations: generateRecommendations(dueForReview, staleSubjects, weakAreas)
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Calculate current streak
export const calculateStreak = async (userId) => {
    const nowIST = getIndianTime();
    const todayIST = getIndianDateStartOfDay();
    
    // Consider it "early in the day" if it's before 6 PM IST
    const isEarlyInDay = nowIST.getHours() < 18;
    
    let streak = await streakModel.findOne({ user: userId });
    if (!streak) {
        // Create new streak record if none exists
        streak = await streakModel.create({
            user: userId,
            currentStreak: 0,
            longestStreak: 0,
            lastStudyDate: null,
            streakStartDate: null,
            totalStudyDays: 0,
            studyCalendar: [],
            achievements: []
        });
    }

    // Get study entries for the last 30 days
    const thirtyDaysAgo = new Date(todayIST.getTime() - 30 * 24 * 60 * 60 * 1000);
    const studyEntries = await studyEntryModel.find({
        student: userId,
        createdAt: { $gte: thirtyDaysAgo }
    }).sort({ createdAt: -1 });

    // Group by date (Indian time)
    const studyByDate = {};
    studyEntries.forEach(entry => {
        const dateIST = getIndianDateStartOfDay(entry.createdAt);
        const dateStr = getIndianDateString(dateIST);
        
        if (!studyByDate[dateStr]) {
            studyByDate[dateStr] = [];
        }
        studyByDate[dateStr].push(entry);
    });

    // Calculate current streak - FIXED LOGIC
    let currentStreak = 0;
    let checkDate = new Date(todayIST);
    
    const todayStr = getIndianDateString(todayIST);
    const yesterday = new Date(todayIST);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = getIndianDateString(yesterday);
    
    // Check if there's a study entry today
    if (studyByDate[todayStr]) {
        // Start counting from today
        checkDate = new Date(todayIST);
    } 
    // If no entry today, check yesterday
    else if (studyByDate[yesterdayStr]) {
        // Start counting from yesterday
        checkDate = new Date(yesterday);
    }
    // If no entry today or yesterday, check for gaps
    else {
        // Find the most recent study entry
        const recentDates = Object.keys(studyByDate).sort().reverse();
        if (recentDates.length > 0) {
            const lastStudyDate = new Date(recentDates[0]);
            const daysSinceLastStudy = Math.floor((todayIST.getTime() - lastStudyDate.getTime()) / (1000 * 60 * 60 * 24));
            
            // If more than 1 day gap, reset streak to 0
            if (daysSinceLastStudy > 1) {
                currentStreak = 0;
            } else {
                // Only 1 day gap, continue from last study date
                checkDate = lastStudyDate;
            }
        } else {
            // No study entries at all
            currentStreak = 0;
        }
    }
    
    // Count consecutive days backwards from checkDate
    if (checkDate && currentStreak === 0) {
        while (true) {
            const dateStr = getIndianDateString(checkDate);
            
            if (studyByDate[dateStr]) {
                // There's a study entry on this date
                currentStreak++;
                checkDate.setDate(checkDate.getDate() - 1);
            } else {
                // No study entry on this date - streak ends here
                break;
            }
        }
    }

    // Update streak record
    const longestStreak = Math.max(streak.longestStreak, currentStreak);
    
    await streakModel.findByIdAndUpdate(streak._id, {
        currentStreak,
        longestStreak,
        lastStudyDate: studyEntries.length > 0 ? studyEntries[0].createdAt : null,
        totalStudyDays: Object.keys(studyByDate).length
    });

    // Rebuild study calendar to ensure it's accurate
    await rebuildStudyCalendar(userId);
};

// Update study calendar
const updateStudyCalendar = async (userId, studyEntry) => {
    const todayIST = getIndianDateStartOfDay();
    
    const streak = await streakModel.findOne({ user: userId });
    if (!streak) return;

    const dateStr = getIndianDateString(todayIST);
    
    // Check if we already have an entry for today
    const existingEntry = streak.studyCalendar.find(entry => 
        getIndianDateString(entry.date) === dateStr
    );

    if (existingEntry) {
        // Update existing entry
        if (!existingEntry.subjectsStudied.includes(studyEntry.subject)) {
            existingEntry.subjectsStudied.push(studyEntry.subject);
        }
        if (studyEntry.lesson && !existingEntry.lessonsStudied.includes(studyEntry.lesson)) {
            existingEntry.lessonsStudied.push(studyEntry.lesson);
        }
        existingEntry.totalTime += studyEntry.totalTime || 0;
        existingEntry.confidence = Math.max(existingEntry.confidence, studyEntry.confidence || 0);
    } else {
        // Create new entry
        streak.studyCalendar.push({
            date: todayIST,
            subjectsStudied: [studyEntry.subject],
            lessonsStudied: studyEntry.lesson ? [studyEntry.lesson] : [],
            totalTime: studyEntry.totalTime || 0,
            confidence: studyEntry.confidence || 0
        });
    }

    await streak.save();
};

// Rebuild study calendar from existing study entries (for fixing historical data)
export const rebuildStudyCalendar = async (userId) => {
    try {
        const streak = await streakModel.findOne({ user: userId });
        if (!streak) return;

        // Get all study entries for this user
        const studyEntries = await studyEntryModel.find({ student: userId }).sort({ createdAt: -1 });
        
        // Clear existing calendar
        streak.studyCalendar = [];
        
        // Group entries by Indian date
        const entriesByDate = {};
        studyEntries.forEach(entry => {
            const entryDateIST = getIndianDateStartOfDay(entry.createdAt);
            const dateStr = getIndianDateString(entryDateIST);
            
            if (!entriesByDate[dateStr]) {
                entriesByDate[dateStr] = [];
            }
            entriesByDate[dateStr].push(entry);
        });
        
        // Create calendar entries for each date
        Object.keys(entriesByDate).forEach(dateStr => {
            const entries = entriesByDate[dateStr];
            const firstEntry = entries[0];
            const entryDateIST = getIndianDateStartOfDay(firstEntry.createdAt);
            
            const subjectsStudied = [...new Set(entries.map(e => e.subject))];
            const lessonsStudied = [...new Set(entries.filter(e => e.lesson).map(e => e.lesson))];
            const totalTime = entries.reduce((sum, e) => sum + (e.totalTime || 0), 0);
            const maxConfidence = Math.max(...entries.map(e => e.confidence || 0));
            
            streak.studyCalendar.push({
                date: entryDateIST,
                subjectsStudied,
                lessonsStudied,
                totalTime,
                confidence: maxConfidence
            });
        });
        
        // Sort calendar by date (newest first)
        streak.studyCalendar.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        await streak.save();
        console.log(`Rebuilt study calendar for user ${userId} with ${streak.studyCalendar.length} entries`);
    } catch (error) {
        console.error('Error rebuilding study calendar:', error);
    }
};

// Update progress for subjects and lessons
const updateProgress = async (userId, studyEntry) => {
    if (!studyEntry.lesson) return;

    const existingProgress = await progressModel.findOne({
        user: userId,
        subject: studyEntry.subject,
        lesson: studyEntry.lesson
    });

    const todayIST = getIndianTime();
    const revisionEntry = {
        date: todayIST,
        confidence: studyEntry.confidence || 3,
        timeSpent: studyEntry.totalTime || 0,
        notes: studyEntry.reading?.notes || ''
    };

    if (existingProgress) {
        // Update existing progress
        existingProgress.lastStudied = today;
        existingProgress.studyCount += 1;
        existingProgress.totalTimeSpent += studyEntry.totalTime || 0;
        existingProgress.confidence = studyEntry.confidence || existingProgress.confidence;
        existingProgress.revisionHistory.push(revisionEntry);
        
        // Update mastery level based on study count and confidence
        if (existingProgress.studyCount >= 5 && existingProgress.confidence >= 4) {
            existingProgress.masteryLevel = 5; // Mastered
        } else if (existingProgress.studyCount >= 3 && existingProgress.confidence >= 3) {
            existingProgress.masteryLevel = 4; // Great
        } else if (existingProgress.studyCount >= 2) {
            existingProgress.masteryLevel = 3; // Good
        } else {
            existingProgress.masteryLevel = 2; // Learning
        }

        // Calculate next review date using spaced repetition
        existingProgress.nextReviewDate = calculateNextReviewDate(existingProgress);
        
        await existingProgress.save();
    } else {
        // Create new progress record
        await progressModel.create({
            user: userId,
            subject: studyEntry.subject,
            lesson: studyEntry.lesson,
            firstStudied: today,
            lastStudied: today,
            studyCount: 1,
            masteryLevel: 1,
            confidence: studyEntry.confidence || 3,
            totalTimeSpent: studyEntry.totalTime || 0,
            revisionHistory: [revisionEntry],
            nextReviewDate: new Date(today.getTime() + 24 * 60 * 60 * 1000) // Next day
        });
    }
};

// Calculate next review date using spaced repetition (simplified SM-2 algorithm)
const calculateNextReviewDate = (progress) => {
    const today = new Date();
    const confidence = progress.confidence;
    
    if (confidence >= 4) {
        // High confidence - increase interval
        progress.interval = Math.min(progress.interval * 2, 30); // Max 30 days
    } else if (confidence >= 3) {
        // Medium confidence - keep interval
        progress.interval = Math.max(progress.interval, 1);
    } else {
        // Low confidence - reset interval
        progress.interval = 1;
    }
    
    const nextReview = new Date(today.getTime() + progress.interval * 24 * 60 * 60 * 1000);
    return nextReview;
};

// Check and award achievements
const checkAchievements = async (userId) => {
    const streak = await streakModel.findOne({ user: userId });
    if (!streak) return;

    const achievements = [];
    
    // Streak achievements
    if (streak.currentStreak >= 7 && !streak.achievements.find(a => a.type === 'streak_7')) {
        achievements.push({
            type: 'streak_7',
            description: '7 Day Streak! 🔥'
        });
    }
    
    if (streak.currentStreak >= 30 && !streak.achievements.find(a => a.type === 'streak_30')) {
        achievements.push({
            type: 'streak_30',
            description: '30 Day Streak! 🏆'
        });
    }
    
    if (streak.totalStudyDays >= 100 && !streak.achievements.find(a => a.type === 'century')) {
        achievements.push({
            type: 'century',
            description: '100 Study Days! 💯'
        });
    }

    // Subject mastery achievements
    const subjectProgress = await progressModel.aggregate([
        { $match: { user: userId } },
        { $group: { _id: '$subject', masteredLessons: { $sum: { $cond: [{ $gte: ['$masteryLevel', 4] }, 1, 0] } } } }
    ]);

    for (const subj of subjectProgress) {
        if (subj.masteredLessons >= 10 && !streak.achievements.find(a => a.type === `subject_master_${subj._id}`)) {
            achievements.push({
                type: `subject_master_${subj._id}`,
                description: 'Subject Master! 🎓'
            });
        }
    }

    if (achievements.length > 0) {
        streak.achievements.push(...achievements);
        await streak.save();
    }
};

// Generate smart recommendations
const generateRecommendations = (dueForReview, staleSubjects, weakAreas) => {
    const recommendations = [];
    
    if (dueForReview.length > 0) {
        recommendations.push({
            type: 'urgent',
            title: 'Due for Review',
            description: `${dueForReview.length} topics need your attention`,
            priority: 'high',
            items: dueForReview.slice(0, 3)
        });
    }
    
    if (staleSubjects.length > 0) {
        recommendations.push({
            type: 'stale',
            title: 'Stale Subjects',
            description: 'Haven\'t studied these subjects recently',
            priority: 'medium',
            items: staleSubjects.slice(0, 3)
        });
    }
    
    if (weakAreas.length > 0) {
        recommendations.push({
            type: 'weak',
            title: 'Weak Areas',
            description: 'Focus on improving these topics',
            priority: 'medium',
            items: weakAreas.slice(0, 3)
        });
    }
    
    return recommendations;
};
