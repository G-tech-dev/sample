import { useEffect, useState, useRef } from "react";
import api from "../api";
import { FileText, Download, Printer, Calendar, Package, ArrowRightLeft, User, BarChart3, TrendingUp } from "lucide-react";

export default function Report() {
  const [stockIn, setStockIn] = useState([]);
  const [stockOut, setStockOut] = useState([]);
  const [stockSummary, setStockSummary] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState({
    startDate: "",
    endDate: "",
  });
  const [reportType, setReportType] = useState("dailyStatus"); // dailyStatus, stockin, stockout
  const reportRef = useRef(null);

  const fetchData = async () => {
    try {
      const [stockInRes, stockOutRes, summaryRes] = await Promise.all([
        api.get("/stockin"),
        api.get("/stockout"),
        api.get("/stock/summary"),
      ]);
      setStockIn(stockInRes.data);
      setStockOut(stockOutRes.data);
      setStockSummary(summaryRes.data);
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filterByDate = (data, dateField) => {
    if (!dateFilter.startDate && !dateFilter.endDate) return data;
    return data.filter((item) => {
      const itemDate = new Date(item[dateField]);
      const start = dateFilter.startDate ? new Date(dateFilter.startDate) : null;
      const end = dateFilter.endDate ? new Date(dateFilter.endDate) : null;
      
      if (start) start.setHours(0, 0, 0, 0);
      if (end) end.setHours(23, 59, 59, 999);
      
      if (start && end) {
        return itemDate >= start && itemDate <= end;
      } else if (start) {
        return itemDate >= start;
      } else if (end) {
        return itemDate <= end;
      }
      return true;
    });
  };

  const filteredStockIn = filterByDate(stockIn, "stockIndate");
  const filteredStockOut = filterByDate(stockOut, "stockoutDate");

  const totalStockInQuantity = filteredStockIn.reduce((sum, item) => sum + item.quantityIn, 0);
  const totalStockOutQuantity = filteredStockOut.reduce((sum, item) => sum + item.quantityout, 0);

  // Calculate daily stock status
  const calculateDailyStockStatus = () => {
    const itemMap = new Map();
    
    // Aggregate all stock in entries
    stockIn.forEach(item => {
      const itemName = item.itemname;
      if (!itemMap.has(itemName)) {
        itemMap.set(itemName, {
          itemname: itemName,
          description: item.description || "",
          totalReceived: 0,
          totalIssued: 0,
          currentStock: 0,
          supplierName: item.supplierName || "",
          lastStockInDate: item.stockIndate
        });
      }
      const record = itemMap.get(itemName);
      record.totalReceived += item.quantityIn;
      record.currentStock += item.quantityIn;
      if (item.stockIndate > record.lastStockInDate) {
        record.lastStockInDate = item.stockIndate;
      }
    });
    
    // Aggregate all stock out entries
    stockOut.forEach(item => {
      const itemName = item.stockin_id?.itemname;
      if (itemName && itemMap.has(itemName)) {
        const record = itemMap.get(itemName);
        record.totalIssued += item.quantityout;
        record.currentStock -= item.quantityout;
      }
    });
    
    return Array.from(itemMap.values()).sort((a, b) => a.itemname.localeCompare(b.itemname));
  };

  const dailyStockStatus = calculateDailyStockStatus();
  
  const totalItems = dailyStockStatus.length;
  const totalReceivedAll = dailyStockStatus.reduce((sum, item) => sum + item.totalReceived, 0);
  const totalIssuedAll = dailyStockStatus.reduce((sum, item) => sum + item.totalIssued, 0);
  const totalCurrentStock = dailyStockStatus.reduce((sum, item) => sum + item.currentStock, 0);
  const lowStockItems = dailyStockStatus.filter(item => item.currentStock < 10 && item.currentStock > 0);
  const outOfStockItems = dailyStockStatus.filter(item => item.currentStock === 0);

  // Export to CSV
  const exportToCSV = () => {
    let csvData = [];
    
    if (reportType === "dailyStatus") {
      csvData.push(["DAILY STOCK STATUS REPORT"]);
      csvData.push([`Generated: ${new Date().toLocaleString()}`]);
      csvData.push([`Report Date: ${new Date().toLocaleDateString()}`]);
      csvData.push([]);
      csvData.push(["Item Name", "Description", "Total Received", "Total Issued", "Current Stock", "Supplier", "Status", "Last Stock In Date"]);
      csvData.push(...dailyStockStatus.map(item => [
        item.itemname,
        item.description || "",
        item.totalReceived,
        item.totalIssued,
        item.currentStock,
        item.supplierName || "",
        item.currentStock === 0 ? "Out of Stock" : item.currentStock < 10 ? "Low Stock" : "In Stock",
        new Date(item.lastStockInDate).toLocaleDateString()
      ]));
      csvData.push([]);
      csvData.push(["SUMMARY"]);
      csvData.push([`Total Items: ${totalItems}`]);
      csvData.push([`Total Received: ${totalReceivedAll}`]);
      csvData.push([`Total Issued: ${totalIssuedAll}`]);
      csvData.push([`Current Stock: ${totalCurrentStock}`]);
      csvData.push([`Low Stock Items: ${lowStockItems.length}`]);
      csvData.push([`Out of Stock Items: ${outOfStockItems.length}`]);
    } else if (reportType === "stockin") {
      csvData.push(["STOCK IN REPORT"]);
      csvData.push([`Generated: ${new Date().toLocaleString()}`]);
      csvData.push([`Date Range: ${dateFilter.startDate || "Start"} to ${dateFilter.endDate || "End"}`]);
      csvData.push([]);
      csvData.push(["Item Name", "Description", "Quantity", "Supplier", "Date", "Created By"]);
      csvData.push(...filteredStockIn.map(item => [
        item.itemname,
        item.description || "",
        item.quantityIn,
        item.supplierName || "",
        new Date(item.stockIndate).toLocaleDateString(),
        item.user_id?.user_name || "N/A",
      ]));
      csvData.push([]);
      csvData.push([`Total Stock In: ${totalStockInQuantity}`]);
    } else if (reportType === "stockout") {
      csvData.push(["STOCK OUT REPORT"]);
      csvData.push([`Generated: ${new Date().toLocaleString()}`]);
      csvData.push([`Date Range: ${dateFilter.startDate || "Start"} to ${dateFilter.endDate || "End"}`]);
      csvData.push([]);
      csvData.push(["Item Name", "Quantity Out", "Date", "Issued By"]);
      csvData.push(...filteredStockOut.map(item => [
        item.stockin_id?.itemname || "N/A",
        item.quantityout,
        new Date(item.stockoutDate).toLocaleDateString(),
        item.user_id?.user_name || "N/A",
      ]));
      csvData.push([]);
      csvData.push([`Total Stock Out: ${totalStockOutQuantity}`]);
    }

    const csvContent = csvData.map(row => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `sms_report_${reportType}_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Print Daily Stock Status Report
  const printDailyStatusReport = () => {
    const printWindow = window.open('', '_blank');
    const styles = `
      <style>
        body {
          font-family: Arial, sans-serif;
          margin: 20px;
          color: #333;
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
          padding-bottom: 20px;
          border-bottom: 2px solid #333;
        }
        .header h1 {
          margin: 0;
          color: #1e3a8a;
        }
        .header p {
          margin: 5px 0;
          color: #666;
        }
        .summary-cards {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 15px;
          margin-bottom: 30px;
        }
        .card {
          padding: 15px;
          background: #f3f4f6;
          border-radius: 8px;
          text-align: center;
        }
        .card h3 {
          margin: 0 0 10px 0;
          font-size: 14px;
          color: #666;
        }
        .card .value {
          font-size: 24px;
          font-weight: bold;
          color: #1e3a8a;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 20px;
        }
        th, td {
          border: 1px solid #ddd;
          padding: 10px;
          text-align: left;
        }
        th {
          background-color: #f3f4f6;
          font-weight: bold;
        }
        .status-badge {
          display: inline-block;
          padding: 3px 8px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: bold;
        }
        .status-instock { background: #d1fae5; color: #065f46; }
        .status-lowstock { background: #fed7aa; color: #92400e; }
        .status-outofstock { background: #fee2e2; color: #991b1b; }
        .footer {
          text-align: center;
          margin-top: 30px;
          padding-top: 20px;
          border-top: 1px solid #ddd;
          font-size: 12px;
          color: #666;
        }
        @media print {
          body {
            margin: 0;
            padding: 10px;
          }
          .no-print {
            display: none;
          }
        }
      </style>
    `;

    let content = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Daily Stock Status Report - ${new Date().toLocaleDateString()}</title>
        ${styles}
      </head>
      <body>
        <div class="header">
          <h1>Stock Management System (SMS)</h1>
          <h2>Daily Stock Status Report</h2>
          <p>Generated: ${new Date().toLocaleString()}</p>
          <p>Report Date: ${new Date().toLocaleDateString()}</p>
        </div>
        
        <div class="summary-cards">
          <div class="card">
            <h3>Total Items</h3>
            <div class="value">${totalItems}</div>
          </div>
          <div class="card">
            <h3>Total Received</h3>
            <div class="value">${totalReceivedAll}</div>
          </div>
          <div class="card">
            <h3>Total Issued</h3>
            <div class="value">${totalIssuedAll}</div>
          </div>
          <div class="card">
            <h3>Current Stock</h3>
            <div class="value">${totalCurrentStock}</div>
          </div>
        </div>
        
        <div class="summary-cards">
          <div class="card">
            <h3>Low Stock Items</h3>
            <div class="value" style="color: #d97706;">${lowStockItems.length}</div>
          </div>
          <div class="card">
            <h3>Out of Stock</h3>
            <div class="value" style="color: #dc2626;">${outOfStockItems.length}</div>
          </div>
          <div class="card">
            <h3>Stock Value</h3>
            <div class="value">-</div>
          </div>
          <div class="card">
            <h3>Turnover Rate</h3>
            <div class="value">${totalIssuedAll > 0 ? ((totalIssuedAll / totalReceivedAll) * 100).toFixed(1) : 0}%</div>
          </div>
        </div>
        
        <table>
          <thead>
            <tr>
              <th>Item Name</th>
              <th>Description</th>
              <th>Total Received</th>
              <th>Total Issued</th>
              <th>Current Stock</th>
              <th>Supplier</th>
              <th>Status</th>
              <th>Last Stock In</th>
            </tr>
          </thead>
          <tbody>
    `;

    dailyStockStatus.forEach(item => {
      let statusClass = '';
      let statusText = '';
      if (item.currentStock === 0) {
        statusClass = 'status-outofstock';
        statusText = 'Out of Stock';
      } else if (item.currentStock < 10) {
        statusClass = 'status-lowstock';
        statusText = 'Low Stock';
      } else {
        statusClass = 'status-instock';
        statusText = 'In Stock';
      }
      
      content += `
        <tr>
          <td>${item.itemname}</td>
          <td>${item.description || '-'}</td>
          <td>${item.totalReceived}</td>
          <td>${item.totalIssued}</td>
          <td><strong>${item.currentStock}</strong></td>
          <td>${item.supplierName || '-'}</td>
          <td><span class="status-badge ${statusClass}">${statusText}</span></td>
          <td>${new Date(item.lastStockInDate).toLocaleDateString()}</td>
        </tr>
      `;
    });

    content += `
          </tbody>
        </table>
        
        <div class="footer">
          <p>This is a system-generated daily stock status report from Stock Management System (SMS)</p>
          <p>Report ID: SMS-DSR-${Date.now()}</p>
          <p>Generated by: ${localStorage.getItem("user") ? JSON.parse(localStorage.getItem("user")).user_name : "System"}</p>
        </div>
        
        <div class="no-print" style="text-align: center; margin-top: 20px;">
          <button onclick="window.print()" style="padding: 10px 20px; margin: 5px;">Print</button>
          <button onclick="window.close()" style="padding: 10px 20px; margin: 5px;">Close</button>
        </div>
      </body>
      </html>
    `;

    printWindow.document.write(content);
    printWindow.document.close();
    printWindow.print();
  };

  // Print regular report
  const printReport = () => {
    if (reportType === "dailyStatus") {
      printDailyStatusReport();
      return;
    }

    const printWindow = window.open('', '_blank');
    const styles = `
      <style>
        body {
          font-family: Arial, sans-serif;
          margin: 20px;
          color: #333;
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
          padding-bottom: 20px;
          border-bottom: 2px solid #333;
        }
        .header h1 {
          margin: 0;
          color: #1e3a8a;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 20px;
        }
        th, td {
          border: 1px solid #ddd;
          padding: 8px;
          text-align: left;
        }
        th {
          background-color: #f3f4f6;
          font-weight: bold;
        }
        .footer {
          text-align: center;
          margin-top: 30px;
          padding-top: 20px;
          border-top: 1px solid #ddd;
          font-size: 12px;
        }
      </style>
    `;

    let content = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>SMS Report</title>
        ${styles}
      </head>
      <body>
        <div class="header">
          <h1>Stock Management System</h1>
          <h2>${reportType === 'stockin' ? 'Stock In Report' : 'Stock Out Report'}</h2>
          <p>Generated: ${new Date().toLocaleString()}</p>
        </div>
    `;

    if (reportType === "stockin") {
      content += `
        <table>
          <thead><tr><th>Item Name</th><th>Description</th><th>Quantity</th><th>Supplier</th><th>Date</th><th>Created By</th></tr></thead>
          <tbody>
      `;
      filteredStockIn.forEach(item => {
        content += `<tr><td>${item.itemname}</td><td>${item.description || '-'}</td><td>${item.quantityIn}</td><td>${item.supplierName || '-'}</td><td>${new Date(item.stockIndate).toLocaleDateString()}</td><td>${item.user_id?.user_name || 'N/A'}</td></tr>`;
      });
      content += `</tbody></table>`;
    } else {
      content += `
        </table>
          <thead><tr><th>Item Name</th><th>Quantity Out</th><th>Date</th><th>Issued By</th></tr></thead>
          <tbody>
      `;
      filteredStockOut.forEach(item => {
        content += `<tr><td>${item.stockin_id?.itemname || 'N/A'}</td><td>${item.quantityout}</td><td>${new Date(item.stockoutDate).toLocaleDateString()}</td><td>${item.user_id?.user_name || 'N/A'}</td></tr>`;
      });
      content += `</tbody></table>`;
    }

    content += `<div class="footer"><p>System-generated report</p></div></body></html>`;
    printWindow.document.write(content);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FileText /> Reports
          </h1>
          <p className="text-gray-400">Generate stock reports including daily stock status</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={printReport}
            className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg flex items-center gap-2"
          >
            <Printer size={20} /> Print Report
          </button>
          <button
            onClick={exportToCSV}
            className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg flex items-center gap-2"
          >
            <Download size={20} /> Export to CSV
          </button>
        </div>
      </div>

      {/* Filters Section */}
      <div className="bg-slate-800 p-4 rounded-xl mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Date Range - Only show for stockin/stockout reports */}
          {reportType !== "dailyStatus" && (
            <>
              <div>
                <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                  <Calendar size={16} /> Start Date
                </label>
                <input
                  type="date"
                  className="w-full bg-slate-700 p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={dateFilter.startDate}
                  onChange={(e) => setDateFilter({ ...dateFilter, startDate: e.target.value })}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                  <Calendar size={16} /> End Date
                </label>
                <input
                  type="date"
                  className="w-full bg-slate-700 p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={dateFilter.endDate}
                  onChange={(e) => setDateFilter({ ...dateFilter, endDate: e.target.value })}
                />
              </div>
            </>
          )}

          {/* Report Type */}
          <div>
            <label className="block text-sm font-medium mb-2 flex items-center gap-2">
              <FileText size={16} /> Report Type
            </label>
            <select
              className="w-full bg-slate-700 p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
            >
              <option value="dailyStatus">Daily Stock Status Report</option>
              <option value="stockin">Stock In Report</option>
              <option value="stockout">Stock Out Report</option>
            </select>
          </div>

          {/* Clear Filters */}
          {reportType !== "dailyStatus" && (dateFilter.startDate || dateFilter.endDate) && (
            <div className="flex items-end">
              <button
                onClick={() => setDateFilter({ startDate: "", endDate: "" })}
                className="w-full bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded transition"
              >
                Clear Date Filters
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Daily Stock Status Report */}
      {reportType === "dailyStatus" && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-slate-800 p-4 rounded-xl">
              <div className="flex items-center justify-between">
                <Package className="text-blue-400" size={24} />
                <p className="text-2xl font-bold text-blue-400">{totalItems}</p>
              </div>
              <p className="text-gray-400 mt-2">Total Items</p>
              <p className="text-xs text-gray-500">Unique products</p>
            </div>
            
            <div className="bg-slate-800 p-4 rounded-xl">
              <div className="flex items-center justify-between">
                <TrendingUp className="text-green-400" size={24} />
                <p className="text-2xl font-bold text-green-400">{totalReceivedAll}</p>
              </div>
              <p className="text-gray-400 mt-2">Total Received</p>
              <p className="text-xs text-gray-500">Lifetime purchases</p>
            </div>
            
            <div className="bg-slate-800 p-4 rounded-xl">
              <div className="flex items-center justify-between">
                <ArrowRightLeft className="text-yellow-400" size={24} />
                <p className="text-2xl font-bold text-yellow-400">{totalIssuedAll}</p>
              </div>
              <p className="text-gray-400 mt-2">Total Issued</p>
              <p className="text-xs text-gray-500">Lifetime issues</p>
            </div>
            
            <div className="bg-slate-800 p-4 rounded-xl">
              <div className="flex items-center justify-between">
                <BarChart3 className="text-purple-400" size={24} />
                <p className="text-2xl font-bold text-purple-400">{totalCurrentStock}</p>
              </div>
              <p className="text-gray-400 mt-2">Current Stock</p>
              <p className="text-xs text-gray-500">Available now</p>
            </div>
          </div>

          {/* Additional Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="bg-red-900/30 border border-red-500 p-4 rounded-xl">
              <p className="text-red-400 font-bold">Out of Stock Items: {outOfStockItems.length}</p>
              {outOfStockItems.slice(0, 3).map((item, idx) => (
                <p key={idx} className="text-sm text-red-300 mt-1">• {item.itemname}</p>
              ))}
              {outOfStockItems.length > 3 && (
                <p className="text-sm text-red-300 mt-1">• And {outOfStockItems.length - 3} more...</p>
              )}
            </div>
            <div className="bg-yellow-900/30 border border-yellow-500 p-4 rounded-xl">
              <p className="text-yellow-400 font-bold">Low Stock Items: {lowStockItems.length}</p>
              {lowStockItems.slice(0, 3).map((item, idx) => (
                <p key={idx} className="text-sm text-yellow-300 mt-1">• {item.itemname} (Only {item.currentStock} left)</p>
              ))}
              {lowStockItems.length > 3 && (
                <p className="text-sm text-yellow-300 mt-1">• And {lowStockItems.length - 3} more...</p>
              )}
            </div>
          </div>

          {/* Stock Status Table */}
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400"></div>
            </div>
          ) : (
            <div className="bg-slate-800 rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-700">
                    <tr>
                      <th className="p-3">Item Name</th>
                      <th className="p-3 hidden lg:table-cell">Description</th>
                      <th className="p-3">Total Received</th>
                      <th className="p-3">Total Issued</th>
                      <th className="p-3">Current Stock</th>
                      <th className="p-3 hidden md:table-cell">Supplier</th>
                      <th className="p-3">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dailyStockStatus.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="text-center p-8 text-gray-400">
                          No stock data available
                        </td>
                      </tr>
                    ) : (
                      dailyStockStatus.map((item, index) => (
                        <tr key={index} className="border-b border-slate-700 hover:bg-slate-700/50 transition">
                          <td className="p-3 font-medium">{item.itemname}</td>
                          <td className="p-3 hidden lg:table-cell text-gray-300">
                            {item.description?.slice(0, 60) || "-"}
                          </td>
                          <td className="p-3">{item.totalReceived}</td>
                          <td className="p-3">{item.totalIssued}</td>
                          <td className="p-3">
                            <span className={`font-bold ${
                              item.currentStock === 0 ? "text-red-400" :
                              item.currentStock < 10 ? "text-yellow-400" : "text-green-400"
                            }`}>
                              {item.currentStock}
                            </span>
                          </td>
                          <td className="p-3 hidden md:table-cell">{item.supplierName || "-"}</td>
                          <td className="p-3">
                            <span className={`px-2 py-1 rounded text-sm whitespace-nowrap ${
                              item.currentStock === 0
                                ? "bg-red-600"
                                : item.currentStock < 10
                                ? "bg-yellow-600"
                                : "bg-green-600"
                            }`}>
                              {item.currentStock === 0
                                ? "Out of Stock"
                                : item.currentStock < 10
                                ? "Low Stock"
                                : "In Stock"}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* Stock In Report */}
      {reportType === "stockin" && !loading && (
        <div className="bg-slate-800 rounded-xl p-4">
          <h2 className="text-xl font-bold mb-3 flex items-center gap-2">
            <Package className="text-blue-400" size={20} />
            Stock In Report
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-700">
                <tr>
                  <th className="p-2">Item Name</th>
                  <th className="p-2 hidden md:table-cell">Description</th>
                  <th className="p-2">Quantity</th>
                  <th className="p-2 hidden lg:table-cell">Supplier</th>
                  <th className="p-2">Date</th>
                  <th className="p-2">Created By</th>
                </tr>
              </thead>
              <tbody>
                {filteredStockIn.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center p-4 text-gray-400">
                      No stock in records found
                    </td>
                  </tr>
                ) : (
                  filteredStockIn.map((item) => (
                    <tr key={item._id} className="border-b border-slate-700">
                      <td className="p-2 font-medium">{item.itemname}</td>
                      <td className="p-2 hidden md:table-cell">{item.description?.slice(0, 50) || "-"}</td>
                      <td className="p-2">{item.quantityIn}</td>
                      <td className="p-2 hidden lg:table-cell">{item.supplierName || "-"}</td>
                      <td className="p-2">{new Date(item.stockIndate).toLocaleDateString()}</td>
                      <td className="p-2">{item.user_id?.user_name || "N/A"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Stock Out Report */}
      {reportType === "stockout" && !loading && (
        <div className="bg-slate-800 rounded-xl p-4">
          <h2 className="text-xl font-bold mb-3 flex items-center gap-2">
            <ArrowRightLeft className="text-yellow-400" size={20} />
            Stock Out Report
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-700">
                <tr>
                  <th className="p-2">Item Name</th>
                  <th className="p-2">Quantity Out</th>
                  <th className="p-2">Date</th>
                  <th className="p-2">Issued By</th>
                </tr>
              </thead>
              <tbody>
                {filteredStockOut.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="text-center p-4 text-gray-400">
                      No stock out records found
                    </td>
                  </tr>
                ) : (
                  filteredStockOut.map((item) => (
                    <tr key={item._id} className="border-b border-slate-700">
                      <td className="p-2 font-medium">{item.stockin_id?.itemname || "N/A"}</td>
                      <td className="p-2">{item.quantityout}</td>
                      <td className="p-2">{new Date(item.stockoutDate).toLocaleDateString()}</td>
                      <td className="p-2">{item.user_id?.user_name || "N/A"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}