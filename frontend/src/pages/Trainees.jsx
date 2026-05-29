import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { 
  FiUsers, FiPlus, FiEdit2, FiTrash2, FiRefreshCw, FiX, FiCheck, 
  FiBookOpen, FiAward, FiPrinter
} from 'react-icons/fi';

const api = axios.create({
  baseURL: 'http://localhost:3000/api',
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

const validateMarks = (value, max) => {
  if (value === '' || value === null || value === undefined) return null; // optional
  const num = parseFloat(value);
  if (isNaN(num)) return 'Must be a valid number';
  if (num < 0) return 'Cannot be negative';
  if (num > max) return `Cannot exceed ${max}`;
  return null;
};

const Trainees = () => {
  const [trainees, setTrainees] = useState([]);
  const [trades, setTrades] = useState([]);
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Trainee modal state
  const [showModal, setShowModal] = useState(false);
  const [editingTrainee, setEditingTrainee] = useState(null);
  const [formData, setFormData] = useState({
    firstnames: '',
    lastnames: '',
    gender: 'male',
    trade_id: ''
  });
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Enrollment modal state
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [selectedTrainee, setSelectedTrainee] = useState(null);
  const [enrollForm, setEnrollForm] = useState({ 
    module_id: '', 
    enrollment_date: new Date().toISOString().split('T')[0]
  });
  const [enrollError, setEnrollError] = useState('');

  // Marks entry modal state
  const [showMarksModal, setShowMarksModal] = useState(false);
  const [selectedEnrollment, setSelectedEnrollment] = useState(null);
  const [marksData, setMarksData] = useState({ formative: '', summative: '' });
  const [marksErrors, setMarksErrors] = useState({});
  const [submittingMarks, setSubmittingMarks] = useState(false);

  // Action-specific loading states
  const [deletingId, setDeletingId] = useState(null);
  const [removingEnrollment, setRemovingEnrollment] = useState({ traineeId: null, moduleId: null });

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [traineesRes, tradesRes, modulesRes] = await Promise.all([
        api.get('/trainees'),
        api.get('/trades'),
        api.get('/modules')
      ]);
      setTrainees(traineesRes.data);
      setTrades(tradesRes.data);
      setModules(modulesRes.data);
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

  // CRUD for trainees with validation
  const handleOpenModal = (trainee = null) => {
    setFormErrors({});
    if (trainee) {
      setEditingTrainee(trainee);
      setFormData({
        firstnames: trainee.firstnames,
        lastnames: trainee.lastnames,
        gender: trainee.gender,
        trade_id: trainee.trade_id?._id || trainee.trade_id
      });
    } else {
      setEditingTrainee(null);
      setFormData({ firstnames: '', lastnames: '', gender: 'male', trade_id: '' });
    }
    setShowModal(true);
  };

  const validateTraineeForm = () => {
    const errors = {};
    const firstNameError = validateName(formData.firstnames, 'First names');
    if (firstNameError) errors.firstnames = firstNameError;
    
    const lastNameError = validateName(formData.lastnames, 'Last names');
    if (lastNameError) errors.lastnames = lastNameError;
    
    if (!formData.gender) errors.gender = 'Gender is required';
    if (!formData.trade_id) errors.trade_id = 'Please select a trade';
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateTraineeForm()) return;
    
    setSubmitting(true);
    try {
      const payload = { 
        ...formData, 
        firstnames: formData.firstnames.trim(), 
        lastnames: formData.lastnames.trim() 
      };
      
      if (editingTrainee) {
        await api.put(`/trainees/${editingTrainee._id}`, payload);
        toast.success('Trainee updated successfully');
      } else {
        await api.post('/trainees', payload);
        toast.success('Trainee added successfully');
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

  const handleDelete = async (trainee) => {
    if (!window.confirm(`⚠️ Delete trainee "${trainee.firstnames} ${trainee.lastnames}"?\n\nThis will also remove all enrollments and marks. This action cannot be undone.`)) return;
    
    setDeletingId(trainee._id);
    try {
      await api.delete(`/trainees/${trainee._id}`);
      toast.success('Trainee deleted successfully');
      await fetchAllData();
    } catch (err) {
      console.error('Delete error:', err);
      toast.error(err.response?.data?.error || 'Failed to delete trainee');
    } finally {
      setDeletingId(null);
    }
  };

  // Enrollment management with duplicate validation
  const openEnrollmentModal = (trainee) => {
    setEnrollError('');
    setSelectedTrainee(trainee);
    setEnrollForm({ 
      module_id: '', 
      enrollment_date: new Date().toISOString().split('T')[0]
    });
    setShowEnrollModal(true);
  };

  const isModuleAlreadyEnrolled = (trainee, moduleId) => {
    return trainee.enrollments?.some(
      enr => (enr.module_id?._id || enr.module_id) === moduleId
    );
  };

  const addEnrollment = async () => {
    setEnrollError('');
    
    if (!enrollForm.module_id) {
      setEnrollError('Please select a module');
      return;
    }
    
    if (isModuleAlreadyEnrolled(selectedTrainee, enrollForm.module_id)) {
      setEnrollError('Trainee is already enrolled in this module');
      return;
    }
    
    try {
      await api.post(`/trainees/${selectedTrainee._id}/enrollments`, {
        module_id: enrollForm.module_id,
        enrollment_date: enrollForm.enrollment_date
      });
      toast.success('Enrollment added successfully');
      await fetchAllData();
      setShowEnrollModal(false);
    } catch (err) {
      console.error('Enrollment error:', err);
      let errorMsg = err.response?.data?.error || 'Enrollment failed';
      if (err.response?.status === 409) errorMsg = 'This trainee is already enrolled in the module';
      setEnrollError(errorMsg);
      toast.error(errorMsg);
    }
  };

  const deleteEnrollment = async (traineeId, moduleId, traineeName) => {
    if (!window.confirm(`Remove enrollment from ${traineeName}?`)) return;
    
    setRemovingEnrollment({ traineeId, moduleId });
    try {
      await api.delete(`/trainees/${traineeId}/enrollments/${moduleId}`);
      toast.success('Enrollment removed');
      await fetchAllData();
    } catch (err) {
      console.error('Remove enrollment error:', err);
      toast.error(err.response?.data?.error || 'Failed to remove enrollment');
    } finally {
      setRemovingEnrollment({ traineeId: null, moduleId: null });
    }
  };

  // Marks entry with validation
  const openMarksModal = (trainee, enrollment) => {
    setMarksErrors({});
    setSelectedEnrollment({ trainee, enrollment });
    setMarksData({
      formative: enrollment.formative ?? '',
      summative: enrollment.summative ?? ''
    });
    setShowMarksModal(true);
  };

  const validateMarksForm = () => {
    const errors = {};
    const formativeError = validateMarks(marksData.formative, 50);
    if (formativeError) errors.formative = formativeError;
    
    const summativeError = validateMarks(marksData.summative, 50);
    if (summativeError) errors.summative = summativeError;
    
    setMarksErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const saveMarks = async () => {
    if (!validateMarksForm()) return;
    
    const formative = marksData.formative === '' ? null : parseFloat(marksData.formative);
    const summative = marksData.summative === '' ? null : parseFloat(marksData.summative);
    
    if (formative === null && summative === null) {
      if (!window.confirm('Both marks are empty. This will clear existing marks. Continue?')) return;
    }
    
    setSubmittingMarks(true);
    try {
      await api.put(`/trainees/${selectedEnrollment.trainee._id}/enrollments/${selectedEnrollment.enrollment.module_id?._id}/marks`, {
        formative: formative !== null ? formative : 0,
        summative: summative !== null ? summative : 0
      });
      toast.success('Marks saved successfully');
      setShowMarksModal(false);
      await fetchAllData();
    } catch (err) {
      console.error('Save marks error:', err);
      toast.error(err.response?.data?.error || 'Failed to save marks');
    } finally {
      setSubmittingMarks(false);
    }
  };

  const getCompetencyStatus = (totalMarks) => {
    if (totalMarks === null || totalMarks === undefined) {
      return { label: 'Not graded', class: 'bg-gray-700 text-gray-300' };
    }
    if (totalMarks >= 70) {
      return { label: 'Competent', class: 'bg-green-900/50 text-green-300' };
    }
    return { label: 'Not Yet Competent', class: 'bg-amber-900/50 text-amber-300' };
  };

  // Report printing
  const computeTraineeAverage = (trainee) => {
    const gradedEnrollments = trainee.enrollments.filter(e => e.total_marks !== null && e.total_marks !== undefined);
    if (gradedEnrollments.length === 0) return null;
    const sum = gradedEnrollments.reduce((acc, e) => acc + e.total_marks, 0);
    return sum / gradedEnrollments.length;
  };

  const printTraineeReport = (trainee) => {
    const sameTradeTrainees = trainees.filter(t => {
      const tradeId = t.trade_id?._id || t.trade_id;
      const targetTradeId = trainee.trade_id?._id || trainee.trade_id;
      return tradeId === targetTradeId;
    });

    const ranks = sameTradeTrainees.map(t => ({
      trainee: t,
      avg: computeTraineeAverage(t)
    })).filter(r => r.avg !== null).sort((a,b) => b.avg - a.avg);

    let position = null;
    const currentAvg = computeTraineeAverage(trainee);
    if (currentAvg !== null) {
      const idx = ranks.findIndex(r => r.trainee._id === trainee._id);
      position = idx !== -1 ? idx + 1 : null;
    }

    const enrollmentsList = trainee.enrollments.map(enr => ({
      moduleName: enr.module_id?.module_name || 'Unknown',
      moduleCode: enr.module_id?.module_code || 'N/A',
      enrollmentDate: new Date(enr.enrollment_date).toLocaleDateString(),
      formative: enr.formative !== null ? enr.formative : '—',
      summative: enr.summative !== null ? enr.summative : '—',
      total: enr.total_marks !== null ? `${enr.total_marks}%` : '—',
      competent: enr.total_marks !== null ? (enr.total_marks >= 70 ? 'Yes' : 'No') : '—'
    }));

    const printWindow = window.open('', '_blank', 'width=900,height=700');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Report - ${trainee.firstnames} ${trainee.lastnames}</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <style>
          @media print {
            body { margin: 0; padding: 20px; }
            .no-print { display: none; }
          }
          table { border-collapse: collapse; width: 100%; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; }
        </style>
      </head>
      <body class="p-8 bg-white">
        <div class="max-w-4xl mx-auto">
          <div class="text-center mb-8">
            <h1 class="text-3xl font-bold text-amber-600">XWISDOM Training Report</h1>
            <p class="text-gray-600">Generated on ${new Date().toLocaleString()}</p>
          </div>
          <div class="bg-gray-50 p-4 rounded mb-6">
            <h2 class="text-xl font-semibold mb-2">Trainee Information</h2>
            <div class="grid grid-cols-2 gap-4">
              <div><span class="font-medium">Name:</span> ${trainee.firstnames} ${trainee.lastnames}</div>
              <div><span class="font-medium">Gender:</span> ${trainee.gender}</div>
              <div><span class="font-medium">Trade:</span> ${trainee.trade_id?.trade_name || 'N/A'}</div>
              <div><span class="font-medium">Overall Average:</span> ${currentAvg !== null ? currentAvg.toFixed(1) + '%' : 'No graded modules'}</div>
              ${position ? `<div><span class="font-medium">Rank in Trade:</span> ${position} / ${ranks.length}</div>` : ''}
            </div>
          </div>
          <div class="mb-6">
            <h2 class="text-xl font-semibold mb-3">Module Performance</h2>
            <table class="min-w-full border">
              <thead>
                <tr><th>Module</th><th>Code</th><th>Enrolled</th><th>Formative (50)</th><th>Summative (50)</th><th>Total (%)</th><th>Competent?</th></tr>
              </thead>
              <tbody>
                ${enrollmentsList.map(e => `
                  <tr>
                    <td>${e.moduleName}</td><td>${e.moduleCode}</td><td>${e.enrollmentDate}</td>
                    <td>${e.formative}</td><td>${e.summative}</td>
                    <td class="font-semibold ${e.total !== '—' && parseFloat(e.total) >= 70 ? 'text-green-600' : 'text-orange-600'}">${e.total}</td>
                    <td>${e.competent}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
          <div class="mt-8 text-center text-gray-500 text-sm no-print">
            <button onclick="window.print(); setTimeout(() => window.close(), 1000)" class="bg-amber-500 hover:bg-amber-600 text-black px-6 py-2 rounded mr-3 font-medium">🖨️ Print / Save PDF</button>
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
            <h1 className="text-2xl sm:text-3xl font-bold text-amber-400">Trainees</h1>
            <p className="text-sm text-gray-400">Manage trainees, enrollments, and marks</p>
          </div>
          <div className="flex gap-3 w-full sm:w-auto">
            <button onClick={fetchAllData} className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-gray-200 px-4 py-2 rounded-xl border border-gray-700 transition">
              <FiRefreshCw size={18} /> Refresh
            </button>
            <button onClick={() => handleOpenModal()} className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-black px-4 py-2 rounded-xl font-medium shadow-md transition">
              <FiPlus size={18} /> Add Trainee
            </button>
          </div>
        </div>

        {loading ? (
          <div className="bg-gray-800 rounded-xl shadow-md p-12 text-center border border-gray-700">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500 mx-auto"></div>
            <p className="text-gray-400 mt-3">Loading trainees...</p>
          </div>
        ) : trainees.length === 0 ? (
          <div className="bg-gray-800 rounded-xl shadow-md p-12 text-center border border-gray-700">
            <FiUsers className="mx-auto text-gray-500 mb-4" size={48} />
            <p className="text-gray-400">No trainees yet. Add your first trainee.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {trainees.map(trainee => (
              <div key={trainee._id} className="bg-gray-800 rounded-xl shadow-md overflow-hidden border border-gray-700">
                <div className="p-5 border-b border-gray-700 flex flex-wrap justify-between items-start gap-3">
                  <div>
                    <h3 className="text-lg font-bold text-gray-100">{trainee.firstnames} {trainee.lastnames}</h3>
                    <p className="text-sm text-gray-400">Gender: {trainee.gender} | Trade: {trainee.trade_id?.trade_name || 'N/A'}</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => printTraineeReport(trainee)} className="bg-gray-700 hover:bg-gray-600 text-amber-400 px-3 py-1 rounded-lg text-sm flex items-center gap-1 transition" title="Print Report">
                      <FiPrinter size={14} /> Report
                    </button>
                    <button onClick={() => openEnrollmentModal(trainee)} className="bg-gray-700 hover:bg-gray-600 text-amber-400 px-3 py-1 rounded-lg text-sm flex items-center gap-1 transition">
                      <FiBookOpen size={14} /> Enroll
                    </button>
                    <button onClick={() => handleOpenModal(trainee)} className="text-amber-400 hover:text-amber-300 p-1"><FiEdit2 size={18} /></button>
                    <button onClick={() => handleDelete(trainee)} disabled={deletingId === trainee._id} className="text-red-400 hover:text-red-300 p-1 disabled:opacity-50">
                      {deletingId === trainee._id ? '...' : <FiTrash2 size={18} />}
                    </button>
                  </div>
                </div>
                {trainee.enrollments && trainee.enrollments.length > 0 && (
                  <div className="p-5">
                    <h4 className="font-semibold text-gray-300 mb-3">Enrollments</h4>
                    <div className="overflow-x-auto">
                      <table className="min-w-full text-sm">
                        <thead className="bg-gray-900">
                          <tr>
                            <th className="text-left p-2 text-amber-400">Module</th>
                            <th className="text-left p-2 text-amber-400">Enrolled</th>
                            <th className="text-left p-2 text-amber-400">Competency</th>
                            <th className="text-left p-2 text-amber-400">Total Marks</th>
                            <th className="text-center text-amber-400">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-700">
                          {trainee.enrollments.map(enr => {
                            const moduleName = enr.module_id?.module_name || 'Unknown';
                            const moduleId = enr.module_id?._id || enr.module_id;
                            const competency = getCompetencyStatus(enr.total_marks);
                            const isRemoving = removingEnrollment.traineeId === trainee._id && removingEnrollment.moduleId === moduleId;
                            return (
                              <tr key={enr._id} className="border-t border-gray-700">
                                <td className="p-2 text-gray-200">{moduleName}</td>
                                <td className="p-2 text-gray-400">{new Date(enr.enrollment_date).toLocaleDateString()}</td>
                                <td className="p-2"><span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${competency.class}`}>{competency.label}</span></td>
                                <td className="p-2">{enr.total_marks !== null ? <span className={`font-semibold ${enr.total_marks >= 70 ? 'text-green-400' : 'text-amber-400'}`}>{enr.total_marks}%</span> : <span className="text-gray-500">—</span>}</td>
                                <td className="p-2 text-center">
                                  <button onClick={() => openMarksModal(trainee, enr)} className="bg-gray-700 hover:bg-gray-600 text-amber-400 px-2 py-1 rounded text-xs mr-1 transition"><FiAward size={12} className="inline mr-1" /> marks</button>
                                  <button onClick={() => deleteEnrollment(trainee._id, moduleId, `${trainee.firstnames} ${trainee.lastnames}`)} disabled={isRemoving} className="text-red-400 hover:text-red-300 text-xs hover:underline disabled:opacity-50">
                                    {isRemoving ? '...' : 'Remove'}
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add/Edit Trainee Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-2xl shadow-xl w-full max-w-md border border-gray-700">
            <div className="p-5 border-b border-gray-700 flex justify-between items-center">
              <h2 className="text-xl font-bold text-amber-400">{editingTrainee ? 'Edit Trainee' : 'Add Trainee'}</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-200"><FiX size={24} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              {formErrors.general && <div className="bg-red-900/50 text-red-200 p-2 rounded-lg text-sm">{formErrors.general}</div>}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">First Names *</label>
                <input type="text" value={formData.firstnames} onChange={(e) => setFormData({...formData, firstnames: e.target.value})} className={`w-full bg-gray-900 border ${formErrors.firstnames ? 'border-red-500' : 'border-gray-700'} rounded-xl px-3 py-2 text-gray-200 focus:ring-2 focus:ring-amber-500`} />
                {formErrors.firstnames && <p className="text-red-400 text-xs mt-1">{formErrors.firstnames}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Last Names *</label>
                <input type="text" value={formData.lastnames} onChange={(e) => setFormData({...formData, lastnames: e.target.value})} className={`w-full bg-gray-900 border ${formErrors.lastnames ? 'border-red-500' : 'border-gray-700'} rounded-xl px-3 py-2 text-gray-200 focus:ring-2 focus:ring-amber-500`} />
                {formErrors.lastnames && <p className="text-red-400 text-xs mt-1">{formErrors.lastnames}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Gender *</label>
                <select value={formData.gender} onChange={(e) => setFormData({...formData, gender: e.target.value})} className="w-full bg-gray-900 border border-gray-700 rounded-xl px-3 py-2 text-gray-200">
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
                {formErrors.gender && <p className="text-red-400 text-xs mt-1">{formErrors.gender}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Trade *</label>
                <select value={formData.trade_id} onChange={(e) => setFormData({...formData, trade_id: e.target.value})} className={`w-full bg-gray-900 border ${formErrors.trade_id ? 'border-red-500' : 'border-gray-700'} rounded-xl px-3 py-2 text-gray-200`}>
                  <option value="">Select trade</option>
                  {trades.map(t => <option key={t._id} value={t._id}>{t.trade_name}</option>)}
                </select>
                {formErrors.trade_id && <p className="text-red-400 text-xs mt-1">{formErrors.trade_id}</p>}
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 bg-gray-700 hover:bg-gray-600 text-gray-200 py-2 rounded-xl transition">Cancel</button>
                <button type="submit" disabled={submitting} className="flex-1 bg-amber-500 hover:bg-amber-600 text-black py-2 rounded-xl font-medium flex items-center justify-center gap-2 transition">
                  {submitting ? 'Saving...' : <><FiCheck /> Save</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Enrollment Modal - only modules from trainee's trade */}
      {showEnrollModal && selectedTrainee && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-2xl shadow-xl w-full max-w-md border border-gray-700">
            <div className="p-5 border-b border-gray-700 flex justify-between items-center">
              <h2 className="text-xl font-bold text-amber-400">Enroll in Module</h2>
              <button onClick={() => setShowEnrollModal(false)} className="text-gray-400 hover:text-gray-200"><FiX size={24} /></button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Trainee</label>
                <input type="text" value={`${selectedTrainee.firstnames} ${selectedTrainee.lastnames}`} disabled className="w-full bg-gray-900 border border-gray-700 rounded-xl px-3 py-2 text-gray-400" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Module *</label>
                <select 
                  value={enrollForm.module_id} 
                  onChange={(e) => setEnrollForm({...enrollForm, module_id: e.target.value})} 
                  className="w-full bg-gray-900 border border-gray-700 rounded-xl px-3 py-2 text-gray-200"
                >
                  <option value="">Select module</option>
                  {/* Filter modules: only those that belong to the trainee's trade */}
                  {modules
                    .filter(mod => {
                      const modTradeId = mod.trade_id?._id || mod.trade_id;
                      const traineeTradeId = selectedTrainee.trade_id?._id || selectedTrainee.trade_id;
                      return modTradeId === traineeTradeId;
                    })
                    .map(m => {
                      const alreadyEnrolled = isModuleAlreadyEnrolled(selectedTrainee, m._id);
                      return (
                        <option key={m._id} value={m._id} disabled={alreadyEnrolled}>
                          {m.module_name} ({m.module_code}) {alreadyEnrolled ? '(already enrolled)' : ''}
                        </option>
                      );
                    })}
                </select>
                {enrollError && <p className="text-red-400 text-xs mt-1">{enrollError}</p>}
                {/* If no modules available for this trade */}
                {modules.filter(mod => {
                  const modTradeId = mod.trade_id?._id || mod.trade_id;
                  const traineeTradeId = selectedTrainee.trade_id?._id || selectedTrainee.trade_id;
                  return modTradeId === traineeTradeId;
                }).length === 0 && (
                  <p className="text-amber-400 text-xs mt-1">No modules available for this trade. Please add modules first.</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Enrollment Date</label>
                <input type="date" value={enrollForm.enrollment_date} onChange={(e) => setEnrollForm({...enrollForm, enrollment_date: e.target.value})} className="w-full bg-gray-900 border border-gray-700 rounded-xl px-3 py-2 text-gray-200" />
              </div>
              <div className="flex gap-3">
                <button onClick={() => setShowEnrollModal(false)} className="flex-1 bg-gray-700 hover:bg-gray-600 text-gray-200 py-2 rounded-xl transition">Cancel</button>
                <button onClick={addEnrollment} className="flex-1 bg-amber-500 hover:bg-amber-600 text-black py-2 rounded-xl font-medium flex items-center justify-center gap-2 transition">
                  <FiBookOpen /> Enroll
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Marks Entry Modal */}
      {showMarksModal && selectedEnrollment && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-2xl shadow-xl w-full max-w-md border border-gray-700">
            <div className="p-5 border-b border-gray-700 flex justify-between items-center">
              <h2 className="text-xl font-bold text-amber-400">Assign Marks</h2>
              <button onClick={() => setShowMarksModal(false)} className="text-gray-400 hover:text-gray-200"><FiX size={24} /></button>
            </div>
            <div className="p-5 space-y-4">
              <div className="bg-gray-900 p-3 rounded-xl">
                <p className="text-gray-300"><span className="font-medium text-amber-400">Trainee:</span> {selectedEnrollment.trainee.firstnames} {selectedEnrollment.trainee.lastnames}</p>
                <p className="text-gray-300"><span className="font-medium text-amber-400">Module:</span> {selectedEnrollment.enrollment.module_id?.module_name} ({selectedEnrollment.enrollment.module_id?.module_code})</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Formative Assessment (max 50)</label>
                <input type="number" value={marksData.formative} onChange={(e) => setMarksData({...marksData, formative: e.target.value})} min="0" max="50" step="0.5" className={`w-full bg-gray-900 border ${marksErrors.formative ? 'border-red-500' : 'border-gray-700'} rounded-xl px-3 py-2 text-gray-200 focus:ring-2 focus:ring-amber-500`} placeholder="e.g., 42.5" />
                {marksErrors.formative && <p className="text-red-400 text-xs mt-1">{marksErrors.formative}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Summative Assessment (max 50)</label>
                <input type="number" value={marksData.summative} onChange={(e) => setMarksData({...marksData, summative: e.target.value})} min="0" max="50" step="0.5" className={`w-full bg-gray-900 border ${marksErrors.summative ? 'border-red-500' : 'border-gray-700'} rounded-xl px-3 py-2 text-gray-200 focus:ring-2 focus:ring-amber-500`} placeholder="e.g., 35.0" />
                {marksErrors.summative && <p className="text-red-400 text-xs mt-1">{marksErrors.summative}</p>}
              </div>
              <div className="bg-amber-900/20 p-3 rounded-xl text-sm border border-amber-800/30">
                <p className="text-gray-300">Total marks = Formative + Summative (max 100)</p>
                {marksData.formative !== '' && marksData.summative !== '' && !isNaN(parseFloat(marksData.formative)) && !isNaN(parseFloat(marksData.summative)) && (
                  <p className="font-bold mt-1 text-amber-400">Calculated total: {(parseFloat(marksData.formative) + parseFloat(marksData.summative)).toFixed(1)}%</p>
                )}
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowMarksModal(false)} className="flex-1 bg-gray-700 hover:bg-gray-600 text-gray-200 py-2 rounded-xl transition">Cancel</button>
                <button onClick={saveMarks} disabled={submittingMarks} className="flex-1 bg-amber-500 hover:bg-amber-600 text-black py-2 rounded-xl font-medium flex items-center justify-center gap-2 transition">
                  {submittingMarks ? 'Saving...' : 'Save Marks'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Trainees;