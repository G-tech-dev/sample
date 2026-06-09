import { useEffect, useState } from "react";
import api from "../api";
import { Plus, Edit, Trash2, Search } from "lucide-react";

export default function Items() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [formData, setFormData] = useState({
    ItemName: "",
    Specification: "",
    UnitMeasure: "",
    Quantity: 0,
    UnitPrice: 0,
    TotalQuantity: 0
  });

  const fetchItems = async () => {
    try {
      const res = await api.get("/items");
      setItems(res.data);
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingItem) {
        await api.put(`/items/${editingItem._id}`, formData);
      } else {
        await api.post("/items", formData);
      }
      fetchItems();
      setShowModal(false);
      resetForm();
    } catch (err) {
      console.log(err);
      alert(err.response?.data?.msg || "Error saving item");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this item?")) {
      try {
        await api.delete(`/items/${id}`);
        fetchItems();
      } catch (err) {
        alert(err.response?.data?.msg || "Error deleting item");
      }
    }
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData({
      ItemName: item.ItemName,
      Specification: item.Specification || "",
      UnitMeasure: item.UnitMeasure || "",
      Quantity: item.Quantity,
      UnitPrice: item.UnitPrice,
      TotalQuantity: item.TotalQuantity
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setEditingItem(null);
    setFormData({
      ItemName: "",
      Specification: "",
      UnitMeasure: "",
      Quantity: 0,
      UnitPrice: 0,
      TotalQuantity: 0
    });
  };

  const filteredItems = items.filter(item =>
    item.ItemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.Specification?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Items Management</h1>
          <p className="text-gray-400">Manage your product inventory</p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
          className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg flex items-center gap-2"
        >
          <Plus size={20} /> Add Item
        </button>
      </div>

      <div className="mb-4 flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search items by name or specification..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-800 text-white pl-10 pr-4 py-2 rounded-lg border border-slate-700 focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {loading ? (
        <p className="text-gray-400">Loading items...</p>
      ) : (
        <div className="bg-slate-800 rounded-xl overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-slate-700">
              <tr>
                <th className="p-3">Item Name</th>
                <th className="p-3">Specification</th>
                <th className="p-3">Unit Measure</th>
                <th className="p-3">Quantity</th>
                <th className="p-3">Unit Price (RWF)</th>
                <th className="p-3">Total Value</th>
                <th className="p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((item) => (
                <tr key={item._id} className="border-b border-slate-700">
                  <td className="p-3 font-medium">{item.ItemName}</td>
                  <td className="p-3">{item.Specification || "-"}</td>
                  <td className="p-3">{item.UnitMeasure || "-"}</td>
                  <td className="p-3">{item.Quantity}</td>
                  <td className="p-3">{item.UnitPrice.toLocaleString()}</td>
                  <td className="p-3">{(item.Quantity * item.UnitPrice).toLocaleString()}</td>
                  <td className="p-3">
                    <button
                      onClick={() => handleEdit(item)}
                      className="text-blue-400 hover:text-blue-300 mr-3"
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
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-xl p-6 w-full max-w-md">
            <h2 className="text-2xl font-bold mb-4">
              {editingItem ? "Edit Item" : "Add New Item"}
            </h2>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Item Name"
                  value={formData.ItemName}
                  onChange={(e) => setFormData({ ...formData, ItemName: e.target.value })}
                  className="w-full bg-slate-700 text-white px-4 py-2 rounded-lg"
                  required
                />
                <input
                  type="text"
                  placeholder="Specification"
                  value={formData.Specification}
                  onChange={(e) => setFormData({ ...formData, Specification: e.target.value })}
                  className="w-full bg-slate-700 text-white px-4 py-2 rounded-lg"
                />
                <input
                  type="text"
                  placeholder="Unit Measure (e.g., pcs, kg, m)"
                  value={formData.UnitMeasure}
                  onChange={(e) => setFormData({ ...formData, UnitMeasure: e.target.value })}
                  className="w-full bg-slate-700 text-white px-4 py-2 rounded-lg"
                />
                <input
                  type="number"
                  placeholder="Initial Quantity"
                  value={formData.Quantity}
                  onChange={(e) => setFormData({ ...formData, Quantity: parseInt(e.target.value) })}
                  className="w-full bg-slate-700 text-white px-4 py-2 rounded-lg"
                />
                <input
                  type="number"
                  placeholder="Unit Price (RWF)"
                  value={formData.UnitPrice}
                  onChange={(e) => setFormData({ ...formData, UnitPrice: parseInt(e.target.value) })}
                  className="w-full bg-slate-700 text-white px-4 py-2 rounded-lg"
                  required
                />
              </div>
              <div className="flex gap-3 mt-6">
                <button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700 py-2 rounded-lg">
                  {editingItem ? "Update" : "Save"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
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