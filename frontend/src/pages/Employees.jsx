// Employees.jsx – Manage Employees – Professional Blue/Cyan Theme
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { 
  FiUsers, FiPlus, FiEdit2, FiTrash2, FiRefreshCw, FiX, FiCheck, 
  FiBriefcase, FiAward, FiPrinter, FiMail, FiPhone, FiCalendar,
  FiDollarSign, FiUserCheck, FiUserX
} from 'react-icons/fi';

const api = axios.create({
  baseURL: 'http://localhost:5000/api', // Updated to HRMS backend port
  withCredentials: true
});

// Helper validation functions
const validateName = (name, fieldName) => {
  if (!name || name.trim().length === 0) return `${fieldName} is required`;
  if (name.trim().length < 2) return `${fieldName} must be at least 2 characters`;
  if (name.trim().length > 50) return `${fieldName} cannot exceed 50 characters`;
  if (!/^[a-zA-ZÀ-ÿ\s'-]+$/.test(name.trim())) return `${fieldName} contains invalid characters`;
  return null;
};

const validateEmail = (email) => {
  if (!email || email.trim().length === 0) return 'Email is required';
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email.trim())) return 'Invalid email format';
  return null;
};

const validatePhone = (phone) => {
  if (!phone || phone.trim().length === 0) return null; // Optional
  const phoneRegex = /^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,4}[-\s.]?[0-9]{1,9}$/;
  if (!phoneRegex.test(phone.trim())) return 'Invalid phone number format';
  return null;
};

