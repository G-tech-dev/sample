import { useEffect, useState } from "react";
import api from "../api";
import { Plus, Trash2, Printer } from "lucide-react";

export default function Sales() {
  const [sales, setSales] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedSale, setSelectedSale] = useState(null);
  const [cart, setCart] = useState([]);
  const [customerName, setCustomerName] = useState("");
  const [selectedItem, setSelectedItem] = useState("");
  const [quantity, setQuantity] = useState(1);

  const fetchData = async () => {
    try {
      const [salesRes, itemsRes] = await Promise.all([
        api.get("/sales"),
        api.get("/items")
      ]);
      setSales(salesRes.data);
      setItems(itemsRes.data);
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const addToCart = () => {
    if (!selectedItem || quantity <= 0) return;
    
    const item = items.find(i => i._id === selectedItem);
    if (!item) return;
    
    if (quantity > item.Quantity) {
      alert(`Insufficient stock! Available: ${item.Quantity}`);
      return;
    }
    
    const existingItem = cart.find(c => c.item_id === selectedItem);
    if (existingItem) {
      if (existingItem.QuantitySold + quantity > item.Quantity) {
        alert(`Insufficient stock! Available: ${item.Quantity}`);
        return;
      }
      setCart(cart.map(c => 
        c.item_id === selectedItem 
          ? { ...c, QuantitySold: c.QuantitySold + quantity, SubTotalPrice: (c.QuantitySold + quantity) * item.UnitPrice }
          : c
      ));
    } else {
      setCart([...cart, {
        item_id: item._id,
        ItemName: item.ItemName,
        QuantitySold: quantity,
        UnitPrice: item.UnitPrice,
        SubTotalPrice: quantity * item.UnitPrice
      }]);
    }
    
    setSelectedItem("");
    setQuantity(1);
  };

  const removeFromCart = (index) => {
    setCart(cart.filter((_, i) => i !== index));
  };

  const handleSubmitSale = async () => {
    if (!customerName.trim()) {
      alert("Please enter customer name");
      return;
    }
    if (cart.length === 0) {
      alert("Please add items to the sale");
      return;
    }
    
    try {
      await api.post("/sales", {
        CustomerName: customerName,
        items: cart.map(item => ({
          item_id: item.item_id,
          QuantitySold: item.QuantitySold
        }))
      });
      
      setShowModal(false);
      setCart([]);
      setCustomerName("");
      fetchData();
      alert("Sale completed successfully!");
    } catch (err) {
      alert(err.response?.data?.msg || "Error processing sale");
    }
  };

  const viewSaleDetails = async (saleId) => {
    try {
      const res = await api.get(`/sales/${saleId}`);
      setSelectedSale(res.data);
    } catch (err) {
      console.log(err);
    }
  };

  const totalAmount = cart.reduce((sum, item) => sum + item.SubTotalPrice, 0);

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Sales Management</h1>
          <p className="text-gray-400">Record and manage sales transactions</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg flex items-center gap-2"
        >
          <Plus size={20} /> New Sale
        </button>
      </div>

      {loading ? (
        <p className="text-gray-400">Loading sales...</p>
      ) : (
        <div className="bg-slate-800 rounded-xl overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-slate-700">
              <tr>
                <th className="p-3">Date</th>
                <th className="p-3">Customer Name</th>
                <th className="p-3">Total Price (RWF)</th>
                <th className="p-3">Recorded By</th>
                <th className="p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sales.map((sale) => (
                <tr key={sale._id} className="border-b border-slate-700">
                  <td className="p-3">{new Date(sale.SaleDate).toLocaleDateString()}</td>
                  <td className="p-3 font-medium">{sale.CustomerName}</td>
                  <td className="p-3">{sale.TotalPrice.toLocaleString()} RWF</td>
                  <td className="p-3">{sale.user_id?.UserName || "-"}</td>
                  <td className="p-3">
                    <button
                      onClick={() => viewSaleDetails(sale._id)}
                      className="text-blue-400 hover:text-blue-300"
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selectedSale && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-xl p-6 w-full max-w-2xl">
            <h2 className="text-2xl font-bold mb-4">Sale Details</h2>
            <p><strong>Customer:</strong> {selectedSale.sale.CustomerName}</p>
            <p><strong>Date:</strong> {new Date(selectedSale.sale.SaleDate).toLocaleString()}</p>
            <p><strong>Total:</strong> {selectedSale.sale.TotalPrice.toLocaleString()} RWF</p>
            
            <h3 className="text-xl font-bold mt-4 mb-2">Items Sold</h3>
            <table className="w-full text-left">
              <thead className="bg-slate-700">
                <tr>
                  <th className="p-2">Item</th>
                  <th className="p-2">Quantity</th>
                  <th className="p-2">Unit Price</th>
                  <th className="p-2">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {selectedSale.details.map((detail, idx) => (
                  <tr key={idx} className="border-b border-slate-700">
                    <td className="p-2">{detail.ItemName}</td>
                    <td className="p-2">{detail.QuantitySold}</td>
                    <td className="p-2">{detail.UnitPriceAtSale.toLocaleString()}</td>
                    <td className="p-2">{detail.SubTotalPrice.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            <button
              onClick={() => setSelectedSale(null)}
              className="mt-4 bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded-lg"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-y-auto">
          <div className="bg-slate-800 rounded-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">New Sale Transaction</h2>
            
            <div className="mb-4">
              <label className="block mb-2">Customer Name</label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full bg-slate-700 text-white px-4 py-2 rounded-lg"
                required
              />
            </div>
            
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block mb-2">Select Item</label>
                <select
                  value={selectedItem}
                  onChange={(e) => setSelectedItem(e.target.value)}
                  className="w-full bg-slate-700 text-white px-4 py-2 rounded-lg"
                >
                  <option value="">Choose an item...</option>
                  {items.filter(i => i.Quantity > 0).map(item => (
                    <option key={item._id} value={item._id}>
                      {item.ItemName} - {item.UnitPrice.toLocaleString()} RWF (Stock: {item.Quantity})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block mb-2">Quantity</label>
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value))}
                  min="1"
                  className="w-full bg-slate-700 text-white px-4 py-2 rounded-lg"
                />
              </div>
              <div className="flex items-end">
                <button
                  onClick={addToCart}
                  className="w-full bg-green-600 hover:bg-green-700 py-2 rounded-lg"
                >
                  Add to Cart
                </button>
              </div>
            </div>
            
            <div className="mb-4">
              <h3 className="text-xl font-bold mb-2">Shopping Cart</h3>
              <table className="w-full text-left">
                <thead className="bg-slate-700">
                  <tr>
                    <th className="p-2">Item</th>
                    <th className="p-2">Quantity</th>
                    <th className="p-2">Unit Price</th>
                    <th className="p-2">Subtotal</th>
                    <th className="p-2">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {cart.map((item, idx) => (
                    <tr key={idx} className="border-b border-slate-700">
                      <td className="p-2">{item.ItemName}</td>
                      <td className="p-2">{item.QuantitySold}</td>
                      <td className="p-2">{item.UnitPrice.toLocaleString()}</td>
                      <td className="p-2">{item.SubTotalPrice.toLocaleString()}</td>
                      <td className="p-2">
                        <button onClick={() => removeFromCart(idx)} className="text-red-400">
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-slate-700">
                  <tr>
                    <td colSpan="3" className="p-2 text-right font-bold">Total:</td>
                    <td className="p-2 font-bold">{totalAmount.toLocaleString()} RWF</td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={handleSubmitSale}
                className="flex-1 bg-blue-600 hover:bg-blue-700 py-2 rounded-lg"
              >
                Complete Sale
              </button>
              <button
                onClick={() => {
                  setShowModal(false);
                  setCart([]);
                  setCustomerName("");
                }}
                className="flex-1 bg-gray-600 hover:bg-gray-700 py-2 rounded-lg"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}