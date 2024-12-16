import { Router } from 'express';
import { quizzes, users } from '../config/mongoCollections.js';

const router = Router();

router.get('/', async (req, res) => {
    try {
        const quizCollection = await quizzes();
        const userCollection = await users();
        
        const totalUsers = await userCollection.countDocuments();
        const totalQuizzes = await quizCollection.countDocuments();
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const usersData = await userCollection.find({}).toArray();
        let activeToday = 0;
        let quizzesToday = 0;
        
        for (const user of usersData) {
            if (user.quizResults) {
                const todayQuizzes = user.quizResults.filter(result => 
                    new Date(result.dateTaken) >= today
                ).length;
                
                if (todayQuizzes > 0) {
                    activeToday++;
                    quizzesToday += todayQuizzes;
                }
            }
        }

        res.render('admin/dashboard', {
            title: 'Admin Dashboard',
            stats: {
                totalUsers,
                totalQuizzes,
                activeToday,
                quizzesToday
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
