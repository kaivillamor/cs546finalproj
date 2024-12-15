//Here you will require route files and export them as used in previous labs.
//Here you will import route files and export them as used in previous labs

import { Router } from "express";
import adminRoutes from './admin.js';
import userRoutes from './users.js';
import { users } from '../config/mongoCollections.js';
import { validateEmail, validatePassword, validateName, validateUsername, validateRole, hashPassword, comparePasswords } from '../helpers.js';
import { quizzes } from '../config/mongoCollections.js';
import { ObjectId } from 'mongodb';

export const buildRoutes = (app) => {
    app.use('/admin', adminRoutes);
    app.use('/user', userRoutes);
    
    app.get('/', (req, res) => {
        res.render('home', {
            title: 'Quiz App'
        });
    });

    app.route('/login')
        .get((req, res) => {
            if (req.session.user) {
                return res.redirect(req.session.user.role === 'admin' ? '/admin' : '/user');
            }
            res.render('login', { title: 'Login' });
        })
        .post(async (req, res) => {
            try {
                const { email, password } = req.body;

                if (!email || !password) {
                    return res.status(400).render('login', {
                        title: 'Login',
                        error: 'All fields are required'
                    });
                }

                if (!validateEmail(email)) {
                    return res.status(400).render('login', {
                        title: 'Login',
                        error: 'Invalid email format'
                    });
                }

                const userCollection = await users();
                const user = await userCollection.findOne({ email: email.toLowerCase() });

                if (!user || !(await comparePasswords(password, user.password))) {
                    return res.status(401).render('login', {
                        title: 'Login',
                        error: 'Invalid email or password'
                    });
                }

                req.session.user = {
                    id: user._id,
                    username: user.username,
                    email: user.email,
                    role: user.role
                };

                res.redirect(user.role === 'admin' ? '/admin' : '/user');
            } catch (e) {
                res.status(500).render('login', {
                    title: 'Login',
                    error: 'Internal server error'
                });
            }
        });

    app.route('/register')
        .get((req, res) => {
            if (req.session.user) {
                return res.redirect(req.session.user.role === 'admin' ? '/admin' : '/user');
            }
            res.render('register', { title: 'Register' });
        })
        .post(async (req, res) => {
            try {
                console.log('Registration attempt:', req.body);

                const { firstName, lastName, username, email, password, confirmPassword, role } = req.body;

                if (!firstName || !lastName || !username || !email || !password || !confirmPassword || !role) {
                    throw new Error('All fields are required');
                }

                if (!validateName(firstName)) throw new Error('Invalid first name');
                if (!validateName(lastName)) throw new Error('Invalid last name');
                if (!validateUsername(username)) throw new Error('Invalid username');
                if (!validateEmail(email)) throw new Error('Invalid email format');
                if (!validatePassword(password)) throw new Error('Password must be at least 8 characters');
                if (password !== confirmPassword) throw new Error('Passwords do not match');
                if (!validateRole(role)) throw new Error('Invalid role selected');


                const userCollection = await users();
                console.log('Connected to user collection');

                const existingUser = await userCollection.findOne({
                    $or: [
                        { email: email.toLowerCase() },
                        { username: username.toLowerCase() }
                    ]
                });

                if (existingUser) {
                    throw new Error('Username or email already exists');
                }

                const hashedPassword = await hashPassword(password);
                const newUser = {
                    firstName: firstName.trim(),
                    lastName: lastName.trim(),
                    username: username.toLowerCase(),
                    email: email.toLowerCase(),
                    password: hashedPassword,
                    role: role,
                    createdAt: new Date()
                };

                console.log('Attempting to insert user:', { ...newUser, password: '[HIDDEN]' });

                const insertInfo = await userCollection.insertOne(newUser);
                
                if (!insertInfo.acknowledged) {
                    throw new Error('Could not add user');
                }

                req.session.user = {
                    id: insertInfo.insertedId,
                    username: newUser.username,
                    email: newUser.email,
                    role: newUser.role
                };

                res.redirect(newUser.role === 'admin' ? '/admin' : '/user');
            } catch (e) {
                console.error('Registration error:', e);
                res.status(400).render('register', {
                    title: 'Register',
                    error: e.message,
                    firstName: req.body.firstName,
                    lastName: req.body.lastName,
                    username: req.body.username,
                    email: req.body.email
                });
            }
        });

    app.get('/logout', (req, res) => {
        if (req.session) {
            req.session.destroy((err) => {
                if (err) {
                    console.error('Session destruction error:', err);
                    return res.status(500).render('error', {
                        title: 'Error',
                        error: 'Could not log out'
                    });
                }
                res.clearCookie('QuizAppSession');
                res.redirect('/');
            });
        } else {
            res.redirect('/');
        }
    });

    app.route('/quiz/create')
        .get((req, res) => {
            if (!req.session.user) {
                return res.redirect('/login');
            }
            res.render('quiz/create', {
                title: 'Create Quiz',
                user: req.session.user
            });
        })
        .post(async (req, res) => {
            try {
                if (!req.session.user) {
                    return res.redirect('/login');
                }

                const { title, description, category, questions } = req.body;
                
                if (!title || !description || !category || !questions) {
                    throw new Error('All fields are required');
                }

                const quizCollection = await quizzes();
                const newQuiz = {
                    title: title.trim(),
                    description: description.trim(),
                    category: category.trim(),
                    questions: JSON.parse(questions),
                    createdBy: req.session.user.id,
                    createdAt: new Date(),
                    active: true
                };

                const insertInfo = await quizCollection.insertOne(newQuiz);
                
                if (!insertInfo.acknowledged) {
                    throw new Error('Could not create quiz');
                }

                res.redirect(req.session.user.role === 'admin' ? '/admin' : '/user');
            } catch (e) {
                res.status(400).render('quiz/create', {
                    title: 'Create Quiz',
                    error: e.message,
                    user: req.session.user
                });
            }
        });

    app.get('/quiz/:id', async (req, res) => {
        try {
            if (!req.session.user) {
                return res.redirect('/login');
            }

            const quizCollection = await quizzes();
            const quiz = await quizCollection.findOne({ _id: new ObjectId(req.params.id) });
            
            if (!quiz) {
                throw new Error('Quiz not found');
            }

            res.render('quiz/take', {
                title: quiz.title,
                quiz: {
                    _id: quiz._id,
                    title: quiz.title,
                    description: quiz.description,
                    questions: quiz.questions,
                    category: quiz.category
                },
                user: req.session.user
            });
        } catch (e) {
            res.status(404).render('error', {
                title: 'Error',
                error: e.message
            });
        }
    });

    app.post('/quiz/:id/submit', async (req, res) => {
        try {
            if (!req.session.user) {
                return res.redirect('/login');
            }

            const { answers } = req.body;
            
            if (!Array.isArray(answers)) {
                throw new Error('Invalid answers format');
            }

            const quizCollection = await quizzes();
            const userCollection = await users();
            const quiz = await quizCollection.findOne({ _id: new ObjectId(req.params.id) });

            if (!quiz) {
                throw new Error('Quiz not found');
            }

            let score = 0;
            
            quiz.questions.forEach((question, index) => {
                const submittedAnswer = answers[index];
                const correctAnswer = question.correctAnswer;
                
                if (submittedAnswer === correctAnswer) {
                    score++;
                }
            });

            const scorePercentage = Math.round((score / quiz.questions.length) * 100);

            // Get current user to calculate new average
            const user = await userCollection.findOne({ _id: new ObjectId(req.session.user.id) });
            const currentTotal = (user.quizzesTaken || 0) * (user.averageScore || 0);
            const newAverage = Math.round((currentTotal + scorePercentage) / (user.quizzesTaken + 1));

            await userCollection.updateOne(
                { _id: new ObjectId(req.session.user.id) },
                {
                    $push: {
                        quizResults: {
                            quizId: quiz._id,
                            quizTitle: quiz.title,
                            score: scorePercentage,
                            dateTaken: new Date()
                        }
                    },
                    $inc: { quizzesTaken: 1 },
                    $set: { averageScore: newAverage }
                }
            );

            res.json({
                score: scorePercentage,
                totalQuestions: quiz.questions.length,
                correctAnswers: score
            });
        } catch (e) {
            res.status(400).json({ error: e.message });
        }
    });

    app.use('*', (req, res) => {
        res.status(404).render('error', {
            title: '404 Not Found',
            error: 'Page not found'
        });
    });

    app.get('/test-db', async (req, res) => {
        try {
            const userCollection = await users();
            const count = await userCollection.countDocuments();
            res.json({ message: 'Database connected', userCount: count });
        } catch (e) {
            console.error('Database test error:', e);
            res.status(500).json({ error: e.message });
        }
    });
};

