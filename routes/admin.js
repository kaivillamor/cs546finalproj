import { Router } from 'express';
import { quizzes, users } from '../config/mongoCollections.js';
import { ObjectId } from 'mongodb';

const router = Router();

router.get('/', async (req, res) => {
    try {
        if (!req.session.user || req.session.user.role !== 'admin') {
            return res.redirect('/login');
        }

        const quizCollection = await quizzes();
        const userCollection = await users();
        
        const totalQuizzes = await quizCollection.countDocuments();
        const totalUsers = await userCollection.countDocuments();
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const usersToday = await userCollection.find({
            "quizResults": {
                $elemMatch: {
                    "dateTaken": { $gte: today }
                }
            }
        }).toArray();

        const activeToday = usersToday.length;
        
        const quizzesToday = usersToday.reduce((total, user) => {
            return total + (user.quizResults || []).filter(result => 
                new Date(result.dateTaken) >= today
            ).length;
        }, 0);

        res.render('admin/dashboard', {
            title: 'Admin Dashboard',
            stats: {
                totalQuizzes,
                totalUsers,
                activeToday,
                quizzesToday
            }
        });
    } catch (e) {
        console.error('Admin dashboard error:', e);
        res.status(500).render('error', {
            title: 'Error',
            error: e.message
        });
    }
});

export default router;
