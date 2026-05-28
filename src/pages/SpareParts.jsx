import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { FiEdit2, FiTrash2, FiPlus, FiX, FiRefreshCw, FiSearch } from 'react-icons/fi';

const SpareParts = () => {
    const [parts, setParts] = useState([]);
    const [filteredParts, setFilteredParts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('');
    const [categories, setCategories] = useState([]);
    
    const [formData, setFormData] = useState({
        name: '',
        category: '',
        unitprice: '',
        quantity: ''
    });

    useEffect(() => {
        fetchParts();
    }, []);

    useEffect(() => {
        let filtered = parts;
        if (searchTerm) {
            filtered = filtered.filter(part => 
                part.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                part.category.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }
        if (categoryFilter) {
            filtered = filtered.filter(part => part.category === categoryFilter);
        }
        setFilteredParts(filtered);
    }, [searchTerm, categoryFilter, parts]);

    const fetchParts = async () => {
        setLoading(true);
        try {
            const response = await axios.get('http://localhost:5000/api/spareparts');
            setParts(response.data);
            setFilteredParts(response.data);
            const uniqueCategories = [...new Set(response.data.map(part => part.category))];
            setCategories(uniqueCategories);
            setError('');
        } catch (err) {
            const errorMsg = err.response?.data?.error || err.message || 'Failed to fetch spare parts';
            setError(errorMsg);
            toast.error(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.name || !formData.category) {
            toast.error('Name and category are required');
            return;
        }
        if (parseFloat(formData.unitprice) < 0) {
            toast.error('Unit price cannot be negative');
            return;
        }
        if (parseInt(formData.quantity) < 0) {
            toast.error('Quantity cannot be negative');
            return;
        }
        setLoading(true);
        try {
            if (editingId) {
                await axios.put(`http://localhost:5000/api/spareparts/${editingId}`, formData);
                toast.success('Spare part updated successfully');
            } else {
                await axios.post(`http://localhost:5000/api/spareparts`, formData);
                toast.success('Spare part added successfully');
            }
            resetForm();
            await fetchParts();
        } catch (err) {
            const errorMsg = err.response?.data?.error || 'Failed to save spare part';
            setError(errorMsg);
            toast.error(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setFormData({ name: '', category: '', unitprice: '', quantity: '' });
        setEditingId(null);
        setShowForm(false);
        setError('');
    };

    const handleEdit = (part) => {
        setFormData({
            name: part.name,
            category: part.category,
            unitprice: part.unitprice,
            quantity: part.quantity
        });
        setEditingId(part.part_id);
        setShowForm(true);
    };

    const handleDelete = async (id, name) => {
        if (window.confirm(`Are you sure you want to delete "${name}"?`)) {
            try {
                await axios.delete(`http://localhost:5000/api/spareparts/${id}`);
                toast.success('Spare part deleted successfully');
                await fetchParts();
            } catch (err) {
                toast.error('Failed to delete spare part');
            }
        }
    };

    const getStockStatus = (quantity) => {
        if (quantity === 0) return { text: 'Out of Stock', bg: 'bg-red-100 text-red-800' };
        if (quantity < 10) return { text: 'Low Stock', bg: 'bg-orange-100 text-orange-800' };
        if (quantity < 30) return { text: 'Medium Stock', bg: 'bg-yellow-100 text-yellow-800' };
        return { text: 'Good Stock', bg: 'bg-green-100 text-green-800' };
    };

    const calculateTotalValue = () => {
        return filteredParts.reduce((sum, part) => sum + (part.quantity * part.unitprice), 0).toFixed(2);
    };

    const calculateTotalQuantity = () => {
        return filteredParts.reduce((sum, part) => sum + part.quantity, 0);
    };

    return (
        <div className="min-h-screen bg-gray-100">
            <div className="w-full px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Spare Parts Management</h1>
                        <p className="text-sm sm:text-base text-gray-600 mt-1">Manage your inventory spare parts</p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                        <button
                            onClick={fetchParts}
                            className="flex items-center justify-center gap-2 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition shadow-md w-full sm:w-auto"
                        >
                            <FiRefreshCw size={18} /> Refresh
                        </button>
                        <button
                            onClick={() => setShowForm(!showForm)}
                            className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition shadow-md w-full sm:w-auto"
                        >
                            {showForm ? <FiX size={18} /> : <FiPlus size={18} />}
                            {showForm ? 'Cancel' : 'Add New Part'}
                        </button>
                    </div>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded text-sm">
                        <p>{error}</p>
                    </div>
                )}

                {/* Stats Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <div className="bg-white rounded-lg shadow-md p-4">
                        <div className="text-sm text-gray-500">Total Parts</div>
                        <div className="text-2xl font-bold text-gray-800">{filteredParts.length}</div>
                    </div>
                    <div className="bg-white rounded-lg shadow-md p-4">
                        <div className="text-sm text-gray-500">Total Quantity</div>
                        <div className="text-2xl font-bold text-gray-800">{calculateTotalQuantity()}</div>
                    </div>
                    <div className="bg-white rounded-lg shadow-md p-4">
                        <div className="text-sm text-gray-500">Total Value</div>
                        <div className="text-2xl font-bold text-green-600">${calculateTotalValue()}</div>
                    </div>
                    <div className="bg-white rounded-lg shadow-md p-4">
                        <div className="text-sm text-gray-500">Low Stock Items</div>
                        <div className="text-2xl font-bold text-orange-600">
                            {parts.filter(p => p.quantity < 10 && p.quantity > 0).length}
                        </div>
                    </div>
                </div>

                {/* Form */}
                {showForm && (
                    <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 mb-6">
                        <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-4">
                            {editingId ? 'Edit Spare Part' : 'Add New Spare Part'}
                        </h2>
                        <form onSubmit={handleSubmit}>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Part Name *</label>
                                    <input type="text" name="name" value={formData.name} onChange={handleInputChange} required placeholder="Enter part name" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                                    <input type="text" name="category" value={formData.category} onChange={handleInputChange} required placeholder="e.g., Engine, Brake" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Unit Price ($)</label>
                                    <input type="number" name="unitprice" value={formData.unitprice} onChange={handleInputChange} step="0.01" min="0" placeholder="0.00" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                                    <input type="number" name="quantity" value={formData.quantity} onChange={handleInputChange} min="0" placeholder="0" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm" />
                                </div>
                            </div>
                            <div className="flex flex-col sm:flex-row gap-3 mt-6">
                                <button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-6 py-2 rounded-lg transition w-full sm:w-auto">
                                    {loading ? 'Saving...' : (editingId ? 'Update Part' : 'Add Part')}
                                </button>
                                <button type="button" onClick={resetForm} className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-lg transition w-full sm:w-auto">
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* Search and Filter Bar */}
                <div className="bg-white rounded-lg shadow-md p-4 mb-6">
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="flex-1 relative">
                            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                            <input type="text" placeholder="Search by name or category..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm" />
                        </div>
                        <div>
                            <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="w-full sm:w-48 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm">
                                <option value="">All Categories</option>
                                {categories.map(category => <option key={category} value={category}>{category}</option>)}
                            </select>
                        </div>
                        {(searchTerm || categoryFilter) && (
                            <button onClick={() => { setSearchTerm(''); setCategoryFilter(''); }} className="text-red-600 hover:text-red-800 text-sm">
                                Clear Filters
                            </button>
                        )}
                    </div>
                </div>

                {/* Spare Parts Table - Responsive */}
                {loading && filteredParts.length === 0 ? (
                    <div className="bg-white rounded-lg shadow-md p-12 text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                        <p className="mt-4 text-gray-600">Loading spare parts...</p>
                    </div>
                ) : filteredParts.length === 0 ? (
                    <div className="bg-white rounded-lg shadow-md p-12 text-center">
                        <p className="text-gray-500 text-lg">No spare parts found.</p>
                        <button onClick={() => setShowForm(true)} className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition">
                            Add Your First Part
                        </button>
                    </div>
                ) : (
                    <div className="bg-white rounded-lg shadow-md overflow-hidden">
                        {/* Desktop Table */}
                        <div className="hidden md:block overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">ID</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Part Name</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Category</th>
                                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">Quantity</th>
                                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">Unit Price</th>
                                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">Total Value</th>
                                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500">Status</th>
                                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {filteredParts.map((part, index) => {
                                        const stockStatus = getStockStatus(part.quantity);
                                        return (
                                            <tr key={part.part_id} className="hover:bg-gray-50">
                                                <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{index + 1}</td>
                                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{part.name}</td>
                                                <td className="px-4 py-3 whitespace-nowrap"><span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">{part.category}</span></td>
                                                <td className="px-4 py-3 whitespace-nowrap text-sm text-right"><span className={`font-semibold ${part.quantity === 0 ? 'text-red-600' : part.quantity < 10 ? 'text-orange-600' : 'text-gray-900'}`}>{part.quantity}</span></td>
                                                <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-600">${parseFloat(part.unitprice).toFixed(2)}</td>
                                                <td className="px-4 py-3 whitespace-nowrap text-sm text-right font-semibold text-gray-900">${(part.quantity * part.unitprice).toFixed(2)}</td>
                                                <td className="px-4 py-3 whitespace-nowrap text-center"><span className={`px-2 py-1 text-xs rounded-full ${stockStatus.bg}`}>{stockStatus.text}</span></td>
                                                <td className="px-4 py-3 whitespace-nowrap text-center">
                                                    <div className="flex gap-2 justify-center">
                                                        <button onClick={() => handleEdit(part)} className="text-blue-600 hover:text-blue-800" title="Edit"><FiEdit2 size={18} /></button>
                                                        <button onClick={() => handleDelete(part.part_id, part.name)} className="text-red-600 hover:text-red-800" title="Delete"><FiTrash2 size={18} /></button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                                <tfoot className="bg-gray-50">
                                    <tr>
                                        <td colSpan="3" className="px-4 py-3 text-right font-bold text-gray-700">Total:</td>
                                        <td className="px-4 py-3 text-right font-bold text-gray-900">{filteredParts.reduce((sum, p) => sum + p.quantity, 0)}</td>
                                        <td className="px-4 py-3 text-right font-bold text-gray-700">Total Value:</td>
                                        <td className="px-4 py-3 text-right font-bold text-green-600">${calculateTotalValue()}</td>
                                        <td colSpan="2"></td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>

                        {/* Mobile Card View */}
                        <div className="md:hidden divide-y divide-gray-200">
                            {filteredParts.map((part) => {
                                const stockStatus = getStockStatus(part.quantity);
                                return (
                                    <div key={part.part_id} className="p-4 hover:bg-gray-50 transition">
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                <h3 className="font-bold text-gray-900">{part.name}</h3>
                                                <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800 inline-block mt-1">{part.category}</span>
                                            </div>
                                            <div className="flex gap-3">
                                                <button onClick={() => handleEdit(part)} className="text-blue-600 hover:text-blue-800"><FiEdit2 size={18} /></button>
                                                <button onClick={() => handleDelete(part.part_id, part.name)} className="text-red-600 hover:text-red-800"><FiTrash2 size={18} /></button>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-3 mt-3 text-sm">
                                            <div><span className="text-gray-500">Quantity:</span> <p className={`font-semibold ${part.quantity === 0 ? 'text-red-600' : 'text-gray-900'}`}>{part.quantity} units</p></div>
                                            <div><span className="text-gray-500">Unit Price:</span> <p className="text-gray-900">${parseFloat(part.unitprice).toFixed(2)}</p></div>
                                            <div><span className="text-gray-500">Total Value:</span> <p className="text-gray-900 font-semibold">${(part.quantity * part.unitprice).toFixed(2)}</p></div>
                                            <div><span className="text-gray-500">Status:</span> <p><span className={`px-2 py-1 text-xs rounded-full ${stockStatus.bg} inline-block mt-1`}>{stockStatus.text}</span></p></div>
                                        </div>
                                    </div>
                                );
                            })}
                            <div className="p-4 bg-gray-50">
                                <div className="flex justify-between text-sm"><span className="font-bold">Total Parts:</span><span>{filteredParts.length}</span></div>
                                <div className="flex justify-between text-sm mt-2"><span className="font-bold">Total Quantity:</span><span>{filteredParts.reduce((sum, p) => sum + p.quantity, 0)}</span></div>
                                <div className="flex justify-between text-sm mt-2"><span className="font-bold">Total Value:</span><span className="font-bold text-green-600">${calculateTotalValue()}</span></div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SpareParts;