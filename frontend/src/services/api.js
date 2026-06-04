import axios from "axios";

export const API_BASE_URL = 'http://localhost:5000/api'; // Changed to port 5000 (backend port)

export const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json'
    },
    withCredentials: true   // ✅ important for session cookies
});


// Add these to your existing api.js file

// ======================== USER MANAGEMENT (ADMIN ONLY) ========================
export const fetchUsers = async () => {
    try {
        const response = await api.get('/users');
        return response.data;
    } catch (error) {
        throw error.response?.data || { error: 'Failed to fetch users' };
    }
};

export const deleteUser = async (id) => {
    try {
        const response = await api.delete(`/users/${id}`);
        return response.data;
    } catch (error) {
        throw error.response?.data || { error: 'Failed to delete user' };
    }
};

export const updateUserRole = async (id, role) => {
    try {
        const response = await api.put(`/users/${id}/role`, { role });
        return response.data;
    } catch (error) {
        throw error.response?.data || { error: 'Failed to update user role' };
    }
};

export const checkUsersExist = async () => {
    try {
        const response = await api.get('/users/count');
        return response.data;
    } catch (error) {
        throw error.response?.data || { error: 'Failed to check users' };
    }
};
// ======================== AUTH ========================
export const signin = async (userName, password) => {
    try {
        const response = await api.post('/login', { userName, password });
        // Store user info in localStorage for UI convenience
        localStorage.setItem('user_id', response.data.user.id);
        localStorage.setItem('userName', response.data.user.userName);
        localStorage.setItem('role', response.data.user.role);
        if (response.data.user.employee) {
            localStorage.setItem('employee_id', response.data.user.employee._id);
        }
        return response.data;
    } catch (error) {
        throw error.response?.data || { error: 'Login failed' };
    }
};

export const signup = async (userName, password, role = 'viewer', employee_id = null) => {
    try {
        const response = await api.post('/register', { userName, password, role, employee_id });
        return response.data;
    } catch (error) {
        throw error.response?.data || { error: 'Registration failed' };
    }
};

export const logout = async () => {
    try {
        await api.post('/logout');
    } catch (error) {
        console.error('Logout error', error);
    } finally {
        localStorage.removeItem('user_id');
        localStorage.removeItem('userName');
        localStorage.removeItem('role');
        localStorage.removeItem('employee_id');
    }
};

// Check if user is logged in by verifying session with backend
export const isLoggedIn = async () => {
    try {
        const response = await api.get('/me');
        // update localStorage with fresh data
        localStorage.setItem('user_id', response.data.userId);
        localStorage.setItem('userName', response.data.userName);
        localStorage.setItem('role', response.data.role);
        return true;
    } catch {
        return false;
    }
};

export const getCurrentUser = () => {
    return {
        user_id: localStorage.getItem('user_id'),
        userName: localStorage.getItem('userName'),
        role: localStorage.getItem('role'),
        employee_id: localStorage.getItem('employee_id')
    };
};

export const requireAuth = async (navigate) => {
    const loggedIn = await isLoggedIn();
    if (!loggedIn) {
        navigate('/login');
        return null;
    }
    return getCurrentUser();
};

export const handleLogout = async (navigate) => {
    await logout();
    navigate('/login');
};

// ======================== DEPARTMENTS ========================
export const fetchDepartments = async () => {
    try {
        const response = await api.get('/departments');
        return response.data;
    } catch (error) {
        throw error.response?.data || { error: 'Failed to fetch departments' };
    }
};

export const addDepartment = async (departmentData) => {
    try {
        const response = await api.post('/departments', departmentData);
        return response.data;
    } catch (error) {
        throw error.response?.data || { error: 'Failed to add department' };
    }
};

export const updateDepartment = async (id, departmentData) => {
    try {
        const response = await api.put(`/departments/${id}`, departmentData);
        return response.data;
    } catch (error) {
        throw error.response?.data || { error: 'Failed to update department' };
    }
};

export const deleteDepartment = async (id) => {
    try {
        const response = await api.delete(`/departments/${id}`);
        return response.data;
    } catch (error) {
        throw error.response?.data || { error: 'Failed to delete department' };
    }
};

// ======================== POSITIONS ========================
export const fetchPositions = async () => {
    try {
        const response = await api.get('/positions');
        return response.data;
    } catch (error) {
        throw error.response?.data || { error: 'Failed to fetch positions' };
    }
};

export const addPosition = async (positionData) => {
    try {
        const response = await api.post('/positions', positionData);
        return response.data;
    } catch (error) {
        throw error.response?.data || { error: 'Failed to add position' };
    }
};

export const updatePosition = async (id, positionData) => {
    try {
        const response = await api.put(`/positions/${id}`, positionData);
        return response.data;
    } catch (error) {
        throw error.response?.data || { error: 'Failed to update position' };
    }
};

export const deletePosition = async (id) => {
    try {
        const response = await api.delete(`/positions/${id}`);
        return response.data;
    } catch (error) {
        throw error.response?.data || { error: 'Failed to delete position' };
    }
};

// ======================== EMPLOYEES ========================
export const fetchEmployees = async () => {
    try {
        const response = await api.get('/employees');
        return response.data;
    } catch (error) {
        throw error.response?.data || { error: 'Failed to fetch employees' };
    }
};

