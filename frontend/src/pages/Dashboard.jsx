// Dashboard.jsx - HRMS Dashboard with Blue/Cyan Theme
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  FiBriefcase,
  FiAward,
  FiUsers,
  FiCalendar,
  FiTrendingUp, 
  FiTrendingDown, 
  FiAlertCircle,
  FiCheckCircle,
  FiXCircle,
  FiClock,
  FiDollarSign,
  FiBarChart2,
  FiUserCheck,
  FiUserX
} from 'react-icons/fi';
import toast from 'react-hot-toast';

const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  withCredentials: true
});

const Dashboard = () => {
  const [stats, setStats] = useState({
    total_departments: 0,
    total_positions: 0,
    total_employees: 0,
    active_employees: 0,
    on_leave: 0,
    attendance_today: 0,
    pending_leaves: 0,
    monthly_payroll: 0
  });
  const [recentEmployees, setRecentEmployees] = useState([]);
  const [topDepartments, setTopDepartments] = useState([]);
  const [recentLeaves, setRecentLeaves] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAllDashboardData();
  }, []);

  const fetchAllDashboardData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchDashboardStats(),
        fetchRecentEmployees(),
        fetchTopDepartments(),
        fetchRecentLeaves()
      ]);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const fetchDashboardStats = async () => {
    try {
      const [departmentsRes, positionsRes, employeesRes, leavesRes, attendanceRes, payrollRes] = await Promise.all([
        api.get('/departments'),
        api.get('/positions'),
        api.get('/employees'),
        api.get('/leaves'),
        api.get('/attendance'),
        api.get('/payroll')
      ]);
      
      const departments = departmentsRes.data;
      const positions = positionsRes.data;
      const employees = employeesRes.data;
      const leaves = leavesRes.data;
      const attendance = attendanceRes.data;
      const payroll = payrollRes.data;
      
      const activeEmployees = employees.filter(emp => emp.empstatus === 'active').length;
      const onLeave = employees.filter(emp => emp.empstatus === 'on_leave').length;
      
      // Attendance today
      const today = new Date().toISOString().split('T')[0];
      const attendanceToday = attendance.filter(att => att.date?.split('T')[0] === today).length;
      
      // Pending leaves
      const pendingLeaves = leaves.filter(leave => leave.status === 'pending').length;
      
      // Monthly payroll (current month)
      const currentMonth = new Date().getMonth() + 1;
      const currentYear = new Date().getFullYear();
      const monthlyPayroll = payroll
        .filter(p => p.month === currentMonth && p.year === currentYear)
        .reduce((sum, p) => sum + (p.net_salary || 0), 0);
      
      setStats({
        total_departments: departments.length,
        total_positions: positions.length,
        total_employees: employees.length,
        active_employees: activeEmployees,
        on_leave: onLeave,
        attendance_today: attendanceToday,
        pending_leaves: pendingLeaves,
        monthly_payroll: monthlyPayroll
      });
    } catch (err) {
      console.error('Failed to fetch dashboard stats:', err);
      toast.error('Could not load statistics');
    }
  };

  const fetchRecentEmployees = async () => {
    try {
      const employeesRes = await api.get('/employees');
      const employees = employeesRes.data;
      const sorted = employees
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, 5);
      setRecentEmployees(sorted);
    } catch (err) {
      console.error('Failed to fetch recent employees:', err);
    }
  };

  const fetchTopDepartments = async () => {
    try {
      const [departmentsRes, employeesRes] = await Promise.all([
        api.get('/departments'),
        api.get('/employees')
      ]);
      
      const departments = departmentsRes.data;
      const employees = employeesRes.data;
      
      const deptCounts = departments.map(dept => ({
        ...dept,
        employeeCount: employees.filter(emp => 
          (emp.department_id?._id === dept._id || emp.department_id === dept._id)
        ).length
      }));
      
      const sorted = deptCounts.sort((a, b) => b.employeeCount - a.employeeCount).slice(0, 5);
      setTopDepartments(sorted);
    } catch (err) {
      console.error('Failed to fetch top departments:', err);
    }
  };

  const fetchRecentLeaves = async () => {
    try {
      const leavesRes = await api.get('/leaves');
      const leaves = leavesRes.data;
      const sorted = leaves
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, 5);
      setRecentLeaves(sorted);
    } catch (err) {
      console.error('Failed to fetch recent leaves:', err);
    }
  };

  const StatCard = ({ title, value, icon: Icon, color = 'blue' }) => {
    const colorClasses = {
      blue: 'border-blue-500/30 bg-blue-900/20 text-blue-400',
      green: 'border-green-500/30 bg-green-900/20 text-green-400',
      cyan: 'border-cyan-500/30 bg-cyan-900/20 text-cyan-400',
      yellow: 'border-yellow-500/30 bg-yellow-900/20 text-yellow-400',
      purple: 'border-purple-500/30 bg-purple-900/20 text-purple-400'
    };
    
    return (
      <div className={`bg-gray-800 rounded-xl shadow-md p-4 sm:p-6 hover:shadow-lg transition-all duration-300 border ${colorClasses[color]}`}>
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <p className="text-gray-400 text-xs sm:text-sm font-medium truncate">{title}</p>
            <p className="text-xl sm:text-2xl font-bold mt-1 sm:mt-2 break-words">{value}</p>
          </div>
          <div className={`p-2 sm:p-3 rounded-full flex-shrink-0 ml-2 ${colorClasses[color]}`}>
            <Icon size={20} />
          </div>
        </div>
      </div>
    );
  };

  const getLeaveStatusIcon = (status) => {
    switch(status) {
      case 'pending': return <FiClock className="text-yellow-400" size={14} />;
      case 'approved': return <FiCheckCircle className="text-green-400" size={14} />;
      case 'rejected': return <FiXCircle className="text-red-400" size={14} />;
      default: return null;
    }
  };

  const getLeaveStatusColor = (status) => {
    switch(status) {
      case 'pending': return 'text-yellow-300 bg-yellow-900/30';
      case 'approved': return 'text-green-300 bg-green-900/30';
      case 'rejected': return 'text-red-300 bg-red-900/30';
      default: return 'text-gray-300 bg-gray-700';
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-blue-400">Loading HRMS dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <div className="w-full px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
            HRMS Dashboard
          </h1>
          <p className="text-sm sm:text-base text-gray-400 mt-1">Real-time HR insights and workforce analytics</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6 mb-6 sm:mb-8">
          <StatCard title="Total Departments" value={stats.total_departments} icon={FiBriefcase} color="blue" />
          <StatCard title="Total Positions" value={stats.total_positions} icon={FiAward} color="cyan" />
          <StatCard title="Total Employees" value={stats.total_employees} icon={FiUsers} color="purple" />
          <StatCard title="Monthly Payroll" value={formatCurrency(stats.monthly_payroll)} icon={FiDollarSign} color="green" />
        </div>

        {/* Employee Status Breakdown */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 md:gap-6 mb-6 sm:mb-8">
          <div className="bg-gray-800 rounded-xl shadow-md p-3 sm:p-4 text-center border border-gray-700 hover:border-green-500 transition">
            <FiUserCheck className="text-green-400 mx-auto mb-2" size={24} />
            <p className="text-2xl font-bold text-green-400">{stats.active_employees}</p>
            <p className="text-xs text-gray-400">Active</p>
          </div>
          <div className="bg-gray-800 rounded-xl shadow-md p-3 sm:p-4 text-center border border-gray-700 hover:border-yellow-500 transition">
            <FiClock className="text-yellow-400 mx-auto mb-2" size={24} />
            <p className="text-2xl font-bold text-yellow-400">{stats.on_leave}</p>
            <p className="text-xs text-gray-400">On Leave</p>
          </div>
          <div className="bg-gray-800 rounded-xl shadow-md p-3 sm:p-4 text-center border border-gray-700 hover:border-blue-500 transition">
            <FiCalendar className="text-blue-400 mx-auto mb-2" size={24} />
            <p className="text-2xl font-bold text-blue-400">{stats.attendance_today}</p>
            <p className="text-xs text-gray-400">Present Today</p>
          </div>
          <div className="bg-gray-800 rounded-xl shadow-md p-3 sm:p-4 text-center border border-gray-700 hover:border-yellow-500 transition">
            <FiAlertCircle className="text-yellow-400 mx-auto mb-2" size={24} />
            <p className="text-2xl font-bold text-yellow-400">{stats.pending_leaves}</p>
            <p className="text-xs text-gray-400">Pending Requests</p>
          </div>
        </div>

        {/* Recent Employees & Top Departments */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
          {/* Recent Employees */}
          <div className="bg-gray-800 rounded-xl shadow-md overflow-hidden border border-gray-700">
            <div className="p-4 sm:p-6 border-b border-gray-700">
              <h3 className="text-base sm:text-lg font-bold text-blue-400">Recent Hires</h3>
            </div>
            <div className="divide-y divide-gray-700 max-h-96 overflow-y-auto">
              {recentEmployees.length === 0 ? (
                <div className="p-4 sm:p-6 text-center text-gray-500">No employees found</div>
              ) : (
                recentEmployees.map((employee) => (
                  <div key={employee._id} className="p-3 sm:p-4 hover:bg-gray-700 transition">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="p-2 rounded-full flex-shrink-0 bg-gray-700">
                          <FiUsers className="text-blue-400" size={14} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-gray-200 text-sm sm:text-base truncate">
                            {employee.empFirstname} {employee.empLastname}
                          </p>
                          <p className="text-xs sm:text-sm text-gray-400 truncate">
                            {employee.position_id?.posName || 'No position'} • {employee.department_id?.departName || 'No dept'}
                          </p>
                        </div>
                      </div>
                      <div className="text-left sm:text-right pl-11 sm:pl-0">
                        <p className="text-xs text-gray-500">
                          Hired: {new Date(employee.empHiredate).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Top Departments by Employee Count */}
          <div className="bg-gray-800 rounded-xl shadow-md overflow-hidden border border-gray-700">
            <div className="p-4 sm:p-6 border-b border-gray-700">
              <h3 className="text-base sm:text-lg font-bold text-cyan-400">Top Departments</h3>
            </div>
            <div className="divide-y divide-gray-700">
              {topDepartments.length === 0 ? (
                <div className="p-4 sm:p-6 text-center text-gray-500">No departments found</div>
              ) : (
                topDepartments.map((dept) => (
                  <div key={dept._id} className="p-3 sm:p-4 hover:bg-gray-700 transition">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="w-8 h-8 rounded-full bg-blue-900/50 flex items-center justify-center flex-shrink-0">
                          <FiBriefcase className="text-blue-400" size={14} />
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-gray-200 text-sm sm:text-base truncate">{dept.departName}</p>
                          <p className="text-xs sm:text-sm text-gray-400 truncate">Department</p>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="font-bold text-blue-400 text-sm sm:text-base">
                          {dept.employeeCount} employee{dept.employeeCount !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Recent Leave Requests & Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {/* Recent Leave Requests */}
          <div className="bg-gray-800 rounded-xl shadow-md overflow-hidden border border-gray-700">
            <div className="p-4 sm:p-6 border-b border-gray-700">
              <h3 className="text-base sm:text-lg font-bold text-yellow-400">Recent Leave Requests</h3>
            </div>
            <div className="divide-y divide-gray-700 max-h-96 overflow-y-auto">
              {recentLeaves.length === 0 ? (
                <div className="p-4 sm:p-6 text-center text-gray-500">No leave requests found</div>
              ) : (
                recentLeaves.map((leave) => (
                  <div key={leave._id} className="p-3 sm:p-4 hover:bg-gray-700 transition">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="p-2 rounded-full flex-shrink-0 bg-gray-700">
                          {getLeaveStatusIcon(leave.status)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-gray-200 text-sm sm:text-base truncate">
                            {leave.employee_id?.empFirstname} {leave.employee_id?.empLastname}
                          </p>
                          <p className="text-xs sm:text-sm text-gray-400 truncate">
                            {leave.leave_type} • {new Date(leave.start_date).toLocaleDateString()} - {new Date(leave.end_date).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-left sm:text-right pl-11 sm:pl-0">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getLeaveStatusColor(leave.status)}`}>
                          {leave.status}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-gray-800 rounded-xl shadow-md p-4 sm:p-6 border border-gray-700">
            <h3 className="text-base sm:text-lg font-bold text-blue-400 mb-3 sm:mb-4">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-2 sm:gap-4">
              <button
                onClick={() => window.location.href = '/employees'}
                className="flex flex-col items-center p-3 sm:p-4 bg-gray-700 rounded-xl hover:bg-gray-600 transition border border-gray-600 hover:border-blue-500 group"
              >
                <FiUsers className="text-blue-400 mb-1 sm:mb-2 group-hover:scale-110 transition" size={20} />
                <span className="text-xs sm:text-sm font-medium text-gray-200">Add Employee</span>
              </button>
              <button
                onClick={() => window.location.href = '/attendance'}
                className="flex flex-col items-center p-3 sm:p-4 bg-gray-700 rounded-xl hover:bg-gray-600 transition border border-gray-600 hover:border-cyan-500 group"
              >
                <FiCalendar className="text-cyan-400 mb-1 sm:mb-2 group-hover:scale-110 transition" size={20} />
                <span className="text-xs sm:text-sm font-medium text-gray-200">Mark Attendance</span>
              </button>
              <button
                onClick={() => window.location.href = '/leaves'}
                className="flex flex-col items-center p-3 sm:p-4 bg-gray-700 rounded-xl hover:bg-gray-600 transition border border-gray-600 hover:border-yellow-500 group"
              >
                <FiClock className="text-yellow-400 mb-1 sm:mb-2 group-hover:scale-110 transition" size={20} />
                <span className="text-xs sm:text-sm font-medium text-gray-200">Request Leave</span>
              </button>
              <button
                onClick={() => window.location.href = '/reports'}
                className="flex flex-col items-center p-3 sm:p-4 bg-gray-700 rounded-xl hover:bg-gray-600 transition border border-gray-600 hover:border-purple-500 group"
              >
                <FiBarChart2 className="text-purple-400 mb-1 sm:mb-2 group-hover:scale-110 transition" size={20} />
                <span className="text-xs sm:text-sm font-medium text-gray-200">View Reports</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;