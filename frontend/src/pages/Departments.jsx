// Departments.jsx – Manage Departments (e.g., IT, HR, Finance, Sales) – Professional Blue/Cyan Theme
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { 
  FiBriefcase, 
  FiPlus, 
  FiEdit2, 
  FiTrash2, 
  FiRefreshCw,
  FiX,
  FiCheck,
  FiUsers
} from 'react-icons/fi';

const api = axios.create({
  baseURL: 'http://localhost:5000/api', // Updated to HRMS backend port
  withCredentials: true
});

const Departments = () => {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState(null);
  const [formData, setFormData] = useState({ 
    departName: '',
    description: '' 
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    setLoading(true);
    try {
      const response = await api.get('/departments');
      setDepartments(response.data);
    } catch (err) {
      console.error('Failed to fetch departments:', err);
      toast.error('Failed to load departments');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (department = null) => {
    if (department) {
      setEditingDepartment(department);
      setFormData({ 
        departName: department.departName,
        description: department.description || '' 
      });
    } else {
      setEditingDepartment(null);
      setFormData({ 
        departName: '',
        description: '' 
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingDepartment(null);
    setFormData({ 
      departName: '',
      description: '' 
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.departName.trim()) {
      toast.error('Department name is required');
      return;
    }
    setSubmitting(true);
    try {
      if (editingDepartment) {
        await api.put(`/departments/${editingDepartment._id}`, { 
          departName: formData.departName.trim(),
          description: formData.description.trim() 
        });
        toast.success('Department updated successfully');
      } else {
        await api.post('/departments', { 
          departName: formData.departName.trim(),
          description: formData.description.trim() 
        });
        toast.success('Department created successfully');
      }
      fetchDepartments();
      handleCloseModal();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save department');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (department) => {
    if (!window.confirm(`Are you sure you want to delete the department "${department.departName}"? This may affect employees and positions.`)) return;
    try {
      await api.delete(`/departments/${department._id}`);
      toast.success('Department deleted successfully');
      fetchDepartments();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to delete department');
    }
  };

  return (
    <div className="min-h-screen bg-black">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                Departments
              </h1>
              <p className="text-gray-400 mt-1 flex items-center gap-1">
                <FiBriefcase size={14} /> Manage organizational departments
              </p>
            </div>
            <div className="flex gap-3 w-full sm:w-auto">
              <button 
                onClick={fetchDepartments} 
                className="flex items-center gap-2 bg-gray-800 border border-gray-700 hover:bg-gray-700 text-gray-200 px-4 py-2 rounded-xl shadow-sm transition-all duration-200"
              >
                <FiRefreshCw size={16} /> Refresh
              </button>
              <button 
                onClick={() => handleOpenModal()} 
                className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white px-5 py-2 rounded-xl shadow-md transition-all duration-200 font-medium"
              >
                <FiPlus size={16} /> Add Department
              </button>
            </div>
          </div>
        </div>

        {/* Departments Grid */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        ) : departments.length === 0 ? (
          <div className="bg-gray-800 rounded-2xl shadow-sm p-12 text-center border border-gray-700">
            <div className="w-20 h-20 bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <FiBriefcase className="text-blue-400" size={32} />
            </div>
            <h3 className="text-lg font-semibold text-gray-200">No departments yet</h3>
            <p className="text-gray-400 mt-1">Create your first department to get started.</p>
            <button 
              onClick={() => handleOpenModal()} 
              className="mt-4 bg-gradient-to-r from-blue-500 to-cyan-600 text-white px-5 py-2 rounded-xl inline-flex items-center gap-2 hover:from-blue-600 hover:to-cyan-700 transition font-medium"
            >
              <FiPlus size={16} /> Create Department
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {departments.map((department) => (
              <div 
                key={department._id} 
                className="group bg-gray-800 rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-700 hover:border-blue-500"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-blue-900/30 flex items-center justify-center">
                        <FiBriefcase className="text-blue-400" size={20} />
                      </div>
                      <div>
                        <h3 className="font-bold text-lg text-gray-100">{department.departName}</h3>
                        <p className="text-xs text-gray-500 font-mono">ID: {department._id.slice(-6)}</p>
                      </div>
                    </div>
                    <div className="flex gap-1 opacity-70 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleOpenModal(department)}
                        className="p-1.5 text-blue-400 hover:bg-blue-900/30 rounded-lg transition"
                        title="Edit"
                      >
                        <FiEdit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(department)}
                        className="p-1.5 text-red-400 hover:bg-red-900/30 rounded-lg transition"
                        title="Delete"
                      >
                        <FiTrash2 size={16} />
                      </button>
                    </div>
                  </div>
                  {department.description && (
                    <div className="mt-3 text-sm text-gray-400 line-clamp-2">
                      {department.description}
                    </div>
                  )}
                  <div className="mt-4 pt-3 border-t border-gray-700 text-xs text-gray-500 flex justify-between">
                    <span className="flex items-center gap-1">
                      <FiUsers size={12} /> 
                      Created: {new Date(department.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal for Add/Edit Department – Dark theme */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md transform transition-all duration-300 scale-100 border border-gray-700">
            <div className="flex justify-between items-center p-6 border-b border-gray-700">
              <h2 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                {editingDepartment ? 'Edit Department' : 'New Department'}
              </h2>
              <button onClick={handleCloseModal} className="text-gray-400 hover:text-gray-200 transition p-1 rounded-full hover:bg-gray-700">
                <FiX size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-200 mb-1">Department Name *</label>
                <input
                  type="text"
                  value={formData.departName}
                  onChange={(e) => setFormData({ ...formData, departName: e.target.value })}
                  placeholder="e.g., Information Technology, Human Resources, Finance"
                  className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-2.5 text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-200 mb-1">Description (Optional)</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description of the department's function..."
                  rows="3"
                  className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-2.5 text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition resize-none"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 text-gray-200 py-2.5 rounded-xl font-medium transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white py-2.5 rounded-xl font-medium flex items-center justify-center gap-2 shadow-md transition disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : <><FiCheck size={16} /> {editingDepartment ? 'Update' : 'Create'}</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Departments;