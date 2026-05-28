import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { FiEdit2, FiTrash2, FiPlus, FiX } from 'react-icons/fi';

const StockIn = () => {
    const [stockInRecords, setStockInRecords] = useState([]);
    const [spareParts, setSpareParts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    
    const [formData, setFormData] = useState({
        part_id: '',
        stock_in_quantity: '',
        stock_in_date: new Date().toISOString().split('T')[0],
        unit_price: '',
        supplier_name: '',
        invoice_number: ''
    });

    useEffect(() => {
        fetchStockIn();
        fetchSpareParts();
    }, []);

    const fetchStockIn = async () => {
        try {
            setLoading(true);
            const response = await axios.get('http://localhost:5000/api/stockin');
            setStockInRecords(response.data);
            setError('');
        } catch (err) {
            const errorMsg = err.response?.data?.error || err.message || 'Failed to fetch stock in records';
            setError(errorMsg);
            toast.error(errorMsg);
            console.error('Fetch error:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchSpareParts = async () => {
        try {
            const response = await axios.get('http://localhost:5000/api/spareparts');
            setSpareParts(response.data);
        } catch (err) {
            console.error('Failed to fetch spare parts:', err);
            toast.error('Failed to fetch spare parts');
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
        
        if (parseInt(formData.stock_in_quantity) <= 0) {
            toast.error('Quantity must be greater than 0');
            return;
        }

        setLoading(true);
        try {
            if (editingId) {
                await axios.put(`http://localhost:5000/api/stockin/${editingId}`, formData);
                toast.success('Stock in record updated successfully');
            } else {
                await axios.post('http://localhost:5000/api/stockin', formData);
                toast.success('Stock in recorded successfully');
            }
            resetForm();
            await fetchStockIn();
        } catch (err) {
            const errorMsg = err.response?.data?.error || 'Failed to save stock in record';
            setError(errorMsg);
            toast.error(errorMsg);
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setFormData({
            part_id: '',
            stock_in_quantity: '',
            stock_in_date: new Date().toISOString().split('T')[0],
            unit_price: '',
            supplier_name: '',
            invoice_number: ''
        });
        setEditingId(null);
        setShowForm(false);
        setError('');
    };

    const handleEdit = (record) => {
        setFormData({
            part_id: record.spare_part_id,
            stock_in_quantity: record.stock_in_quantity,
            stock_in_date: record.stock_in_date.split('T')[0],
            unit_price: record.unit_price || '',
            supplier_name: record.supplier_name || '',
            invoice_number: record.invoice_number || ''
        });
        setEditingId(record.stock_in_id);
        setShowForm(true);
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this stock in record?')) {
            try {
                await axios.delete(`http://localhost:5000/api/stockin/${id}`);
                toast.success('Stock in record deleted successfully');
                await fetchStockIn();
            } catch (err) {
                toast.error('Failed to delete record');
                console.error(err);
            }
        }
    };

    const getPartName = (partId) => {
        const part = spareParts.find(p => p.part_id === partId);
        return part ? part.name : 'Unknown Part';
    };

    return (
        <div className="min-h-screen bg-gray-100">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Stock In Management</h1>
                        <p className="text-gray-600 mt-1">Track all incoming inventory transactions</p>
                    </div>
                    <button
                        onClick={() => setShowForm(!showForm)}
                        className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition shadow-md"
                    >
                        {showForm ? <FiX size={18} /> : <FiPlus size={18} />}
                        {showForm ? 'Cancel' : 'New Stock In'}
                    </button>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded">
                        <p>{error}</p>
                    </div>
                )}

                {/* Form */}
                {showForm && (
                    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                        <h2 className="text-xl font-bold text-gray-800 mb-4">
                            {editingId ? 'Edit Stock In Record' : 'New Stock In Record'}
                        </h2>
                        <form onSubmit={handleSubmit}>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Spare Part *</label>
                                    <select
                                        name="part_id"
                                        value={formData.part_id}
                                        onChange={handleInputChange}
                                        required
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                    >
                                        <option value="">Select Part</option>
                                        {spareParts.map(part => (
                                            <option key={part.part_id} value={part.part_id}>
                                                {part.name} - {part.category} (Stock: {part.quantity})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Quantity *</label>
                                    <input
                                        type="number"
                                        name="stock_in_quantity"
                                        value={formData.stock_in_quantity}
                                        onChange={handleInputChange}
                                        required
                                        min="1"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Unit Price ($)</label>
                                    <input
                                        type="number"
                                        name="unit_price"
                                        value={formData.unit_price}
                                        onChange={handleInputChange}
                                        step="0.01"
                                        min="0"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
                                    <input
                                        type="date"
                                        name="stock_in_date"
                                        value={formData.stock_in_date}
                                        onChange={handleInputChange}
                                        required
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Supplier Name</label>
                                    <input
                                        type="text"
                                        name="supplier_name"
                                        value={formData.supplier_name}
                                        onChange={handleInputChange}
                                        placeholder="Enter supplier name"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Invoice Number</label>
                                    <input
                                        type="text"
                                        name="invoice_number"
                                        value={formData.invoice_number}
                                        onChange={handleInputChange}
                                        placeholder="Enter invoice number"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                    />
                                </div>
                            </div>
                            <div className="flex gap-3 mt-6">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white px-6 py-2 rounded-lg transition"
                                >
                                    {loading ? 'Saving...' : (editingId ? 'Update Record' : 'Save Record')}
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

                {/* Stock In Records Table */}
                {loading && !stockInRecords.length ? (
                    <div className="flex justify-center items-center py-12">
                        <div className="text-gray-500">Loading records...</div>
                    </div>
                ) : stockInRecords.length === 0 ? (
                    <div className="bg-white rounded-lg shadow-md p-8 text-center">
                        <p className="text-gray-500">No stock in records found.</p>
                    </div>
                ) : (
                    <div className="bg-white rounded-lg shadow-md overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Part Name</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Unit Price</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Supplier</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {stockInRecords.map((record) => (
                                        <tr key={record.stock_in_id} className="hover:bg-gray-50 transition">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                #{record.stock_in_id}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                                                {record.part_name}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                                                <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                                                    +{record.stock_in_quantity}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-600">
                                                ${parseFloat(record.unit_price || 0).toFixed(2)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-semibold text-gray-900">
                                                ${parseFloat(record.total_price || record.stock_in_quantity * (record.unit_price || 0)).toFixed(2)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                                {record.supplier_name || '-'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {new Date(record.stock_in_date).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center text-sm">
                                                <div className="flex gap-2 justify-center">
                                                    <button
                                                        onClick={() => handleEdit(record)}
                                                        className="text-blue-600 hover:text-blue-800 transition"
                                                        title="Edit"
                                                    >
                                                        <FiEdit2 size={18} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(record.stock_in_id)}
                                                        className="text-red-600 hover:text-red-800 transition"
                                                        title="Delete"
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
                                        <td colSpan="2" className="px-6 py-4 text-right font-bold text-gray-700">Total Quantity:</td>
                                        <td className="px-6 py-4 text-right font-bold text-gray-900">
                                            {stockInRecords.reduce((sum, r) => sum + parseInt(r.stock_in_quantity), 0)}
                                        </td>
                                        <td colSpan="5"></td>
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

export default StockIn;