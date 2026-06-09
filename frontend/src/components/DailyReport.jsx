import { useState, useRef } from "react";
import api from "../api";
import { Search, Printer, Calendar, Download } from "lucide-react";

export default function DailyReport() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const reportRef = useRef(null);

  const generateReport = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/reports/daily/${selectedDate}`);
      setReport(res.data);
    } catch (err) {
      console.log(err);
      alert("Error generating report");
    } finally {
      setLoading(false);
    }
  };

  const printReport = () => {
    if (!reportRef.current) return;
    
    // Get the report content
    const reportContent = reportRef.current.innerHTML;
    
    // Create a new window for printing
    const printWindow = window.open('', '_blank');
    
    // Write the report HTML with print-specific styles
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Daily Sales Report - ${new Date(report.reportDate).toLocaleDateString()}</title>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            
            body {
              font-family: 'Arial', 'Helvetica', sans-serif;
              padding: 40px;
              background: white;
              color: black;
            }
            
            .report-container {
              max-width: 1200px;
              margin: 0 auto;
            }
            
            .header {
              text-align: center;
              margin-bottom: 30px;
              padding-bottom: 20px;
              border-bottom: 2px solid #333;
            }
            
            .company-name {
              font-size: 24px;
              font-weight: bold;
              color: #1e3a8a;
            }
            
            .company-details {
              color: #666;
              margin-top: 5px;
            }
            
            .report-title {
              font-size: 20px;
              font-weight: bold;
              margin-top: 20px;
              margin-bottom: 10px;
            }
            
            .report-date {
              color: #666;
              margin-bottom: 20px;
            }
            
            .stats-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 20px;
              margin-bottom: 30px;
            }
            
            .stat-card {
              background: #f3f4f6;
              padding: 20px;
              border-radius: 8px;
              text-align: center;
              border: 1px solid #e5e7eb;
            }
            
            .stat-label {
              color: #666;
              font-size: 14px;
              margin-bottom: 10px;
            }
            
            .stat-value {
              font-size: 28px;
              font-weight: bold;
              color: #1e3a8a;
            }
            
            .stat-value.total {
              color: #059669;
            }
            
            .section-title {
              font-size: 18px;
              font-weight: bold;
              margin: 20px 0 15px 0;
              padding-bottom: 8px;
              border-bottom: 1px solid #ccc;
            }
            
            table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 30px;
            }
            
            th {
              background: #f3f4f6;
              padding: 12px;
              text-align: left;
              font-weight: bold;
              border: 1px solid #e5e7eb;
            }
            
            td {
              padding: 10px;
              border: 1px solid #e5e7eb;
            }
            
            .footer {
              margin-top: 40px;
              padding-top: 20px;
              border-top: 1px solid #ccc;
              text-align: center;
              color: #666;
              font-size: 12px;
            }
            
            .signature {
              margin-top: 40px;
              text-align: center;
            }
            
            .signature-line {
              margin-top: 30px;
              width: 200px;
              border-top: 1px solid #333;
              margin-left: auto;
              margin-right: auto;
            }
            
            @media print {
              body {
                padding: 20px;
              }
              .no-print {
                display: none;
              }
              .stat-card {
                break-inside: avoid;
              }
              table {
                break-inside: avoid;
              }
              tr {
                break-inside: avoid;
              }
            }
          </style>
        </head>
        <body>
          <div class="report-container">
            ${reportContent}
            <div class="signature">
              <div class="signature-line"></div>
              <p style="margin-top: 10px;">Authorized Signature</p>
              <p style="margin-top: 20px; font-size: 12px; color: #666;">
                Generated on: ${new Date().toLocaleString()}
              </p>
            </div>
          </div>
          <script>
            window.onload = () => {
              window.print();
              window.onafterprint = () => window.close();
            };
          <\/script>
        </body>
      </html>
    `);
    
    printWindow.document.close();
  };

  const exportToCSV = () => {
    if (!report || !report.soldItems.length) return;
    
    // Prepare CSV data
    const headers = ['Item Name', 'Specification', 'Unit Measure', 'Unit Price (RWF)', 'Quantity Sold', 'Subtotal (RWF)'];
    const rows = report.soldItems.map(item => [
      item.ItemName,
      item.Specification || '-',
      item.UnitMeasure || '-',
      item.UnitPrice,
      item.QuantitySold,
      item.SubTotalPrice
    ]);
    
    // Add summary row
    rows.push(['', '', '', '', 'Total:', report.totalAmount]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');
    
    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `sales_report_${selectedDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Daily Sales Report</h1>
        <p className="text-gray-400">Generate and view daily sales reports</p>
      </div>

      <div className="bg-slate-800 p-6 rounded-xl mb-6">
        <div className="flex gap-4 items-end flex-wrap">
          <div className="flex-1 min-w-[200px]">
            <label className="block mb-2 flex items-center gap-2">
              <Calendar size={18} /> Select Date
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full bg-slate-700 text-white px-4 py-2 rounded-lg"
            />
          </div>
          <button
            onClick={generateReport}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-lg flex items-center gap-2 disabled:opacity-50"
          >
            <Search size={20} /> {loading ? "Loading..." : "Generate Report"}
          </button>
          {report && (
            <>
              <button
                onClick={printReport}
                className="bg-green-600 hover:bg-green-700 px-6 py-2 rounded-lg flex items-center gap-2"
              >
                <Printer size={20} /> Print Report
              </button>
              <button
                onClick={exportToCSV}
                className="bg-yellow-600 hover:bg-yellow-700 px-6 py-2 rounded-lg flex items-center gap-2"
              >
                <Download size={20} /> Export to CSV
              </button>
            </>
          )}
        </div>
      </div>

      {report && (
        <div className="bg-slate-800 rounded-xl p-6">
          {/* Report Content - This will be captured for printing */}
          <div ref={reportRef}>
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-blue-400">DAB Enterprise LTD</h2>
              <p className="text-gray-400">Building Tools and Construction Materials</p>
              <p className="text-gray-400">Kigali City, Rwanda</p>
              <h3 className="text-xl font-bold mt-4">Daily Sales Report</h3>
              <p className="text-gray-400">
                Date: {new Date(report.reportDate).toLocaleDateString('en-GB', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="bg-slate-700 p-4 rounded-lg text-center">
                <p className="text-gray-400">Total Number of Sales</p>
                <p className="text-2xl font-bold text-blue-400">{report.totalSales}</p>
              </div>
              <div className="bg-slate-700 p-4 rounded-lg text-center">
                <p className="text-gray-400">Total Revenue</p>
                <p className="text-2xl font-bold text-green-400">
                  {report.totalAmount.toLocaleString()} RWF
                </p>
              </div>
            </div>

            <h3 className="text-xl font-bold mb-4">Sold Items Details</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-700">
                  <tr>
                    <th className="p-3">Item Name</th>
                    <th className="p-3">Specification</th>
                    <th className="p-3">Unit Measure</th>
                    <th className="p-3">Unit Price (RWF)</th>
                    <th className="p-3">Quantity Sold</th>
                    <th className="p-3">Subtotal (RWF)</th>
                  </tr>
                </thead>
                <tbody>
                  {report.soldItems.length > 0 ? (
                    report.soldItems.map((item, idx) => (
                      <tr key={idx} className="border-b border-slate-700">
                        <td className="p-3">{item.ItemName}</td>
                        <td className="p-3">{item.Specification || "-"}</td>
                        <td className="p-3">{item.UnitMeasure || "-"}</td>
                        <td className="p-3">{item.UnitPrice.toLocaleString()}</td>
                        <td className="p-3">{item.QuantitySold}</td>
                        <td className="p-3">{item.SubTotalPrice.toLocaleString()}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="p-3 text-center text-gray-400">
                        No sales recorded for this date
                      </td>
                    </tr>
                  )}
                </tbody>
                {report.soldItems.length > 0 && (
                  <tfoot className="bg-slate-700">
                    <tr>
                      <td colSpan="5" className="p-3 text-right font-bold">Grand Total:</td>
                      <td className="p-3 font-bold text-green-400">
                        {report.totalAmount.toLocaleString()} RWF
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-700 text-center text-gray-400">
              <p>Report ID: SRMS-{new Date().getTime()}</p>
              <p className="text-xs mt-2">
                This is a computer-generated report and does not require a physical signature.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}