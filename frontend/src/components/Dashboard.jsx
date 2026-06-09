import { useEffect, useState } from "react";
import api from "../api";
import {
  Package,
  ShoppingCart,
  TrendingUp,
  DollarSign,
  AlertTriangle,
} from "lucide-react";

export default function Dashboard() {
  const [items, setItems] = useState([]);
  const [sales, setSales] = useState([]);
  const [summary, setSummary] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [itemsRes, salesRes, summaryRes] = await Promise.all([
        api.get("/items"),
        api.get("/sales"),
        api.get("/stock/summary"),
      ]);
      setItems(itemsRes.data);
      setSales(salesRes.data);
      setSummary(summaryRes.data);
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const totalItems = items.length;
  const totalStockValue = items.reduce((sum, item) => sum + (item.Quantity * item.UnitPrice), 0);
  const totalSales = sales.length;
  const totalRevenue = sales.reduce((sum, sale) => sum + sale.TotalPrice, 0);
  const lowStockItems = summary.filter(item => item.CurrentQuantity < 10);

  return (
    <div className="p-6 text-white">
      <div className="mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <TrendingUp /> SRMS Dashboard
        </h1>
        <p className="text-gray-400">Sales Records Management System Overview</p>
      </div>

      {loading && <p className="text-gray-400">Loading dashboard...</p>}

      {!loading && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-800 p-5 rounded-xl shadow">
              <div className="flex items-center justify-between">
                <Package className="text-blue-400" size={24} />
                <span className="text-2xl font-bold">{totalItems}</span>
              </div>
              <p className="text-gray-400 mt-2">Total Products</p>
            </div>

            <div className="bg-slate-800 p-5 rounded-xl shadow">
              <div className="flex items-center justify-between">
                <ShoppingCart className="text-green-400" size={24} />
                <span className="text-2xl font-bold">{totalSales}</span>
              </div>
              <p className="text-gray-400 mt-2">Total Sales</p>
            </div>

            <div className="bg-slate-800 p-5 rounded-xl shadow">
              <div className="flex items-center justify-between">
                <DollarSign className="text-yellow-400" size={24} />
                <span className="text-2xl font-bold">{totalRevenue.toLocaleString()}</span>
              </div>
              <p className="text-gray-400 mt-2">Total Revenue (RWF)</p>
            </div>

            <div className="bg-slate-800 p-5 rounded-xl shadow">
              <div className="flex items-center justify-between">
                <AlertTriangle className="text-red-400" size={24} />
                <span className="text-2xl font-bold">{lowStockItems.length}</span>
              </div>
              <p className="text-gray-400 mt-2">Low Stock Items</p>
            </div>
          </div>

          {lowStockItems.length > 0 && (
            <div className="mt-8 bg-red-900/30 border border-red-500 p-5 rounded-xl">
              <h2 className="text-xl font-bold mb-4 text-red-300 flex items-center gap-2">
                <AlertTriangle /> Low Stock Alert
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-red-800/50">
                    <tr>
                      <th className="p-2">Item Name</th>
                      <th className="p-2">Specification</th>
                      <th className="p-2">Current Stock</th>
                      <th className="p-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lowStockItems.map((item, index) => (
                      <tr key={index} className="border-b border-red-800/50">
                        <td className="p-2">{item.ItemName}</td>
                        <td className="p-2">{item.Specification || "-"}</td>
                        <td className="p-2 font-bold">{item.CurrentQuantity}</td>
                        <td className="p-2">
                          <span className={`px-2 py-1 rounded text-sm ${
                            item.CurrentQuantity === 0 ? "bg-red-600" : "bg-yellow-600"
                          }`}>
                            {item.CurrentQuantity === 0 ? "Out of Stock" : "Low Stock"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="mt-8 bg-slate-800 p-5 rounded-xl">
            <h2 className="text-xl font-bold mb-4">Recent Sales</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-700">
                  <tr>
                    <th className="p-2">Date</th>
                    <th className="p-2">Customer</th>
                    <th className="p-2">Total (RWF)</th>
                  </tr>
                </thead>
                <tbody>
                  {sales.slice(0, 5).map((sale) => (
                    <tr key={sale._id} className="border-b border-slate-700">
                      <td className="p-2">{new Date(sale.SaleDate).toLocaleDateString()}</td>
                      <td className="p-2">{sale.CustomerName}</td>
                      <td className="p-2">{sale.TotalPrice.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}