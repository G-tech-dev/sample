// Positions.jsx – Manage Positions (e.g., Software Engineer, HR Manager, Accountant) – Professional Blue/Cyan Theme
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { 
  FiBriefcase, FiPlus, FiEdit2, FiTrash2, FiRefreshCw, FiX, FiCheck,
  FiAward, FiUsers, FiUserPlus, FiDollarSign, FiMapPin
} from 'react-icons/fi';

const api = axios.create({
  baseURL: 'http://localhost:5000/api', // Updated to HRMS backend port
  withCredentials: true
});

const Positions = () => {
  const [positions, setPositions] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPosition, setEditingPosition] = useState(null);
  const [formData, setFormData] = useState({
    posName: '',
    requiredQualification: '',
    department_id: '',
    salary_range: {
      min: '',
      max: ''
    }
  });
  const [submitting, setSubmitting] = useState(false);

  // Assignment modal state
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState(null);
  const [availableEmployees, setAvailableEmployees] = useState([]);
  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const [assigning, setAssigning] = useState(false);

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [positionsRes, departmentsRes, employeesRes] = await Promise.all([
        api.get('/positions'),
        api.get('/departments'),
        api.get('/employees')
      ]);
      setPositions(positionsRes.data);
      setDepartments(departmentsRes.data);
      setEmployees(employeesRes.data);
    } catch (err) {
      console.error('Failed to fetch data:', err);
      toast.error('Failed to load positions');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (position = null) => {
    if (position) {
      setEditingPosition(position);
      setFormData({
        posName: position.posName,
        requiredQualification: position.requiredQualification,
        department_id: position.department_id?._id || position.department_id,
        salary_range: {
          min: position.salary_range?.min || '',
          max: position.salary_range?.max || ''
        }
      });
    } else {
      setEditingPosition(null);
      setFormData({
        posName: '',
        requiredQualification: '',
        department_id: '',
        salary_range: {
          min: '',
          max: ''
        }
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingPosition(null);
    setFormData({
      posName: '',
      requiredQualification: '',
      department_id: '',
      salary_range: {
        min: '',
        max: ''
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.posName.trim() || !formData.requiredQualification.trim() || !formData.department_id) {
      toast.error('All fields are required');
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        posName: formData.posName.trim(),
        requiredQualification: formData.requiredQualification.trim(),
        department_id: formData.department_id,
        salary_range: {
          min: Number(formData.salary_range.min) || 0,
          max: Number(formData.salary_range.max) || 0
        }
      };
      if (editingPosition) {
        await api.put(`/positions/${editingPosition._id}`, payload);
        toast.success('Position updated successfully');
      } else {
        await api.post('/positions', payload);
        toast.success('Position created successfully');
      }
      fetchAllData();
      handleCloseModal();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save position');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (position) => {
    if (!window.confirm(`Delete position "${position.posName}"? This will remove it from all employees.`)) return;
    try {
      await api.delete(`/positions/${position._id}`);
      toast.success('Position deleted successfully');
      fetchAllData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Delete failed');
    }
  };

  // ========== ASSIGNMENT LOGIC ==========
  const openAssignModal = (position) => {
    setSelectedPosition(position);
    // Find employees that are NOT already assigned to this position
    const eligible = employees.filter(emp => 
      emp.position_id?._id !== position._id && 
      emp.position_id !== position._id &&
      emp.empstatus === 'active'
    );
    setAvailableEmployees(eligible);
    setSelectedEmployees([]);
    setShowAssignModal(true);
  };

  const handleToggleEmployee = (employeeId) => {
    setSelectedEmployees(prev =>
      prev.includes(employeeId) ? prev.filter(id => id !== employeeId) : [...prev, employeeId]
    );
  };

  const handleAssign = async () => {
    if (selectedEmployees.length === 0) {
      toast.error('Select at least one employee');
      return;
    }
    setAssigning(true);
    try {
      // Assign each selected employee to this position
      for (const employeeId of selectedEmployees) {
        await api.put(`/employees/${employeeId}`, {
          position_id: selectedPosition._id
        });
      }
      toast.success(`${selectedEmployees.length} employee(s) assigned successfully`);
      fetchAllData(); // refresh to update assigned counts
      setShowAssignModal(false);
      setSelectedEmployees([]);
      setSelectedPosition(null);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Assignment failed');
    } finally {
      setAssigning(false);
    }
  };

  // Helper to get assigned employees count for a position
  const getAssignedCount = (position) => {
    return employees.filter(emp => 
      emp.position_id?._id === position._id || emp.position_id === position._id
    ).length;
  };

  // Helper to get assigned employees names (first 3)
  const getAssignedNames = (position) => {
    const assigned = employees.filter(emp => 
      emp.position_id?._id === position._id || emp.position_id === position._id
    ).slice(0, 3);
    return assigned.map(emp => `${emp.empFirstname} ${emp.empLastname}`).join(', ');
  };

  // Format salary range display
  const formatSalaryRange = (min, max) => {
    if (!min && !max) return 'Not specified';
    if (min && max) return `$${min.toLocaleString()} - $${max.toLocaleString()}`;
    if (min) return `From $${min.toLocaleString()}`;
    return `Up to $${max.toLocaleString()}`;
  };

  return (
    <div className="min-h-screen bg-black">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                Positions
              </h1>
              <p className="text-gray-400 mt-1 flex items-center gap-1">
                <FiBriefcase size={14} /> Manage job positions and assign employees
              </p>
            </div>
            <div className="flex gap-3 w-full sm:w-auto">
              <button onClick={fetchAllData} className="flex items-center gap-2 bg-gray-800 border border-gray-700 hover:bg-gray-700 text-gray-200 px-4 py-2 rounded-xl shadow-sm transition">
                <FiRefreshCw size={16} /> Refresh
              </button>
              <button onClick={() => handleOpenModal()} className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white px-5 py-2 rounded-xl shadow-md transition font-medium">
                <FiPlus size={16} /> Add Position
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        ) : positions.length === 0 ? (
          <div className="bg-gray-800 rounded-2xl shadow-sm p-12 text-center border border-gray-700">
            <div className="w-20 h-20 bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <FiBriefcase className="text-blue-400" size={32} />
            </div>
            <h3 className="text-lg font-semibold text-gray-200">No positions yet</h3>
            <p className="text-gray-400 mt-1">Create your first position to get started.</p>
            <button onClick={() => handleOpenModal()} className="mt-4 bg-gradient-to-r from-blue-500 to-cyan-600 text-white px-5 py-2 rounded-xl inline-flex items-center gap-2 hover:from-blue-600 hover:to-cyan-700 transition font-medium">
              <FiPlus size={16} /> Create Position
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {positions.map((pos) => {
              const assignedCount = getAssignedCount(pos);
              const assignedNames = getAssignedNames(pos);
              return (
                <div key={pos._id} className="group bg-gray-800 rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-700 hover:border-blue-500 flex flex-col">
                  <div className="p-6 flex-1">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="w-8 h-8 rounded-lg bg-blue-900/30 flex items-center justify-center">
                            <FiBriefcase className="text-blue-400" size={16} />
                          </div>
                          <h3 className="font-bold text-lg text-gray-100">{pos.posName}</h3>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs font-mono bg-gray-700 text-blue-400 px-2 py-0.5 rounded-full">
                            {pos.department_id?.departName || 'No Department'}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-1 opacity-70 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => handleOpenModal(pos)} className="p-1.5 text-blue-400 hover:bg-blue-900/30 rounded-lg transition" title="Edit">
                          <FiEdit2 size={16} />
                        </button>
                        <button onClick={() => handleDelete(pos)} className="p-1.5 text-red-400 hover:bg-red-900/30 rounded-lg transition" title="Delete">
                          <FiTrash2 size={16} />
                        </button>
                      </div>
                    </div>
                    
                    <div className="mt-4 pt-4 border-t border-gray-700 space-y-2">
                      <div className="flex items-start gap-2 text-sm">
                        <FiAward className="text-blue-400 mt-0.5" size={14} />
                        <div className="flex-1">
                          <span className="text-gray-400">Required Qualification:</span>
                          <p className="text-gray-300 font-medium mt-0.5">{pos.requiredQualification}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm text-gray-400">
                          <FiDollarSign size={14} />
                          <span>Salary Range</span>
                        </div>
                        <span className="text-cyan-400 font-semibold bg-cyan-900/30 px-2 py-0.5 rounded-lg">
                          {formatSalaryRange(pos.salary_range?.min, pos.salary_range?.max)}
                        </span>
                      </div>
                      
                      <div className="flex items-start justify-between mt-2">
                        <div className="flex items-center gap-2 text-sm text-gray-400">
                          <FiUsers size={14} />
                          <span>Assigned Employees</span>
                        </div>
                        <div className="text-right">
                          <span className="text-blue-400 font-semibold">{assignedCount}</span>
                          {assignedCount > 0 && (
                            <p className="text-xs text-gray-500 mt-1 max-w-[150px] truncate" title={assignedNames}>
                              {assignedNames}{assignedCount > 3 ? ` +${assignedCount - 3}` : ''}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gray-900 px-6 py-3 flex justify-between items-center">
                    <span className="text-xs text-gray-500">
                      Created: {new Date(pos.created_at).toLocaleDateString()}
                    </span>
                    <button
                      onClick={() => openAssignModal(pos)}
                      className="flex items-center gap-1 text-xs bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 px-3 py-1 rounded-lg transition"
                    >
                      <FiUserPlus size={12} /> Assign Employees
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add/Edit Position Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg border border-gray-700 max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gray-800 flex justify-between items-center p-6 border-b border-gray-700">
              <h2 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                {editingPosition ? 'Edit Position' : 'New Position'}
              </h2>
              <button onClick={handleCloseModal} className="text-gray-400 hover:text-gray-200 transition p-1 rounded-full hover:bg-gray-700">
                <FiX size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-1">Position Name *</label>
                <input 
                  type="text" 
                  value={formData.posName} 
                  onChange={(e) => setFormData({...formData, posName: e.target.value})} 
                  className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-2.5 text-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition" 
                  placeholder="e.g., Senior Software Engineer, HR Manager" 
                  required 
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-1">Department *</label>
                <select 
                  value={formData.department_id} 
                  onChange={(e) => setFormData({...formData, department_id: e.target.value})} 
                  className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-2.5 text-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition" 
                  required
                >
                  <option value="">Select a department</option>
                  {departments.map(d => <option key={d._id} value={d._id}>{d.departName}</option>)}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-1">Required Qualification *</label>
                <textarea 
                  value={formData.requiredQualification} 
                  onChange={(e) => setFormData({...formData, requiredQualification: e.target.value})} 
                  className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-2.5 text-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition" 
                  placeholder="e.g., Bachelor's degree in Computer Science, 5+ years experience" 
                  rows="3"
                  required 
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">Salary Range (Optional)</label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Minimum ($)</label>
                    <input 
                      type="number" 
                      value={formData.salary_range.min} 
                      onChange={(e) => setFormData({
                        ...formData, 
                        salary_range: {...formData.salary_range, min: e.target.value}
                      })} 
                      className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-2 text-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition" 
                      placeholder="e.g., 50000"
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Maximum ($)</label>
                    <input 
                      type="number" 
                      value={formData.salary_range.max} 
                      onChange={(e) => setFormData({
                        ...formData, 
                        salary_range: {...formData.salary_range, max: e.target.value}
                      })} 
                      className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-2 text-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition" 
                      placeholder="e.g., 80000"
                      min="0"
                    />
                  </div>
                </div>
              </div>
              
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={handleCloseModal} className="flex-1 bg-gray-700 hover:bg-gray-600 text-gray-200 py-2.5 rounded-xl font-medium transition">
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className="flex-1 bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white py-2.5 rounded-xl font-medium flex items-center justify-center gap-2 shadow-md transition disabled:opacity-50">
                  {submitting ? 'Saving...' : <><FiCheck size={16} /> Save</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign Employees Modal */}
      {showAssignModal && selectedPosition && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col border border-gray-700">
            <div className="flex justify-between items-center p-5 border-b border-gray-700">
              <div>
                <h2 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                  Assign Employees
                </h2>
                <p className="text-sm text-gray-400">Position: {selectedPosition.posName}</p>
                <p className="text-xs text-gray-500">{selectedPosition.department_id?.departName}</p>
              </div>
              <button onClick={() => setShowAssignModal(false)} className="text-gray-400 hover:text-gray-200 transition">
                <FiX size={20} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-5 space-y-3">
              {availableEmployees.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-400">No eligible employees found.</p>
                  <p className="text-xs text-gray-500 mt-1">All active employees are already assigned to this position or no active employees exist.</p>
                </div>
              ) : (
                availableEmployees.map(emp => (
                  <label key={emp._id} className="flex items-center gap-3 p-3 bg-gray-900 rounded-xl cursor-pointer hover:bg-gray-700 transition">
                    <input 
                      type="checkbox" 
                      checked={selectedEmployees.includes(emp._id)} 
                      onChange={() => handleToggleEmployee(emp._id)} 
                      className="w-4 h-4 text-blue-500 rounded border-gray-600 focus:ring-blue-500" 
                    />
                    <div className="flex-1">
                      <p className="font-medium text-gray-200">{emp.empFirstname} {emp.empLastname}</p>
                      <p className="text-xs text-gray-500 flex items-center gap-2">
                        <span>{emp.employee_id}</span>
                        <span>•</span>
                        <span>{emp.email}</span>
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-xs px-2 py-1 rounded-full bg-gray-700 text-gray-300">
                        {emp.empstatus}
                      </span>
                    </div>
                  </label>
                ))
              )}
            </div>
            
            <div className="p-5 border-t border-gray-700 flex gap-3">
              <button onClick={() => setShowAssignModal(false)} className="flex-1 bg-gray-700 hover:bg-gray-600 text-gray-200 py-2.5 rounded-xl font-medium transition">
                Cancel
              </button>
              <button 
                onClick={handleAssign} 
                disabled={assigning || selectedEmployees.length === 0} 
                className="flex-1 bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white py-2.5 rounded-xl font-medium flex items-center justify-center gap-2 transition disabled:opacity-50"
              >
                {assigning ? 'Assigning...' : <><FiUserPlus size={16} /> Assign ({selectedEmployees.length})</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Positions;