const Employees = () => {
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [positions, setPositions] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Employee modal state
  const [showModal, setShowModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [formData, setFormData] = useState({
    empFirstname: '',
    empLastname: '',
    empGender: 'male',
    empdateOfBirth: '',
    empHiredate: new Date().toISOString().split('T')[0],
    empstatus: 'active',
    email: '',
    phone: '',
    address: '',
    department_id: '',
    position_id: '',
    salary: ''
  });
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Position filter based on selected department
  const [filteredPositions, setFilteredPositions] = useState([]);

  // Action-specific loading states
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    fetchAllData();
  }, []);

  useEffect(() => {
    // Filter positions when department changes
    if (formData.department_id) {
      const filtered = positions.filter(pos => 
        (pos.department_id?._id === formData.department_id) || 
        (pos.department_id === formData.department_id)
      );
      setFilteredPositions(filtered);
      // Clear position if it doesn't belong to selected department
      if (formData.position_id && !filtered.find(p => p._id === formData.position_id)) {
        setFormData(prev => ({ ...prev, position_id: '' }));
      }
    } else {
      setFilteredPositions([]);
    }
  }, [formData.department_id, positions]);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [employeesRes, departmentsRes, positionsRes] = await Promise.all([
        api.get('/employees'),
        api.get('/departments'),
        api.get('/positions')
      ]);
      setEmployees(employeesRes.data);
      setDepartments(departmentsRes.data);
      setPositions(positionsRes.data);
    } catch (err) {
      console.error('Fetch error:', err);
      if (err.code === 'ERR_NETWORK') {
        toast.error('Network error: Unable to connect to server');
      } else if (err.response?.status === 401) {
        toast.error('Session expired. Please login again.');
      } else {
        toast.error(err.response?.data?.error || 'Failed to load data');
      }
    } finally {
      setLoading(false);
    }
  };

  // CRUD for employees with validation
  const handleOpenModal = (employee = null) => {
    setFormErrors({});
    if (employee) {
      setEditingEmployee(employee);
      setFormData({
        empFirstname: employee.empFirstname,
        empLastname: employee.empLastname,
        empGender: employee.empGender,
        empdateOfBirth: employee.empdateOfBirth?.split('T')[0] || '',
        empHiredate: employee.empHiredate?.split('T')[0] || new Date().toISOString().split('T')[0],
        empstatus: employee.empstatus,
        email: employee.email || '',
        phone: employee.phone || '',
        address: employee.address || '',
        department_id: employee.department_id?._id || employee.department_id || '',
        position_id: employee.position_id?._id || employee.position_id || '',
        salary: employee.salary || ''
      });
    } else {
      setEditingEmployee(null);
      setFormData({
        empFirstname: '',
        empLastname: '',
        empGender: 'male',
        empdateOfBirth: '',
        empHiredate: new Date().toISOString().split('T')[0],
        empstatus: 'active',
        email: '',
        phone: '',
        address: '',
        department_id: '',
        position_id: '',
        salary: ''
      });
      setFilteredPositions([]);
    }
    setShowModal(true);
  };

  const validateEmployeeForm = () => {
    const errors = {};
    
    const firstNameError = validateName(formData.empFirstname, 'First name');
    if (firstNameError) errors.empFirstname = firstNameError;
    
    const lastNameError = validateName(formData.empLastname, 'Last name');
    if (lastNameError) errors.empLastname = lastNameError;
    
    if (!formData.empGender) errors.empGender = 'Gender is required';
    
    if (!formData.empdateOfBirth) {
      errors.empdateOfBirth = 'Date of birth is required';
    } else {
      const age = new Date().getFullYear() - new Date(formData.empdateOfBirth).getFullYear();
      if (age < 18) errors.empdateOfBirth = 'Employee must be at least 18 years old';
      if (age > 70) errors.empdateOfBirth = 'Date of birth seems invalid';
    }
    
    if (!formData.empHiredate) errors.empHiredate = 'Hire date is required';
    
    const emailError = validateEmail(formData.email);
    if (emailError) errors.email = emailError;
    
    const phoneError = validatePhone(formData.phone);
    if (phoneError) errors.phone = phoneError;
    
    if (!formData.department_id) errors.department_id = 'Please select a department';
    if (!formData.position_id) errors.position_id = 'Please select a position';
    
    if (formData.salary && (formData.salary < 0 || isNaN(formData.salary))) {
      errors.salary = 'Salary must be a positive number';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateEmployeeForm()) return;
    
    setSubmitting(true);
    try {
      const payload = { 
        ...formData, 
        empFirstname: formData.empFirstname.trim(), 
        empLastname: formData.empLastname.trim(),
        email: formData.email.trim(),
        phone: formData.phone?.trim(),
        address: formData.address?.trim(),
        salary: formData.salary ? Number(formData.salary) : 0
      };
      
      if (editingEmployee) {
        await api.put(`/employees/${editingEmployee._id}`, payload);
        toast.success('Employee updated successfully');
      } else {
        await api.post('/employees', payload);
        toast.success('Employee added successfully');
      }
      await fetchAllData();
      setShowModal(false);
    } catch (err) {
      console.error('Save error:', err);
      const errorMsg = err.response?.data?.error || err.message || 'Save failed';
      toast.error(errorMsg);
      
      if (err.response?.status === 400) {
        setFormErrors({ general: errorMsg });
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (employee) => {
    if (!window.confirm(`⚠️ Delete employee "${employee.empFirstname} ${employee.empLastname}"?\n\nThis will also remove all attendance, leave, and payroll records. This action cannot be undone.`)) return;
    
    setDeletingId(employee._id);
    try {
      await api.delete(`/employees/${employee._id}`);
      toast.success('Employee deleted successfully');
      await fetchAllData();
    } catch (err) {
      console.error('Delete error:', err);
      toast.error(err.response?.data?.error || 'Failed to delete employee');
    } finally {
      setDeletingId(null);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      'active': { class: 'bg-green-900/50 text-green-300', icon: FiUserCheck },
      'on_leave': { class: 'bg-yellow-900/50 text-yellow-300', icon: FiCalendar },
      'suspended': { class: 'bg-red-900/50 text-red-300', icon: FiUserX },
      'terminated': { class: 'bg-gray-700 text-gray-300', icon: FiUserX },
      'retired': { class: 'bg-blue-900/50 text-blue-300', icon: FiUserCheck }
    };
    const config = statusConfig[status] || statusConfig.active;
    const Icon = config.icon;
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.class}`}>
        <Icon size={12} /> {status.replace('_', ' ').toUpperCase()}
      </span>
    );
  };

  // Report printing
  const printEmployeeReport = (employee) => {
    const printWindow = window.open('', '_blank', 'width=900,height=700');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Employee Report - ${employee.empFirstname} ${employee.empLastname}</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <style>
          @media print {
            body { margin: 0; padding: 20px; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body class="p-8 bg-white">
        <div class="max-w-4xl mx-auto">
          <div class="text-center mb-8">
            <h1 class="text-3xl font-bold text-blue-600">HRMS Employee Report</h1>
            <p class="text-gray-600">Generated on ${new Date().toLocaleString()}</p>
          </div>
          <div class="bg-gray-50 p-6 rounded-lg mb-6">
            <h2 class="text-xl font-semibold mb-4 text-blue-600">Employee Information</h2>
            <div class="grid grid-cols-2 gap-4">
              <div><span class="font-medium">Employee ID:</span> ${employee.employee_id || 'N/A'}</div>
              <div><span class="font-medium">Name:</span> ${employee.empFirstname} ${employee.empLastname}</div>
              <div><span class="font-medium">Gender:</span> ${employee.empGender}</div>
              <div><span class="font-medium">Date of Birth:</span> ${new Date(employee.empdateOfBirth).toLocaleDateString()}</div>
              <div><span class="font-medium">Hire Date:</span> ${new Date(employee.empHiredate).toLocaleDateString()}</div>
              <div><span class="font-medium">Status:</span> ${employee.empstatus}</div>
              <div><span class="font-medium">Email:</span> ${employee.email}</div>
              <div><span class="font-medium">Phone:</span> ${employee.phone || 'N/A'}</div>
              <div><span class="font-medium">Address:</span> ${employee.address || 'N/A'}</div>
              <div><span class="font-medium">Department:</span> ${employee.department_id?.departName || 'N/A'}</div>
              <div><span class="font-medium">Position:</span> ${employee.position_id?.posName || 'N/A'}</div>
              <div><span class="font-medium">Salary:</span> ${employee.salary ? `$${employee.salary.toLocaleString()}` : 'N/A'}</div>
            </div>
          </div>
          <div class="mt-8 text-center text-gray-500 text-sm no-print">
            <button onclick="window.print(); setTimeout(() => window.close(), 1000)" class="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded mr-3 font-medium">🖨️ Print / Save PDF</button>
            <button onclick="window.close()" class="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded">Close</button>
          </div>
        </div>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="min-h-screen bg-black">
      <div className="w-full px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
              Employees
            </h1>
            <p className="text-sm text-gray-400">Manage employee records, assignments, and information</p>
          </div>
          <div className="flex gap-3 w-full sm:w-auto">
            <button onClick={fetchAllData} className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-gray-200 px-4 py-2 rounded-xl border border-gray-700 transition">
              <FiRefreshCw size={18} /> Refresh
            </button>
            <button onClick={() => handleOpenModal()} className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white px-4 py-2 rounded-xl font-medium shadow-md transition">
              <FiPlus size={18} /> Add Employee
            </button>
          </div>
        </div>

        {loading ? (
          <div className="bg-gray-800 rounded-xl shadow-md p-12 text-center border border-gray-700">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p className="text-gray-400 mt-3">Loading employees...</p>
          </div>
        ) : employees.length === 0 ? (
          <div className="bg-gray-800 rounded-xl shadow-md p-12 text-center border border-gray-700">
            <FiUsers className="mx-auto text-gray-500 mb-4" size={48} />
            <p className="text-gray-400">No employees yet. Add your first employee.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {employees.map(employee => (
              <div key={employee._id} className="bg-gray-800 rounded-xl shadow-md overflow-hidden border border-gray-700 hover:border-blue-500 transition-all duration-300">
                <div className="p-5">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-100">
                        {employee.empFirstname} {employee.empLastname}
                      </h3>
                      <p className="text-xs text-gray-500 font-mono mt-1">{employee.employee_id}</p>
                    </div>
                    {getStatusBadge(employee.empstatus)}
                  </div>
                  
                  <div className="space-y-2 mt-4">
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <FiBriefcase size={14} />
                      <span>{employee.position_id?.posName || 'No position'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <FiMail size={14} />
                      <span className="truncate">{employee.email}</span>
                    </div>
                    {employee.phone && (
                      <div className="flex items-center gap-2 text-sm text-gray-400">
                        <FiPhone size={14} />
                        <span>{employee.phone}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <FiCalendar size={14} />
                      <span>Hired: {new Date(employee.empHiredate).toLocaleDateString()}</span>
                    </div>
                    {employee.salary > 0 && (
                      <div className="flex items-center gap-2 text-sm text-cyan-400">
                        <FiDollarSign size={14} />
                        <span className="font-semibold">${employee.salary.toLocaleString()}/year</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="mt-4 pt-3 border-t border-gray-700 flex justify-between items-center">
                    <span className="text-xs text-gray-500">
                      Dept: {employee.department_id?.departName || 'N/A'}
                    </span>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => printEmployeeReport(employee)} 
                        className="bg-gray-700 hover:bg-gray-600 text-blue-400 px-3 py-1 rounded-lg text-sm flex items-center gap-1 transition"
                        title="Print Report"
                      >
                        <FiPrinter size={14} /> Report
                      </button>
                      <button 
                        onClick={() => handleOpenModal(employee)} 
                        className="text-blue-400 hover:text-blue-300 p-1"
                      >
                        <FiEdit2 size={18} />
                      </button>
                      <button 
                        onClick={() => handleDelete(employee)} 
                        disabled={deletingId === employee._id} 
                        className="text-red-400 hover:text-red-300 p-1 disabled:opacity-50"
                      >
                        {deletingId === employee._id ? '...' : <FiTrash2 size={18} />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add/Edit Employee Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-2xl shadow-xl w-full max-w-2xl border border-gray-700 max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gray-800 p-5 border-b border-gray-700 flex justify-between items-center">
              <h2 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                {editingEmployee ? 'Edit Employee' : 'Add Employee'}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-200">
                <FiX size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {formErrors.general && (
                <div className="bg-red-900/50 text-red-200 p-3 rounded-lg text-sm">
                  {formErrors.general}
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">First Name *</label>
                  <input 
                    type="text" 
                    value={formData.empFirstname} 
                    onChange={(e) => setFormData({...formData, empFirstname: e.target.value})} 
                    className={`w-full bg-gray-900 border ${formErrors.empFirstname ? 'border-red-500' : 'border-gray-700'} rounded-xl px-3 py-2 text-gray-200 focus:ring-2 focus:ring-blue-500`} 
                  />
                  {formErrors.empFirstname && <p className="text-red-400 text-xs mt-1">{formErrors.empFirstname}</p>}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Last Name *</label>
                  <input 
                    type="text" 
                    value={formData.empLastname} 
                    onChange={(e) => setFormData({...formData, empLastname: e.target.value})} 
                    className={`w-full bg-gray-900 border ${formErrors.empLastname ? 'border-red-500' : 'border-gray-700'} rounded-xl px-3 py-2 text-gray-200 focus:ring-2 focus:ring-blue-500`} 
                  />
                  {formErrors.empLastname && <p className="text-red-400 text-xs mt-1">{formErrors.empLastname}</p>}
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Gender *</label>
                  <select 
                    value={formData.empGender} 
                    onChange={(e) => setFormData({...formData, empGender: e.target.value})} 
                    className="w-full bg-gray-900 border border-gray-700 rounded-xl px-3 py-2 text-gray-200"
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                  {formErrors.empGender && <p className="text-red-400 text-xs mt-1">{formErrors.empGender}</p>}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Status *</label>
                  <select 
                    value={formData.empstatus} 
                    onChange={(e) => setFormData({...formData, empstatus: e.target.value})} 
                    className="w-full bg-gray-900 border border-gray-700 rounded-xl px-3 py-2 text-gray-200"
                  >
                    <option value="active">Active</option>
                    <option value="on_leave">On Leave</option>
                    <option value="suspended">Suspended</option>
                    <option value="terminated">Terminated</option>
                    <option value="retired">Retired</option>
                  </select>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Date of Birth *</label>
                  <input 
                    type="date" 
                    value={formData.empdateOfBirth} 
                    onChange={(e) => setFormData({...formData, empdateOfBirth: e.target.value})} 
                    className={`w-full bg-gray-900 border ${formErrors.empdateOfBirth ? 'border-red-500' : 'border-gray-700'} rounded-xl px-3 py-2 text-gray-200`} 
                  />
                  {formErrors.empdateOfBirth && <p className="text-red-400 text-xs mt-1">{formErrors.empdateOfBirth}</p>}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Hire Date *</label>
                  <input 
                    type="date" 
                    value={formData.empHiredate} 
                    onChange={(e) => setFormData({...formData, empHiredate: e.target.value})} 
                    className={`w-full bg-gray-900 border ${formErrors.empHiredate ? 'border-red-500' : 'border-gray-700'} rounded-xl px-3 py-2 text-gray-200`} 
                  />
                  {formErrors.empHiredate && <p className="text-red-400 text-xs mt-1">{formErrors.empHiredate}</p>}
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Email *</label>
                  <input 
                    type="email" 
                    value={formData.email} 
                    onChange={(e) => setFormData({...formData, email: e.target.value})} 
                    className={`w-full bg-gray-900 border ${formErrors.email ? 'border-red-500' : 'border-gray-700'} rounded-xl px-3 py-2 text-gray-200`} 
                    placeholder="employee@company.com"
                  />
                  {formErrors.email && <p className="text-red-400 text-xs mt-1">{formErrors.email}</p>}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Phone (Optional)</label>
                  <input 
                    type="tel" 
                    value={formData.phone} 
                    onChange={(e) => setFormData({...formData, phone: e.target.value})} 
                    className={`w-full bg-gray-900 border ${formErrors.phone ? 'border-red-500' : 'border-gray-700'} rounded-xl px-3 py-2 text-gray-200`} 
                    placeholder="+1234567890"
                  />
                  {formErrors.phone && <p className="text-red-400 text-xs mt-1">{formErrors.phone}</p>}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Address (Optional)</label>
                <textarea 
                  value={formData.address} 
                  onChange={(e) => setFormData({...formData, address: e.target.value})} 
                  className="w-full bg-gray-900 border border-gray-700 rounded-xl px-3 py-2 text-gray-200" 
                  rows="2"
                  placeholder="Employee's address"
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Department *</label>
                  <select 
                    value={formData.department_id} 
                    onChange={(e) => setFormData({...formData, department_id: e.target.value, position_id: ''})} 
                    className={`w-full bg-gray-900 border ${formErrors.department_id ? 'border-red-500' : 'border-gray-700'} rounded-xl px-3 py-2 text-gray-200`}
                  >
                    <option value="">Select department</option>
                    {departments.map(d => <option key={d._id} value={d._id}>{d.departName}</option>)}
                  </select>
                  {formErrors.department_id && <p className="text-red-400 text-xs mt-1">{formErrors.department_id}</p>}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Position *</label>
                  <select 
                    value={formData.position_id} 
                    onChange={(e) => setFormData({...formData, position_id: e.target.value})} 
                    className={`w-full bg-gray-900 border ${formErrors.position_id ? 'border-red-500' : 'border-gray-700'} rounded-xl px-3 py-2 text-gray-200`}
                    disabled={!formData.department_id}
                  >
                    <option value="">Select position</option>
                    {filteredPositions.map(p => (
                      <option key={p._id} value={p._id}>
                        {p.posName} {p.salary_range?.min && `($${p.salary_range.min.toLocaleString()}-$${p.salary_range.max.toLocaleString()})`}
                      </option>
                    ))}
                  </select>
                  {formErrors.position_id && <p className="text-red-400 text-xs mt-1">{formErrors.position_id}</p>}
                  {formData.department_id && filteredPositions.length === 0 && (
                    <p className="text-yellow-400 text-xs mt-1">No positions available for this department</p>
                  )}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Annual Salary (Optional)</label>
                <input 
                  type="number" 
                  value={formData.salary} 
                  onChange={(e) => setFormData({...formData, salary: e.target.value})} 
                  className={`w-full bg-gray-900 border ${formErrors.salary ? 'border-red-500' : 'border-gray-700'} rounded-xl px-3 py-2 text-gray-200`} 
                  placeholder="e.g., 50000"
                  min="0"
                  step="1000"
                />
                {formErrors.salary && <p className="text-red-400 text-xs mt-1">{formErrors.salary}</p>}
              </div>
              
              <div className="flex gap-3 pt-4">
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)} 
                  className="flex-1 bg-gray-700 hover:bg-gray-600 text-gray-200 py-2 rounded-xl transition"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={submitting} 
                  className="flex-1 bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white py-2 rounded-xl font-medium flex items-center justify-center gap-2 transition disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : <><FiCheck /> Save</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Employees;