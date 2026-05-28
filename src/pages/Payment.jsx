import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { 
  FiDollarSign, 
  FiCreditCard, 
  FiCheckCircle, 
  FiXCircle,
  FiPrinter,
  FiSearch,
  FiCalendar,
  FiUser,
  FiPackage,
  FiRefreshCw,
  FiEye
} from 'react-icons/fi';

const Payment = () => {
  const [stockOutRecords, setStockOutRecords] = useState([]);
  const [filteredRecords, setFilteredRecords] = useState([]);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showPaymentHistory, setShowPaymentHistory] = useState(false);
  const [selectedPaymentHistory, setSelectedPaymentHistory] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [remarks, setRemarks] = useState('');
  const [processingPayment, setProcessingPayment] = useState(false);

  useEffect(() => {
    fetchAllData();
  }, []);

  useEffect(() => {
    filterRecords();
  }, [searchTerm, dateFilter, stockOutRecords]);

  const safeParseFloat = (value) => {
    if (value === null || value === undefined || value === '') return 0;
    const parsed = parseFloat(value);
    return isNaN(parsed) ? 0 : parsed;
  };

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const response = await axios.get('http://localhost:5000/api/stockout-with-payments');
      console.log('Fetched stock out records:', response.data);
      setStockOutRecords(response.data);
      setFilteredRecords(response.data);
      const paymentsRes = await axios.get('http://localhost:5000/api/payments');
      setPayments(paymentsRes.data);
    } catch (err) {
      console.error('Failed to fetch data:', err);
      toast.error('Failed to load payment data');
    } finally {
      setLoading(false);
    }
  };

  const filterRecords = () => {
    let filtered = [...stockOutRecords];
    if (searchTerm) {
      filtered = filtered.filter(record => 
        record.part_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.stock_out_id.toString().includes(searchTerm)
      );
    }
    if (dateFilter) {
      filtered = filtered.filter(record => record.stockoutDate === dateFilter);
    }
    setFilteredRecords(filtered);
  };

  const handleMakePayment = (record) => {
    if (record.remaining_balance <= 0) {
      toast.error('This bill is already fully paid');
      return;
    }
    setSelectedRecord(record);
    setPaymentAmount(record.remaining_balance.toString());
    setShowPaymentModal(true);
  };

  const viewPaymentHistory = (record) => {
    const recordPayments = payments.filter(p => p.stock_out_id === record.stock_out_id);
    setSelectedPaymentHistory({
      ...record,
      payments: recordPayments
    });
    setShowPaymentHistory(true);
  };

  const processPayment = async () => {
    if (!selectedRecord) return;
    const amount = safeParseFloat(paymentAmount);
    const remainingBalance = safeParseFloat(selectedRecord.remaining_balance);
    if (amount <= 0) {
      toast.error('Payment amount must be greater than 0');
      return;
    }
    if (amount > remainingBalance) {
      toast.error(`Payment amount cannot exceed remaining balance of $${remainingBalance.toFixed(2)}`);
      return;
    }
    setProcessingPayment(true);
    try {
      await axios.post('http://localhost:5000/api/payments', {
        stock_out_id: selectedRecord.stock_out_id,
        amountpaid: amount,
        paymentdate: paymentDate,
        payment_method: paymentMethod,
        remarks: remarks
      });
      toast.success(`Payment of $${amount.toFixed(2)} recorded successfully`);
      await fetchAllData();
      setShowPaymentModal(false);
      setSelectedRecord(null);
      setPaymentAmount('');
      setPaymentDate(new Date().toISOString().split('T')[0]);
      setPaymentMethod('cash');
      setRemarks('');
    } catch (err) {
      console.error('Payment failed:', err);
      toast.error(err.response?.data?.error || 'Failed to process payment');
    } finally {
      setProcessingPayment(false);
    }
  };

  const printReceipt = (record) => {
    const recordPayments = payments.filter(p => p.stock_out_id === record.stock_out_id);
    const totalPaid = recordPayments.reduce((sum, p) => sum + safeParseFloat(p.amountpaid), 0);
    const totalAmount = safeParseFloat(record.total_amount);
    const remainingBalance = totalAmount - totalPaid;
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Payment Receipt #${record.stock_out_id}</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <style>
          @media print {
            body { margin: 0; padding: 20px; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body class="bg-gray-100 p-4 sm:p-8">
        <div class="max-w-2xl mx-auto bg-white rounded-lg shadow-lg overflow-hidden">
          <div class="bg-gradient-to-r from-blue-800 to-blue-900 text-white p-4 sm:p-6 text-center">
            <h1 class="text-xl sm:text-2xl font-bold">SIMS Inventory System</h1>
            <p class="text-blue-200 mt-1">Payment Receipt</p>
          </div>
          <div class="p-4 sm:p-6">
            <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <div>
                <p class="text-gray-600">Receipt Number:</p>
                <p class="text-xl font-bold text-gray-800">#${record.stock_out_id}</p>
              </div>
              <div class="text-left sm:text-right">
                <p class="text-gray-600">Date:</p>
                <p class="font-semibold text-gray-800">${new Date().toLocaleDateString()}</p>
              </div>
            </div>
            <div class="border-t border-b border-gray-200 py-4 mb-6">
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p class="text-gray-600 text-sm">Customer Name:</p>
                  <p class="font-semibold">${record.customer_name || 'Walk-in Customer'}</p>
                </div>
                <div>
                  <p class="text-gray-600 text-sm">Contact:</p>
                  <p class="font-semibold">${record.customer_contact || 'N/A'}</p>
                </div>
              </div>
            </div>
            <div class="overflow-x-auto">
              <table class="w-full mb-6 min-w-[300px]">
                <thead class="bg-gray-100">
                  <tr><th class="text-left p-2 text-sm">Item</th><th class="text-right p-2 text-sm">Qty</th><th class="text-right p-2 text-sm">Unit Price</th><th class="text-right p-2 text-sm">Total</th></tr>
                </thead>
                <tbody>
                  <tr class="border-b"><td class="p-2 text-sm">${record.part_name || 'N/A'}</td><td class="p-2 text-right text-sm">${record.stockoutquantity}</td><td class="p-2 text-right text-sm">$${safeParseFloat(record.stockoutUnitPrice).toFixed(2)}</td><td class="p-2 text-right text-sm font-semibold">$${totalAmount.toFixed(2)}</td></tr>
                </tbody>
              </table>
            </div>
            <div class="bg-gray-50 p-4 rounded-lg mb-6">
              <div class="flex justify-between mb-2 text-sm"><span>Total Amount:</span><span class="font-bold">$${totalAmount.toFixed(2)}</span></div>
              <div class="flex justify-between mb-2 text-sm"><span>Total Paid:</span><span class="text-green-600 font-bold">$${totalPaid.toFixed(2)}</span></div>
              <div class="flex justify-between pt-2 border-t text-sm"><span>Remaining Balance:</span><span class="font-bold text-orange-600">$${remainingBalance.toFixed(2)}</span></div>
            </div>
            ${recordPayments.length > 0 ? `<div class="mb-6"><h3 class="font-bold mb-2">Payment History</h3><div class="overflow-x-auto"><table class="w-full text-sm"><thead class="bg-gray-100"><tr><th class="text-left p-2">Date</th><th class="text-right p-2">Amount</th><th class="text-left p-2">Method</th></tr></thead><tbody>${recordPayments.map(p => `<tr class="border-b"><td class="p-2">${new Date(p.paymentdate).toLocaleDateString()}</td><td class="p-2 text-right font-semibold">$${safeParseFloat(p.amountpaid).toFixed(2)}</td><td class="p-2 capitalize">${p.payment_method || 'Cash'}</td></tr>`).join('')}</tbody></table></div></div>` : ''}
            <div class="text-center text-gray-500 text-xs sm:text-sm pt-6 border-t"><p>Thank you for your payment!</p></div>
          </div>
          <div class="p-4 sm:p-6 bg-gray-50 text-center no-print"><button onclick="window.print(); setTimeout(() => window.close(), 1000)" class="bg-blue-600 text-white px-4 sm:px-6 py-2 rounded-lg hover:bg-blue-700 mr-3">🖨️ Print Receipt</button><button onclick="window.close()" class="bg-gray-500 text-white px-4 sm:px-6 py-2 rounded-lg hover:bg-gray-600">Close</button></div>
        </div>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  const formatCurrency = (amount) => `$${safeParseFloat(amount).toFixed(2)}`;

  const getPaymentStatus = (record) => {
    const totalAmount = safeParseFloat(record.total_amount);
    const totalPaid = safeParseFloat(record.total_paid);
    if (totalPaid === 0) return { text: 'Unpaid', color: 'red', bg: 'bg-red-100 text-red-800' };
    if (totalPaid >= totalAmount) return { text: 'Fully Paid', color: 'green', bg: 'bg-green-100 text-green-800' };
    return { text: 'Partially Paid', color: 'orange', bg: 'bg-orange-100 text-orange-800' };
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="w-full px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Payment Management</h1>
            <p className="text-sm sm:text-base text-gray-600 mt-1">Process and track customer payments</p>
          </div>
          <button onClick={fetchAllData} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition w-full sm:w-auto justify-center">
            <FiRefreshCw size={18} /> Refresh
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-md p-4"><div className="flex items-center justify-between"><div><p className="text-gray-500 text-sm">Total Bills</p><p className="text-2xl font-bold text-blue-600">{stockOutRecords.length}</p></div><FiCreditCard className="text-blue-500" size={28} /></div></div>
          <div className="bg-white rounded-lg shadow-md p-4"><div className="flex items-center justify-between"><div><p className="text-gray-500 text-sm">Pending Bills</p><p className="text-2xl font-bold text-orange-600">{stockOutRecords.filter(r => safeParseFloat(r.remaining_balance) > 0).length}</p></div><FiXCircle className="text-orange-500" size={28} /></div></div>
          <div className="bg-white rounded-lg shadow-md p-4"><div className="flex items-center justify-between"><div><p className="text-gray-500 text-sm">Total Collected</p><p className="text-2xl font-bold text-green-600">{formatCurrency(payments.reduce((sum, p) => sum + safeParseFloat(p.amountpaid), 0))}</p></div><FiDollarSign className="text-green-500" size={28} /></div></div>
          <div className="bg-white rounded-lg shadow-md p-4"><div className="flex items-center justify-between"><div><p className="text-gray-500 text-sm">Payment Transactions</p><p className="text-2xl font-bold text-purple-600">{payments.length}</p></div><FiCheckCircle className="text-purple-500" size={28} /></div></div>
        </div>

        {/* Search and Filter */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="relative"><FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" /><input type="text" placeholder="Search by bill #, customer, or part..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm" /></div>
            <div className="relative"><FiCalendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" /><input type="date" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm" /></div>
            <button onClick={() => { setSearchTerm(''); setDateFilter(''); }} className="text-gray-500 hover:text-gray-700 text-sm">Clear Filters</button>
          </div>
        </div>

        {/* Records */}
        {loading ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div><p className="mt-4 text-gray-600">Loading records...</p></div>
        ) : filteredRecords.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center"><FiCheckCircle className="mx-auto text-gray-400 mb-4" size={48} /><p className="text-gray-500 text-lg">No records found</p></div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block bg-white rounded-lg shadow-md overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50"><tr><th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Bill #</th><th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Customer</th><th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Part</th><th className="px-4 py-3 text-right text-xs font-medium text-gray-500">Qty</th><th className="px-4 py-3 text-right text-xs font-medium text-gray-500">Total</th><th className="px-4 py-3 text-right text-xs font-medium text-gray-500">Paid</th><th className="px-4 py-3 text-right text-xs font-medium text-gray-500">Balance</th><th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Status</th><th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Date</th><th className="px-4 py-3 text-center text-xs font-medium text-gray-500">Actions</th></tr></thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredRecords.map((record) => {
                      const totalAmount = safeParseFloat(record.total_amount);
                      const totalPaid = safeParseFloat(record.total_paid);
                      const remainingBalance = totalAmount - totalPaid;
                      const paidPercentage = totalAmount > 0 ? (totalPaid / totalAmount) * 100 : 0;
                      const status = getPaymentStatus(record);
                      return (
                        <tr key={record.stock_out_id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">#{record.stock_out_id}</td>
                          <td className="px-4 py-3"><div className="flex items-center gap-2"><FiUser className="text-gray-400" size={14} /><span className="text-sm">{record.customer_name || 'Walk-in'}</span></div></td>
                          <td className="px-4 py-3"><div className="flex items-center gap-2"><FiPackage className="text-gray-400" size={14} /><span className="text-sm">{record.part_name}</span></div></td>
                          <td className="px-4 py-3 text-sm text-right">{record.stockoutquantity}</td>
                          <td className="px-4 py-3 text-sm text-right font-semibold">{formatCurrency(totalAmount)}</td>
                          <td className="px-4 py-3"><div className="text-right"><span className="text-sm text-green-600 font-semibold">{formatCurrency(totalPaid)}</span><div className="w-full bg-gray-200 rounded-full h-1.5 mt-1"><div className="bg-green-500 h-1.5 rounded-full" style={{ width: `${paidPercentage}%` }}></div></div></div></td>
                          <td className="px-4 py-3 text-sm text-right font-bold text-orange-600">{formatCurrency(remainingBalance)}</td>
                          <td className="px-4 py-3"><span className={`px-2 py-1 text-xs rounded-full ${status.bg}`}>{status.text}</span></td>
                          <td className="px-4 py-3 text-sm text-gray-500">{new Date(record.stockoutDate).toLocaleDateString()}</td>
                          <td className="px-4 py-3 text-center"><div className="flex flex-wrap gap-2 justify-center">{remainingBalance > 0 && <button onClick={() => handleMakePayment(record)} className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-lg text-sm flex items-center gap-1"><FiDollarSign size={14} /> Pay</button>}<button onClick={() => printReceipt(record)} className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-lg text-sm flex items-center gap-1"><FiPrinter size={14} /> Receipt</button><button onClick={() => viewPaymentHistory(record)} className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded-lg text-sm flex items-center gap-1"><FiEye size={14} /> History</button></div></td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot className="bg-gray-50"><tr><td colSpan="4" className="px-4 py-3 text-right font-bold text-gray-700">Totals:</td><td className="px-4 py-3 text-right font-bold text-gray-900">{formatCurrency(filteredRecords.reduce((sum, r) => sum + safeParseFloat(r.total_amount), 0))}</td><td className="px-4 py-3 text-right font-bold text-green-600">{formatCurrency(filteredRecords.reduce((sum, r) => sum + safeParseFloat(r.total_paid), 0))}</td><td className="px-4 py-3 text-right font-bold text-orange-600">{formatCurrency(filteredRecords.reduce((sum, r) => sum + (safeParseFloat(r.total_amount) - safeParseFloat(r.total_paid)), 0))}</td><td colSpan="3"></td></tr></tfoot>
                </table>
              </div>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-3">
              {filteredRecords.map((record) => {
                const totalAmount = safeParseFloat(record.total_amount);
                const totalPaid = safeParseFloat(record.total_paid);
                const remainingBalance = totalAmount - totalPaid;
                const paidPercentage = totalAmount > 0 ? (totalPaid / totalAmount) * 100 : 0;
                const status = getPaymentStatus(record);
                return (
                  <div key={record.stock_out_id} className="bg-white rounded-lg shadow-md p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div><p className="text-xs text-gray-500">Bill #{record.stock_out_id}</p><h3 className="font-bold text-gray-800 text-base">{record.part_name}</h3><p className="text-sm text-gray-600">{record.customer_name || 'Walk-in Customer'}</p></div>
                      <span className={`px-2 py-1 text-xs rounded-full ${status.bg}`}>{status.text}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                      <div><span className="text-gray-500">Qty:</span> <span className="font-medium">{record.stockoutquantity}</span></div>
                      <div><span className="text-gray-500">Date:</span> <span>{new Date(record.stockoutDate).toLocaleDateString()}</span></div>
                      <div><span className="text-gray-500">Total:</span> <span className="font-semibold">{formatCurrency(totalAmount)}</span></div>
                      <div><span className="text-gray-500">Paid:</span> <span className="text-green-600 font-semibold">{formatCurrency(totalPaid)}</span></div>
                      <div className="col-span-2"><span className="text-gray-500">Balance:</span> <span className="font-bold text-orange-600">{formatCurrency(remainingBalance)}</span></div>
                      <div className="col-span-2"><div className="w-full bg-gray-200 rounded-full h-1.5"><div className="bg-green-500 h-1.5 rounded-full" style={{ width: `${paidPercentage}%` }}></div></div></div>
                    </div>
                    <div className="flex flex-wrap gap-2 pt-2 border-t">
                      {remainingBalance > 0 && <button onClick={() => handleMakePayment(record)} className="bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg text-sm flex items-center gap-1"><FiDollarSign size={14} /> Pay</button>}
                      <button onClick={() => printReceipt(record)} className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-sm flex items-center gap-1"><FiPrinter size={14} /> Receipt</button>
                      <button onClick={() => viewPaymentHistory(record)} className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1.5 rounded-lg text-sm flex items-center gap-1"><FiEye size={14} /> History</button>
                    </div>
                  </div>
                );
              })}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex justify-between text-sm"><span className="font-bold">Total Bills:</span><span>{filteredRecords.length}</span></div>
                <div className="flex justify-between text-sm mt-1"><span className="font-bold">Total Amount:</span><span className="font-semibold">{formatCurrency(filteredRecords.reduce((sum, r) => sum + safeParseFloat(r.total_amount), 0))}</span></div>
                <div className="flex justify-between text-sm mt-1"><span className="font-bold">Total Paid:</span><span className="text-green-600 font-semibold">{formatCurrency(filteredRecords.reduce((sum, r) => sum + safeParseFloat(r.total_paid), 0))}</span></div>
                <div className="flex justify-between text-sm mt-1"><span className="font-bold">Total Balance:</span><span className="text-orange-600 font-semibold">{formatCurrency(filteredRecords.reduce((sum, r) => sum + (safeParseFloat(r.total_amount) - safeParseFloat(r.total_paid)), 0))}</span></div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Payment Modal - Responsive */}
      {showPaymentModal && selectedRecord && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-4 sm:p-6 border-b border-gray-200 sticky top-0 bg-white">
              <h2 className="text-lg sm:text-xl font-bold text-gray-800">Process Payment</h2>
              <p className="text-sm text-gray-600">Bill #{selectedRecord.stock_out_id}</p>
            </div>
            <div className="p-4 sm:p-6 space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg text-sm space-y-2">
                <div className="flex justify-between"><span className="text-gray-600">Customer:</span><span className="font-semibold">{selectedRecord.customer_name || 'Walk-in Customer'}</span></div>
                <div className="flex justify-between"><span className="text-gray-600">Part:</span><span>{selectedRecord.part_name}</span></div>
                <div className="flex justify-between"><span className="text-gray-600">Total:</span><span className="font-bold">{formatCurrency(selectedRecord.total_amount)}</span></div>
                <div className="flex justify-between"><span className="text-gray-600">Paid:</span><span className="text-green-600 font-bold">{formatCurrency(selectedRecord.total_paid)}</span></div>
                <div className="flex justify-between pt-2 border-t"><span className="font-semibold">Balance:</span><span className="text-orange-600 font-bold text-base">{formatCurrency(selectedRecord.remaining_balance)}</span></div>
              </div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Payment Amount *</label><input type="number" value={paymentAmount} onChange={(e) => setPaymentAmount(e.target.value)} step="0.01" min="0.01" max={selectedRecord.remaining_balance} className="w-full px-3 py-2 border rounded-lg text-sm" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Payment Date</label><input type="date" value={paymentDate} onChange={(e) => setPaymentDate(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label><select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm"><option value="cash">Cash</option><option value="card">Credit/Debit Card</option><option value="bank_transfer">Bank Transfer</option><option value="mobile_money">Mobile Money</option><option value="check">Check</option></select></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Remarks</label><textarea value={remarks} onChange={(e) => setRemarks(e.target.value)} rows="2" placeholder="Add notes..." className="w-full px-3 py-2 border rounded-lg text-sm" /></div>
            </div>
            <div className="p-4 sm:p-6 border-t border-gray-200 flex flex-col sm:flex-row gap-3 justify-end sticky bottom-0 bg-white">
              <button onClick={() => { setShowPaymentModal(false); setSelectedRecord(null); }} className="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded-lg transition w-full sm:w-auto">Cancel</button>
              <button onClick={processPayment} disabled={processingPayment} className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg transition flex items-center justify-center gap-2 w-full sm:w-auto">{processingPayment ? 'Processing...' : <><FiCheckCircle size={18} /> Process Payment</>}</button>
            </div>
          </div>
        </div>
      )}

      {/* Payment History Modal - Responsive */}
      {showPaymentHistory && selectedPaymentHistory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-4 sm:p-6 border-b border-gray-200 sticky top-0 bg-white">
              <h2 className="text-lg sm:text-xl font-bold text-gray-800">Payment History</h2>
              <p className="text-sm text-gray-600">Bill #{selectedPaymentHistory.stock_out_id}</p>
            </div>
            <div className="p-4 sm:p-6">
              <div className="bg-gray-50 p-4 rounded-lg mb-6">
                <h3 className="font-bold text-gray-800 mb-3 text-sm sm:text-base">Bill Summary</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  <div><span className="text-gray-500">Customer:</span> <span className="font-semibold">{selectedPaymentHistory.customer_name || 'Walk-in Customer'}</span></div>
                  <div><span className="text-gray-500">Part:</span> <span>{selectedPaymentHistory.part_name}</span></div>
                  <div><span className="text-gray-500">Quantity:</span> <span>{selectedPaymentHistory.stockoutquantity}</span></div>
                  <div><span className="text-gray-500">Total Amount:</span> <span className="font-bold">{formatCurrency(selectedPaymentHistory.total_amount)}</span></div>
                </div>
              </div>
              <h3 className="font-bold text-gray-800 mb-3">Payment Records</h3>
              {selectedPaymentHistory.payments.length === 0 ? (<div className="text-center py-8 text-gray-500">No payments recorded</div>) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50"><tr><th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Date</th><th className="px-4 py-3 text-right text-xs font-medium text-gray-500">Amount</th><th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Method</th><th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Remarks</th></tr></thead>
                    <tbody>{selectedPaymentHistory.payments.map((payment, idx) => (<tr key={idx} className="hover:bg-gray-50"><td className="px-4 py-3 text-sm">{new Date(payment.paymentdate).toLocaleDateString()}</td><td className="px-4 py-3 text-sm text-right font-semibold text-green-600">{formatCurrency(payment.amountpaid)}</td><td className="px-4 py-3 text-sm capitalize">{payment.payment_method || 'Cash'}</td><td className="px-4 py-3 text-sm text-gray-500">{payment.remarks || '-'}</td></tr>))}</tbody>
                    <tfoot className="bg-gray-50"><tr><td className="px-4 py-3 text-right font-bold">Total Paid:</td><td className="px-4 py-3 text-right font-bold text-green-600">{formatCurrency(selectedPaymentHistory.payments.reduce((sum, p) => sum + safeParseFloat(p.amountpaid), 0))}</td><td colSpan="2"></td></tr></tfoot>
                  </table>
                </div>
              )}
            </div>
            <div className="p-4 sm:p-6 border-t border-gray-200 flex justify-end sticky bottom-0 bg-white">
              <button onClick={() => { setShowPaymentHistory(false); setSelectedPaymentHistory(null); }} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition w-full sm:w-auto">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Payment;