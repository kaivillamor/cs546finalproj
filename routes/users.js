// Import the express router as shown in the lecture code
// Note: please do not forget to export the router!

import { Router } from 'express';
import { quizzes, users } from '../config/mongoCollections.js';
import { ObjectId } from 'mongodb';

const router = Router();

router.get('/', async (req, res) => {
    try {
        if (!req.session.user) {
            return res.redirect('/login');
        }

        const userCollection = await users();
        const quizCollection = await quizzes();
        
        // Get user and initialize if quizResults doesn't exist
        let user = await userCollection.findOne({ _id: new ObjectId(req.session.user.id) });
        if (!user.quizResults) {
            await userCollection.updateOne(
                { _id: new ObjectId(req.session.user.id) },
                { 
                    $set: { 
                        quizResults: [],
                        quizzesTaken: 0,
                        averageScore: 0,
                        todayQuizzes: 0
                    } 
                }
            );
            user = await userCollection.findOne({ _id: new ObjectId(req.session.user.id) });
        }

        // Get available quizzes
        const availableQuizzes = await quizCollection
            .find({ active: true })
            .sort({ createdAt: -1 })
            .limit(5)
            .toArray();

        const formattedQuizzes = availableQuizzes.map(quiz => ({
            _id: quiz._id,
            title: quiz.title,
            description: quiz.description,
            questionCount: quiz.questions.length,
            category: quiz.category || 'General'
        }));

        // Calculate today's quizzes
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayQuizzes = user.quizResults.filter(result => 
            result.dateTaken >= today
        ).length;

        res.render('users/dashboard', {
            title: 'User Dashboard',
            user: {
                username: user.username,
                quizzesTaken: user.quizzesTaken || 0,
                averageScore: user.averageScore || 0,
                todayQuizzes: todayQuizzes
            },
            availableQuizzes: formattedQuizzes,
            inProgressQuizzes: [],
            recentResults: user.quizResults.slice(0, 5).map(result => ({
                quizTitle: result.quizTitle,
                score: result.score,
                date: result.dateTaken.toLocaleDateString()
            }))
        });
    } catch (e) {
        res.status(500).render('error', {
            title: 'Error',
            error: e.message
        });
    }
});

export default router;