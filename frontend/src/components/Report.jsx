import { useEffect, useState, useRef } from "react";
import api from "../api";
import { FileText, Download, Printer, Calendar, Package, ArrowRightLeft, User } from "lucide-react";

export default function Report() {
  const [stockIn, setStockIn] = useState([]);
  const [stockOut, setStockOut] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState({
    startDate: "",
    endDate: "",
  });
  const [reportType, setReportType] = useState("both"); // both, stockin, stockout
  const reportRef = useRef(null);

  const fetchData = async () => {
    try {
      const [stockInRes, stockOutRes] = await Promise.all([
        api.get("/stockin"),
        api.get("/stockout"),
      ]);
      setStockIn(stockInRes.data);
      setStockOut(stockOutRes.data);
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
      
      // Set time to beginning and end of day for accurate filtering
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

  // Export to CSV
  const exportToCSV = () => {
    let csvData = [];
    
    if (reportType === "both" || reportType === "stockin") {
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
      csvData.push([]);
    }
    
    if (reportType === "both" || reportType === "stockout") {
      if (reportType === "both") csvData.push([]);
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

  // Print Report
  const printReport = () => {
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
        .filters {
          margin-bottom: 20px;
          padding: 10px;
          background: #f3f4f6;
          border-radius: 5px;
        }
        .section {
          margin-bottom: 30px;
        }
        .section h2 {
          color: #1e3a8a;
          border-left: 4px solid #1e3a8a;
          padding-left: 10px;
          margin-bottom: 15px;
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
        .summary {
          margin-top: 20px;
          padding: 15px;
          background: #f9fafb;
          border-radius: 5px;
        }
        .summary-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 10px;
          margin-top: 10px;
        }
        .summary-item {
          padding: 10px;
          background: white;
          border: 1px solid #ddd;
          border-radius: 5px;
        }
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
        <title>SMS Report - ${new Date().toLocaleDateString()}</title>
        ${styles}
      </head>
      <body>
        <div class="header">
          <h1>Stock Management System (SMS)</h1>
          <h2>Stock Movement Report</h2>
          <p>Generated: ${new Date().toLocaleString()}</p>
          <p>Report Type: ${reportType === 'both' ? 'Stock In & Stock Out' : reportType === 'stockin' ? 'Stock In Only' : 'Stock Out Only'}</p>
          ${dateFilter.startDate || dateFilter.endDate ? `
            <p>Date Range: ${dateFilter.startDate || 'Start'} to ${dateFilter.endDate || 'End'}</p>
          ` : '<p>Date Range: All Time</p>'}
        </div>
    `;

    if (reportType === "both" || reportType === "stockin") {
      content += `
        <div class="section">
          <h2>Stock In Report</h2>
          <table>
            <thead>
              <tr>
                <th>Item Name</th>
                <th>Description</th>
                <th>Quantity</th>
                <th>Supplier</th>
                <th>Date</th>
                <th>Created By</th>
              </tr>
            </thead>
            <tbody>
      `;
      
      filteredStockIn.forEach(item => {
        content += `
          <tr>
            <td>${item.itemname}</td>
            <td>${item.description || '-'}</td>
            <td>${item.quantityIn}</td>
            <td>${item.supplierName || '-'}</td>
            <td>${new Date(item.stockIndate).toLocaleDateString()}</td>
            <td>${item.user_id?.user_name || 'N/A'}</td>
          </tr>
        `;
      });
      
      content += `
            </tbody>
          </table>
          <div class="summary">
            <strong>Stock In Summary:</strong>
            <div class="summary-grid">
              <div class="summary-item">Total Items Received: ${filteredStockIn.length}</div>
              <div class="summary-item">Total Quantity Received: ${totalStockInQuantity}</div>
            </div>
          </div>
        </div>
      `;
    }

    if (reportType === "both" || reportType === "stockout") {
      content += `
        <div class="section">
          <h2>Stock Out Report</h2>
          <table>
            <thead>
              <tr>
                <th>Item Name</th>
                <th>Quantity Out</th>
                <th>Date</th>
                <th>Issued By</th>
              </tr>
            </thead>
            <tbody>
      `;
      
      filteredStockOut.forEach(item => {
        content += `
          <tr>
            <td>${item.stockin_id?.itemname || 'N/A'}</td>
            <td>${item.quantityout}</td>
            <td>${new Date(item.stockoutDate).toLocaleDateString()}</td>
            <td>${item.user_id?.user_name || 'N/A'}</td>
          </tr>
        `;
      });
      
      content += `
            </tbody>
          </table>
          <div class="summary">
            <strong>Stock Out Summary:</strong>
            <div class="summary-grid">
              <div class="summary-item">Total Items Issued: ${filteredStockOut.length}</div>
              <div class="summary-item">Total Quantity Issued: ${totalStockOutQuantity}</div>
            </div>
          </div>
        </div>
      `;
    }

    content += `
        <div class="footer">
          <p>This is a system-generated report from Stock Management System (SMS)</p>
          <p>Report ID: SMS-${Date.now()}</p>
        </div>
      </body>
      </html>
    `;

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
          <p className="text-gray-400">Generate stock movement reports</p>
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
          {/* Date Range */}
          <div>
            <label className="block text-sm font-medium mb-2 flex items-center gap-2">
              <Calendar size={16} /> Start Date
            </label>
            <input
              type="date"
              className="w-full bg-slate-700 p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={dateFilter.startDate}
              onChange={(e) =>
                setDateFilter({ ...dateFilter, startDate: e.target.value })
              }
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
              onChange={(e) =>
                setDateFilter({ ...dateFilter, endDate: e.target.value })
              }
            />
          </div>

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
              <option value="both">Both Stock In & Stock Out</option>
              <option value="stockin">Stock In Only</option>
              <option value="stockout">Stock Out Only</option>
            </select>
          </div>

          {/* Clear Filters */}
          <div className="flex items-end">
            <button
              onClick={() => setDateFilter({ startDate: "", endDate: "" })}
              className="w-full bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded transition"
            >
              Clear Date Filters
            </button>
          </div>
        </div>
        
        {/* Active Filters Display */}
        {(dateFilter.startDate || dateFilter.endDate) && (
          <div className="mt-3 text-sm text-gray-400">
            Active filters: 
            {dateFilter.startDate && ` Start: ${dateFilter.startDate}`}
            {dateFilter.endDate && ` End: ${dateFilter.endDate}`}
          </div>
        )}
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-slate-800 p-4 rounded-xl">
          <div className="flex items-center justify-between">
            <Package className="text-blue-400" size={24} />
            <p className="text-2xl font-bold text-blue-400">{totalStockInQuantity}</p>
          </div>
          <p className="text-gray-400 mt-2">Total Stock In</p>
          <p className="text-xs text-gray-500">{filteredStockIn.length} transactions</p>
        </div>
        
        <div className="bg-slate-800 p-4 rounded-xl">
          <div className="flex items-center justify-between">
            <ArrowRightLeft className="text-yellow-400" size={24} />
            <p className="text-2xl font-bold text-yellow-400">{totalStockOutQuantity}</p>
          </div>
          <p className="text-gray-400 mt-2">Total Stock Out</p>
          <p className="text-xs text-gray-500">{filteredStockOut.length} transactions</p>
        </div>
        
        <div className="bg-slate-800 p-4 rounded-xl">
          <div className="flex items-center justify-between">
            <Package className="text-green-400" size={24} />
            <p className="text-2xl font-bold text-green-400">{totalStockInQuantity - totalStockOutQuantity}</p>
          </div>
          <p className="text-gray-400 mt-2">Current Stock Balance</p>
          <p className="text-xs text-gray-500">Net difference</p>
        </div>
        
        <div className="bg-slate-800 p-4 rounded-xl">
          <div className="flex items-center justify-between">
            <User className="text-purple-400" size={24} />
            <p className="text-2xl font-bold text-purple-400">
              {[...new Set(filteredStockOut.map(item => item.user_id?.user_name))].length}
            </p>
          </div>
          <p className="text-gray-400 mt-2">Active Issuers</p>
          <p className="text-xs text-gray-500">Staff who issued stock</p>
        </div>
      </div>

      {/* Report Content */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400"></div>
        </div>
      ) : (
        <div ref={reportRef}>
          {/* Stock In Report */}
          {(reportType === "both" || reportType === "stockin") && (
            <div className="bg-slate-800 rounded-xl p-4 mb-6">
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
                          No stock in records found for the selected date range
                        </td>
                      </tr>
                    ) : (
                      filteredStockIn.map((item) => (
                        <tr key={item._id} className="border-b border-slate-700">
                          <td className="p-2 font-medium">{item.itemname}</td>
                          <td className="p-2 hidden md:table-cell text-gray-300">
                            {item.description?.slice(0, 50) || "-"}
                          </td>
                          <td className="p-2">{item.quantityIn}</td>
                          <td className="p-2 hidden lg:table-cell">{item.supplierName || "-"}</td>
                          <td className="p-2">
                            {new Date(item.stockIndate).toLocaleDateString()}
                          </td>
                          <td className="p-2">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-xs font-bold">
                                {item.user_id?.user_name?.charAt(0).toUpperCase() || "?"}
                              </div>
                              <span className="text-sm">{item.user_id?.user_name || "N/A"}</span>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Stock Out Report */}
          {(reportType === "both" || reportType === "stockout") && (
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
                          No stock out records found for the selected date range
                        </td>
                      </tr>
                    ) : (
                      filteredStockOut.map((item) => (
                        <tr key={item._id} className="border-b border-slate-700">
                          <td className="p-2 font-medium">
                            {item.stockin_id?.itemname || "N/A"}
                          </td>
                          <td className="p-2">{item.quantityout}</td>
                          <td className="p-2">
                            {new Date(item.stockoutDate).toLocaleDateString()}
                          </td>
                          <td className="p-2">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-yellow-500 flex items-center justify-center text-xs font-bold">
                                {item.user_id?.user_name?.charAt(0).toUpperCase() || "?"}
                              </div>
                              <span className="text-sm">{item.user_id?.user_name || "N/A"}</span>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}