const express = require('express');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const cors = require('cors');
const app = express();
require('dotenv').config();

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/hrms_db';
const SALT_ROUNDS = 10;

// ======================== MIDDLEWARE ========================
app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ======================== SCHEMAS ========================

// Department Schema
const departmentSchema = new mongoose.Schema({
    departName: { type: String, required: true, unique: true },
    description: { type: String },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now }
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });
const Department = mongoose.model('Department', departmentSchema);

// Position Schema
const positionSchema = new mongoose.Schema({
    posName: { type: String, required: true, unique: true },
    requiredQualification: { type: String, required: true },
    department_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', required: true },
    salary_range: { 
        min: { type: Number, default: 0 },
        max: { type: Number, default: 0 }
    },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now }
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });
const Position = mongoose.model('Position', positionSchema);

// Employee Schema
const employeeSchema = new mongoose.Schema({
    empFirstname: { type: String, required: true },
    empLastname: { type: String, required: true },
    empGender: { type: String, enum: ['male', 'female', 'other'], required: true },
    empdateOfBirth: { type: Date, required: true },
    empHiredate: { type: Date, required: true, default: Date.now },
    empstatus: { 
        type: String, 
        enum: ['active', 'on_leave', 'suspended', 'terminated', 'retired'], 
        default: 'active' 
    },
    email: { type: String, required: true, unique: true },
    phone: { type: String },
    address: { type: String },
    employee_id: { type: String, unique: true },
    department_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
    position_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Position' },
    salary: { type: Number, default: 0 },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now }
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

// Auto-generate employee ID
employeeSchema.pre('save', async function(next) {
    if (!this.employee_id) {
        const count = await mongoose.model('Employee').countDocuments();
        this.employee_id = `EMP${String(count + 1).padStart(5, '0')}`;
    }
    next();
});

const Employee = mongoose.model('Employee', employeeSchema);

// User Schema (for authentication)
const userSchema = new mongoose.Schema({
    userName: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['admin', 'hr_manager', 'hr_staff', 'viewer'], default: 'admin' },
    employee_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
    created_at: { type: Date, default: Date.now }
});
const User = mongoose.model('User', userSchema);

// Attendance Schema
const attendanceSchema = new mongoose.Schema({
    employee_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
    date: { type: Date, required: true },
    check_in: { type: Date },
    check_out: { type: Date },
    status: { type: String, enum: ['present', 'absent', 'late', 'half_day'], default: 'present' },
    overtime_hours: { type: Number, default: 0 },
    created_at: { type: Date, default: Date.now }
});
const Attendance = mongoose.model('Attendance', attendanceSchema);

// Leave Schema
const leaveSchema = new mongoose.Schema({
    employee_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
    leave_type: { type: String, enum: ['annual', 'sick', 'unpaid', 'maternity', 'paternity', 'bereavement'], required: true },
    start_date: { type: Date, required: true },
    end_date: { type: Date, required: true },
    reason: { type: String },
    status: { type: String, enum: ['pending', 'approved', 'rejected', 'cancelled'], default: 'pending' },
    approved_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    approved_date: { type: Date },
    created_at: { type: Date, default: Date.now }
});
const Leave = mongoose.model('Leave', leaveSchema);

// Payroll Schema
const payrollSchema = new mongoose.Schema({
    employee_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
    month: { type: Number, required: true },
    year: { type: Number, required: true },
    basic_salary: { type: Number, required: true },
    allowances: { type: Number, default: 0 },
    deductions: { type: Number, default: 0 },
    bonus: { type: Number, default: 0 },
    net_salary: { type: Number },
    payment_date: { type: Date },
    payment_status: { type: String, enum: ['pending', 'paid', 'cancelled'], default: 'pending' },
    created_at: { type: Date, default: Date.now }
});

payrollSchema.pre('save', function(next) {
    this.net_salary = this.basic_salary + this.allowances + this.bonus - this.deductions;
    next();
});

const Payroll = mongoose.model('Payroll', payrollSchema);

// ======================== AUTH MIDDLEWARE ========================
function requireLogin(req, res, next) {
    if (!req.session || !req.session.userId) {
        return res.status(401).json({ error: 'Unauthorized, please login' });
    }
    next();
}

