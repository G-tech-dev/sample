import { useEffect, useState } from "react";
import api from "../api";
import {
  Package,
  ArrowRightLeft,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";

export default function Dashboard() {
  // ===================== STATE =====================
  const [stockIn, setStockIn] = useState([]);
  const [stockOut, setStockOut] = useState([]);
  const [summary, setSummary] = useState([]);
  const [loading, setLoading] = useState(true);

  // ===================== FETCH DATA =====================
  const fetchData = async () => {
    try {
      setLoading(true);

      const [stockInRes, stockOutRes, summaryRes] = await Promise.all([
        api.get("/stockin"),
        api.get("/stockout"),
        api.get("/stock/summary"),
      ]);

      setStockIn(stockInRes.data);
      setStockOut(stockOutRes.data);
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

  // ===================== STATS =====================
  const totalStockInQuantity = stockIn.reduce((sum, item) => sum + item.quantityIn, 0);
  const totalStockOutQuantity = stockOut.reduce((sum, item) => sum + item.quantityout, 0);
  const totalCurrentStock = summary.reduce((sum, item) => sum + item.currentStock, 0);
  
  const lowStockItems = summary.filter(item => item.currentStock < 10);
  const outOfStockItems = summary.filter(item => item.currentStock === 0);

  // ===================== UI =====================
  return (
    <div className="p-6 text-white">

      {/* HEADER */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <TrendingUp /> SMS Dashboard
        </h1>
        <p className="text-gray-400">
          Stock Management System Overview
        </p>
      </div>

      {/* LOADING */}
      {loading && (
        <p className="text-gray-400">Loading dashboard...</p>
      )}

      {/* STATS CARDS */}
      {!loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">

          {/* TOTAL STOCK IN */}
          <div className="bg-slate-800 p-5 rounded-xl shadow">
            <div className="flex items-center justify-between">
              <Package className="text-blue-400" size={24} />
              <span className="text-2xl font-bold">{totalStockInQuantity}</span>
            </div>
            <p className="text-gray-400 mt-2">Total Stock In</p>
          </div>

          {/* TOTAL STOCK OUT */}
          <div className="bg-slate-800 p-5 rounded-xl shadow">
            <div className="flex items-center justify-between">
              <ArrowRightLeft className="text-yellow-400" size={24} />
              <span className="text-2xl font-bold">{totalStockOutQuantity}</span>
            </div>
            <p className="text-gray-400 mt-2">Total Stock Out</p>
          </div>

          {/* CURRENT STOCK */}
          <div className="bg-slate-800 p-5 rounded-xl shadow">
            <div className="flex items-center justify-between">
              <CheckCircle className="text-green-400" size={24} />
              <span className="text-2xl font-bold">{totalCurrentStock}</span>
            </div>
            <p className="text-gray-400 mt-2">Current Stock</p>
          </div>

          {/* LOW STOCK ALERT */}
          <div className="bg-slate-800 p-5 rounded-xl shadow">
            <div className="flex items-center justify-between">
              <AlertTriangle className="text-red-400" size={24} />
              <span className="text-2xl font-bold">{lowStockItems.length}</span>
            </div>
            <p className="text-gray-400 mt-2">Low Stock Items</p>
          </div>

        </div>
      )}

      {/* LOW STOCK ITEMS */}
      {!loading && lowStockItems.length > 0 && (
        <div className="mt-8 bg-red-900/30 border border-red-500 p-5 rounded-xl">
          <h2 className="text-xl font-bold mb-4 text-red-300 flex items-center gap-2">
            <AlertTriangle /> Low Stock Alert
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-red-800/50">
                <tr>
                  <th className="p-2">Item Name</th>
                  <th className="p-2">Current Stock</th>
                  <th className="p-2">Supplier</th>
                  <th className="p-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {lowStockItems.map((item, index) => (
                  <tr key={index} className="border-b border-red-800/50">
                    <td className="p-2">{item.itemname}</td>
                    <td className="p-2 font-bold">{item.currentStock}</td>
                    <td className="p-2">{item.supplierName}</td>
                    <td className="p-2">
                      <span className={`px-2 py-1 rounded text-sm ${
                        item.currentStock === 0 ? "bg-red-600" : "bg-yellow-600"
                      }`}>
                        {item.currentStock === 0 ? "Out of Stock" : "Low Stock"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* RECENT STOCK IN ACTIVITY */}
      {!loading && (
        <div className="mt-8 bg-slate-800 p-5 rounded-xl">
          <h2 className="text-xl font-bold mb-4">
            Recent Stock In
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-700">
                <tr>
                  <th className="p-2">Item Name</th>
                  <th className="p-2">Quantity</th>
                  <th className="p-2">Supplier</th>
                  <th className="p-2">Date</th>
                </tr>
              </thead>
              <tbody>
                {stockIn.slice(0, 5).map((item) => (
                  <tr key={item._id} className="border-b border-slate-700">
                    <td className="p-2">{item.itemname}</td>
                    <td className="p-2">{item.quantityIn}</td>
                    <td className="p-2">{item.supplierName}</td>
                    <td className="p-2">
                      {new Date(item.stockIndate).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
}