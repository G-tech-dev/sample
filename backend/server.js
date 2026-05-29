const express = require('express');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const cors = require('cors');
const app = express();
require('dotenv').config();


const PORT = process.env.PORT ;         
const MONGO_URI = process.env.MONGO_URI;
const SALT_ROUNDS = 10;


app.use(cors({
    origin: 'http://localhost:5173',   
    credentials: true
}));


app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const tradeSchema = new mongoose.Schema({
    trade_name: { type: String, required: true, unique: true },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now }
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });
const Trade = mongoose.model('Trade', tradeSchema);

const moduleSchema = new mongoose.Schema({
    module_name: { type: String, required: true },
    module_code: { type: String, required: true, unique: true },
    credits: { type: Number, required: true, min: 0 },
    trade_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Trade', required: true },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now }
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });
const Module = mongoose.model('Module', moduleSchema);

const enrollmentSchema = new mongoose.Schema({
    module_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Module', required: true },
    enrollment_date: { type: Date, default: Date.now },
    completion_status: { type: String, enum: ['enrolled', 'completed', 'dropped', 'failed'], default: 'enrolled' },
    formative: { type: Number, min: 0, max: 50, default: null },
    summative: { type: Number, min: 0, max: 50, default: null },
    total_marks: { type: Number, min: 0, max: 100, default: null },
    grade: { type: Number, min: 0, max: 100, default: null },
    completed_at: { type: Date, default: null }
});

enrollmentSchema.pre('save', function(next) {
    if (this.formative !== null && this.summative !== null) {
        this.total_marks = this.formative + this.summative;
        this.grade = this.total_marks;
    }
    next();
});

const traineeSchema = new mongoose.Schema({
    firstnames: { type: String, required: true },
    lastnames: { type: String, required: true },
    gender: { type: String, enum: ['male', 'female'], required: true },
    trade_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Trade', required: true },
    enrollments: [enrollmentSchema],
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now }
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });
const Trainee = mongoose.model('Trainee', traineeSchema);

const userSchema = new mongoose.Schema({
    userName: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['admin', 'trainer', 'viewer'], default: 'viewer' },
    created_at: { type: Date, default: Date.now }
});
const User = mongoose.model('User', userSchema);

// ======================== AUTH MIDDLEWARE ========================
function requireLogin(req, res, next) {
    if (!req.session.userId) {
        return res.status(401).json({ error: 'Unauthorized, please login' });
    }
    next();
}

