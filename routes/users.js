// Import the express router as shown in the lecture code
// Note: please do not forget to export the router!

import { Router } from 'express';
import { quizzes, users } from '../config/mongoCollections.js';

const router = Router();

router.get('/', async (req, res) => {
    try {
        if (!req.session.user) {
            return res.redirect('/login');
        }

        const quizCollection = await quizzes();
        // Get 5 most recent quizzes
        const availableQuizzes = await quizCollection
            .find({ active: true })
            .sort({ createdAt: -1 })
            .limit(3)
            .toArray();

        // Format quiz data for display
        const formattedQuizzes = availableQuizzes.map(quiz => ({
            _id: quiz._id,
            title: quiz.title,
            description: quiz.description,
            questionCount: quiz.questions.length,
            category: quiz.category || 'General' // Default category if none specified
        }));

        res.render('users/dashboard', {
            title: 'User Dashboard',
            user: {
                username: req.session.user.username,
                quizzesTaken: 0, // You can update these with real metrics later
                averageScore: 0,
                todayQuizzes: 0
            },
            availableQuizzes: formattedQuizzes,
            inProgressQuizzes: [],
            recentResults: []
        });
    } catch (e) {
        res.status(500).render('error', {
            title: 'Error',
            error: e.message
        });
    }
});

export default router;