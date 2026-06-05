import { useEffect, useState } from "react";
import api from "../api";
import { ArrowRightLeft, Plus, Edit, Trash2, Save, X, FileText, Printer, Eye } from "lucide-react";

export default function StockOut() {
  const [stockOut, setStockOut] = useState([]);
  const [stockInOptions, setStockInOptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [showBillModal, setShowBillModal] = useState(false);
  const [selectedBill, setSelectedBill] = useState(null);
  const [formData, setFormData] = useState({
    quantityout: "",
    stockin_id: "",
    stockoutDate: new Date().toISOString().slice(0, 16),
  });

  const fetchData = async () => {
    try {
      const [stockOutRes, stockInRes] = await Promise.all([
        api.get("/stockout"),
        api.get("/stockin"),
      ]);
      setStockOut(stockOutRes.data);
      setStockInOptions(stockInRes.data);
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingItem) {
        await api.put(`/stockout/${editingItem._id}`, formData);
      } else {
        await api.post("/stockout", formData);
      }
      fetchData();
      closeModal();
    } catch (err) {
      console.log(err);
      alert(err.response?.data?.msg || "Error saving stock out");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this stock out entry?")) {
      try {
        await api.delete(`/stockout/${id}`);
        fetchData();
      } catch (err) {
        console.log(err);
        alert("Error deleting stock out");
      }
    }
  };

  const openModal = (item = null) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        quantityout: item.quantityout,
        stockin_id: item.stockin_id?._id || item.stockin_id,
        stockoutDate: item.stockoutDate ? new Date(item.stockoutDate).toISOString().slice(0, 16) : new Date().toISOString().slice(0, 16),
      });
    } else {
      setEditingItem(null);
      setFormData({
        quantityout: "",
        stockin_id: "",
        stockoutDate: new Date().toISOString().slice(0, 16),
      });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingItem(null);
    setFormData({
      quantityout: "",
      stockin_id: "",
      stockoutDate: new Date().toISOString().slice(0, 16),
    });
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
        }
        .header p {
          margin: 5px 0;
          font-size: 12px;
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
        <title>Stock Issue Receipt</title>
        ${styles}
      </head>
      <body>
        <div class="bill-container">
          <div class="header">
            <h2>STOCK ISSUE RECEIPT</h2>
            <p>Stock Management System</p>
            <p>Receipt No: ${selectedBill._id.slice(-8).toUpperCase()}</p>
          </div>
          
          <div class="bill-details">
            <div class="row">
              <span class="label">Date:</span> ${new Date(selectedBill.stockoutDate).toLocaleString()}
            </div>
            <div class="row">
              <span class="label">Item Name:</span> ${selectedBill.stockin_id?.itemname || 'N/A'}
            </div>
            <div class="row">
              <span class="label">Description:</span> ${selectedBill.stockin_id?.description || 'N/A'}
            </div>
            <div class="row">
              <span class="label">Quantity Issued:</span> ${selectedBill.quantityout} units
            </div>
            <div class="row">
              <span class="label">Supplier:</span> ${selectedBill.stockin_id?.supplierName || 'N/A'}
            </div>
            <div class="row">
              <span class="label">Issued By:</span> ${selectedBill.user_id?.user_name || 'N/A'}
            </div>
          </div>
          
          <div class="divider"></div>
          
          <div class="row">
            <strong>Total Items Issued: ${selectedBill.quantityout}</strong>
          </div>
          
          <div class="footer">
            <p>This is a computer-generated receipt</p>
            <p>Thank you for using SMS</p>
          </div>
          
          <div class="signature">
            <p>_________________</p>
            <p>Authorized Signature</p>
          </div>
          
          <div class="no-print" style="text-align: center; margin-top: 20px;">
            <button onclick="window.print()" style="padding: 10px 20px; margin: 5px;">Print</button>
            <button onclick="window.close()" style="padding: 10px 20px; margin: 5px;">Close</button>
          </div>
        </div>
      </body>
      </html>
    `;

    printWindow.document.write(content);
    printWindow.document.close();
  };

  // Get available quantity for selected item
  const getAvailableQuantity = () => {
    const selectedItem = stockInOptions.find(item => item._id === formData.stockin_id);
    if (!selectedItem) return 0;
    
    // Calculate total stock out for this item
    const totalOutForItem = stockOut
      .filter(out => {
        const stockInId = out.stockin_id?._id || out.stockin_id;
        return stockInId === formData.stockin_id;
      })
      .reduce((sum, out) => sum + out.quantityout, 0);
    
    // If editing, subtract the current item's quantity from total out
    const currentQuantity = editingItem ? editingItem.quantityout : 0;
    const netOut = totalOutForItem - currentQuantity;
    
    return selectedItem.quantityIn - netOut;
  };

  const availableQuantity = getAvailableQuantity();

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ArrowRightLeft /> Stock Out Management
          </h1>
          <p className="text-gray-400">Manage outgoing stock and generate receipts</p>
        </div>
        <button
          onClick={() => openModal()}
          className="bg-yellow-600 hover:bg-yellow-700 px-4 py-2 rounded-lg flex items-center gap-2"
        >
          <Plus size={20} /> Add Stock Out
        </button>
      </div>

      {loading ? (
        <p className="text-gray-400">Loading...</p>
      ) : (
        <div className="bg-slate-800 rounded-xl overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-slate-700">
              <tr>
                <th className="p-3">Item Name</th>
                <th className="p-3">Quantity Out</th>
                <th className="p-3 hidden md:table-cell">Date</th>
                <th className="p-3">Issued By</th>
                <th className="p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {stockOut.map((item) => (
                <tr key={item._id} className="border-b border-slate-700 hover:bg-slate-700/50 transition">
                  <td className="p-3 font-medium">
                    {item.stockin_id?.itemname || "N/A"}
                  </td>
                  <td className="p-3">{item.quantityout}</td>
                  <td className="p-3 hidden md:table-cell">
                    {new Date(item.stockoutDate).toLocaleDateString()}
                  </td>
                  <td className="p-3">
                    <span className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-xs font-bold">
                        {item.user_id?.user_name?.charAt(0).toUpperCase() || "?"}
                      </div>
                      {item.user_id?.user_name || "Unknown User"}
                    </span>
                  </td>
                  <td className="p-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => viewBill(item)}
                        className="text-green-400 hover:text-green-300"
                        title="View Receipt"
                      >
                        <FileText size={18} />
                      </button>
                      <button
                        onClick={() => openModal(item)}
                        className="text-blue-400 hover:text-blue-300"
                        title="Edit"
                      >
                        <Edit size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(item._id)}
                        className="text-red-400 hover:text-red-300"
                        title="Delete"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {stockOut.length === 0 && (
            <div className="text-center p-8 text-gray-400">
              No stock out records found
            </div>
          )}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">
                {editingItem ? "Edit Stock Out" : "Add Stock Out"}
              </h2>
              <button onClick={closeModal} className="text-gray-400 hover:text-white">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <select
                  className="w-full p-2 bg-slate-700 rounded"
                  value={formData.stockin_id}
                  onChange={(e) => setFormData({ ...formData, stockin_id: e.target.value })}
                  required
                  disabled={editingItem}
                >
                  <option value="">Select Item</option>
                  {stockInOptions.map((item) => {
                    // Calculate remaining stock for each item
                    const totalOutForItem = stockOut
                      .filter(out => {
                        const stockInId = out.stockin_id?._id || out.stockin_id;
                        return stockInId === item._id;
                      })
                      .reduce((sum, out) => sum + out.quantityout, 0);
                    const currentQuantity = editingItem && editingItem.stockin_id?._id === item._id ? editingItem.quantityout : 0;
                    const remaining = item.quantityIn - (totalOutForItem - currentQuantity);
                    
                    return (
                      <option key={item._id} value={item._id}>
                        {item.itemname} - Available: {remaining} {remaining > 0 ? "units" : "(Out of Stock)"}
                      </option>
                    );
                  })}
                </select>
                {formData.stockin_id && (
                  <p className="text-sm text-gray-400 mt-1">
                    Available quantity: {availableQuantity} units
                  </p>
                )}
              </div>
              
              <input
                type="number"
                placeholder="Quantity to Remove"
                className="w-full p-2 bg-slate-700 rounded"
                value={formData.quantityout}
                onChange={(e) => setFormData({ ...formData, quantityout: parseInt(e.target.value) })}
                required
                max={availableQuantity}
              />
              
              <input
                type="datetime-local"
                className="w-full p-2 bg-slate-700 rounded"
                value={formData.stockoutDate}
                onChange={(e) => setFormData({ ...formData, stockoutDate: e.target.value })}
                required
              />
              
              <div className="bg-slate-700/50 p-3 rounded-lg">
                <p className="text-sm text-gray-300">
                  <strong>Note:</strong> Stock will be issued under your account ({localStorage.getItem("user") ? JSON.parse(localStorage.getItem("user")).user_name : "Current User"})
                </p>
              </div>
              
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={formData.quantityout > availableQuantity || !formData.quantityout}
                  className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-2 ${
                    formData.quantityout > availableQuantity || !formData.quantityout
                      ? "bg-gray-600 cursor-not-allowed"
                      : "bg-yellow-600 hover:bg-yellow-700"
                  }`}
                >
                  <Save size={18} /> {editingItem ? "Update" : "Save"}
                </button>
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 bg-gray-600 hover:bg-gray-700 py-2 rounded-lg"
                >
                  Cancel
                </button>
              </div>
              
              {formData.quantityout > availableQuantity && availableQuantity > 0 && (
                <p className="text-red-400 text-sm text-center">
                  Cannot issue more than available quantity ({availableQuantity} units)
                </p>
              )}
            </form>
          </div>
        </div>
      )}

      {/* Bill/Receipt Modal */}
      {showBillModal && selectedBill && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4 border-b pb-2">
              <h2 className="text-xl font-bold text-gray-800">Stock Issue Receipt</h2>
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
                <p className="text-xs text-gray-600">Stock Issue Receipt</p>
                <p className="text-xs text-gray-500">Receipt No: {selectedBill._id.slice(-8).toUpperCase()}</p>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="font-semibold text-gray-700">Date:</span>
                  <span className="text-gray-600">{new Date(selectedBill.stockoutDate).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold text-gray-700">Item Name:</span>
                  <span className="text-gray-600">{selectedBill.stockin_id?.itemname || 'N/A'}</span>
                </div>
                {selectedBill.stockin_id?.description && (
                  <div className="flex justify-between">
                    <span className="font-semibold text-gray-700">Description:</span>
                    <span className="text-gray-600">{selectedBill.stockin_id.description}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="font-semibold text-gray-700">Quantity Issued:</span>
                  <span className="text-gray-600 font-bold">{selectedBill.quantityout} units</span>
                </div>
                {selectedBill.stockin_id?.supplierName && (
                  <div className="flex justify-between">
                    <span className="font-semibold text-gray-700">Supplier:</span>
                    <span className="text-gray-600">{selectedBill.stockin_id.supplierName}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="font-semibold text-gray-700">Issued By:</span>
                  <span className="text-gray-600">{selectedBill.user_id?.user_name || 'N/A'}</span>
                </div>
              </div>
              
              <div className="border-t border-dashed pt-3 mt-3">
                <div className="flex justify-between font-bold">
                  <span>Total Items Issued:</span>
                  <span>{selectedBill.quantityout}</span>
                </div>
              </div>
              
              <div className="text-center text-xs text-gray-500 pt-3 border-t">
                <p>This is a computer-generated receipt</p>
                <p>Thank you for using SMS</p>
              </div>
              
              <div className="text-center pt-4">
                <p className="text-xs text-gray-600">Authorized Signature</p>
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