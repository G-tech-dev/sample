import { useEffect, useState } from "react";
import api from "../api";
import { Package, Plus, Edit, Trash2, Save, X } from "lucide-react";

export default function StockIn() {
  const [stockIn, setStockIn] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
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
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStockIn();
  }, []);

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
    if (window.confirm("Are you sure you want to delete this stock in entry?")) {
      try {
        await api.delete(`/stockin/${id}`);
        fetchStockIn();
      } catch (err) {
        console.log(err);
        alert(err.response?.data?.msg || "Error deleting stock in");
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

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Package /> Stock In Management
          </h1>
          <p className="text-gray-400">Manage incoming stock</p>
        </div>
        <button
          onClick={() => openModal()}
          className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg flex items-center gap-2"
        >
          <Plus size={20} /> Add Stock In
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
                <th className="p-3 hidden md:table-cell">Description</th>
                <th className="p-3">Quantity</th>
                <th className="p-3 hidden lg:table-cell">Supplier</th>
                <th className="p-3">Date</th>
                <th className="p-3">Created By</th>
                <th className="p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {stockIn.map((item) => (
                <tr key={item._id} className="border-b border-slate-700">
                  <td className="p-3 font-medium">{item.itemname}</td>
                  <td className="p-3 hidden md:table-cell text-gray-300">
                    {item.description?.slice(0, 50)}
                  </td>
                  <td className="p-3">{item.quantityIn}</td>
                  <td className="p-3 hidden lg:table-cell">{item.supplierName || "-"}</td>
                  <td className="p-3">
                    {new Date(item.stockIndate).toLocaleDateString()}
                  </td>
                  <td className="p-3">
                    <span className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center text-xs font-bold">
                        {item.user_id?.user_name?.charAt(0).toUpperCase() || "?"}
                      </div>
                      {item.user_id?.user_name || "Unknown"}
                    </span>
                  </td>
                  <td className="p-3">
                    <button
                      onClick={() => openModal(item)}
                      className="text-blue-400 hover:text-blue-300 mr-2"
                    >
                      <Edit size={18} />
                    </button>
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
          
          {stockIn.length === 0 && (
            <div className="text-center p-8 text-gray-400">
              No stock in records found
            </div>
          )}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">
                {editingItem ? "Edit Stock In" : "Add Stock In"}
              </h2>
              <button onClick={closeModal} className="text-gray-400 hover:text-white">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="text"
                placeholder="Item Name (e.g., steel bars, wheelbarrows, etc.)"
                className="w-full p-2 bg-slate-700 rounded"
                value={formData.itemname}
                onChange={(e) => setFormData({ ...formData, itemname: e.target.value })}
                required
              />
              <textarea
                placeholder="Description"
                className="w-full p-2 bg-slate-700 rounded"
                rows="3"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
              <input
                type="number"
                placeholder="Quantity"
                className="w-full p-2 bg-slate-700 rounded"
                value={formData.quantityIn}
                onChange={(e) => setFormData({ ...formData, quantityIn: parseInt(e.target.value) })}
                required
              />
              <input
                type="text"
                placeholder="Supplier Name"
                className="w-full p-2 bg-slate-700 rounded"
                value={formData.supplierName}
                onChange={(e) => setFormData({ ...formData, supplierName: e.target.value })}
              />
              <input
                type="datetime-local"
                className="w-full p-2 bg-slate-700 rounded"
                value={formData.stockIndate}
                onChange={(e) => setFormData({ ...formData, stockIndate: e.target.value })}
                required
              />
              
              {!editingItem && (
                <div className="bg-slate-700/50 p-3 rounded-lg">
                  <p className="text-sm text-gray-300">
                    <strong>Note:</strong> Stock will be recorded under your account ({localStorage.getItem("user") ? JSON.parse(localStorage.getItem("user")).user_name : "Current User"})
                  </p>
                </div>
              )}
              
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 py-2 rounded-lg flex items-center justify-center gap-2"
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
            </form>
          </div>
        </div>
      )}
    </div>
  );
}