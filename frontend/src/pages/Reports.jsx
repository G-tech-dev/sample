// Reports.jsx – HRMS Reports – Professional Blue/Cyan Theme
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { 
  FiAward, FiAlertCircle, FiDownload, FiFilter, FiRefreshCw, 
  FiBarChart2, FiCheckCircle, FiXCircle, FiPrinter, FiX,
  FiUser, FiFileText, FiUsers, FiBriefcase, FiDollarSign,
  FiCalendar, FiTrendingUp, FiPieChart
} from 'react-icons/fi';

const api = axios.create({
  baseURL: 'http://localhost:5000/api', // Updated to HRMS backend port
  withCredentials: true
});

const Reports = () => {
  const [reportData, setReportData] = useState({ 
    employeeSummary: null,
    leaveSummary: null,
    payrollSummary: null
  });
  const [departments, setDepartments] = useState([]);
  const [positions, setPositions] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [filters, setFilters] = useState({ department_id: '', position_id: '', status: '' });
  const [loading, setLoading] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [reportType, setReportType] = useState('employee'); // employee, leave, payroll
  
  // Individual employee report
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [filteredEmployees, setFilteredEmployees] = useState([]);

  useEffect(() => {
    const loadAll = async () => {
      await fetchFiltersData();
      await fetchAllEmployees();
      await fetchEmployeeSummary();
      await fetchLeaveSummary();
      await fetchPayrollSummary();
    };
    loadAll();
  }, []);

  const fetchFiltersData = async () => {
    try {
      const [departmentsRes, positionsRes] = await Promise.all([
        api.get('/departments'),
        api.get('/positions')
      ]);
      setDepartments(departmentsRes.data || []);
      setPositions(positionsRes.data || []);
    } catch (err) {
      console.error('Failed to load filters', err);
      toast.error('Could not load departments/positions');
    }
  };

  const fetchAllEmployees = async () => {
    try {
      const res = await api.get('/employees');
      setEmployees(res.data || []);
    } catch (err) {
      console.error('Failed to load employees', err);
      toast.error('Could not load employees list');
    }
  };

  const fetchEmployeeSummary = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filters.department_id) params.department_id = filters.department_id;
      if (filters.position_id) params.position_id = filters.position_id;
      if (filters.status) params.status = filters.status;
      
      const response = await api.get('/reports/employee-summary', { params });
      setReportData(prev => ({ ...prev, employeeSummary: response.data }));
    } catch (err) {
      console.error(err);
      toast.error('Failed to load employee summary');
    } finally {
      setLoading(false);
    }
  };

  const fetchLeaveSummary = async () => {
    try {
      const response = await api.get('/reports/leave-summary');
      setReportData(prev => ({ ...prev, leaveSummary: response.data }));
    } catch (err) {
      console.error(err);
      toast.error('Failed to load leave summary');
    }
  };

  const fetchPayrollSummary = async () => {
    try {
      const params = {};
      if (filters.department_id) params.department_id = filters.department_id;
      
      const response = await api.get('/payroll', { params });
      // Calculate payroll summary
      const payrollRecords = response.data;
      const totalPayroll = payrollRecords.reduce((sum, record) => sum + (record.net_salary || 0), 0);
      const pendingPayments = payrollRecords.filter(r => r.payment_status === 'pending').length;
      const paidPayments = payrollRecords.filter(r => r.payment_status === 'paid').length;
      
      setReportData(prev => ({ 
        ...prev, 
        payrollSummary: {
          total_records: payrollRecords.length,
          total_amount: totalPayroll,
          pending_payments: pendingPayments,
          paid_payments: paidPayments,
          records: payrollRecords
        }
      }));
    } catch (err) {
      console.error(err);
      toast.error('Failed to load payroll summary');
    }
  };

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const applyFilters = () => {
    fetchEmployeeSummary();
    fetchPayrollSummary();
  };

  const resetFilters = () => {
    setFilters({ department_id: '', position_id: '', status: '' });
    setTimeout(() => {
      fetchEmployeeSummary();
      fetchPayrollSummary();
    }, 100);
  };

  const exportToCSV = (data, filename, type) => {
    if (!data || !data.length) return toast.error('No data to export');
    
    let headers, rows;
    if (type === 'employee') {
      headers = ['Employee Name', 'Employee ID', 'Department', 'Position', 'Status', 'Email', 'Phone', 'Hire Date', 'Salary'];
      rows = data.map(emp => [
        `${emp.empFirstname} ${emp.empLastname}`,
        emp.employee_id,
        emp.department_id?.departName || 'N/A',
        emp.position_id?.posName || 'N/A',
        emp.empstatus,
        emp.email,
        emp.phone || 'N/A',
        new Date(emp.empHiredate).toLocaleDateString(),
        emp.salary ? `$${emp.salary.toLocaleString()}` : 'N/A'
      ]);
    } else if (type === 'leave') {
      headers = ['Employee', 'Leave Type', 'Start Date', 'End Date', 'Status', 'Reason'];
      rows = data.map(leave => [
        `${leave.employee_id?.empFirstname} ${leave.employee_id?.empLastname}`,
        leave.leave_type,
        new Date(leave.start_date).toLocaleDateString(),
        new Date(leave.end_date).toLocaleDateString(),
        leave.status,
        leave.reason || 'N/A'
      ]);
    } else {
      headers = ['Employee', 'Month/Year', 'Basic Salary', 'Allowances', 'Deductions', 'Bonus', 'Net Salary', 'Status'];
      rows = data.map(payroll => [
        `${payroll.employee_id?.empFirstname} ${payroll.employee_id?.empLastname}`,
        `${payroll.month}/${payroll.year}`,
        `$${payroll.basic_salary.toLocaleString()}`,
        `$${payroll.allowances.toLocaleString()}`,
        `$${payroll.deductions.toLocaleString()}`,
        `$${payroll.bonus.toLocaleString()}`,
        `$${payroll.net_salary.toLocaleString()}`,
        payroll.payment_status
      ]);
    }
    
    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Individual employee report
  const handleEmployeeChange = (employeeId) => {
    setSelectedEmployee(employeeId);
  };

  const printEmployeeReport = (employee) => {
    if (!employee) {
      toast.error('Please select an employee');
      return;
    }

    const printWindow = window.open('', '_blank', 'width=900,height=700');
    if (!printWindow) {
      toast.error('Pop-up blocked. Please allow pop-ups for this site.');
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Employee Report - ${employee.empFirstname} ${employee.empLastname}</title>
        <style>
          body { font-family: 'Segoe UI', Arial, sans-serif; padding: 2rem; background: white; }
          .header { text-align: center; border-bottom: 2px solid #3b82f6; padding-bottom: 1rem; margin-bottom: 2rem; }
          .header h1 { color: #3b82f6; }
          .info-grid { background: #f3f4f6; padding: 1rem; border-radius: 8px; margin-bottom: 1.5rem; display: grid; grid-template-columns: repeat(2,1fr); gap: 0.5rem; }
          .section-title { font-size: 1.2rem; font-weight: bold; margin: 1rem 0 0.5rem 0; color: #2563eb; }
          table { width: 100%; border-collapse: collapse; margin: 1rem 0; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background: #1f2937; color: #3b82f6; }
          .status-active { color: #16a34a; font-weight: bold; }
          .status-on_leave { color: #eab308; font-weight: bold; }
          .status-suspended { color: #dc2626; font-weight: bold; }
          .footer { margin-top: 2rem; text-align: center; font-size: 0.7rem; color: #6b7280; border-top: 1px solid #e5e7eb; padding-top: 1rem; }
          @media print { body { padding: 0.5in; } .no-print { display: none; } }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>HRMS - Employee Report</h1>
          <p>${new Date().toLocaleString()}</p>
        </div>
        <div class="info-grid">
          <div><strong>Employee ID:</strong> ${employee.employee_id || 'N/A'}</div>
          <div><strong>Name:</strong> ${employee.empFirstname} ${employee.empLastname}</div>
          <div><strong>Gender:</strong> ${employee.empGender === 'male' ? 'Male' : employee.empGender === 'female' ? 'Female' : 'Other'}</div>
          <div><strong>Date of Birth:</strong> ${new Date(employee.empdateOfBirth).toLocaleDateString()}</div>
          <div><strong>Hire Date:</strong> ${new Date(employee.empHiredate).toLocaleDateString()}</div>
          <div><strong>Status:</strong> <span class="status-${employee.empstatus}">${employee.empstatus.replace('_', ' ').toUpperCase()}</span></div>
          <div><strong>Email:</strong> ${employee.email}</div>
          <div><strong>Phone:</strong> ${employee.phone || 'N/A'}</div>
          <div><strong>Address:</strong> ${employee.address || 'N/A'}</div>
          <div><strong>Department:</strong> ${employee.department_id?.departName || 'N/A'}</div>
          <div><strong>Position:</strong> ${employee.position_id?.posName || 'N/A'}</div>
          <div><strong>Salary:</strong> ${employee.salary ? `$${employee.salary.toLocaleString()}/year` : 'N/A'}</div>
        </div>
        
        <div class="section-title">Employment History</div>
        <div class="info-grid">
          <div><strong>Years of Service:</strong> ${Math.floor((new Date() - new Date(employee.empHiredate)) / (1000 * 60 * 60 * 24 * 365))} years</div>
          <div><strong>Qualification:</strong> ${employee.position_id?.requiredQualification || 'N/A'}</div>
        </div>
        
        <div class="footer">
          <p>This report is computer generated.</p>
          <p>HRMS - Human Resource Management System</p>
        </div>
        <div class="no-print" style="text-align:center; margin-top:20px;">
          <button onclick="window.print(); setTimeout(() => window.close(), 1000)" style="background:#3b82f6; border:none; padding:8px 20px; border-radius:30px; cursor:pointer; color:white;">🖨️ Print / PDF</button>
          <button onclick="window.close()" style="background:#6b7280; color:white; border:none; padding:8px 20px; border-radius:30px; cursor:pointer; margin-left:10px;">Close</button>
        </div>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  // Employee Summary Table Component
  const EmployeeSummaryTable = () => {
    const data = reportData.employeeSummary;
    if (!data) return null;
    
    return (
      <div className="bg-gray-800 rounded-2xl shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden mb-8 border border-gray-700">
        <div className="p-5 border-b border-gray-700 flex flex-wrap justify-between items-center gap-3">
          <div className="flex items-center gap-2">
            <FiUsers className="text-blue-400" size={22} />
            <h2 className="text-xl font-bold text-gray-100">Employee Summary</h2>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => exportToCSV(employees, 'Employee_Summary', 'employee')} 
              className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-gray-200 px-3 py-1.5 rounded-xl text-sm transition"
            >
              <FiDownload size={14} /> Export CSV
            </button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
          <div>
            <h3 className="text-sm font-semibold text-gray-400 mb-3">Key Metrics</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-gray-900 rounded-lg">
                <span className="text-gray-300">Total Employees</span>
                <span className="text-2xl font-bold text-blue-400">{data.totalEmployees || 0}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-900 rounded-lg">
                <span className="text-gray-300">Active Employees</span>
                <span className="text-2xl font-bold text-green-400">{data.activeEmployees || 0}</span>
              </div>
            </div>
          </div>
          
          <div>
            <h3 className="text-sm font-semibold text-gray-400 mb-3">Department Distribution</h3>
            <div className="space-y-2">
              {data.employeesByDepartment?.map((dept, idx) => (
                <div key={idx} className="flex justify-between items-center p-2 bg-gray-900 rounded-lg">
                  <span className="text-gray-300 text-sm">{dept.department?.[0]?.departName || 'Unknown'}</span>
                  <span className="text-blue-400 font-semibold">{dept.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        <div className="p-6 pt-0">
          <h3 className="text-sm font-semibold text-gray-400 mb-3">Position Distribution</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {data.employeesByPosition?.map((pos, idx) => (
              <div key={idx} className="flex justify-between items-center p-2 bg-gray-900 rounded-lg">
                <span className="text-gray-300 text-sm">{pos.position?.[0]?.posName || 'Unknown'}</span>
                <span className="text-cyan-400 font-semibold">{pos.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // Leave Summary Table Component
  const LeaveSummaryTable = () => {
    const data = reportData.leaveSummary;
    if (!data) return null;
    
    return (
      <div className="bg-gray-800 rounded-2xl shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden mb-8 border border-gray-700">
        <div className="p-5 border-b border-gray-700 flex flex-wrap justify-between items-center gap-3">
          <div className="flex items-center gap-2">
            <FiCalendar className="text-cyan-400" size={22} />
            <h2 className="text-xl font-bold text-gray-100">Leave Summary</h2>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-6">
          <div className="text-center p-4 bg-yellow-900/20 rounded-lg border border-yellow-800/30">
            <p className="text-yellow-400 text-sm">Pending</p>
            <p className="text-3xl font-bold text-yellow-400">{data.pendingLeaves || 0}</p>
          </div>
          <div className="text-center p-4 bg-green-900/20 rounded-lg border border-green-800/30">
            <p className="text-green-400 text-sm">Approved</p>
            <p className="text-3xl font-bold text-green-400">{data.approvedLeaves || 0}</p>
          </div>
          <div className="text-center p-4 bg-red-900/20 rounded-lg border border-red-800/30">
            <p className="text-red-400 text-sm">Rejected</p>
            <p className="text-3xl font-bold text-red-400">{data.rejectedLeaves || 0}</p>
          </div>
        </div>
        
        <div className="p-6 pt-0">
          <h3 className="text-sm font-semibold text-gray-400 mb-3">Leaves by Type</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {data.leavesByType?.map((type, idx) => (
              <div key={idx} className="flex justify-between items-center p-2 bg-gray-900 rounded-lg">
                <span className="text-gray-300 text-sm capitalize">{type._id}</span>
                <span className="text-cyan-400 font-semibold">{type.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // Payroll Summary Table Component
  const PayrollSummaryTable = () => {
    const data = reportData.payrollSummary;
    if (!data) return null;
    
    return (
      <div className="bg-gray-800 rounded-2xl shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden mb-8 border border-gray-700">
        <div className="p-5 border-b border-gray-700 flex flex-wrap justify-between items-center gap-3">
          <div className="flex items-center gap-2">
            <FiDollarSign className="text-green-400" size={22} />
            <h2 className="text-xl font-bold text-gray-100">Payroll Summary</h2>
          </div>
          <div className="flex gap-2">
            {data.records?.length > 0 && (
              <button 
                onClick={() => exportToCSV(data.records, 'Payroll_Summary', 'payroll')} 
                className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-gray-200 px-3 py-1.5 rounded-xl text-sm transition"
              >
                <FiDownload size={14} /> Export CSV
              </button>
            )}
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-6">
          <div className="text-center p-4 bg-blue-900/20 rounded-lg border border-blue-800/30">
            <p className="text-blue-400 text-sm">Total Records</p>
            <p className="text-3xl font-bold text-blue-400">{data.total_records || 0}</p>
          </div>
          <div className="text-center p-4 bg-green-900/20 rounded-lg border border-green-800/30">
            <p className="text-green-400 text-sm">Total Amount</p>
            <p className="text-2xl font-bold text-green-400">${(data.total_amount || 0).toLocaleString()}</p>
          </div>
          <div className="text-center p-4 bg-yellow-900/20 rounded-lg border border-yellow-800/30">
            <p className="text-yellow-400 text-sm">Pending</p>
            <p className="text-3xl font-bold text-yellow-400">{data.pending_payments || 0}</p>
          </div>
          <div className="text-center p-4 bg-cyan-900/20 rounded-lg border border-cyan-800/30">
            <p className="text-cyan-400 text-sm">Paid</p>
            <p className="text-3xl font-bold text-cyan-400">{data.paid_payments || 0}</p>
          </div>
        </div>
      </div>
    );
  };

  // Employee list for individual report
  const getFilteredEmployeesForReport = () => {
    let filtered = employees;
    if (filters.department_id) {
      filtered = filtered.filter(emp => 
        (emp.department_id?._id === filters.department_id) || 
        (emp.department_id === filters.department_id)
      );
    }
    if (filters.position_id) {
      filtered = filtered.filter(emp => 
        (emp.position_id?._id === filters.position_id) || 
        (emp.position_id === filters.position_id)
      );
    }
    if (filters.status) {
      filtered = filtered.filter(emp => emp.empstatus === filters.status);
    }
    return filtered;
  };

  return (
    <div className="min-h-screen bg-black">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                HR Reports
              </h1>
              <p className="text-gray-400 mt-1 flex items-center gap-1">
                <FiBarChart2 size={14} />
                Employee, Leave & Payroll Analytics
              </p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => {
                fetchEmployeeSummary();
                fetchLeaveSummary();
                fetchPayrollSummary();
              }} className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-xl font-medium">
                <FiRefreshCw size={16} /> Refresh
              </button>
              <button onClick={() => setShowPrintModal(true)} className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-gray-200 px-4 py-2 rounded-xl border border-gray-700">
                <FiPrinter size={16} /> Print Options
              </button>
            </div>
          </div>
        </div>

        {/* Individual Employee Report Section */}
        <div className="bg-gray-800 rounded-2xl shadow-md p-5 mb-8 border border-gray-700">
          <div className="flex items-center gap-2 mb-4">
            <FiUser className="text-blue-400" size={20} />
            <h2 className="text-lg font-semibold text-blue-400">Print Individual Employee Report</h2>
          </div>
          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-[180px]">
              <label className="block text-xs font-semibold text-blue-400 mb-1">Select Employee</label>
              <select 
                value={selectedEmployee} 
                onChange={(e) => handleEmployeeChange(e.target.value)} 
                className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-2.5 text-sm text-gray-200"
              >
                <option value="">-- Choose Employee --</option>
                {getFilteredEmployeesForReport().map(emp => (
                  <option key={emp._id} value={emp._id}>
                    {emp.empFirstname} {emp.empLastname} - {emp.employee_id}
                  </option>
                ))}
              </select>
            </div>
            <button 
              onClick={() => {
                const employee = employees.find(emp => emp._id === selectedEmployee);
                if (employee) printEmployeeReport(employee);
                else toast.error('Please select an employee');
              }} 
              disabled={!selectedEmployee} 
              className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-700 text-white px-5 py-2.5 rounded-xl font-medium"
            >
              <FiPrinter size={16} /> Print Employee Report
            </button>
          </div>
        </div>

        {/* Filters Section */}
        <div className="bg-gray-800 rounded-2xl shadow-md p-5 mb-8 border border-gray-700">
          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-[150px]">
              <label className="block text-xs font-semibold text-blue-400 mb-1">Department</label>
              <select 
                name="department_id" 
                value={filters.department_id} 
                onChange={handleFilterChange} 
                className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-2.5 text-sm text-gray-200"
              >
                <option value="">All Departments</option>
                {departments.map(d => <option key={d._id} value={d._id}>{d.departName}</option>)}
              </select>
            </div>
            <div className="flex-1 min-w-[150px]">
              <label className="block text-xs font-semibold text-blue-400 mb-1">Position</label>
              <select 
                name="position_id" 
                value={filters.position_id} 
                onChange={handleFilterChange} 
                className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-2.5 text-sm text-gray-200"
              >
                <option value="">All Positions</option>
                {positions.map(p => <option key={p._id} value={p._id}>{p.posName}</option>)}
              </select>
            </div>
            <div className="flex-1 min-w-[150px]">
              <label className="block text-xs font-semibold text-blue-400 mb-1">Employee Status</label>
              <select 
                name="status" 
                value={filters.status} 
                onChange={handleFilterChange} 
                className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-2.5 text-sm text-gray-200"
              >
                <option value="">All Statuses</option>
                <option value="active">Active</option>
                <option value="on_leave">On Leave</option>
                <option value="suspended">Suspended</option>
                <option value="terminated">Terminated</option>
                <option value="retired">Retired</option>
              </select>
            </div>
            <div className="flex gap-2">
              <button onClick={applyFilters} className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-5 py-2.5 rounded-xl font-medium">
                <FiFilter size={16} /> Apply
              </button>
              <button onClick={resetFilters} className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-gray-200 px-5 py-2.5 rounded-xl font-medium">
                Reset
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64 bg-gray-800 rounded-2xl shadow-sm border border-gray-700">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <>
            <EmployeeSummaryTable />
            <LeaveSummaryTable />
            <PayrollSummaryTable />
          </>
        )}
      </div>

      {/* Print Modal */}
      {showPrintModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md transform transition-all border border-gray-700">
            <div className="flex justify-between items-center p-5 border-b border-gray-700">
              <h2 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                Print Options
              </h2>
              <button onClick={() => setShowPrintModal(false)} className="text-gray-400 hover:text-gray-200 transition p-1 rounded-full hover:bg-gray-700">
                <FiX size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-gray-300">Select report type to print</p>
              <div className="grid grid-cols-1 gap-3">
                <button 
                  onClick={() => {
                    setShowPrintModal(false);
                    window.print();
                  }} 
                  className="flex items-center justify-between p-4 border border-gray-700 rounded-xl hover:border-blue-500 hover:bg-gray-700 transition group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-900/30 rounded-full flex items-center justify-center">
                      <FiUsers className="text-blue-400" size={20} />
                    </div>
                    <div className="text-left">
                      <p className="font-semibold text-gray-100">Current View</p>
                      <p className="text-xs text-gray-400">Print all reports on this page</p>
                    </div>
                  </div>
                  <span className="text-blue-400 group-hover:translate-x-1 transition">→</span>
                </button>
                
                <button 
                  onClick={() => {
                    setShowPrintModal(false);
                    // Trigger print for employee summary
                    const printContent = document.querySelector('.bg-gray-800.rounded-2xl.shadow-md');
                    if (printContent) {
                      const printWindow = window.open('', '_blank');
                      printWindow.document.write(printContent.outerHTML);
                      printWindow.print();
                    }
                  }} 
                  className="flex items-center justify-between p-4 border border-gray-700 rounded-xl hover:border-blue-500 hover:bg-gray-700 transition group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-900/30 rounded-full flex items-center justify-center">
                      <FiBarChart2 className="text-green-400" size={20} />
                    </div>
                    <div className="text-left">
                      <p className="font-semibold text-gray-100">Employee Summary Only</p>
                      <p className="text-xs text-gray-400">Employee metrics and distribution</p>
                    </div>
                  </div>
                  <span className="text-blue-400 group-hover:translate-x-1 transition">→</span>
                </button>
                
                <button 
                  onClick={() => {
                    setShowPrintModal(false);
                  }} 
                  className="flex items-center justify-between p-4 border border-gray-700 rounded-xl hover:border-blue-500 hover:bg-gray-700 transition group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-cyan-900/30 rounded-full flex items-center justify-center">
                      <FiDollarSign className="text-cyan-400" size={20} />
                    </div>
                    <div className="text-left">
                      <p className="font-semibold text-gray-100">Payroll Summary Only</p>
                      <p className="text-xs text-gray-400">Payroll metrics and totals</p>
                    </div>
                  </div>
                  <span className="text-blue-400 group-hover:translate-x-1 transition">→</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;