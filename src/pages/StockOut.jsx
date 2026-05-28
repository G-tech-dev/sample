import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { FiPrinter, FiEdit2, FiTrash2, FiPlus, FiX } from 'react-icons/fi';

const StockOut = () => {
    const [stockOutRecords, setStockOutRecords] = useState([]);
    const [spareParts, setSpareParts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    
    const [formData, setFormData] = useState({
        part_id: '',
        stock_out_quantity: '',
        stock_out_unit_price: '',
        stock_out_date: new Date().toISOString().split('T')[0],
        destination: '',
        customer_name: ''
    });

    useEffect(() => {
        fetchStockOut();
        fetchSpareParts();
    }, []);

    const fetchStockOut = async () => {
        try {
            setLoading(true);
            const response = await axios.get('http://localhost:5000/api/stockout');
            setStockOutRecords(response.data);
            setError('');
        } catch (err) {
            const errorMsg = err.response?.data?.error || err.message || 'Failed to fetch stock out records';
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

        if (name === 'part_id' && value) {
            const selectedPart = spareParts.find(part => part.part_id === parseInt(value));
            if (selectedPart) {
                setFormData(prev => ({
                    ...prev,
                    stock_out_unit_price: selectedPart.unitprice
                }));
            }
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (parseInt(formData.stock_out_quantity) <= 0) {
            toast.error('Quantity must be greater than 0');
            return;
        }

        setLoading(true);
        try {
            if (editingId) {
                await axios.put(`http://localhost:5000/api/stockout/${editingId}`, formData);
                toast.success('Stock out record updated successfully');
            } else {
                await axios.post('http://localhost:5000/api/stockout', formData);
                toast.success('Stock out recorded successfully');
            }
            resetForm();
            await fetchStockOut();
        } catch (err) {
            const errorMsg = err.response?.data?.error || 'Failed to save stock out record';
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
            stock_out_quantity: '',
            stock_out_unit_price: '',
            stock_out_date: new Date().toISOString().split('T')[0],
            destination: '',
            customer_name: ''
        });
        setEditingId(null);
        setShowForm(false);
        setError('');
    };

    const handleEdit = (record) => {
        setFormData({
            part_id: record.spare_part_id,
            stock_out_quantity: record.stockoutquantity,
            stock_out_unit_price: record.stockoutUnitPrice,
            stock_out_date: record.stockoutDate.split('T')[0],
            destination: record.destination || '',
            customer_name: record.customer_name || ''
        });
        setEditingId(record.stock_out_id);
        setShowForm(true);
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this stock out record?')) {
            try {
                await axios.delete(`http://localhost:5000/api/stockout/${id}`);
                toast.success('Stock out record deleted successfully');
                await fetchStockOut();
            } catch (err) {
                toast.error('Failed to delete record');
                console.error(err);
            }
        }
    };

    const printBill = (record) => {
        const part = spareParts.find(p => p.part_id === record.spare_part_id);
        
        const printWindow = window.open('', '_blank', 'width=800,height=600');
        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Stock Out Bill #${record.stock_out_id}</title>
                <script src="https://cdn.tailwindcss.com"></script>
                <style>
                    @media print {
                        body { margin: 0; padding: 20px; }
                        .no-print { display: none; }
                    }
                </style>
            </head>
            <body class="bg-gray-100 p-4 sm:p-8">
                <div class="max-w-3xl mx-auto bg-white rounded-lg shadow-lg overflow-hidden">
                    <div class="bg-gradient-to-r from-blue-800 to-blue-900 text-white p-4 sm:p-6">
                        <div class="text-center">
                            <h1 class="text-2xl sm:text-3xl font-bold">SPARE PART Inventory System</h1>
                            <p class="text-blue-200 mt-1">Stock Out Bill / Invoice</p>
                        </div>
                    </div>
                    
                    <div class="p-4 sm:p-8">
                        <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 sm:mb-8">
                            <div>
                                <p class="text-gray-600">Bill Number:</p>
                                <p class="text-xl sm:text-2xl font-bold text-gray-800">#${record.stock_out_id}</p>
                            </div>
                            <div class="text-left sm:text-right">
                                <p class="text-gray-600">Date:</p>
                                <p class="text-base sm:text-lg font-semibold text-gray-800">${new Date(record.stockoutDate).toLocaleDateString()}</p>
                                <p class="text-xs sm:text-sm text-gray-500">${new Date(record.stockoutDate).toLocaleTimeString()}</p>
                            </div>
                        </div>

                        <div class="border-t border-b border-gray-200 py-3 sm:py-4 mb-4 sm:mb-6">
                            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                <div>
                                    <p class="text-gray-600 text-xs sm:text-sm">Destination:</p>
                                    <p class="font-semibold text-gray-800 text-sm sm:text-base">${record.destination || 'N/A'}</p>
                                </div>
                                <div>
                                    <p class="text-gray-600 text-xs sm:text-sm">Customer Name:</p>
                                    <p class="font-semibold text-gray-800 text-sm sm:text-base">${record.customer_name || 'Walk-in Customer'}</p>
                                </div>
                            </div>
                        </div>

                        <div class="overflow-x-auto">
                            <table class="w-full mb-6 min-w-[400px]">
                                <thead class="bg-gray-100">
                                    <tr>
                                        <th class="text-left p-2 sm:p-3 font-semibold text-gray-700 text-xs sm:text-sm">Item</th>
                                        <th class="text-left p-2 sm:p-3 font-semibold text-gray-700 text-xs sm:text-sm">Category</th>
                                        <th class="text-right p-2 sm:p-3 font-semibold text-gray-700 text-xs sm:text-sm">Qty</th>
                                        <th class="text-right p-2 sm:p-3 font-semibold text-gray-700 text-xs sm:text-sm">Unit Price</th>
                                        <th class="text-right p-2 sm:p-3 font-semibold text-gray-700 text-xs sm:text-sm">Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr class="border-b border-gray-200">
                                        <td class="p-2 sm:p-3 text-gray-800 text-sm">${part?.name || 'N/A'}</td>
                                        <td class="p-2 sm:p-3 text-gray-800 text-sm">${part?.category || 'N/A'}</td>
                                        <td class="p-2 sm:p-3 text-right font-semibold text-gray-800 text-sm">${record.stockoutquantity}</td>
                                        <td class="p-2 sm:p-3 text-right text-gray-800 text-sm">$${parseFloat(record.stockoutUnitPrice).toFixed(2)}</td>
                                        <td class="p-2 sm:p-3 text-right font-bold text-gray-800 text-sm">$${parseFloat(record.total_amount || record.stockoutquantity * record.stockoutUnitPrice).toFixed(2)}</td>
                                    </tr>
                                </tbody>
                                <tfoot class="bg-gray-50">
                                    <tr>
                                        <td colspan="4" class="p-2 sm:p-3 text-right font-bold text-gray-700 text-sm">Total Amount:</td>
                                        <td class="p-2 sm:p-3 text-right font-bold text-blue-600 text-base sm:text-xl">$${parseFloat(record.total_amount || record.stockoutquantity * record.stockoutUnitPrice).toFixed(2)}</td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>

                        <div class="text-center text-gray-500 text-xs sm:text-sm mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-gray-200">
                            <p>This document shows amount to pay. Thank you for your business!</p>
                        </div>
                    </div>
                    
                    <div class="p-4 sm:p-6 bg-gray-50 text-center no-print">
                        <button onclick="window.print(); setTimeout(() => window.close(), 1000)" 
                                class="bg-blue-600 text-white px-4 sm:px-6 py-2 rounded-lg hover:bg-blue-700 transition mr-3 text-sm sm:text-base">
                            🖨️ Print Bill
                        </button>
                        <button onclick="window.close()" 
                                class="bg-gray-500 text-white px-4 sm:px-6 py-2 rounded-lg hover:bg-gray-600 transition text-sm sm:text-base">
                            Close
                        </button>
                    </div>
                </div>
            </body>
            </html>
        `);
        printWindow.document.close();
    };

    return (
        <div className="min-h-screen bg-gray-100">
            <div className="w-full px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Stock Out Management</h1>
                        <p className="text-sm sm:text-base text-gray-600 mt-1">Track all outgoing inventory transactions</p>
                    </div>
                    <button
                        onClick={() => setShowForm(!showForm)}
                        className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg transition shadow-md w-full sm:w-auto justify-center"
                    >
                        {showForm ? <FiX size={18} /> : <FiPlus size={18} />}
                        {showForm ? 'Cancel' : 'New Stock Out'}
                    </button>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded text-sm">
                        <p>{error}</p>
                    </div>
                )}

                {/* Form */}
                {showForm && (
                    <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 mb-6">
                        <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-4">
                            {editingId ? 'Edit Stock Out Record' : 'New Stock Out Record'}
                        </h2>
                        <form onSubmit={handleSubmit}>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Spare Part *</label>
                                    <select
                                        name="part_id"
                                        value={formData.part_id}
                                        onChange={handleInputChange}
                                        required
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm"
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
                                        name="stock_out_quantity"
                                        value={formData.stock_out_quantity}
                                        onChange={handleInputChange}
                                        required
                                        min="1"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Unit Price ($)</label>
                                    <input
                                        type="number"
                                        name="stock_out_unit_price"
                                        value={formData.stock_out_unit_price}
                                        onChange={handleInputChange}
                                        required
                                        step="0.01"
                                        min="0"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-sm"
                                        readOnly
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
                                    <input
                                        type="date"
                                        name="stock_out_date"
                                        value={formData.stock_out_date}
                                        onChange={handleInputChange}
                                        required
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Destination</label>
                                    <input
                                        type="text"
                                        name="destination"
                                        value={formData.destination}
                                        onChange={handleInputChange}
                                        placeholder="e.g., Workshop, Customer, Store"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Customer Name</label>
                                    <input
                                        type="text"
                                        name="customer_name"
                                        value={formData.customer_name}
                                        onChange={handleInputChange}
                                        placeholder="Enter customer name"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm"
                                    />
                                </div>
                            </div>
                            <div className="flex flex-col sm:flex-row gap-3 mt-6">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="bg-orange-600 hover:bg-orange-700 disabled:bg-orange-400 text-white px-6 py-2 rounded-lg transition w-full sm:w-auto"
                                >
                                    {loading ? 'Saving...' : (editingId ? 'Update Record' : 'Save Record')}
                                </button>
                                <button
                                    type="button"
                                    onClick={resetForm}
                                    className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-lg transition w-full sm:w-auto"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* Stock Out Records */}
                {loading && !stockOutRecords.length ? (
                    <div className="flex justify-center items-center py-12">
                        <div className="text-gray-500">Loading records...</div>
                    </div>
                ) : stockOutRecords.length === 0 ? (
                    <div className="bg-white rounded-lg shadow-md p-8 text-center">
                        <p className="text-gray-500">No stock out records found.</p>
                    </div>
                ) : (
                    <>
                        {/* Desktop Table View */}
                        <div className="hidden md:block bg-white rounded-lg shadow-md overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Part Name</th>
                                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Unit Price</th>
                                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Destination</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {stockOutRecords.map((record) => (
                                            <tr key={record.stock_out_id} className="hover:bg-gray-50 transition">
                                                <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                                                    #{record.stock_out_id}
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-800">
                                                    {record.part_name}
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap text-sm text-right">
                                                    <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-semibold">
                                                        -{record.stockoutquantity}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-600">
                                                    ${parseFloat(record.stockoutUnitPrice).toFixed(2)}
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap text-sm text-right font-semibold text-gray-900">
                                                    ${parseFloat(record.total_amount || record.stockoutquantity * record.stockoutUnitPrice).toFixed(2)}
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                                                    {record.destination || '-'}
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                                                    {record.customer_name || '-'}
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                                                    {new Date(record.stockoutDate).toLocaleDateString()}
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap text-center text-sm">
                                                    <div className="flex gap-2 justify-center">
                                                        <button
                                                            onClick={() => printBill(record)}
                                                            className="text-green-600 hover:text-green-800 transition"
                                                            title="Print Bill"
                                                        >
                                                            <FiPrinter size={18} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleEdit(record)}
                                                            className="text-blue-600 hover:text-blue-800 transition"
                                                            title="Edit"
                                                        >
                                                            <FiEdit2 size={18} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(record.stock_out_id)}
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
                                            <td colSpan="2" className="px-4 py-3 text-right font-bold text-gray-700">Total Quantity:</td>
                                            <td className="px-4 py-3 text-right font-bold text-gray-900">
                                                {stockOutRecords.reduce((sum, r) => sum + parseInt(r.stockoutquantity), 0)}
                                            </td>
                                            <td colSpan="6"></td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        </div>

                        {/* Mobile Card View */}
                        <div className="md:hidden space-y-3">
                            {stockOutRecords.map((record) => (
                                <div key={record.stock_out_id} className="bg-white rounded-lg shadow-md p-4">
                                    <div className="flex justify-between items-start mb-3">
                                        <div>
                                            <p className="text-xs text-gray-500">#{record.stock_out_id}</p>
                                            <h3 className="font-bold text-gray-800 text-base mt-1">{record.part_name}</h3>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => printBill(record)}
                                                className="text-green-600 hover:text-green-800"
                                                title="Print Bill"
                                            >
                                                <FiPrinter size={18} />
                                            </button>
                                            <button
                                                onClick={() => handleEdit(record)}
                                                className="text-blue-600 hover:text-blue-800"
                                                title="Edit"
                                            >
                                                <FiEdit2 size={18} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(record.stock_out_id)}
                                                className="text-red-600 hover:text-red-800"
                                                title="Delete"
                                            >
                                                <FiTrash2 size={18} />
                                            </button>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 text-sm">
                                        <div>
                                            <span className="text-gray-500">Quantity:</span>
                                            <p className="font-semibold text-red-600">-{record.stockoutquantity}</p>
                                        </div>
                                        <div>
                                            <span className="text-gray-500">Unit Price:</span>
                                            <p className="text-gray-800">${parseFloat(record.stockoutUnitPrice).toFixed(2)}</p>
                                        </div>
                                        <div>
                                            <span className="text-gray-500">Total:</span>
                                            <p className="font-semibold text-gray-900">${parseFloat(record.total_amount || record.stockoutquantity * record.stockoutUnitPrice).toFixed(2)}</p>
                                        </div>
                                        <div>
                                            <span className="text-gray-500">Date:</span>
                                            <p className="text-gray-600">{new Date(record.stockoutDate).toLocaleDateString()}</p>
                                        </div>
                                        <div className="col-span-2">
                                            <span className="text-gray-500">Destination:</span>
                                            <p className="text-gray-800">{record.destination || '-'}</p>
                                        </div>
                                        <div className="col-span-2">
                                            <span className="text-gray-500">Customer:</span>
                                            <p className="text-gray-800">{record.customer_name || '-'}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            <div className="bg-gray-50 rounded-lg p-4">
                                <div className="flex justify-between text-sm">
                                    <span className="font-bold text-gray-700">Total Quantity:</span>
                                    <span className="font-bold text-gray-900">
                                        {stockOutRecords.reduce((sum, r) => sum + parseInt(r.stockoutquantity), 0)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default StockOut;