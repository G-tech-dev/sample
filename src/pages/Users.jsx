import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { 
  FiUsers, 
  FiUserPlus, 
  FiEdit2, 
  FiTrash2, 
  FiX, 
  FiRefreshCw,
  FiSearch,
  FiUserCheck,
  FiUserX,
  FiShield,
  FiClock
} from 'react-icons/fi';

const Users = () => {
    const [users, setUsers] = useState([]);
    const [filteredUsers, setFilteredUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentUser, setCurrentUser] = useState(null);
    
    const [formData, setFormData] = useState({
        username: '',
        password: '',
        confirmPassword: '',
        role: 'user'
    });

    useEffect(() => {
        fetchUsers();
        getCurrentUser();
    }, []);

    useEffect(() => {
        // Filter users based on search term
        let filtered = users;
        
        if (searchTerm) {
            filtered = filtered.filter(user => 
                user.username.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }
        
        setFilteredUsers(filtered);
    }, [searchTerm, users]);

    const getCurrentUser = () => {
        const user = {
            user_id: localStorage.getItem('user_id'),
            username: localStorage.getItem('username')
        };
        setCurrentUser(user);
    };

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const response = await axios.get('http://localhost:5000/api/users');
            setUsers(response.data);
            setFilteredUsers(response.data);
            setError('');
            console.log('Users fetched:', response.data);
        } catch (err) {
            const errorMsg = err.response?.data?.error || err.message || 'Failed to fetch users';
            setError(errorMsg);
            toast.error(errorMsg);
            console.error('Fetch error:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Validation
        if (!formData.username.trim()) {
            toast.error('Username is required');
            return;
        }
        
        if (!editingId && !formData.password) {
            toast.error('Password is required for new users');
            return;
        }
        
        if (formData.password && formData.password !== formData.confirmPassword) {
            toast.error('Passwords do not match');
            return;
        }
        
        if (formData.password && formData.password.length < 4) {
            toast.error('Password must be at least 4 characters');
            return;
        }

        setLoading(true);
        try {
            if (editingId) {
                // Update user (excluding password if not provided)
                const updateData = {
                    username: formData.username.trim()
                };
                if (formData.password) {
                    updateData.password = formData.password;
                }
                await axios.put(`http://localhost:5000/api/users/${editingId}`, updateData);
                toast.success('User updated successfully');
            } else {
                // Create new user
                await axios.post('http://localhost:5000/api/users/register', {
                    username: formData.username.trim(),
                    password: formData.password
                });
                toast.success('User created successfully');
            }
            resetForm();
            await fetchUsers();
        } catch (err) {
            const errorMsg = err.response?.data?.error || 'Failed to save user';
            setError(errorMsg);
            toast.error(errorMsg);
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setFormData({
            username: '',
            password: '',
            confirmPassword: '',
            role: 'user'
        });
        setEditingId(null);
        setShowForm(false);
        setError('');
    };

    const handleEdit = (user) => {
        setFormData({
            username: user.username,
            password: '',
            confirmPassword: '',
            role: user.role || 'user'
        });
        setEditingId(user.user_id);
        setShowForm(true);
    };

    const handleDelete = async (user) => {
        // Prevent self-deletion
        if (currentUser && currentUser.user_id == user.user_id) {
            toast.error('You cannot delete your own account');
            return;
        }
        
        if (window.confirm(`Are you sure you want to delete user "${user.username}"?`)) {
            try {
                await axios.delete(`http://localhost:5000/api/users/${user.user_id}`);
                toast.success('User deleted successfully');
                await fetchUsers();
            } catch (err) {
                toast.error('Failed to delete user');
                console.error(err);
            }
        }
    };

    const getInitials = (username) => {
        return username.charAt(0).toUpperCase();
    };

    const getRandomColor = (id) => {
        const colors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 'bg-red-500', 'bg-orange-500'];
        return colors[id % colors.length];
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
    };

    return (
        <div className="min-h-screen bg-gray-100">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
                        <p className="text-gray-600 mt-1">Manage system users and their access</p>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={fetchUsers}
                            className="flex items-center gap-2 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition shadow-md"
                            title="Refresh"
                        >
                            <FiRefreshCw size={18} />
                            Refresh
                        </button>
                        <button
                            onClick={() => setShowForm(!showForm)}
                            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition shadow-md"
                        >
                            {showForm ? <FiX size={18} /> : <FiUserPlus size={18} />}
                            {showForm ? 'Cancel' : 'Add New User'}
                        </button>
                    </div>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded">
                        <p>{error}</p>
                    </div>
                )}

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-white rounded-lg shadow-md p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="text-sm text-gray-500">Total Users</div>
                                <div className="text-2xl font-bold text-gray-800">{users.length}</div>
                            </div>
                            <FiUsers className="text-blue-500" size={28} />
                        </div>
                    </div>
                    <div className="bg-white rounded-lg shadow-md p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="text-sm text-gray-500">Active Users</div>
                                <div className="text-2xl font-bold text-green-600">{users.length}</div>
                            </div>
                            <FiUserCheck className="text-green-500" size={28} />
                        </div>
                    </div>
                    <div className="bg-white rounded-lg shadow-md p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="text-sm text-gray-500">Admin Users</div>
                                <div className="text-2xl font-bold text-purple-600">
                                    {users.filter(u => u.role === 'admin').length}
                                </div>
                            </div>
                            <FiShield className="text-purple-500" size={28} />
                        </div>
                    </div>
                    <div className="bg-white rounded-lg shadow-md p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="text-sm text-gray-500">Regular Users</div>
                                <div className="text-2xl font-bold text-orange-600">
                                    {users.filter(u => u.role !== 'admin').length}
                                </div>
                            </div>
                            <FiUserX className="text-orange-500" size={28} />
                        </div>
                    </div>
                </div>

                {/* Search Bar */}
                <div className="bg-white rounded-lg shadow-md p-4 mb-6">
                    <div className="relative">
                        <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search users by username..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                </div>

                {/* Add/Edit User Form */}
                {showForm && (
                    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                        <h2 className="text-xl font-bold text-gray-800 mb-4">
                            {editingId ? 'Edit User' : 'Add New User'}
                        </h2>
                        <form onSubmit={handleSubmit}>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Username *
                                    </label>
                                    <input
                                        type="text"
                                        name="username"
                                        value={formData.username}
                                        onChange={handleInputChange}
                                        required
                                        placeholder="Enter username"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>
                                
                                {!editingId && (
                                    <>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Password *
                                            </label>
                                            <input
                                                type="password"
                                                name="password"
                                                value={formData.password}
                                                onChange={handleInputChange}
                                                required={!editingId}
                                                placeholder="Enter password"
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Confirm Password *
                                            </label>
                                            <input
                                                type="password"
                                                name="confirmPassword"
                                                value={formData.confirmPassword}
                                                onChange={handleInputChange}
                                                required={!editingId}
                                                placeholder="Confirm password"
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            />
                                        </div>
                                    </>
                                )}
                                
                                {editingId && (
                                    <>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                New Password (optional)
                                            </label>
                                            <input
                                                type="password"
                                                name="password"
                                                value={formData.password}
                                                onChange={handleInputChange}
                                                placeholder="Leave blank to keep current password"
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Confirm New Password
                                            </label>
                                            <input
                                                type="password"
                                                name="confirmPassword"
                                                value={formData.confirmPassword}
                                                onChange={handleInputChange}
                                                placeholder="Confirm new password"
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            />
                                        </div>
                                    </>
                                )}
                            </div>
                            
                            <div className="flex gap-3 mt-6">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-6 py-2 rounded-lg transition"
                                >
                                    {loading ? 'Saving...' : (editingId ? 'Update User' : 'Create User')}
                                </button>
                                <button
                                    type="button"
                                    onClick={resetForm}
                                    className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-lg transition"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* Users Table */}
                {loading && filteredUsers.length === 0 ? (
                    <div className="bg-white rounded-lg shadow-md p-12">
                        <div className="flex justify-center items-center">
                            <div className="text-gray-500">Loading users...</div>
                        </div>
                    </div>
                ) : filteredUsers.length === 0 ? (
                    <div className="bg-white rounded-lg shadow-md p-12 text-center">
                        <FiUsers className="mx-auto text-gray-400 mb-4" size={48} />
                        <p className="text-gray-500 text-lg">No users found.</p>
                        <button
                            onClick={() => setShowForm(true)}
                            className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition"
                        >
                            Add Your First User
                        </button>
                    </div>
                ) : (
                    <div className="bg-white rounded-lg shadow-md overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Username</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created At</th>
                                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {filteredUsers.map((user, index) => (
                                        <tr key={user.user_id} className="hover:bg-gray-50 transition">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                #{user.user_id}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <div className={`w-10 h-10 rounded-full ${getRandomColor(user.user_id)} flex items-center justify-center text-white font-bold`}>
                                                        {getInitials(user.username)}
                                                    </div>
                                                    {currentUser && currentUser.user_id == user.user_id && (
                                                        <span className="ml-2 px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                                                            You
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-gray-900">{user.username}</div>
                                                <div className="text-xs text-gray-500">ID: {user.user_id}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2 py-1 text-xs rounded-full ${
                                                    user.role === 'admin' 
                                                        ? 'bg-purple-100 text-purple-800' 
                                                        : 'bg-blue-100 text-blue-800'
                                                }`}>
                                                    {user.role === 'admin' ? 'Administrator' : 'Regular User'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                <div className="flex items-center gap-1">
                                                    <FiClock size={14} />
                                                    {formatDate(user.created_at)}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center text-sm">
                                                <div className="flex gap-2 justify-center">
                                                    <button
                                                        onClick={() => handleEdit(user)}
                                                        className="text-blue-600 hover:text-blue-800 transition"
                                                        title="Edit User"
                                                    >
                                                        <FiEdit2 size={18} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(user)}
                                                        className={`transition ${
                                                            currentUser && currentUser.user_id == user.user_id
                                                                ? 'text-gray-400 cursor-not-allowed'
                                                                : 'text-red-600 hover:text-red-800'
                                                        }`}
                                                        title="Delete User"
                                                        disabled={currentUser && currentUser.user_id == user.user_id}
                                                    >
                                                        <FiTrash2 size={18} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot className="bg-gray-50">
                                    <tr>
                                        <td colSpan="6" className="px-6 py-4 text-center text-sm text-gray-500">
                                            Total Users: {filteredUsers.length}
                                        </td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Users;