// ======================== CONNECT TO MONGODB AND START SERVER ========================
mongoose.connect(MONGO_URI)
    .then(() => {
        console.log('Connected to MongoDB');

        // -------------------- SESSION MIDDLEWARE (AFTER CONNECTION) --------------------
        app.use(session({
            secret: process.env.SESSION_SECRET,
            resave: false,
            saveUninitialized: false,
            store: MongoStore.create({ client: mongoose.connection.getClient() }),
            cookie: { maxAge: 1000 * 60 * 60 * 24 }
        }));

        // -------------------- AUTH ROUTES --------------------
        app.post('/api/register', async (req, res) => {
            try {
                const { userName, password, role } = req.body;
                if (!userName || !password) return res.status(400).json({ error: 'Username and password required' });
                const existing = await User.findOne({ userName });
                if (existing) return res.status(409).json({ error: 'Username already exists' });
                const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
                const user = new User({ userName, password: hashedPassword, role: role || 'viewer' });
                await user.save();
                res.status(201).json({ message: 'User registered successfully', userId: user._id });
            } catch (err) {
                res.status(500).json({ error: err.message });
            }
        });

        app.post('/api/login', async (req, res) => {
            try {
                const { userName, password } = req.body;
                const user = await User.findOne({ userName });
                if (!user) return res.status(401).json({ error: 'Invalid credentials' });
                const match = await bcrypt.compare(password, user.password);
                if (!match) return res.status(401).json({ error: 'Invalid credentials' });
                req.session.userId = user._id;
                req.session.userName = user.userName;
                req.session.role = user.role;
                res.json({ message: 'Login successful', user: { id: user._id, userName: user.userName, role: user.role } });
            } catch (err) {
                res.status(500).json({ error: err.message });
            }
        });

        app.post('/api/logout', (req, res) => {
            req.session.destroy(err => {
                if (err) return res.status(500).json({ error: 'Logout failed' });
                res.json({ message: 'Logged out' });
            });
        });

        app.get('/api/me', requireLogin, (req, res) => {
            res.json({ userId: req.session.userId, userName: req.session.userName, role: req.session.role });
        });

        // -------------------- CRUD: TRADES --------------------
        app.get('/api/trades', requireLogin, async (req, res) => {
            try {
                const trades = await Trade.find();
                res.json(trades);
            } catch (err) { res.status(500).json({ error: err.message }); }
        });

        app.post('/api/trades', requireLogin, async (req, res) => {
            try {
                const { trade_name } = req.body;
                const trade = new Trade({ trade_name });
                await trade.save();
                res.status(201).json(trade);
            } catch (err) { res.status(400).json({ error: err.message }); }
        });

        app.put('/api/trades/:id', requireLogin, async (req, res) => {
            try {
                const trade = await Trade.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
                if (!trade) return res.status(404).json({ error: 'Trade not found' });
                res.json(trade);
            } catch (err) { res.status(400).json({ error: err.message }); }
        });

        app.delete('/api/trades/:id', requireLogin, async (req, res) => {
            try {
                const trade = await Trade.findByIdAndDelete(req.params.id);
                if (!trade) return res.status(404).json({ error: 'Trade not found' });
                res.json({ message: 'Trade deleted' });
            } catch (err) { res.status(500).json({ error: err.message }); }
        });

        // -------------------- CRUD: MODULES --------------------
        app.get('/api/modules', requireLogin, async (req, res) => {
            try {
                const modules = await Module.find().populate('trade_id');
                res.json(modules);
            } catch (err) { res.status(500).json({ error: err.message }); }
        });

        app.post('/api/modules', requireLogin, async (req, res) => {
            try {
                const module = new Module(req.body);
                await module.save();
                res.status(201).json(module);
            } catch (err) { res.status(400).json({ error: err.message }); }
        });

        app.put('/api/modules/:id', requireLogin, async (req, res) => {
            try {
                const module = await Module.findByIdAndUpdate(req.params.id, req.body, { new: true });
                if (!module) return res.status(404).json({ error: 'Module not found' });
                res.json(module);
            } catch (err) { res.status(400).json({ error: err.message }); }
        });

        app.delete('/api/modules/:id', requireLogin, async (req, res) => {
            try {
                const module = await Module.findByIdAndDelete(req.params.id);
                if (!module) return res.status(404).json({ error: 'Module not found' });
                res.json({ message: 'Module deleted' });
            } catch (err) { res.status(500).json({ error: err.message }); }
        });

        // -------------------- CRUD: TRAINEES & ENROLLMENTS --------------------
        app.get('/api/trainees', requireLogin, async (req, res) => {
            try {
                const trainees = await Trainee.find().populate('trade_id').populate('enrollments.module_id');
                res.json(trainees);
            } catch (err) { res.status(500).json({ error: err.message }); }
        });

        app.get('/api/trainees/:id', requireLogin, async (req, res) => {
            try {
                const trainee = await Trainee.findById(req.params.id).populate('trade_id').populate('enrollments.module_id');
                if (!trainee) return res.status(404).json({ error: 'Trainee not found' });
                res.json(trainee);
            } catch (err) { res.status(500).json({ error: err.message }); }
        });

        app.post('/api/trainees', requireLogin, async (req, res) => {
            try {
                const trainee = new Trainee(req.body);
                await trainee.save();
                res.status(201).json(trainee);
            } catch (err) { res.status(400).json({ error: err.message }); }
        });

        app.put('/api/trainees/:id', requireLogin, async (req, res) => {
            try {
                const trainee = await Trainee.findByIdAndUpdate(req.params.id, req.body, { new: true });
                if (!trainee) return res.status(404).json({ error: 'Trainee not found' });
                res.json(trainee);
            } catch (err) { res.status(400).json({ error: err.message }); }
        });

        app.delete('/api/trainees/:id', requireLogin, async (req, res) => {
            try {
                const trainee = await Trainee.findByIdAndDelete(req.params.id);
                if (!trainee) return res.status(404).json({ error: 'Trainee not found' });
                res.json({ message: 'Trainee deleted' });
            } catch (err) { res.status(500).json({ error: err.message }); }
        });

        // -------------------- ENROLLMENT ADD (MISSING ROUTE) --------------------
        app.post('/api/trainees/:traineeId/enrollments', requireLogin, async (req, res) => {
            try {
                const { module_id, enrollment_date, completion_status, grade } = req.body;
                const trainee = await Trainee.findById(req.params.traineeId);
                if (!trainee) return res.status(404).json({ error: 'Trainee not found' });

                // Check for duplicate enrollment
                const already = trainee.enrollments.find(e => e.module_id.toString() === module_id);
                if (already) return res.status(400).json({ error: 'Already enrolled in this module' });

                trainee.enrollments.push({
                    module_id,
                    enrollment_date: enrollment_date || new Date(),
                    completion_status: completion_status || 'enrolled',
                    grade: grade || null
                });
                await trainee.save();
                res.status(201).json(trainee);
            } catch (err) {
                res.status(400).json({ error: err.message });
            }
        });

        // -------------------- UPDATE ENROLLMENT STATUS --------------------
        app.put('/api/trainees/:traineeId/enrollments/:moduleId', requireLogin, async (req, res) => {
            try {
                const { grade, completion_status } = req.body;
                const trainee = await Trainee.findById(req.params.traineeId);
                if (!trainee) return res.status(404).json({ error: 'Trainee not found' });
                const enrollment = trainee.enrollments.find(e => e.module_id.toString() === req.params.moduleId);
                if (!enrollment) return res.status(404).json({ error: 'Enrollment not found' });
                if (grade !== undefined) enrollment.grade = grade;
                if (completion_status) {
                    enrollment.completion_status = completion_status;
                    if (completion_status === 'completed') enrollment.completed_at = new Date();
                }
                await trainee.save();
                res.json(trainee);
            } catch (err) {
                res.status(400).json({ error: err.message });
            }
        });

        // -------------------- MARKS ENTRY --------------------
        app.put('/api/trainees/:traineeId/enrollments/:moduleId/marks', requireLogin, async (req, res) => {
            try {
                const { formative, summative } = req.body;
                const trainee = await Trainee.findById(req.params.traineeId);
                if (!trainee) return res.status(404).json({ error: 'Trainee not found' });
                const enrollment = trainee.enrollments.find(e => e.module_id.toString() === req.params.moduleId);
                if (!enrollment) return res.status(404).json({ error: 'Enrollment not found' });
                if (formative !== undefined) enrollment.formative = formative;
                if (summative !== undefined) enrollment.summative = summative;
                await trainee.save();
                res.json({ message: 'Marks updated successfully', enrollment });
            } catch (err) {
                res.status(400).json({ error: err.message });
            }
        });

        // -------------------- DELETE ENROLLMENT --------------------
        app.delete('/api/trainees/:traineeId/enrollments/:moduleId', requireLogin, async (req, res) => {
            try {
                const trainee = await Trainee.findById(req.params.traineeId);
                if (!trainee) return res.status(404).json({ error: 'Trainee not found' });
                trainee.enrollments = trainee.enrollments.filter(e => e.module_id.toString() !== req.params.moduleId);
                await trainee.save();
                res.json({ message: 'Enrollment removed' });
            } catch (err) {
                res.status(500).json({ error: err.message });
            }
        });

        // -------------------- COMPETENCY REPORT --------------------
        app.get('/api/reports/competency', requireLogin, async (req, res) => {
            try {
                const { trade_id, module_id } = req.query;
                let traineeQuery = {};
                if (trade_id) traineeQuery.trade_id = trade_id;
                let trainees = await Trainee.find(traineeQuery).populate('trade_id').populate('enrollments.module_id');
                if (module_id) {
                    trainees = trainees.filter(t =>
                        t.enrollments.some(e => e.module_id?._id.toString() === module_id)
                    );
                }
                const competent = [];
                const notYetCompetent = [];
                for (const trainee of trainees) {
                    for (const enrollment of trainee.enrollments) {
                        if (enrollment.total_marks !== null && enrollment.total_marks !== undefined) {
                            if (module_id && enrollment.module_id?._id.toString() !== module_id) continue;
                            const traineeInfo = {
                                trainee_id: trainee._id,
                                name: `${trainee.firstnames} ${trainee.lastnames}`,
                                trade: trainee.trade_id?.trade_name,
                                module: enrollment.module_id?.module_name,
                                module_code: enrollment.module_id?.module_code,
                                formative: enrollment.formative,
                                summative: enrollment.summative,
                                total_marks: enrollment.total_marks,
                                completion_status: enrollment.completion_status
                            };
                            if (enrollment.total_marks >= 70) {
                                competent.push(traineeInfo);
                            } else {
                                notYetCompetent.push(traineeInfo);
                            }
                        }
                    }
                }
                res.json({
                    competent,
                    notYetCompetent,
                    summary: {
                        total_competent: competent.length,
                        total_not_yet_competent: notYetCompetent.length,
                        total_assessed: competent.length + notYetCompetent.length
                    }
                });
            } catch (err) {
                res.status(500).json({ error: err.message });
            }
        });

        // -------------------- START SERVER --------------------
        app.listen(PORT, () => {
            console.log(`Server running on http://localhost:${PORT}`);
        });
    })
    .catch(err => {
        console.error('MongoDB connection error:', err);
        process.exit(1);
    });