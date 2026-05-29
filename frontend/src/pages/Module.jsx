// Modules.jsx – Black & Amber Theme with enrollment management
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { 
  FiBook, FiPlus, FiEdit2, FiTrash2, FiRefreshCw, FiX, FiCheck,
  FiAward, FiBriefcase, FiUsers, FiUserPlus
} from 'react-icons/fi';

const api = axios.create({
  baseURL: 'http://localhost:3000/api',
  withCredentials: true
});

const Modules = () => {
  const [modules, setModules] = useState([]);
  const [trades, setTrades] = useState([]);
  const [trainees, setTrainees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingModule, setEditingModule] = useState(null);
  const [formData, setFormData] = useState({
    module_name: '',
    module_code: '',
    credits: '',
    trade_id: ''
  });
  const [submitting, setSubmitting] = useState(false);

  // Enrollment modal state
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [selectedModule, setSelectedModule] = useState(null);
  const [availableTrainees, setAvailableTrainees] = useState([]);
  const [selectedTrainees, setSelectedTrainees] = useState([]);
  const [enrolling, setEnrolling] = useState(false);

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [modulesRes, tradesRes, traineesRes] = await Promise.all([
        api.get('/modules'),
        api.get('/trades'),
        api.get('/trainees')
      ]);
      setModules(modulesRes.data);
      setTrades(tradesRes.data);
      setTrainees(traineesRes.data);
    } catch (err) {
      console.error('Failed to fetch data:', err);
      toast.error('Failed to load modules');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (module = null) => {
    if (module) {
      setEditingModule(module);
      setFormData({
        module_name: module.module_name,
        module_code: module.module_code,
        credits: module.credits,
        trade_id: module.trade_id?._id || module.trade_id
      });
    } else {
      setEditingModule(null);
      setFormData({ module_name: '', module_code: '', credits: '', trade_id: '' });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingModule(null);
    setFormData({ module_name: '', module_code: '', credits: '', trade_id: '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.module_name.trim() || !formData.module_code.trim() || !formData.credits || !formData.trade_id) {
      toast.error('All fields are required');
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        module_name: formData.module_name.trim(),
        module_code: formData.module_code.trim(),
        credits: Number(formData.credits),
        trade_id: formData.trade_id
      };
      if (editingModule) {
        await api.put(`/modules/${editingModule._id}`, payload);
        toast.success('Module updated');
      } else {
        await api.post('/modules', payload);
        toast.success('Module created');
      }
      fetchAllData();
      handleCloseModal();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save module');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (module) => {
    if (!window.confirm(`Delete module "${module.module_name}"? This will remove it from all enrollments.`)) return;
    try {
      await api.delete(`/modules/${module._id}`);
      toast.success('Module deleted');
      fetchAllData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Delete failed');
    }
  };

  // ========== ENROLLMENT LOGIC ==========
  const openEnrollModal = (module) => {
    setSelectedModule(module);
    // Find trainees that belong to the module's trade and are NOT already enrolled in this module
    const alreadyEnrolledIds = new Set();
    // Get enrolled trainees from the module's data (if we had it, but we need to traverse trainees)
    // Actually, we have trainees loaded, we can check each trainee's enrollments
    const eligible = trainees.filter(t => {
      const belongsToTrade = (t.trade_id?._id === module.trade_id?._id) || (t.trade_id === module.trade_id);
      if (!belongsToTrade) return false;
      // Check if already enrolled in this module
      const enrolled = t.enrollments?.some(e => e.module_id?._id === module._id || e.module_id === module._id);
      return !enrolled;
    });
    setAvailableTrainees(eligible);
    setSelectedTrainees([]);
    setShowEnrollModal(true);
  };

  const handleToggleTrainee = (traineeId) => {
    setSelectedTrainees(prev =>
      prev.includes(traineeId) ? prev.filter(id => id !== traineeId) : [...prev, traineeId]
    );
  };

  const handleEnroll = async () => {
    if (selectedTrainees.length === 0) {
      toast.error('Select at least one trainee');
      return;
    }
    setEnrolling(true);
    try {
      // Enroll each selected trainee
      for (const traineeId of selectedTrainees) {
        await api.post(`/trainees/${traineeId}/enrollments`, {
          module_id: selectedModule._id,
          enrollment_date: new Date().toISOString().split('T')[0]
        });
      }
      toast.success(`${selectedTrainees.length} trainee(s) enrolled successfully`);
      fetchAllData(); // refresh to update enrolled counts
      setShowEnrollModal(false);
      setSelectedTrainees([]);
      setSelectedModule(null);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Enrollment failed');
    } finally {
      setEnrolling(false);
    }
  };

  // Helper to get enrolled trainees count for a module
  const getEnrolledCount = (module) => {
    return trainees.filter(t =>
      t.enrollments?.some(e => e.module_id?._id === module._id || e.module_id === module._id)
    ).length;
  };

  // Helper to get enrolled trainees names (first 3)
  const getEnrolledNames = (module) => {
    const enrolled = trainees.filter(t =>
      t.enrollments?.some(e => e.module_id?._id === module._id || e.module_id === module._id)
    ).slice(0, 3);
    return enrolled.map(t => `${t.firstnames} ${t.lastnames}`).join(', ');
  };

  return (
    <div className="min-h-screen bg-black">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-amber-400">Modules</h1>
              <p className="text-gray-400 mt-1 flex items-center gap-1">
                <FiBook size={14} /> Manage training modules and enroll trainees
              </p>
            </div>
            <div className="flex gap-3 w-full sm:w-auto">
              <button onClick={fetchAllData} className="flex items-center gap-2 bg-gray-800 border border-gray-700 hover:bg-gray-700 text-gray-200 px-4 py-2 rounded-xl shadow-sm transition">
                <FiRefreshCw size={16} /> Refresh
              </button>
              <button onClick={() => handleOpenModal()} className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-black px-5 py-2 rounded-xl shadow-md transition font-medium">
                <FiPlus size={16} /> Add Module
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
          </div>
        ) : modules.length === 0 ? (
          <div className="bg-gray-800 rounded-2xl shadow-sm p-12 text-center border border-gray-700">
            <div className="w-20 h-20 bg-amber-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <FiBook className="text-amber-400" size={32} />
            </div>
            <h3 className="text-lg font-semibold text-gray-200">No modules yet</h3>
            <p className="text-gray-400 mt-1">Create your first module to get started.</p>
            <button onClick={() => handleOpenModal()} className="mt-4 bg-amber-500 text-black px-5 py-2 rounded-xl inline-flex items-center gap-2 hover:bg-amber-600 transition font-medium">
              <FiPlus size={16} /> Create Module
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {modules.map((mod) => {
              const enrolledCount = getEnrolledCount(mod);
              const enrolledNames = getEnrolledNames(mod);
              return (
                <div key={mod._id} className="group bg-gray-800 rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-700 hover:border-amber-500 flex flex-col">
                  <div className="p-6 flex-1">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="w-8 h-8 rounded-lg bg-amber-900/30 flex items-center justify-center">
                            <FiBook className="text-amber-400" size={16} />
                          </div>
                          <h3 className="font-bold text-lg text-gray-100">{mod.module_name}</h3>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs font-mono bg-gray-700 text-amber-400 px-2 py-0.5 rounded-full">
                            {mod.module_code}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-1 opacity-70 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => handleOpenModal(mod)} className="p-1.5 text-amber-400 hover:bg-amber-900/30 rounded-lg transition" title="Edit">
                          <FiEdit2 size={16} />
                        </button>
                        <button onClick={() => handleDelete(mod)} className="p-1.5 text-red-400 hover:bg-red-900/30 rounded-lg transition" title="Delete">
                          <FiTrash2 size={16} />
                        </button>
                      </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-gray-700 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm text-gray-400"><FiAward size={14} /><span>Credits</span></div>
                        <span className="font-semibold text-amber-400 bg-amber-900/30 px-2 py-0.5 rounded-lg">{mod.credits}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm text-gray-400"><FiBriefcase size={14} /><span>Trade</span></div>
                        <span className="text-gray-300 font-medium">{mod.trade_id?.trade_name || 'N/A'}</span>
                      </div>
                      <div className="flex items-start justify-between mt-2">
                        <div className="flex items-center gap-2 text-sm text-gray-400"><FiUsers size={14} /><span>Enrolled</span></div>
                        <div className="text-right">
                          <span className="text-amber-400 font-semibold">{enrolledCount}</span>
                          {enrolledCount > 0 && (
                            <p className="text-xs text-gray-500 mt-1 max-w-[150px] truncate" title={enrolledNames}>
                              {enrolledNames}{enrolledCount > 3 ? ` +${enrolledCount - 3}` : ''}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="bg-gray-900 px-6 py-3 flex justify-between items-center">
                    <span className="text-xs text-gray-500">Created: {new Date(mod.created_at).toLocaleDateString()}</span>
                    <button
                      onClick={() => openEnrollModal(mod)}
                      className="flex items-center gap-1 text-xs bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 px-3 py-1 rounded-lg transition"
                    >
                      <FiUserPlus size={12} /> Enroll Trainees
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add/Edit Module Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md border border-gray-700">
            <div className="flex justify-between items-center p-6 border-b border-gray-700">
              <h2 className="text-xl font-bold text-amber-400">{editingModule ? 'Edit Module' : 'New Module'}</h2>
              <button onClick={handleCloseModal} className="text-gray-400 hover:text-gray-200 transition p-1 rounded-full hover:bg-gray-700"><FiX size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div><label className="block text-sm font-semibold text-gray-300 mb-1">Module Name *</label><input type="text" value={formData.module_name} onChange={(e) => setFormData({...formData, module_name: e.target.value})} className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-2.5 text-gray-200 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition" placeholder="e.g., Advanced Wiring" required /></div>
              <div><label className="block text-sm font-semibold text-gray-300 mb-1">Module Code *</label><input type="text" value={formData.module_code} onChange={(e) => setFormData({...formData, module_code: e.target.value})} className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-2.5 text-gray-200 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition" placeholder="e.g., ELEC202" required /></div>
              <div><label className="block text-sm font-semibold text-gray-300 mb-1">Credits *</label><input type="number" value={formData.credits} onChange={(e) => setFormData({...formData, credits: e.target.value})} className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-2.5 text-gray-200 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition" min="0" step="1" placeholder="e.g., 5" required /></div>
              <div><label className="block text-sm font-semibold text-gray-300 mb-1">Trade *</label><select value={formData.trade_id} onChange={(e) => setFormData({...formData, trade_id: e.target.value})} className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-2.5 text-gray-200 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition" required><option value="">Select a trade</option>{trades.map(t => <option key={t._id} value={t._id}>{t.trade_name}</option>)}</select></div>
              <div className="flex gap-3 pt-4"><button type="button" onClick={handleCloseModal} className="flex-1 bg-gray-700 hover:bg-gray-600 text-gray-200 py-2.5 rounded-xl font-medium transition">Cancel</button><button type="submit" disabled={submitting} className="flex-1 bg-amber-500 hover:bg-amber-600 text-black py-2.5 rounded-xl font-medium flex items-center justify-center gap-2 shadow-md transition disabled:opacity-50">{submitting ? 'Saving...' : <><FiCheck size={16} /> Save</>}</button></div>
            </form>
          </div>
        </div>
      )}

      {/* Enroll Trainees Modal */}
      {showEnrollModal && selectedModule && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col border border-gray-700">
            <div className="flex justify-between items-center p-5 border-b border-gray-700">
              <div>
                <h2 className="text-xl font-bold text-amber-400">Enroll Trainees</h2>
                <p className="text-sm text-gray-400">Module: {selectedModule.module_name} ({selectedModule.module_code})</p>
              </div>
              <button onClick={() => setShowEnrollModal(false)} className="text-gray-400 hover:text-gray-200 transition"><FiX size={20} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-5 space-y-3">
              {availableTrainees.length === 0 ? (
                <p className="text-gray-400 text-center py-8">No eligible trainees. All trainees from this trade are already enrolled.</p>
              ) : (
                availableTrainees.map(t => (
                  <label key={t._id} className="flex items-center gap-3 p-3 bg-gray-900 rounded-xl cursor-pointer hover:bg-gray-700 transition">
                    <input type="checkbox" checked={selectedTrainees.includes(t._id)} onChange={() => handleToggleTrainee(t._id)} className="w-4 h-4 text-amber-500 rounded border-gray-600 focus:ring-amber-500" />
                    <div>
                      <p className="font-medium text-gray-200">{t.firstnames} {t.lastnames}</p>
                      <p className="text-xs text-gray-500">Gender: {t.gender}</p>
                    </div>
                  </label>
                ))
              )}
            </div>
            <div className="p-5 border-t border-gray-700 flex gap-3">
              <button onClick={() => setShowEnrollModal(false)} className="flex-1 bg-gray-700 hover:bg-gray-600 text-gray-200 py-2.5 rounded-xl font-medium transition">Cancel</button>
              <button onClick={handleEnroll} disabled={enrolling || selectedTrainees.length === 0} className="flex-1 bg-amber-500 hover:bg-amber-600 text-black py-2.5 rounded-xl font-medium flex items-center justify-center gap-2 transition disabled:opacity-50">
                {enrolling ? 'Enrolling...' : <><FiUserPlus size={16} /> Enroll ({selectedTrainees.length})</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Modules;