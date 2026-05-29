// Dashboard.jsx - Fully Responsive Version for XWISDOM Training Management (Black/Amber Theme)
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  FiBriefcase,
  FiBook,
  FiUsers,
  FiBookOpen,
  FiTrendingUp, 
  FiTrendingDown, 
  FiAlertCircle,
  FiCheckCircle,
  FiXCircle,
  FiClock,
  FiAward,
  FiBarChart2
} from 'react-icons/fi';
import toast from 'react-hot-toast';

const api = axios.create({
  baseURL: 'http://localhost:3000/api',
  withCredentials: true
});

const Dashboard = () => {
  const [stats, setStats] = useState({
    total_trades: 0,
    total_modules: 0,
    total_trainees: 0,
    total_enrollments: 0,
    enrolled_count: 0,
    completed_count: 0,
    dropped_count: 0,
    failed_count: 0
  });
  const [recentEnrollments, setRecentEnrollments] = useState([]);
  const [topTrades, setTopTrades] = useState([]);
  const [recentTrainees, setRecentTrainees] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAllDashboardData();
  }, []);

  const fetchAllDashboardData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchDashboardStats(),
        fetchRecentEnrollments(),
        fetchTopTrades(),
        fetchRecentTrainees()
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
      const [tradesRes, modulesRes, traineesRes] = await Promise.all([
        api.get('/trades'),
        api.get('/modules'),
        api.get('/trainees')
      ]);
      
      const trades = tradesRes.data;
      const modules = modulesRes.data;
      const trainees = traineesRes.data;
      
      let totalEnrollments = 0;
      let enrolled = 0, completed = 0, dropped = 0, failed = 0;
      
      trainees.forEach(trainee => {
        if (trainee.enrollments) {
          totalEnrollments += trainee.enrollments.length;
          trainee.enrollments.forEach(enrollment => {
            switch (enrollment.completion_status) {
              case 'enrolled': enrolled++; break;
              case 'completed': completed++; break;
              case 'dropped': dropped++; break;
              case 'failed': failed++; break;
              default: break;
            }
          });
        }
      });
      
      setStats({
        total_trades: trades.length,
        total_modules: modules.length,
        total_trainees: trainees.length,
        total_enrollments: totalEnrollments,
        enrolled_count: enrolled,
        completed_count: completed,
        dropped_count: dropped,
        failed_count: failed
      });
    } catch (err) {
      console.error('Failed to fetch dashboard stats:', err);
      toast.error('Could not load statistics');
    }
  };

  const fetchRecentEnrollments = async () => {
    try {
      const traineesRes = await api.get('/trainees');
      const trainees = traineesRes.data;
      
      let allEnrollments = [];
      for (const trainee of trainees) {
        if (trainee.enrollments && trainee.enrollments.length > 0) {
          for (const enrollment of trainee.enrollments) {
            let moduleName = enrollment.module_id?.module_name || 'Unknown Module';
            allEnrollments.push({
              id: `${trainee._id}-${enrollment._id}`,
              traineeName: `${trainee.firstnames} ${trainee.lastnames}`,
              moduleName: moduleName,
              status: enrollment.completion_status,
              enrollmentDate: new Date(enrollment.enrollment_date),
              grade: enrollment.grade
            });
          }
        }
      }
      
      const sorted = allEnrollments.sort((a,b) => b.enrollmentDate - a.enrollmentDate).slice(0, 10);
      setRecentEnrollments(sorted);
    } catch (err) {
      console.error('Failed to fetch recent enrollments:', err);
    }
  };

  const fetchTopTrades = async () => {
    try {
      const [tradesRes, traineesRes] = await Promise.all([
        api.get('/trades'),
        api.get('/trainees')
      ]);
      
      const trades = tradesRes.data;
      const trainees = traineesRes.data;
      
      const tradeCounts = trades.map(trade => ({
        ...trade,
        traineeCount: trainees.filter(t => t.trade_id?._id === trade._id || t.trade_id === trade._id).length
      }));
      
      const sorted = tradeCounts.sort((a,b) => b.traineeCount - a.traineeCount).slice(0, 5);
      setTopTrades(sorted);
    } catch (err) {
      console.error('Failed to fetch top trades:', err);
    }
  };

  const fetchRecentTrainees = async () => {
    try {
      const traineesRes = await api.get('/trainees');
      const trainees = traineesRes.data;
      const sorted = trainees.sort((a,b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 5);
      setRecentTrainees(sorted);
    } catch (err) {
      console.error('Failed to fetch recent trainees:', err);
    }
  };

  const StatCard = ({ title, value, icon: Icon }) => (
    <div className="bg-gray-800 rounded-xl shadow-md p-4 sm:p-6 hover:shadow-lg transition-all duration-300 border border-gray-700 hover:border-amber-500">
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-gray-400 text-xs sm:text-sm font-medium truncate">{title}</p>
          <p className="text-xl sm:text-2xl font-bold text-amber-400 mt-1 sm:mt-2 break-words">{value}</p>
        </div>
        <div className="p-2 sm:p-3 rounded-full bg-amber-900/30 flex-shrink-0 ml-2">
          <Icon className="text-amber-400" size={20} />
        </div>
      </div>
    </div>
  );

  const getStatusIcon = (status) => {
    switch(status) {
      case 'enrolled': return <FiClock className="text-blue-400" size={14} />;
      case 'completed': return <FiCheckCircle className="text-green-400" size={14} />;
      case 'dropped': return <FiXCircle className="text-red-400" size={14} />;
      case 'failed': return <FiAlertCircle className="text-orange-400" size={14} />;
      default: return null;
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'enrolled': return 'text-blue-300 bg-blue-900/30';
      case 'completed': return 'text-green-300 bg-green-900/30';
      case 'dropped': return 'text-red-300 bg-red-900/30';
      case 'failed': return 'text-orange-300 bg-orange-900/30';
      default: return 'text-gray-300 bg-gray-700';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500 mx-auto"></div>
          <p className="mt-4 text-amber-400">Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <div className="w-full px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-amber-400">Training Dashboard</h1>
          <p className="text-sm sm:text-base text-gray-400 mt-1">Real-time insights on trades, modules, and trainees</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6 mb-6 sm:mb-8">
          <StatCard title="Total Trades" value={stats.total_trades} icon={FiBriefcase} />
          <StatCard title="Total Modules" value={stats.total_modules} icon={FiBook} />
          <StatCard title="Total Trainees" value={stats.total_trainees} icon={FiUsers} />
          <StatCard title="Total Enrollments" value={stats.total_enrollments} icon={FiBookOpen} />
        </div>

        {/* Enrollment Status Breakdown */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 md:gap-6 mb-6 sm:mb-8">
          <div className="bg-gray-800 rounded-xl shadow-md p-3 sm:p-4 text-center border border-gray-700 hover:border-blue-500 transition">
            <FiClock className="text-blue-400 mx-auto mb-2" size={24} />
            <p className="text-2xl font-bold text-blue-400">{stats.enrolled_count}</p>
            <p className="text-xs text-gray-400">Enrolled</p>
          </div>
          <div className="bg-gray-800 rounded-xl shadow-md p-3 sm:p-4 text-center border border-gray-700 hover:border-green-500 transition">
            <FiCheckCircle className="text-green-400 mx-auto mb-2" size={24} />
            <p className="text-2xl font-bold text-green-400">{stats.completed_count}</p>
            <p className="text-xs text-gray-400">Completed</p>
          </div>
          <div className="bg-gray-800 rounded-xl shadow-md p-3 sm:p-4 text-center border border-gray-700 hover:border-red-500 transition">
            <FiXCircle className="text-red-400 mx-auto mb-2" size={24} />
            <p className="text-2xl font-bold text-red-400">{stats.dropped_count}</p>
            <p className="text-xs text-gray-400">Dropped</p>
          </div>
          <div className="bg-gray-800 rounded-xl shadow-md p-3 sm:p-4 text-center border border-gray-700 hover:border-orange-500 transition">
            <FiAlertCircle className="text-orange-400 mx-auto mb-2" size={24} />
            <p className="text-2xl font-bold text-orange-400">{stats.failed_count}</p>
            <p className="text-xs text-gray-400">Failed</p>
          </div>
        </div>

        {/* Recent Enrollments & Top Trades */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
          {/* Recent Enrollments */}
          <div className="bg-gray-800 rounded-xl shadow-md overflow-hidden border border-gray-700">
            <div className="p-4 sm:p-6 border-b border-gray-700">
              <h3 className="text-base sm:text-lg font-bold text-amber-400">Recent Enrollments</h3>
            </div>
            <div className="divide-y divide-gray-700 max-h-96 overflow-y-auto">
              {recentEnrollments.length === 0 ? (
                <div className="p-4 sm:p-6 text-center text-gray-500">No recent enrollments</div>
              ) : (
                recentEnrollments.map((enrollment) => (
                  <div key={enrollment.id} className="p-3 sm:p-4 hover:bg-gray-700 transition">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="p-2 rounded-full flex-shrink-0 bg-gray-700">
                          {getStatusIcon(enrollment.status)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-gray-200 text-sm sm:text-base truncate">{enrollment.traineeName}</p>
                          <p className="text-xs sm:text-sm text-gray-400 truncate">{enrollment.moduleName}</p>
                        </div>
                      </div>
                      <div className="text-left sm:text-right pl-11 sm:pl-0">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(enrollment.status)}`}>
                          {enrollment.status}
                        </span>
                        <p className="text-xs text-gray-500 mt-1">{enrollment.enrollmentDate.toLocaleDateString()}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Top Trades by Trainee Count */}
          <div className="bg-gray-800 rounded-xl shadow-md overflow-hidden border border-gray-700">
            <div className="p-4 sm:p-6 border-b border-gray-700">
              <h3 className="text-base sm:text-lg font-bold text-amber-400">Top Trades by Trainees</h3>
            </div>
            <div className="divide-y divide-gray-700">
              {topTrades.length === 0 ? (
                <div className="p-4 sm:p-6 text-center text-gray-500">No trades found</div>
              ) : (
                topTrades.map((trade) => (
                  <div key={trade._id} className="p-3 sm:p-4 hover:bg-gray-700 transition">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="w-8 h-8 rounded-full bg-amber-900/50 flex items-center justify-center flex-shrink-0">
                          <FiBriefcase className="text-amber-400" size={14} />
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-gray-200 text-sm sm:text-base truncate">{trade.trade_name}</p>
                          <p className="text-xs sm:text-sm text-gray-400 truncate">Trade</p>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="font-bold text-amber-400 text-sm sm:text-base">
                          {trade.traineeCount} trainee{trade.traineeCount !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Recent Trainees and Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {/* Recent Trainees */}
          <div className="bg-gray-800 rounded-xl shadow-md overflow-hidden border border-gray-700">
            <div className="p-4 sm:p-6 border-b border-gray-700">
              <h3 className="text-base sm:text-lg font-bold text-amber-400">Recent Trainees</h3>
            </div>
            <div className="divide-y divide-gray-700">
              {recentTrainees.length === 0 ? (
                <div className="p-4 sm:p-6 text-center text-gray-500">No trainees found</div>
              ) : (
                recentTrainees.map((trainee) => (
                  <div key={trainee._id} className="p-3 sm:p-4 hover:bg-gray-700 transition">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="w-8 h-8 rounded-full bg-amber-900/50 flex items-center justify-center flex-shrink-0">
                          <FiUsers className="text-amber-400" size={14} />
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-gray-200 text-sm sm:text-base truncate">
                            {trainee.firstnames} {trainee.lastnames}
                          </p>
                          <p className="text-xs sm:text-sm text-gray-400 truncate">
                            {trainee.trade_id?.trade_name || 'No trade'}
                          </p>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-xs text-gray-500">{new Date(trainee.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-gray-800 rounded-xl shadow-md p-4 sm:p-6 border border-gray-700">
            <h3 className="text-base sm:text-lg font-bold text-amber-400 mb-3 sm:mb-4">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-2 sm:gap-4">
              <button
                onClick={() => window.location.href = '/trades'}
                className="flex flex-col items-center p-3 sm:p-4 bg-gray-700 rounded-xl hover:bg-gray-600 transition border border-gray-600 hover:border-amber-500 group"
              >
                <FiBriefcase className="text-amber-400 mb-1 sm:mb-2 group-hover:scale-110 transition" size={20} />
                <span className="text-xs sm:text-sm font-medium text-gray-200">Manage Trades</span>
              </button>
              <button
                onClick={() => window.location.href = '/modules'}
                className="flex flex-col items-center p-3 sm:p-4 bg-gray-700 rounded-xl hover:bg-gray-600 transition border border-gray-600 hover:border-amber-500 group"
              >
                <FiBook className="text-amber-400 mb-1 sm:mb-2 group-hover:scale-110 transition" size={20} />
                <span className="text-xs sm:text-sm font-medium text-gray-200">Manage Modules</span>
              </button>
              <button
                onClick={() => window.location.href = '/trainees'}
                className="flex flex-col items-center p-3 sm:p-4 bg-gray-700 rounded-xl hover:bg-gray-600 transition border border-gray-600 hover:border-amber-500 group"
              >
                <FiUsers className="text-amber-400 mb-1 sm:mb-2 group-hover:scale-110 transition" size={20} />
                <span className="text-xs sm:text-sm font-medium text-gray-200">Manage Trainees</span>
              </button>
              <button
                onClick={() => window.location.href = '/trainees'}
                className="flex flex-col items-center p-3 sm:p-4 bg-gray-700 rounded-xl hover:bg-gray-600 transition border border-gray-600 hover:border-amber-500 group"
              >
                <FiBookOpen className="text-amber-400 mb-1 sm:mb-2 group-hover:scale-110 transition" size={20} />
                <span className="text-xs sm:text-sm font-medium text-gray-200">Enroll Trainee</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;