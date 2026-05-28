// Report.jsx - Fully Responsive Stock In/Out Report
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { 
  FiFileText, 
  FiDownload, 
  FiPrinter, 
  FiCalendar,
  FiPackage,
  FiTrendingUp,
  FiTrendingDown,
  FiDollarSign,
  FiFilter,
  FiTruck,
  FiShoppingCart,
  FiRefreshCw
} from 'react-icons/fi';

const Report = () => {
  const [reportType, setReportType] = useState('stockin');
  const [dateRangeType, setDateRangeType] = useState('week');
  const [customStartDate, setCustomStartDate] = useState(new Date(new Date().setDate(new Date().getDate() - 7)).toISOString().split('T')[0]);
  const [customEndDate, setCustomEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState({
    totalQuantity: 0,
    totalValue: 0,
    totalTransactions: 0,
    averageValue: 0
  });

  useEffect(() => {
    fetchReportData();
  }, [reportType, dateRangeType, customStartDate, customEndDate]);

  const getDateRange = () => {
    const today = new Date();
    let startDate, endDate;
    switch(dateRangeType) {
      case 'week':
        startDate = new Date(today);
        startDate.setDate(today.getDate() - 7);
        endDate = today;
        break;
      case 'month':
        startDate = new Date(today);
        startDate.setDate(today.getDate() - 30);
        endDate = today;
        break;
      case 'custom':
        startDate = new Date(customStartDate);
        endDate = new Date(customEndDate);
        break;
      default:
        startDate = new Date(today);
        startDate.setDate(today.getDate() - 7);
        endDate = today;
    }
    return {
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0]
    };
  };

  const fetchReportData = async () => {
    setLoading(true);
    try {
      const { startDate, endDate } = getDateRange();
      let response;
      if (reportType === 'stockin') {
        response = await axios.get('http://localhost:5000/api/stockin');
      } else {
        response = await axios.get('http://localhost:5000/api/stockout');
      }
      let filteredData = response.data.filter(item => {
        const itemDate = reportType === 'stockin' ? item.stock_in_date : item.stockoutDate;
        return itemDate >= startDate && itemDate <= endDate;
      });
      const totalQuantity = filteredData.reduce((sum, item) => {
        const qty = reportType === 'stockin' ? item.stock_in_quantity : item.stockoutquantity;
        return sum + safeParseInt(qty);
      }, 0);
      const totalValue = filteredData.reduce((sum, item) => {
        const value = reportType === 'stockin' ? item.total_price : item.total_amount;
        return sum + safeParseFloat(value);
      }, 0);
      setSummary({
        totalQuantity,
        totalValue,
        totalTransactions: filteredData.length,
        averageValue: filteredData.length > 0 ? totalValue / filteredData.length : 0
      });
      const groupedByPart = {};
      filteredData.forEach(item => {
        const partName = item.part_name;
        if (!groupedByPart[partName]) {
          groupedByPart[partName] = { name: partName, quantity: 0, value: 0, count: 0 };
        }
        const qty = reportType === 'stockin' ? item.stock_in_quantity : item.stockoutquantity;
        const val = reportType === 'stockin' ? item.total_price : item.total_amount;
        groupedByPart[partName].quantity += safeParseInt(qty);
        groupedByPart[partName].value += safeParseFloat(val);
        groupedByPart[partName].count++;
      });
      const topItems = Object.values(groupedByPart).sort((a, b) => b.quantity - a.quantity).slice(0, 10);
      setReportData({ records: filteredData, topItems, dateRange: { startDate, endDate } });
    } catch (err) {
      console.error('Failed to fetch report data:', err);
      toast.error('Failed to load report data');
    } finally {
      setLoading(false);
    }
  };

  const safeParseFloat = (value) => {
    if (value === null || value === undefined || value === '') return 0;
    const parsed = parseFloat(value);
    return isNaN(parsed) ? 0 : parsed;
  };

  const safeParseInt = (value) => {
    if (value === null || value === undefined || value === '') return 0;
    const parsed = parseInt(value);
    return isNaN(parsed) ? 0 : parsed;
  };

  const formatCurrency = (amount) => `$${safeParseFloat(amount).toFixed(2)}`;

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  const exportToCSV = () => {
    if (!reportData || reportData.records.length === 0) {
      toast.error('No data to export');
      return;
    }
    const { startDate, endDate } = getDateRange();
    let csvData;
    if (reportType === 'stockin') {
      csvData = reportData.records.map(record => ({
        'Date': record.stock_in_date,
        'Part Name': record.part_name,
        'Quantity': record.stock_in_quantity,
        'Unit Price': record.unit_price,
        'Total Price': record.total_price,
        'Supplier': record.supplier_name || 'N/A',
        'Invoice #': record.invoice_number || 'N/A'
      }));
    } else {
      csvData = reportData.records.map(record => ({
        'Date': record.stockoutDate,
        'Part Name': record.part_name,
        'Quantity': record.stockoutquantity,
        'Unit Price': record.stockoutUnitPrice,
        'Total Amount': record.total_amount,
        'Customer': record.customer_name || 'Walk-in',
        'Destination': record.destination || 'N/A'
      }));
    }
    const headers = Object.keys(csvData[0]);
    const csv = [headers.join(','), ...csvData.map(row => headers.map(h => JSON.stringify(row[h] || '')).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${reportType}_report_${startDate}_to_${endDate}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success('Report exported successfully');
  };

  const printReport = () => {
    const printContent = document.getElementById('report-content');
    if (printContent) {
      const printWindow = window.open('', '_blank', 'width=1200,height=800');
      const typeLabel = reportType === 'stockin' ? 'Stock In Report' : 'Stock Out Report';
      const { startDate, endDate } = getDateRange();
      const dateRangeText = dateRangeType === 'custom' 
        ? `${formatDate(startDate)} to ${formatDate(endDate)}`
        : `${dateRangeType.toUpperCase()} (Last ${dateRangeType === 'week' ? '7' : '30'} days)`;
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head><title>${typeLabel} - ${dateRangeText}</title>
        <style>
          *{margin:0;padding:0;box-sizing:border-box;}
          body{font-family:Arial,sans-serif;padding:20px;background:white;}
          .header{text-align:center;margin-bottom:30px;padding-bottom:20px;border-bottom:2px solid #333;}
          .header h1{color:#1e0bed;margin-bottom:10px;}
          .header p{color:#666;margin:5px 0;}
          .summary{display:grid;grid-template-columns:repeat(4,1fr);gap:15px;margin-bottom:30px;}
          .summary-card{background:#f5f5f5;padding:15px;border-radius:8px;text-align:center;}
          .summary-card h3{font-size:14px;color:#666;margin-bottom:10px;}
          .summary-card .value{font-size:24px;font-weight:bold;color:#333;}
          table{width:100%;border-collapse:collapse;margin-top:20px;}
          th,td{border:1px solid #ddd;padding:10px;text-align:left;}
          th{background-color:#f5f5f5;font-weight:bold;}
          tr:nth-child(even){background-color:#f9f9f9;}
          .footer{margin-top:30px;text-align:center;padding-top:20px;border-top:1px solid #ddd;font-size:12px;color:#999;}
          @media print{body{padding:0;}.no-print{display:none;}}
          @media (max-width:768px){.summary{grid-template-columns:repeat(2,1fr);}th,td{padding:6px;font-size:12px;}}
        </style>
        </head>
        <body>
          <div class="header"><h1>SIMS Inventory System</h1><h2>${typeLabel}</h2><p>Period: ${dateRangeText}</p><p>Generated: ${new Date().toLocaleString()}</p></div>
          <div class="summary"><div class="summary-card"><h3>Total Transactions</h3><div class="value">${summary.totalTransactions}</div></div><div class="summary-card"><h3>Total Quantity</h3><div class="value">${summary.totalQuantity}</div></div><div class="summary-card"><h3>Total Value</h3><div class="value">${formatCurrency(summary.totalValue)}</div></div><div class="summary-card"><h3>Average Value</h3><div class="value">${formatCurrency(summary.averageValue)}</div></div></div>
          <div class="overflow-x-auto"><table><thead><tr><th>Date</th><th>Part Name</th><th>Quantity</th><th>Unit Price</th><th>Total</th>${reportType === 'stockin' ? '<th>Supplier</th><th>Invoice #</th>' : '<th>Customer</th><th>Destination</th>'}</tr></thead><tbody>${reportData.records.map(record => `<tr><td>${formatDate(reportType === 'stockin' ? record.stock_in_date : record.stockoutDate)}</td><td>${record.part_name || 'N/A'}</td><td>${reportType === 'stockin' ? safeParseInt(record.stock_in_quantity) : safeParseInt(record.stockoutquantity)}</td><td>${formatCurrency(reportType === 'stockin' ? record.unit_price : record.stockoutUnitPrice)}</td><td>${formatCurrency(reportType === 'stockin' ? record.total_price : record.total_amount)}</td>${reportType === 'stockin' ? `<td>${record.supplier_name || 'N/A'}</td><td>${record.invoice_number || 'N/A'}</td>` : `<td>${record.customer_name || 'Walk-in'}</td><td>${record.destination || 'N/A'}</td>`}</tr>`).join('')}</tbody></table></div>
          <div class="footer"><p>This is a computer-generated report. For any questions, please contact the system administrator.</p></div>
        </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const StatCard = ({ title, value, icon: Icon, colorClass }) => (
    <div className="bg-white rounded-lg shadow-md p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-500 text-sm">{title}</p>
          <p className="text-2xl font-bold text-gray-800 mt-1 break-words">{value}</p>
        </div>
        <div className={`p-2 rounded-full ${colorClass}`}>
          <Icon size={20} />
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="w-full px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Stock Reports</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">Generate and export stock in/out reports</p>
        </div>

        {/* Filters Card */}
        <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Report Type Selector */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Report Type</label>
              <div className="flex gap-2">
                <button onClick={() => setReportType('stockin')} className={`flex-1 px-3 py-2 rounded-lg font-medium transition text-sm sm:text-base ${reportType === 'stockin' ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>
                  <FiTruck className="inline mr-1 sm:mr-2" size={14} /> Stock In
                </button>
                <button onClick={() => setReportType('stockout')} className={`flex-1 px-3 py-2 rounded-lg font-medium transition text-sm sm:text-base ${reportType === 'stockout' ? 'bg-red-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>
                  <FiShoppingCart className="inline mr-1 sm:mr-2" size={14} /> Stock Out
                </button>
              </div>
            </div>
            {/* Date Range Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
              <select value={dateRangeType} onChange={(e) => setDateRangeType(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm">
                <option value="week">Last 7 Days</option>
                <option value="month">Last 30 Days</option>
                <option value="custom">Custom Range</option>
              </select>
            </div>
            {/* Custom Date Range */}
            {dateRangeType === 'custom' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                  <input type="date" value={customStartDate} onChange={(e) => setCustomStartDate(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                  <input type="date" value={customEndDate} onChange={(e) => setCustomEndDate(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm" />
                </div>
              </>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 mt-6 pt-4 border-t border-gray-200">
            <button onClick={fetchReportData} className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition w-full sm:w-auto">
              <FiRefreshCw size={16} /> Generate Report
            </button>
            <button onClick={exportToCSV} disabled={!reportData || reportData.records.length === 0} className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg transition w-full sm:w-auto">
              <FiDownload size={16} /> Export CSV
            </button>
            <button onClick={printReport} disabled={!reportData || reportData.records.length === 0} className="flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg transition w-full sm:w-auto">
              <FiPrinter size={16} /> Print Report
            </button>
          </div>
        </div>

        {/* Report Content */}
        {loading ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading report data...</p>
          </div>
        ) : reportData && reportData.records.length > 0 ? (
          <div id="report-content">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <StatCard title="Total Transactions" value={summary.totalTransactions} icon={FiFileText} colorClass="bg-blue-100 text-blue-600" />
              <StatCard title="Total Quantity" value={summary.totalQuantity} icon={reportType === 'stockin' ? FiTruck : FiShoppingCart} colorClass={reportType === 'stockin' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'} />
              <StatCard title="Total Value" value={formatCurrency(summary.totalValue)} icon={FiDollarSign} colorClass="bg-yellow-100 text-yellow-600" />
              <StatCard title="Average Transaction" value={formatCurrency(summary.averageValue)} icon={FiTrendingUp} colorClass="bg-purple-100 text-purple-600" />
            </div>

            {/* Top Items - Responsive Table + Card for Mobile */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
              <div className="p-4 border-b bg-gray-50">
                <h3 className="text-base sm:text-lg font-bold text-gray-800">Top 10 Items</h3>
              </div>
              {/* Desktop Table */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr><th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Item Name</th><th className="px-4 py-3 text-right text-xs font-medium text-gray-500">Quantity</th><th className="px-4 py-3 text-right text-xs font-medium text-gray-500">Total Value</th><th className="px-4 py-3 text-right text-xs font-medium text-gray-500">Transactions</th></tr>
                  </thead>
                  <tbody>
                    {reportData.topItems.map((item, idx) => (
                      <tr key={idx} className="hover:bg-gray-50"><td className="px-4 py-3 text-sm text-gray-900">{item.name}</td><td className="px-4 py-3 text-sm text-right font-semibold">{item.quantity}</td><td className="px-4 py-3 text-sm text-right">{formatCurrency(item.value)}</td><td className="px-4 py-3 text-sm text-right">{item.count}</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {/* Mobile Card View */}
              <div className="sm:hidden divide-y divide-gray-200">
                {reportData.topItems.map((item, idx) => (
                  <div key={idx} className="p-4"><div className="flex justify-between items-start"><h4 className="font-medium text-gray-800">{item.name}</h4><span className="text-xs bg-gray-100 px-2 py-1 rounded">{item.count} transactions</span></div><div className="mt-2 grid grid-cols-2 gap-2 text-sm"><div><span className="text-gray-500">Quantity:</span> <span className="font-semibold">{item.quantity}</span></div><div><span className="text-gray-500">Total Value:</span> <span>{formatCurrency(item.value)}</span></div></div></div>
                ))}
              </div>
            </div>

            {/* Detailed Records - Responsive Table + Card for Mobile */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="p-4 bg-gray-50 border-b">
                <h3 className="text-base sm:text-lg font-bold text-gray-800">{reportType === 'stockin' ? 'Stock In' : 'Stock Out'} Details</h3>
                <p className="text-xs sm:text-sm text-gray-500 mt-1">Showing {reportData.records.length} records</p>
              </div>
              {/* Desktop Table */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr><th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Date</th><th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Part Name</th><th className="px-4 py-3 text-right text-xs font-medium text-gray-500">Quantity</th><th className="px-4 py-3 text-right text-xs font-medium text-gray-500">Unit Price</th><th className="px-4 py-3 text-right text-xs font-medium text-gray-500">Total</th>{reportType === 'stockin' ? <><th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Supplier</th><th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Invoice #</th></> : <><th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Customer</th><th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Destination</th></>}</tr>
                  </thead>
                  <tbody>
                    {reportData.records.map((record, idx) => (
                      <tr key={idx} className="hover:bg-gray-50"><td className="px-4 py-3 text-sm text-gray-600">{formatDate(reportType === 'stockin' ? record.stock_in_date : record.stockoutDate)}</td><td className="px-4 py-3 text-sm font-medium text-gray-900">{record.part_name || 'N/A'}</td><td className="px-4 py-3 text-sm text-right"><span className={`font-semibold ${reportType === 'stockin' ? 'text-green-600' : 'text-red-600'}`}>{reportType === 'stockin' ? '+' : '-'}{safeParseInt(reportType === 'stockin' ? record.stock_in_quantity : record.stockoutquantity)}</span></td><td className="px-4 py-3 text-sm text-right">{formatCurrency(reportType === 'stockin' ? record.unit_price : record.stockoutUnitPrice)}</td><td className="px-4 py-3 text-sm text-right font-semibold">{formatCurrency(reportType === 'stockin' ? record.total_price : record.total_amount)}</td>{reportType === 'stockin' ? (<><td className="px-4 py-3 text-sm text-gray-600">{record.supplier_name || '-'}</td><td className="px-4 py-3 text-sm text-gray-600">{record.invoice_number || '-'}</td></>) : (<><td className="px-4 py-3 text-sm text-gray-600">{record.customer_name || 'Walk-in'}</td><td className="px-4 py-3 text-sm text-gray-600">{record.destination || '-'}</td></>)}</tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-50"><tr><td colSpan="2" className="px-4 py-3 text-right font-bold text-gray-700">Totals:</td><td className="px-4 py-3 text-right font-bold text-gray-900">{summary.totalQuantity}</td><td className="px-4 py-3"></td><td className="px-4 py-3 text-right font-bold text-gray-900">{formatCurrency(summary.totalValue)}</td><td colSpan="2"></td></tr></tfoot>
                </table>
              </div>
              {/* Mobile Card View */}
              <div className="sm:hidden divide-y divide-gray-200">
                {reportData.records.map((record, idx) => (
                  <div key={idx} className="p-4 space-y-2">
                    <div className="flex justify-between items-start"><span className="text-xs text-gray-500">{formatDate(reportType === 'stockin' ? record.stock_in_date : record.stockoutDate)}</span><span className={`text-xs font-semibold ${reportType === 'stockin' ? 'text-green-600' : 'text-red-600'}`}>{reportType === 'stockin' ? '+' : '-'}{safeParseInt(reportType === 'stockin' ? record.stock_in_quantity : record.stockoutquantity)}</span></div>
                    <div><h4 className="font-bold text-gray-800">{record.part_name || 'N/A'}</h4></div>
                    <div className="grid grid-cols-2 gap-2 text-sm"><div><span className="text-gray-500">Unit Price:</span> {formatCurrency(reportType === 'stockin' ? record.unit_price : record.stockoutUnitPrice)}</div><div><span className="text-gray-500">Total:</span> <span className="font-semibold">{formatCurrency(reportType === 'stockin' ? record.total_price : record.total_amount)}</span></div></div>
                    <div className="text-xs text-gray-500">{reportType === 'stockin' ? `Supplier: ${record.supplier_name || '-'} | Invoice: ${record.invoice_number || '-'}` : `Customer: ${record.customer_name || 'Walk-in'} | Destination: ${record.destination || '-'}`}</div>
                  </div>
                ))}
                <div className="p-4 bg-gray-50 text-sm font-semibold flex justify-between"><span>Totals:</span><span>{summary.totalQuantity} units | {formatCurrency(summary.totalValue)}</span></div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <FiFileText className="mx-auto text-gray-400 mb-4" size={48} />
            <p className="text-gray-500 text-lg">No data found for the selected criteria</p>
            <p className="text-gray-400 text-sm mt-2">Try changing the date range or report type</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Report;