// ======================== CONNECT TO MONGODB AND START SERVER ========================
mongoose.connect(MONGO_URI)
    .then(async () => {
        console.log('✅ Connected to MongoDB');

        // Session Middleware - Configure BEFORE routes
        app.use(session({
            secret: process.env.SESSION_SECRET || 'hrms_secret_key',
            resave: false,
            saveUninitialized: false,
            store: MongoStore.create({ client: mongoose.connection.getClient() }),
            cookie: { 
                maxAge: 1000 * 60 * 60 * 24, // 24 hours
                httpOnly: true,
                secure: false, // Set to true if using HTTPS
                sameSite: 'lax'
            }
        }));

        // ======================== AUTH ROUTES ========================

        // Test endpoint
        app.get('/api/test', (req, res) => {
            res.json({ message: 'Server is running!', session: req.sessionID });
        });

        // Check username availability
        app.get('/api/check-username/:username', async (req, res) => {
            try {
                const { username } = req.params;
                const existing = await User.findOne({ userName: username });
                res.json({ available: !existing });
            } catch (err) {
                res.status(500).json({ error: err.message });
            }
        });

        // Register endpoint
        app.post('/api/register', async (req, res) => {
            try {
                const { userName, password, employee_id } = req.body;
                
                console.log('Registration attempt for:', userName);
                
                if (!userName || !userName.trim()) {
                    return res.status(400).json({ error: 'Username is required' });
                }
                
                if (!password || password.length < 6) {
                    return res.status(400).json({ error: 'Password must be at least 6 characters' });
                }
                
                const existing = await User.findOne({ userName: userName.trim() });
                if (existing) {
                    return res.status(409).json({ error: 'Username already exists' });
                }
                
                const hashedPassword = await bcrypt.hash(password, 10);
                
                const user = new User({ 
                    userName: userName.trim(), 
                    password: hashedPassword, 
                    role: 'admin',
                    employee_id: employee_id || null
                });
                
                await user.save();
                
                console.log('User registered successfully:', userName);
                
                res.status(201).json({ 
                    message: 'Admin account created successfully!',
                    userId: user._id,
                    userName: user.userName,
                    role: 'admin'
                });
            } catch (err) {
                console.error('Registration error:', err);
                res.status(500).json({ error: err.message });
            }
        });

        // Login endpoint
        app.post('/api/login', async (req, res) => {
            try {
                const { userName, password } = req.body;
                
                console.log('Login attempt for:', userName);
                
                const user = await User.findOne({ userName: userName.trim() }).populate('employee_id');
                
                if (!user) {
                    console.log('User not found:', userName);
                    return res.status(401).json({ error: 'Invalid credentials' });
                }
                
                const match = await bcrypt.compare(password, user.password);
                if (!match) {
                    console.log('Invalid password for:', userName);
                    return res.status(401).json({ error: 'Invalid credentials' });
                }
                
                // Set session
                req.session.userId = user._id;
                req.session.userName = user.userName;
                req.session.role = user.role;
                
                // Save session explicitly
                req.session.save((err) => {
                    if (err) {
                        console.error('Session save error:', err);
                        return res.status(500).json({ error: 'Session error' });
                    }
                    
                    console.log('Login successful for:', userName, 'Session ID:', req.sessionID);
                    
                    res.json({ 
                        message: 'Login successful', 
                        user: { 
                            id: user._id, 
                            userName: user.userName, 
                            role: user.role,
                            employee: user.employee_id
                        } 
                    });
                });
            } catch (err) {
                console.error('Login error:', err);
                res.status(500).json({ error: 'Login failed' });
            }
        });

        // Get current user endpoint
        app.get('/api/me', (req, res) => {
            console.log('Session check:', req.sessionID, 'UserId:', req.session?.userId);
            
            if (!req.session || !req.session.userId) {
                return res.status(401).json({ error: 'Not authenticated' });
            }
            
            res.json({ 
                userId: req.session.userId, 
                userName: req.session.userName, 
                role: req.session.role || 'admin'
            });
        });

        // Logout endpoint
        app.post('/api/logout', (req, res) => {
            req.session.destroy(err => {
                if (err) {
                    console.error('Logout error:', err);
                    return res.status(500).json({ error: 'Logout failed' });
                }
                res.clearCookie('connect.sid');
                res.json({ message: 'Logged out successfully' });
            });
        });

        // ======================== DEPARTMENT CRUD ========================
        app.get('/api/departments', requireLogin, async (req, res) => {
            try {
                const departments = await Department.find();
                res.json(departments);
            } catch (err) { 
                res.status(500).json({ error: err.message }); 
            }
        });

        app.post('/api/departments', requireLogin, async (req, res) => {
            try {
                const department = new Department(req.body);
                await department.save();
                res.status(201).json(department);
            } catch (err) { 
                res.status(400).json({ error: err.message }); 
            }
        });

        app.put('/api/departments/:id', requireLogin, async (req, res) => {
            try {
                const department = await Department.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
                if (!department) return res.status(404).json({ error: 'Department not found' });
                res.json(department);
            } catch (err) { 
                res.status(400).json({ error: err.message }); 
            }
        });

        app.delete('/api/departments/:id', requireLogin, async (req, res) => {
            try {
                const department = await Department.findByIdAndDelete(req.params.id);
                if (!department) return res.status(404).json({ error: 'Department not found' });
                res.json({ message: 'Department deleted' });
            } catch (err) { 
                res.status(500).json({ error: err.message }); 
            }
        });

        // ======================== POSITION CRUD ========================
        app.get('/api/positions', requireLogin, async (req, res) => {
            try {
                const positions = await Position.find().populate('department_id');
                res.json(positions);
            } catch (err) { 
                res.status(500).json({ error: err.message }); 
            }
        });

        app.post('/api/positions', requireLogin, async (req, res) => {
            try {
                const position = new Position(req.body);
                await position.save();
                res.status(201).json(position);
            } catch (err) { 
                res.status(400).json({ error: err.message }); 
            }
        });

        app.put('/api/positions/:id', requireLogin, async (req, res) => {
            try {
                const position = await Position.findByIdAndUpdate(req.params.id, req.body, { new: true });
                if (!position) return res.status(404).json({ error: 'Position not found' });
                res.json(position);
            } catch (err) { 
                res.status(400).json({ error: err.message }); 
            }
        });

        app.delete('/api/positions/:id', requireLogin, async (req, res) => {
            try {
                const position = await Position.findByIdAndDelete(req.params.id);
                if (!position) return res.status(404).json({ error: 'Position not found' });
                res.json({ message: 'Position deleted' });
            } catch (err) { 
                res.status(500).json({ error: err.message }); 
            }
        });

        // ======================== EMPLOYEE CRUD ========================
        app.get('/api/employees', requireLogin, async (req, res) => {
            try {
                const employees = await Employee.find()
                    .populate('department_id')
                    .populate('position_id');
                res.json(employees);
            } catch (err) { 
                res.status(500).json({ error: err.message }); 
            }
        });

        app.get('/api/employees/:id', requireLogin, async (req, res) => {
            try {
                const employee = await Employee.findById(req.params.id)
                    .populate('department_id')
                    .populate('position_id');
                if (!employee) return res.status(404).json({ error: 'Employee not found' });
                res.json(employee);
            } catch (err) { 
                res.status(500).json({ error: err.message }); 
            }
        });

        app.post('/api/employees', requireLogin, async (req, res) => {
            try {
                const employee = new Employee(req.body);
                await employee.save();
                res.status(201).json(employee);
            } catch (err) { 
                res.status(400).json({ error: err.message }); 
            }
        });

        app.put('/api/employees/:id', requireLogin, async (req, res) => {
            try {
                const employee = await Employee.findByIdAndUpdate(req.params.id, req.body, { new: true });
                if (!employee) return res.status(404).json({ error: 'Employee not found' });
                res.json(employee);
            } catch (err) { 
                res.status(400).json({ error: err.message }); 
            }
        });

        app.delete('/api/employees/:id', requireLogin, async (req, res) => {
            try {
                const employee = await Employee.findByIdAndDelete(req.params.id);
                if (!employee) return res.status(404).json({ error: 'Employee not found' });
                res.json({ message: 'Employee deleted' });
            } catch (err) { 
                res.status(500).json({ error: err.message }); 
            }
        });

        // ======================== ATTENDANCE ROUTES ========================
        app.get('/api/attendance', requireLogin, async (req, res) => {
            try {
                const { start_date, end_date, employee_id } = req.query;
                let query = {};
                
                if (employee_id) query.employee_id = employee_id;
                if (start_date && end_date) {
                    query.date = { $gte: new Date(start_date), $lte: new Date(end_date) };
                }
                
                const attendance = await Attendance.find(query).populate('employee_id');
                res.json(attendance);
            } catch (err) { 
                res.status(500).json({ error: err.message }); 
            }
        });

        app.post('/api/attendance', requireLogin, async (req, res) => {
            try {
                const attendance = new Attendance(req.body);
                await attendance.save();
                res.status(201).json(attendance);
            } catch (err) { 
                res.status(400).json({ error: err.message }); 
            }
        });

        app.put('/api/attendance/:id', requireLogin, async (req, res) => {
            try {
                const attendance = await Attendance.findByIdAndUpdate(req.params.id, req.body, { new: true });
                if (!attendance) return res.status(404).json({ error: 'Attendance record not found' });
                res.json(attendance);
            } catch (err) { 
                res.status(400).json({ error: err.message }); 
            }
        });

        // ======================== LEAVE ROUTES ========================
        app.get('/api/leaves', requireLogin, async (req, res) => {
            try {
                const leaves = await Leave.find()
                    .populate('employee_id')
                    .populate('approved_by');
                res.json(leaves);
            } catch (err) { 
                res.status(500).json({ error: err.message }); 
            }
        });

        app.post('/api/leaves', requireLogin, async (req, res) => {
            try {
                const leave = new Leave(req.body);
                await leave.save();
                res.status(201).json(leave);
            } catch (err) { 
                res.status(400).json({ error: err.message }); 
            }
        });

        app.put('/api/leaves/:id/status', requireLogin, async (req, res) => {
            try {
                const { status } = req.body;
                const leave = await Leave.findByIdAndUpdate(
                    req.params.id, 
                    { 
                        status, 
                        approved_by: req.session.userId,
                        approved_date: status === 'approved' ? new Date() : null
                    }, 
                    { new: true }
                );
                if (!leave) return res.status(404).json({ error: 'Leave request not found' });
                res.json(leave);
            } catch (err) { 
                res.status(400).json({ error: err.message }); 
            }
        });

        // ======================== PAYROLL ROUTES ========================
        app.get('/api/payroll', requireLogin, async (req, res) => {
            try {
                const { month, year, employee_id } = req.query;
                let query = {};
                
                if (employee_id) query.employee_id = employee_id;
                if (month && year) {
                    query.month = parseInt(month);
                    query.year = parseInt(year);
                }
                
                const payroll = await Payroll.find(query).populate('employee_id');
                res.json(payroll);
            } catch (err) { 
                res.status(500).json({ error: err.message }); 
            }
        });

        app.post('/api/payroll', requireLogin, async (req, res) => {
            try {
                const payroll = new Payroll(req.body);
                await payroll.save();
                res.status(201).json(payroll);
            } catch (err) { 
                res.status(400).json({ error: err.message }); 
            }
        });

        app.put('/api/payroll/:id/pay', requireLogin, async (req, res) => {
            try {
                const payroll = await Payroll.findByIdAndUpdate(
                    req.params.id,
                    { 
                        payment_status: 'paid',
                        payment_date: new Date()
                    },
                    { new: true }
                );
                if (!payroll) return res.status(404).json({ error: 'Payroll record not found' });
                res.json(payroll);
            } catch (err) { 
                res.status(400).json({ error: err.message }); 
            }
        });

        // ======================== REPORTS ========================
        app.get('/api/reports/employee-summary', requireLogin, async (req, res) => {
            try {
                const totalEmployees = await Employee.countDocuments();
                const activeEmployees = await Employee.countDocuments({ empstatus: 'active' });
                const employeesByDepartment = await Employee.aggregate([
                    { $group: { _id: '$department_id', count: { $sum: 1 } } },
                    { $lookup: { from: 'departments', localField: '_id', foreignField: '_id', as: 'department' } }
                ]);
                
                const employeesByPosition = await Employee.aggregate([
                    { $group: { _id: '$position_id', count: { $sum: 1 } } },
                    { $lookup: { from: 'positions', localField: '_id', foreignField: '_id', as: 'position' } }
                ]);
                
                res.json({
                    totalEmployees,
                    activeEmployees,
                    employeesByDepartment,
                    employeesByPosition
                });
            } catch (err) {
                res.status(500).json({ error: err.message });
            }
        });

        app.get('/api/reports/leave-summary', requireLogin, async (req, res) => {
            try {
                const pendingLeaves = await Leave.countDocuments({ status: 'pending' });
                const approvedLeaves = await Leave.countDocuments({ status: 'approved' });
                const rejectedLeaves = await Leave.countDocuments({ status: 'rejected' });
                
                const leavesByType = await Leave.aggregate([
                    { $group: { _id: '$leave_type', count: { $sum: 1 } } }
                ]);
                
                res.json({
                    pendingLeaves,
                    approvedLeaves,
                    rejectedLeaves,
                    leavesByType
                });
            } catch (err) {
                res.status(500).json({ error: err.message });
            }
        });

        // ======================== START SERVER ========================
        app.listen(PORT, () => {
            console.log(`✅ HRMS Server running on http://localhost:${PORT}`);
            console.log(`📡 API available at http://localhost:${PORT}/api`);
            console.log(`🔑 Test endpoint: http://localhost:${PORT}/api/test`);
        });
    })
    .catch(err => {
        console.error('❌ MongoDB connection error:', err);
        process.exit(1);
    });