export const fetchEmployeeById = async (id) => {
    try {
        const response = await api.get(`/employees/${id}`);
        return response.data;
    } catch (error) {
        throw error.response?.data || { error: 'Failed to fetch employee' };
    }
};

export const addEmployee = async (employeeData) => {
    try {
        const response = await api.post('/employees', employeeData);
        return response.data;
    } catch (error) {
        throw error.response?.data || { error: 'Failed to add employee' };
    }
};

export const updateEmployee = async (id, employeeData) => {
    try {
        const response = await api.put(`/employees/${id}`, employeeData);
        return response.data;
    } catch (error) {
        throw error.response?.data || { error: 'Failed to update employee' };
    }
};

export const deleteEmployee = async (id) => {
    try {
        const response = await api.delete(`/employees/${id}`);
        return response.data;
    } catch (error) {
        throw error.response?.data || { error: 'Failed to delete employee' };
    }
};

// ======================== ATTENDANCE ========================
export const fetchAttendance = async (filters = {}) => {
    try {
        const params = new URLSearchParams(filters).toString();
        const response = await api.get(`/attendance${params ? `?${params}` : ''}`);
        return response.data;
    } catch (error) {
        throw error.response?.data || { error: 'Failed to fetch attendance records' };
    }
};

export const addAttendance = async (attendanceData) => {
    try {
        const response = await api.post('/attendance', attendanceData);
        return response.data;
    } catch (error) {
        throw error.response?.data || { error: 'Failed to add attendance record' };
    }
};

export const updateAttendance = async (id, attendanceData) => {
    try {
        const response = await api.put(`/attendance/${id}`, attendanceData);
        return response.data;
    } catch (error) {
        throw error.response?.data || { error: 'Failed to update attendance record' };
    }
};

// ======================== LEAVES ========================
export const fetchLeaves = async () => {
    try {
        const response = await api.get('/leaves');
        return response.data;
    } catch (error) {
        throw error.response?.data || { error: 'Failed to fetch leave requests' };
    }
};

export const addLeave = async (leaveData) => {
    try {
        const response = await api.post('/leaves', leaveData);
        return response.data;
    } catch (error) {
        throw error.response?.data || { error: 'Failed to add leave request' };
    }
};

export const updateLeaveStatus = async (id, status) => {
    try {
        const response = await api.put(`/leaves/${id}/status`, { status });
        return response.data;
    } catch (error) {
        throw error.response?.data || { error: 'Failed to update leave status' };
    }
};

// ======================== PAYROLL ========================
export const fetchPayroll = async (filters = {}) => {
    try {
        const params = new URLSearchParams(filters).toString();
        const response = await api.get(`/payroll${params ? `?${params}` : ''}`);
        return response.data;
    } catch (error) {
        throw error.response?.data || { error: 'Failed to fetch payroll records' };
    }
};

export const addPayroll = async (payrollData) => {
    try {
        const response = await api.post('/payroll', payrollData);
        return response.data;
    } catch (error) {
        throw error.response?.data || { error: 'Failed to add payroll record' };
    }
};

export const processPayrollPayment = async (id) => {
    try {
        const response = await api.put(`/payroll/${id}/pay`);
        return response.data;
    } catch (error) {
        throw error.response?.data || { error: 'Failed to process payment' };
    }
};

// ======================== REPORTS ========================
export const fetchEmployeeSummary = async () => {
    try {
        const response = await api.get('/reports/employee-summary');
        return response.data;
    } catch (error) {
        throw error.response?.data || { error: 'Failed to fetch employee summary' };
    }
};

export const fetchLeaveSummary = async () => {
    try {
        const response = await api.get('/reports/leave-summary');
        return response.data;
    } catch (error) {
        throw error.response?.data || { error: 'Failed to fetch leave summary' };
    }
};

// ======================== HELPER FUNCTIONS ========================
export const getEmployeeFullName = (employee) => {
    if (!employee) return '';
    return `${employee.empFirstname} ${employee.empLastname}`;
};

export const formatDate = (date) => {
    if (!date) return '';
    return new Date(date).toLocaleDateString();
};

export const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return '';
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(amount);
};

export const getEmployeeStatusBadge = (status) => {
    const statusMap = {
        'active': { color: 'green', text: 'Active' },
        'on_leave': { color: 'orange', text: 'On Leave' },
        'suspended': { color: 'red', text: 'Suspended' },
        'terminated': { color: 'darkred', text: 'Terminated' },
        'retired': { color: 'gray', text: 'Retired' }
    };
    return statusMap[status] || { color: 'gray', text: status };
};

export const getLeaveStatusBadge = (status) => {
    const statusMap = {
        'pending': { color: 'orange', text: 'Pending' },
        'approved': { color: 'green', text: 'Approved' },
        'rejected': { color: 'red', text: 'Rejected' },
        'cancelled': { color: 'gray', text: 'Cancelled' }
    };
    return statusMap[status] || { color: 'gray', text: status };
};

export const getPaymentStatusBadge = (status) => {
    const statusMap = {
        'pending': { color: 'orange', text: 'Pending' },
        'paid': { color: 'green', text: 'Paid' },
        'cancelled': { color: 'red', text: 'Cancelled' }
    };
    return statusMap[status] || { color: 'gray', text: status };
};