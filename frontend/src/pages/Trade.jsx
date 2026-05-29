// Trades.jsx – Manage trades (e.g., Electrical, Plumbing, Carpentry) – Black & Amber Theme
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
  FiCheck
} from 'react-icons/fi';

const api = axios.create({
  baseURL: 'http://localhost:3000/api',
  withCredentials: true
});

const Trades = () => {
  const [trades, setTrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTrade, setEditingTrade] = useState(null);
  const [formData, setFormData] = useState({ trade_name: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchTrades();
  }, []);

  const fetchTrades = async () => {
    setLoading(true);
    try {
      const response = await api.get('/trades');
      setTrades(response.data);
    } catch (err) {
      console.error('Failed to fetch trades:', err);
      toast.error('Failed to load trades');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (trade = null) => {
    if (trade) {
      setEditingTrade(trade);
      setFormData({ trade_name: trade.trade_name });
    } else {
      setEditingTrade(null);
      setFormData({ trade_name: '' });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingTrade(null);
    setFormData({ trade_name: '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.trade_name.trim()) {
      toast.error('Trade name is required');
      return;
    }
    setSubmitting(true);
    try {
      if (editingTrade) {
        await api.put(`/trades/${editingTrade._id}`, { trade_name: formData.trade_name.trim() });
        toast.success('Trade updated successfully');
      } else {
        await api.post('/trades', { trade_name: formData.trade_name.trim() });
        toast.success('Trade created successfully');
      }
      fetchTrades();
      handleCloseModal();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save trade');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (trade) => {
    if (!window.confirm(`Are you sure you want to delete the trade "${trade.trade_name}"? This may affect modules and trainees.`)) return;
    try {
      await api.delete(`/trades/${trade._id}`);
      toast.success('Trade deleted successfully');
      fetchTrades();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to delete trade');
    }
  };

  return (
    <div className="min-h-screen bg-black">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-amber-400">
                Trades
              </h1>
              <p className="text-gray-400 mt-1 flex items-center gap-1">
                <FiBriefcase size={14} /> Manage training trades / professions
              </p>
            </div>
            <div className="flex gap-3 w-full sm:w-auto">
              <button 
                onClick={fetchTrades} 
                className="flex items-center gap-2 bg-gray-800 border border-gray-700 hover:bg-gray-700 text-gray-200 px-4 py-2 rounded-xl shadow-sm transition-all duration-200"
              >
                <FiRefreshCw size={16} /> Refresh
              </button>
              <button 
                onClick={() => handleOpenModal()} 
                className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-black px-5 py-2 rounded-xl shadow-md transition-all duration-200 font-medium"
              >
                <FiPlus size={16} /> Add Trade
              </button>
            </div>
          </div>
        </div>

        {/* Trades Grid */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
          </div>
        ) : trades.length === 0 ? (
          <div className="bg-gray-800 rounded-2xl shadow-sm p-12 text-center border border-gray-700">
            <div className="w-20 h-20 bg-amber-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <FiBriefcase className="text-amber-400" size={32} />
            </div>
            <h3 className="text-lg font-semibold text-gray-200">No trades yet</h3>
            <p className="text-gray-400 mt-1">Create your first trade to get started.</p>
            <button 
              onClick={() => handleOpenModal()} 
              className="mt-4 bg-amber-500 text-black px-5 py-2 rounded-xl inline-flex items-center gap-2 hover:bg-amber-600 transition font-medium"
            >
              <FiPlus size={16} /> Create Trade
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {trades.map((trade) => (
              <div 
                key={trade._id} 
                className="group bg-gray-800 rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-700 hover:border-amber-500"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-amber-900/30 flex items-center justify-center">
                        <FiBriefcase className="text-amber-400" size={20} />
                      </div>
                      <div>
                        <h3 className="font-bold text-lg text-gray-100">{trade.trade_name}</h3>
                        <p className="text-xs text-gray-500 font-mono">ID: {trade._id.slice(-6)}</p>
                      </div>
                    </div>
                    <div className="flex gap-1 opacity-70 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleOpenModal(trade)}
                        className="p-1.5 text-amber-400 hover:bg-amber-900/30 rounded-lg transition"
                        title="Edit"
                      >
                        <FiEdit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(trade)}
                        className="p-1.5 text-red-400 hover:bg-red-900/30 rounded-lg transition"
                        title="Delete"
                      >
                        <FiTrash2 size={16} />
                      </button>
                    </div>
                  </div>
                  <div className="mt-4 pt-3 border-t border-gray-700 text-xs text-gray-500 flex justify-between">
                    <span>Created: {new Date(trade.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal for Add/Edit Trade – Dark theme */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md transform transition-all duration-300 scale-100 border border-gray-700">
            <div className="flex justify-between items-center p-6 border-b border-gray-700">
              <h2 className="text-xl font-bold text-amber-400">
                {editingTrade ? 'Edit Trade' : 'New Trade'}
              </h2>
              <button onClick={handleCloseModal} className="text-gray-400 hover:text-gray-200 transition p-1 rounded-full hover:bg-gray-700">
                <FiX size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-200 mb-1">Trade Name *</label>
                <input
                  type="text"
                  value={formData.trade_name}
                  onChange={(e) => setFormData({ trade_name: e.target.value })}
                  placeholder="e.g., Electrical Engineering, Plumbing, Carpentry"
                  className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-2.5 text-gray-100 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition"
                  required
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
                  className="flex-1 bg-amber-500 hover:bg-amber-600 text-black py-2.5 rounded-xl font-medium flex items-center justify-center gap-2 shadow-md transition disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : <><FiCheck size={16} /> {editingTrade ? 'Update' : 'Create'}</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Trades;