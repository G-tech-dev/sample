// Dashboard.jsx - Fully Responsive Version
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  FiPackage, 
  FiTrendingUp, 
  FiTrendingDown, 
  FiAlertCircle,
  FiDollarSign,
  FiShoppingCart,
  FiTruck,
  FiUsers,
  FiBox,
  FiBarChart2
} from 'react-icons/fi';
import toast from 'react-hot-toast';

const Dashboard = () => {
  const [stats, setStats] = useState({
    total_parts: 0,
    low_stock_items: 0,
    total_inventory_value: 0,
    recent_stock_ins: 0,
    recent_stock_outs: 0,
    recent_stock_in_quantity: 0,
    recent_stock_out_quantity: 0
  });
  const [recentActivities, setRecentActivities] = useState([]);
  const [topParts, setTopParts] = useState([]);
  const [lowStockParts, setLowStockParts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchAllDashboardData();
  }, []);

  const fetchAllDashboardData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchDashboardStats(),
        fetchRecentActivities(),
        fetchTopParts(),
        fetchLowStockParts()
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
      const response = await axios.get('http://localhost:5000/api/dashboard/stats');
      setStats(response.data);
    } catch (err) {
      console.error('Failed to fetch dashboard stats:', err);
    }
  };

  const fetchRecentActivities = async () => {
    try {
      const [stockInRes, stockOutRes] = await Promise.all([
        axios.get('http://localhost:5000/api/stockin'),
        axios.get('http://localhost:5000/api/stockout')
      ]);
      
      const activities = [
        ...stockInRes.data.map(item => ({
          id: `in-${item.stock_in_id}`,
          type: 'in',
          date: new Date(item.stock_in_date),
          quantity: item.stock_in_quantity,
          part_name: item.part_name,
          reference: item.invoice_number || 'N/A',
          supplier: item.supplier_name || 'N/A'
        })),
        ...stockOutRes.data.map(item => ({
          id: `out-${item.stock_out_id}`,
          type: 'out',
          date: new Date(item.stockoutDate),
          quantity: item.stockoutquantity,
          part_name: item.part_name,
          destination: item.destination || 'N/A',
          customer: item.customer_name || 'N/A'
        }))
      ].sort((a, b) => b.date - a.date).slice(0, 10);
      
      setRecentActivities(activities);
    } catch (err) {
      console.error('Failed to fetch activities:', err);
    }
  };

  const fetchTopParts = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/spareparts');
      const sorted = response.data.sort((a, b) => b.quantity - a.quantity).slice(0, 5);
      setTopParts(sorted);
    } catch (err) {
      console.error('Failed to fetch top parts:', err);
    }
  };

  const fetchLowStockParts = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/spareparts');
      const lowStock = response.data.filter(part => part.quantity < 10).slice(0, 5);
      setLowStockParts(lowStock);
    } catch (err) {
      console.error('Failed to fetch low stock parts:', err);
    }
  };

  const StatCard = ({ title, value, icon: Icon, color, trend, trendValue }) => (
    <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-gray-500 text-xs sm:text-sm font-medium truncate">{title}</p>
          <p className="text-xl sm:text-2xl font-bold text-gray-800 mt-1 sm:mt-2 break-words">{value}</p>
          {trend && (
            <div className="flex items-center mt-1 sm:mt-2">
              {trend === 'up' ? (
                <FiTrendingUp className="text-green-500 mr-1" size={12} />
              ) : (
                <FiTrendingDown className="text-red-500 mr-1" size={12} />
              )}
              <span className={`text-xs ${trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                {trendValue}
              </span>
            </div>
          )}
        </div>
        <div className={`p-2 sm:p-3 rounded-full bg-${color}-100 flex-shrink-0 ml-2`}>
          <Icon className={`text-${color}-600`} size={20} />
        </div>
      </div>
    </div>
  );

  const getStockStatusColor = (quantity) => {
    if (quantity === 0) return 'text-red-600';
    if (quantity < 10) return 'text-orange-600';
    if (quantity < 30) return 'text-yellow-600';
    return 'text-green-600';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="w-full px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">Real-time inventory insights and analytics</p>
        </div>

        {/* Stats Grid - Responsive columns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6 mb-6 sm:mb-8">
          <StatCard
            title="Total Parts"
            value={stats.total_parts}
            icon={FiPackage}
            color="blue"
          />
          <StatCard
            title="Inventory Value"
            value={`$${stats.total_inventory_value?.toLocaleString() || '0'}`}
            icon={FiDollarSign}
            color="green"
          />
          <StatCard
            title="Low Stock Alerts"
            value={stats.low_stock_items}
            icon={FiAlertCircle}
            color="orange"
          />
          <StatCard
            title="Total Transactions (30d)"
            value={(stats.recent_stock_ins || 0) + (stats.recent_stock_outs || 0)}
            icon={FiBarChart2}
            color="purple"
          />
        </div>

        {/* Second Row Stats - Responsive */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6 mb-6 sm:mb-8">
          <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-gray-500 text-xs sm:text-sm">Stock In (30 days)</p>
                <p className="text-xl sm:text-2xl font-bold text-green-600">+{stats.recent_stock_in_quantity || 0}</p>
                <p className="text-xs text-gray-400 mt-1">{stats.recent_stock_ins || 0} transactions</p>
              </div>
              <FiTruck className="text-green-500 flex-shrink-0 ml-2" size={24} />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-gray-500 text-xs sm:text-sm">Stock Out (30 days)</p>
                <p className="text-xl sm:text-2xl font-bold text-red-600">-{stats.recent_stock_out_quantity || 0}</p>
                <p className="text-xs text-gray-400 mt-1">{stats.recent_stock_outs || 0} transactions</p>
              </div>
              <FiShoppingCart className="text-red-500 flex-shrink-0 ml-2" size={24} />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 sm:col-span-2 lg:col-span-1">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-gray-500 text-xs sm:text-sm">Net Movement</p>
                <p className={`text-xl sm:text-2xl font-bold ${(stats.recent_stock_in_quantity || 0) - (stats.recent_stock_out_quantity || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {(stats.recent_stock_in_quantity || 0) - (stats.recent_stock_out_quantity || 0)}
                </p>
                <p className="text-xs text-gray-400 mt-1">Last 30 days</p>
              </div>
              <FiTrendingUp className="text-blue-500 flex-shrink-0 ml-2" size={24} />
            </div>
          </div>
        </div>

        {/* Recent Activities and Stock Info */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {/* Recent Activities */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="p-4 sm:p-6 border-b border-gray-200">
              <h3 className="text-base sm:text-lg font-bold text-gray-800">Recent Activities</h3>
            </div>
            <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
              {recentActivities.length === 0 ? (
                <div className="p-4 sm:p-6 text-center text-gray-500">
                  No recent activities
                </div>
              ) : (
                recentActivities.map((activity) => (
                  <div key={activity.id} className="p-3 sm:p-4 hover:bg-gray-50 transition">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-full flex-shrink-0 ${
                          activity.type === 'in' ? 'bg-green-100' : 'bg-red-100'
                        }`}>
                          {activity.type === 'in' ? (
                            <FiTrendingUp className="text-green-600" size={14} />
                          ) : (
                            <FiTrendingDown className="text-red-600" size={14} />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-gray-800 text-sm sm:text-base truncate">{activity.part_name}</p>
                          <p className="text-xs sm:text-sm text-gray-500 break-words">
                            {activity.type === 'in' ? 'Stock In' : 'Stock Out'} • 
                            Quantity: {activity.quantity}
                          </p>
                        </div>
                      </div>
                      <div className="text-left sm:text-right pl-11 sm:pl-0">
                        <p className="text-xs sm:text-sm text-gray-500">
                          {activity.date.toLocaleDateString()}
                        </p>
                        <p className="text-xs text-gray-400">
                          {activity.date.toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Top Stock and Low Stock Combined */}
          <div className="space-y-4 sm:space-y-6">
            {/* Top Stock Items */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="p-4 sm:p-6 border-b border-gray-200">
                <h3 className="text-base sm:text-lg font-bold text-gray-800">Top Stock Items</h3>
              </div>
              <div className="divide-y divide-gray-200">
                {topParts.length === 0 ? (
                  <div className="p-4 sm:p-6 text-center text-gray-500">
                    No parts available
                  </div>
                ) : (
                  topParts.map((part) => (
                    <div key={part.part_id} className="p-3 sm:p-4 hover:bg-gray-50 transition">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                            <FiBox className="text-blue-600" size={14} />
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-gray-800 text-sm sm:text-base truncate">{part.name}</p>
                            <p className="text-xs sm:text-sm text-gray-500 truncate">{part.category}</p>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className={`font-bold text-sm sm:text-base ${getStockStatusColor(part.quantity)}`}>
                            {part.quantity} units
                          </p>
                          <p className="text-xs sm:text-sm text-gray-500">
                            ${(part.quantity * part.unitprice).toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Low Stock Alerts */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="p-4 sm:p-6 border-b border-gray-200">
                <h3 className="text-base sm:text-lg font-bold text-orange-600 flex items-center gap-2">
                  <FiAlertCircle size={18} />
                  Low Stock Alerts
                </h3>
              </div>
              <div className="divide-y divide-gray-200">
                {lowStockParts.length === 0 ? (
                  <div className="p-4 sm:p-6 text-center text-gray-500">
                    No low stock items
                  </div>
                ) : (
                  lowStockParts.map((part) => (
                    <div key={part.part_id} className="p-3 sm:p-4 hover:bg-gray-50 transition">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-medium text-gray-800 text-sm sm:text-base truncate">{part.name}</p>
                          <p className="text-xs sm:text-sm text-gray-500 truncate">{part.category}</p>
                        </div>
                        <div className="text-left sm:text-right">
                          <p className="font-bold text-red-600 text-sm sm:text-base">
                            Only {part.quantity} units left
                          </p>
                          <button 
                            onClick={() => window.location.href = '/stockin'}
                            className="text-xs bg-orange-100 text-orange-600 px-2 py-1 rounded mt-1 hover:bg-orange-200 w-full sm:w-auto"
                          >
                            Restock Now
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions - Responsive grid */}
        <div className="mt-6 sm:mt-8 bg-white rounded-lg shadow-md p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-bold text-gray-800 mb-3 sm:mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
            <button
              onClick={() => window.location.href = '/stockin'}
              className="flex flex-col items-center p-3 sm:p-4 bg-green-50 rounded-lg hover:bg-green-100 transition"
            >
              <FiTruck className="text-green-600 mb-1 sm:mb-2" size={20} />
              <span className="text-xs sm:text-sm font-medium text-gray-700">New Stock In</span>
            </button>
            <button
              onClick={() => window.location.href = '/stockout'}
              className="flex flex-col items-center p-3 sm:p-4 bg-red-50 rounded-lg hover:bg-red-100 transition"
            >
              <FiShoppingCart className="text-red-600 mb-1 sm:mb-2" size={20} />
              <span className="text-xs sm:text-sm font-medium text-gray-700">New Stock Out</span>
            </button>
            <button
              onClick={() => window.location.href = '/spareparts'}
              className="flex flex-col items-center p-3 sm:p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition"
            >
              <FiPackage className="text-blue-600 mb-1 sm:mb-2" size={20} />
              <span className="text-xs sm:text-sm font-medium text-gray-700">Manage Parts</span>
            </button>
            <button
              onClick={() => window.location.href = '/users'}
              className="flex flex-col items-center p-3 sm:p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition"
            >
              <FiUsers className="text-purple-600 mb-1 sm:mb-2" size={20} />
              <span className="text-xs sm:text-sm font-medium text-gray-700">Manage Users</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;