import { useEffect, useState } from "react";
import api from "../api";
import { ArrowRightLeft, Plus, Trash2, Save, X } from "lucide-react";

export default function StockOut() {
  const [stockOut, setStockOut] = useState([]);
  const [stockInOptions, setStockInOptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
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
      await api.post("/stockout", formData);
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

  const closeModal = () => {
    setShowModal(false);
    setFormData({
      quantityout: "",
      stockin_id: "",
      stockoutDate: new Date().toISOString().slice(0, 16),
    });
  };

  // Get available quantity for selected item
  const getAvailableQuantity = () => {
    const selectedItem = stockInOptions.find(item => item._id === formData.stockin_id);
    if (!selectedItem) return 0;
    
    // Calculate total stock out for this item
    const totalOutForItem = stockOut
      .filter(out => out.stockin_id?._id === formData.stockin_id || out.stockin_id === formData.stockin_id)
      .reduce((sum, out) => sum + out.quantityout, 0);
    
    return selectedItem.quantityIn - totalOutForItem;
  };

  const availableQuantity = getAvailableQuantity();

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ArrowRightLeft /> Stock Out Management
          </h1>
          <p className="text-gray-400">Manage outgoing stock</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
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
                <tr key={item._id} className="border-b border-slate-700">
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
                    <button
                      onClick={() => handleDelete(item._id)}
                      className="text-red-400 hover:text-red-300"
                    >
                      <Trash2 size={18} />
                    </button>
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

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Add Stock Out</h2>
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
                >
                  <option value="">Select Item</option>
                  {stockInOptions.map((item) => {
                    // Calculate remaining stock for each item
                    const totalOutForItem = stockOut
                      .filter(out => out.stockin_id?._id === item._id || out.stockin_id === item._id)
                      .reduce((sum, out) => sum + out.quantityout, 0);
                    const remaining = item.quantityIn - totalOutForItem;
                    
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
                  <Save size={18} /> Save
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
    </div>
  );
}