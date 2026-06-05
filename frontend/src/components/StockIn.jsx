import { useEffect, useState } from "react";
import api from "../api";
import { Package, Plus, Edit, Trash2, Save, X, Search, Download, Upload, Filter, FileText, Printer, Eye } from "lucide-react";

export default function StockIn() {
  const [stockIn, setStockIn] = useState([]);
  const [filteredStockIn, setFilteredStockIn] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showBillModal, setShowBillModal] = useState(false);
  const [selectedBill, setSelectedBill] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [supplierFilter, setSupplierFilter] = useState("all");
  const [uniqueSuppliers, setUniqueSuppliers] = useState([]);
  const [formData, setFormData] = useState({
    itemname: "",
    description: "",
    quantityIn: "",
    TotalQuantityIn: "",
    supplierName: "",
    stockIndate: new Date().toISOString().slice(0, 16),
  });

  const fetchStockIn = async () => {
    try {
      const res = await api.get("/stockin");
      setStockIn(res.data);
      setFilteredStockIn(res.data);
      
      // Extract unique suppliers
      const suppliers = [...new Set(res.data.map(item => item.supplierName).filter(s => s))];
      setUniqueSuppliers(suppliers);
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStockIn();
  }, []);

  // Apply filters
  useEffect(() => {
    let filtered = [...stockIn];
    
    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(item => 
        item.itemname.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.description && item.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item.supplierName && item.supplierName.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    
    // Supplier filter
    if (supplierFilter !== "all") {
      filtered = filtered.filter(item => item.supplierName === supplierFilter);
    }
    
    setFilteredStockIn(filtered);
  }, [searchTerm, supplierFilter, stockIn]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingItem) {
        await api.put(`/stockin/${editingItem._id}`, formData);
      } else {
        await api.post("/stockin", formData);
      }
      fetchStockIn();
      closeModal();
    } catch (err) {
      console.log(err);
      alert(err.response?.data?.msg || "Error saving stock in");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this stock in entry?\n\nNote: This will also delete all associated stock out records!")) {
      try {
        await api.delete(`/stockin/${id}`);
        fetchStockIn();
      } catch (err) {
        console.log(err);
        alert(err.response?.data?.msg || "Error deleting stock in. Please delete associated stock out records first.");
      }
    }
  };

  const openModal = (item = null) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        itemname: item.itemname,
        description: item.description || "",
        quantityIn: item.quantityIn,
        TotalQuantityIn: item.TotalQuantityIn || "",
        supplierName: item.supplierName || "",
        stockIndate: item.stockIndate ? new Date(item.stockIndate).toISOString().slice(0, 16) : new Date().toISOString().slice(0, 16),
      });
    } else {
      setEditingItem(null);
      setFormData({
        itemname: "",
        description: "",
        quantityIn: "",
        TotalQuantityIn: "",
        supplierName: "",
        stockIndate: new Date().toISOString().slice(0, 16),
      });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingItem(null);
  };

  const viewBill = (item) => {
    setSelectedBill(item);
    setShowBillModal(true);
  };

  const printBill = () => {
    const printWindow = window.open('', '_blank');
    const styles = `
      <style>
        body {
          font-family: 'Courier New', monospace;
          margin: 0;
          padding: 20px;
          background: white;
        }
        .bill-container {
          max-width: 300px;
          margin: 0 auto;
          padding: 20px;
          border: 1px solid #ddd;
          background: white;
        }
        .header {
          text-align: center;
          border-bottom: 1px dashed #333;
          padding-bottom: 10px;
          margin-bottom: 15px;
        }
        .header h2 {
          margin: 0;
          font-size: 18px;
          color: #1e3a8a;
        }
        .header p {
          margin: 5px 0;
          font-size: 12px;
          color: #666;
        }
        .bill-details {
          margin-bottom: 15px;
        }
        .row {
          margin-bottom: 8px;
          font-size: 12px;
        }
        .label {
          font-weight: bold;
          display: inline-block;
          min-width: 100px;
        }
        .divider {
          border-top: 1px dashed #333;
          margin: 15px 0;
        }
        .footer {
          text-align: center;
          font-size: 10px;
          margin-top: 20px;
          border-top: 1px dashed #333;
          padding-top: 10px;
        }
        .signature {
          margin-top: 30px;
          text-align: center;
        }
        .total {
          font-size: 14px;
          font-weight: bold;
          text-align: right;
          margin-top: 10px;
        }
        @media print {
          body {
            padding: 0;
          }
          .no-print {
            display: none;
          }
        }
      </style>
    `;

    const content = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Stock Receipt - ${selectedBill.itemname}</title>
        ${styles}
      </head>
      <body>
        <div class="bill-container">
          <div class="header">
            <h2>STOCK RECEIPT</h2>
            <p>Stock Management System</p>
            <p>Receipt No: INV-${selectedBill._id.slice(-8).toUpperCase()}</p>
          </div>
          
          <div class="bill-details">
            <div class="row">
              <span class="label">Date:</span> ${new Date(selectedBill.stockIndate).toLocaleString()}
            </div>
            <div class="row">
              <span class="label">Item Name:</span> ${selectedBill.itemname}
            </div>
            <div class="row">
              <span class="label">Description:</span> ${selectedBill.description || 'N/A'}
            </div>
            <div class="row">
              <span class="label">Quantity Received:</span> ${selectedBill.quantityIn} units
            </div>
            <div class="row">
              <span class="label">Supplier:</span> ${selectedBill.supplierName || 'N/A'}
            </div>
            <div class="row">
              <span class="label">Received By:</span> ${selectedBill.user_id?.user_name || 'N/A'}
            </div>
          </div>
          
          <div class="divider"></div>
          
          <div class="total">
            Total Items Received: ${selectedBill.quantityIn}
          </div>
          
          <div class="footer">
            <p>This is a computer-generated receipt</p>
            <p>Thank you for using SMS</p>
          </div>
          
          <div class="signature">
            <p>_________________</p>
            <p>Received by Signature</p>
          </div>
          
          <div class="no-print" style="text-align: center; margin-top: 20px;">
            <button onclick="window.print()" style="padding: 10px 20px; margin: 5px; cursor: pointer;">Print</button>
            <button onclick="window.close()" style="padding: 10px 20px; margin: 5px; cursor: pointer;">Close</button>
          </div>
        </div>
      </body>
      </html>
    `;

    printWindow.document.write(content);
    printWindow.document.close();
  };

  const exportToCSV = () => {
    const csvData = [
      ["Stock In Report"],
      [`Generated: ${new Date().toLocaleString()}`],
      [],
      ["Item Name", "Description", "Quantity", "Supplier", "Date", "Created By"],
      ...filteredStockIn.map(item => [
        item.itemname,
        item.description || "",
        item.quantityIn,
        item.supplierName || "",
        new Date(item.stockIndate).toLocaleDateString(),
        item.user_id?.user_name || "N/A",
      ]),
      [],
      ["Summary"],
      [`Total Items: ${filteredStockIn.length}`],
      [`Total Quantity: ${filteredStockIn.reduce((sum, item) => sum + item.quantityIn, 0)}`],
      [`Unique Suppliers: ${uniqueSuppliers.length}`]
    ];

    const csvContent = csvData.map(row => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `stock_in_report_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importFromCSV = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = async (e) => {
      const text = e.target.result;
      const rows = text.split('\n');
      
      for (let i = 1; i < rows.length; i++) {
        const values = rows[i].split(',');
        if (values.length >= 4 && values[0]) {
          const newStock = {
            itemname: values[0],
            description: values[1] || "",
            quantityIn: parseInt(values[2]) || 0,
            supplierName: values[3] || "",
            stockIndate: new Date().toISOString().slice(0, 16)
          };
          
          if (newStock.itemname && newStock.quantityIn > 0) {
            try {
              await api.post("/stockin", newStock);
            } catch (err) {
              console.error("Error importing item:", newStock.itemname, err);
            }
          }
        }
      }
      
      alert("Import completed!");
      fetchStockIn();
    };
    reader.readAsText(file);
  };

  const totalQuantity = filteredStockIn.reduce((sum, item) => sum + item.quantityIn, 0);

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Package /> Stock In Management
          </h1>
          <p className="text-gray-400">Manage incoming stock and generate receipts</p>
        </div>
        <div className="flex gap-2">
          <label className="bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded-lg flex items-center gap-2 cursor-pointer">
            <Upload size={20} /> Import CSV
            <input
              type="file"
              accept=".csv"
              onChange={importFromCSV}
              className="hidden"
            />
          </label>
          <button
            onClick={exportToCSV}
            className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg flex items-center gap-2"
          >
            <Download size={20} /> Export CSV
          </button>
          <button
            onClick={() => openModal()}
            className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg flex items-center gap-2"
          >
            <Plus size={20} /> Add Stock In
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-slate-800/50 p-4 rounded-xl mb-6">
        <div className="flex flex-wrap gap-4">
          {/* Search Bar */}
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search by item name, description, or supplier..."
                className="w-full pl-10 pr-4 py-2 bg-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Supplier Filter */}
          <div className="min-w-[150px]">
            <select
              className="w-full px-4 py-2 bg-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={supplierFilter}
              onChange={(e) => setSupplierFilter(e.target.value)}
            >
              <option value="all">All Suppliers</option>
              {uniqueSuppliers.map(supplier => (
                <option key={supplier} value={supplier}>{supplier}</option>
              ))}
            </select>
          </div>

          {/* Clear Filters */}
          {(searchTerm || supplierFilter !== "all") && (
            <button
              onClick={() => {
                setSearchTerm("");
                setSupplierFilter("all");
              }}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg transition"
            >
              Clear Filters
            </button>
          )}
        </div>
        
        {/* Filter Stats */}
        <div className="mt-3 text-sm text-gray-400">
          Showing {filteredStockIn.length} of {stockIn.length} items
          {searchTerm && ` • Search: "${searchTerm}"`}
          {supplierFilter !== "all" && ` • Supplier: ${supplierFilter}`}
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-slate-800 p-4 rounded-xl">
          <p className="text-gray-400 text-sm">Total Items</p>
          <p className="text-2xl font-bold text-blue-400">{filteredStockIn.length}</p>
        </div>
        <div className="bg-slate-800 p-4 rounded-xl">
          <p className="text-gray-400 text-sm">Total Quantity</p>
          <p className="text-2xl font-bold text-green-400">{totalQuantity}</p>
        </div>
        <div className="bg-slate-800 p-4 rounded-xl">
          <p className="text-gray-400 text-sm">Unique Suppliers</p>
          <p className="text-2xl font-bold text-yellow-400">{uniqueSuppliers.length}</p>
        </div>
      </div>

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
                  <th className="p-3 hidden md:table-cell">Description</th>
                  <th className="p-3">Quantity</th>
                  <th className="p-3 hidden lg:table-cell">Supplier</th>
                  <th className="p-3">Date</th>
                  <th className="p-3">Received By</th>
                  <th className="p-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredStockIn.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="text-center p-8 text-gray-400">
                      No stock in records found
                    </td>
                  </tr>
                ) : (
                  filteredStockIn.map((item) => (
                    <tr key={item._id} className="border-b border-slate-700 hover:bg-slate-700/50 transition">
                      <td className="p-3 font-medium">{item.itemname}</td>
                      <td className="p-3 hidden md:table-cell text-gray-300">
                        {item.description?.slice(0, 50) || "-"}
                        {item.description?.length > 50 && "..."}
                      </td>
                      <td className="p-3">
                        <span className="font-semibold">{item.quantityIn}</span>
                      </td>
                      <td className="p-3 hidden lg:table-cell">{item.supplierName || "-"}</td>
                      <td className="p-3">
                        {new Date(item.stockIndate).toLocaleDateString()}
                      </td>
                      <td className="p-3">
                        <span className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center text-xs font-bold">
                            {item.user_id?.user_name?.charAt(0).toUpperCase() || "?"}
                          </div>
                          <span className="text-sm">{item.user_id?.user_name || "Unknown"}</span>
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="flex gap-2">
                          <button
                            onClick={() => viewBill(item)}
                            className="text-green-400 hover:text-green-300 transition"
                            title="View Receipt"
                          >
                            <FileText size={18} />
                          </button>
                          <button
                            onClick={() => openModal(item)}
                            className="text-blue-400 hover:text-blue-300 transition"
                            title="Edit"
                          >
                            <Edit size={18} />
                          </button>
                          <button
                            onClick={() => handleDelete(item._id)}
                            className="text-red-400 hover:text-red-300 transition"
                            title="Delete"
                          >
                            <Trash2 size={18} />
                          </button>
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

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">
                {editingItem ? "Edit Stock In" : "Add Stock In"}
              </h2>
              <button onClick={closeModal} className="text-gray-400 hover:text-white">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-300">
                  Item Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g., steel bars, wheelbarrows, cement"
                  className="w-full p-2 bg-slate-700 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.itemname}
                  onChange={(e) => setFormData({ ...formData, itemname: e.target.value })}
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-300">
                  Description
                </label>
                <textarea
                  placeholder="Optional description"
                  className="w-full p-2 bg-slate-700 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows="3"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-300">
                  Quantity <span className="text-red-400">*</span>
                </label>
                <input
                  type="number"
                  placeholder="Enter quantity"
                  className="w-full p-2 bg-slate-700 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.quantityIn}
                  onChange={(e) => setFormData({ ...formData, quantityIn: parseInt(e.target.value) })}
                  required
                  min="1"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-300">
                  Supplier Name
                </label>
                <input
                  type="text"
                  placeholder="Supplier name"
                  className="w-full p-2 bg-slate-700 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.supplierName}
                  onChange={(e) => setFormData({ ...formData, supplierName: e.target.value })}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-300">
                  Date <span className="text-red-400">*</span>
                </label>
                <input
                  type="datetime-local"
                  className="w-full p-2 bg-slate-700 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.stockIndate}
                  onChange={(e) => setFormData({ ...formData, stockIndate: e.target.value })}
                  required
                />
              </div>
              
              {!editingItem && (
                <div className="bg-slate-700/50 p-3 rounded-lg">
                  <p className="text-sm text-gray-300">
                    <strong>Note:</strong> Stock will be recorded under your account ({localStorage.getItem("user") ? JSON.parse(localStorage.getItem("user")).user_name : "Current User"})
                  </p>
                </div>
              )}
              
              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 py-2 rounded-lg flex items-center justify-center gap-2 transition"
                >
                  <Save size={18} /> {editingItem ? "Update" : "Save"}
                </button>
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 bg-gray-600 hover:bg-gray-700 py-2 rounded-lg transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bill/Receipt Modal */}
      {showBillModal && selectedBill && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4 border-b pb-2">
              <h2 className="text-xl font-bold text-gray-800">Stock Receipt</h2>
              <button 
                onClick={() => setShowBillModal(false)} 
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="space-y-3">
              <div className="text-center border-b pb-3">
                <h3 className="text-lg font-bold text-gray-800">STOCK MANAGEMENT SYSTEM</h3>
                <p className="text-xs text-gray-600">Stock Receipt</p>
                <p className="text-xs text-gray-500">Receipt No: INV-{selectedBill._id.slice(-8).toUpperCase()}</p>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="font-semibold text-gray-700">Date:</span>
                  <span className="text-gray-600">{new Date(selectedBill.stockIndate).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold text-gray-700">Item Name:</span>
                  <span className="text-gray-600">{selectedBill.itemname}</span>
                </div>
                {selectedBill.description && (
                  <div className="flex justify-between">
                    <span className="font-semibold text-gray-700">Description:</span>
                    <span className="text-gray-600">{selectedBill.description}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="font-semibold text-gray-700">Quantity Received:</span>
                  <span className="text-gray-600 font-bold">{selectedBill.quantityIn} units</span>
                </div>
                {selectedBill.supplierName && (
                  <div className="flex justify-between">
                    <span className="font-semibold text-gray-700">Supplier:</span>
                    <span className="text-gray-600">{selectedBill.supplierName}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="font-semibold text-gray-700">Received By:</span>
                  <span className="text-gray-600">{selectedBill.user_id?.user_name || 'N/A'}</span>
                </div>
              </div>
              
              <div className="border-t border-dashed pt-3 mt-3">
                <div className="flex justify-between font-bold">
                  <span>Total Items Received:</span>
                  <span>{selectedBill.quantityIn}</span>
                </div>
              </div>
              
              <div className="text-center text-xs text-gray-500 pt-3 border-t">
                <p>This is a computer-generated receipt</p>
                <p>Thank you for using SMS</p>
              </div>
              
              <div className="text-center pt-4">
                <p className="text-xs text-gray-600">Received by Signature</p>
                <div className="border-t border-gray-300 w-32 mx-auto mt-1"></div>
              </div>
            </div>
            
            <div className="flex gap-2 mt-6">
              <button
                onClick={printBill}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg flex items-center justify-center gap-2"
              >
                <Printer size={18} /> Print Receipt
              </button>
              <button
                onClick={() => setShowBillModal(false)}
                className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-2 rounded-lg"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}