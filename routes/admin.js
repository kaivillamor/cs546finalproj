import express from 'express';
import { quizzes, users } from '../config/mongoCollections.js';
import { ObjectId } from 'mongodb';

const router = express.Router();

router.get('/', async (req, res) => {
    try {
        const quizCollection = await quizzes();
        const userCollection = await users();
        
        const totalUsers = await userCollection.countDocuments();
        const totalQuizzes = await quizCollection.countDocuments();
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const allQuizzes = await quizCollection.find({}).toArray();
        
        const categoryCount = {};
        allQuizzes.forEach(quiz => {
            const category = quiz.category || 'Uncategorized';
            categoryCount[category] = (categoryCount[category] || 0) + 1;
        });

        const popularCategories = Object.entries(categoryCount)
            .map(([category, count]) => ({ category, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);

        const lastWeek = new Date(today);
        lastWeek.setDate(lastWeek.getDate() - 7);

        const newUsers = await userCollection.countDocuments({
            createdAt: { $gte: lastWeek }
        });

        const newQuizzes = await quizCollection.countDocuments({
            createdAt: { $gte: lastWeek }
        });

        const recentBadges = [];
        const usersData = await userCollection.find({}).toArray();
        usersData.forEach(user => {
            if (user.quizzesTaken >= 25) {
                recentBadges.push({
                    username: user.username,
                    badge: 'Master of Learning',
                    date: user.createdAt
                });
            } else if (user.quizzesTaken >= 10) {
                recentBadges.push({
                    username: user.username,
                    badge: 'Study G.O.A.T',
                    date: user.createdAt
                });
            }
        });
        
        const categoryScores = {};
        usersData.forEach(user => {
            if (user.quizResults) {
                user.quizResults.forEach(result => {
                    const quiz = allQuizzes.find(q => q._id.toString() === result.quizId.toString());
                    if (quiz) {
                        const category = quiz.category || 'Uncategorized';
                        if (!categoryScores[category]) {
                            categoryScores[category] = {
                                total: 0,
                                count: 0
                            };
                        }
                        categoryScores[category].total += result.score;
                        categoryScores[category].count++;
                    }
                });
            }
        });

        const averageScoresByCategory = Object.entries(categoryScores).map(([category, data]) => ({
            category,
            averageScore: Math.round(data.total / data.count)
        }));

        res.render('admin/dashboard', {
            title: 'Admin Dashboard',
            stats: {
                totalUsers,
                totalQuizzes,
                activeToday: await userCollection.countDocuments({ 'lastActive': { $gte: today } }),
                quizzesToday: await quizCollection.countDocuments({ 'createdAt': { $gte: today } })
            },
            analytics: {
                popularCategories,
                userActivity: {
                    newUsers,
                    newQuizzes,
                    recentBadges: recentBadges.slice(0, 5)
                },
                categoryPerformance: averageScoresByCategory
            }
        });
    } catch (e) {
        res.status(500).render('error', {
            title: 'Error',
            error: e.message
        });
    }
});

export default router;
