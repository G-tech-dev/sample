import { useEffect, useState } from "react";
import api from "../api";
import { BarChart3, Package, AlertTriangle, TrendingDown, Search, Download, Filter } from "lucide-react";

export default function StockSummary() {
  const [summary, setSummary] = useState([]);
  const [filteredSummary, setFilteredSummary] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [supplierFilter, setSupplierFilter] = useState("all");
  const [uniqueSuppliers, setUniqueSuppliers] = useState([]);

  const fetchSummary = async () => {
    try {
      const res = await api.get("/stock/summary");
      setSummary(res.data);
      setFilteredSummary(res.data);
      
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
    fetchSummary();
  }, []);

  // Apply filters whenever search term, status filter, or supplier filter changes
  useEffect(() => {
    let filtered = [...summary];
    
    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(item => 
        item.itemname.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.description && item.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item.supplierName && item.supplierName.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    
    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(item => {
        if (statusFilter === "instock") return item.currentStock >= 10;
        if (statusFilter === "lowstock") return item.currentStock < 10 && item.currentStock > 0;
        if (statusFilter === "outofstock") return item.currentStock === 0;
        return true;
      });
    }
    
    // Supplier filter
    if (supplierFilter !== "all") {
      filtered = filtered.filter(item => item.supplierName === supplierFilter);
    }
    
    setFilteredSummary(filtered);
  }, [searchTerm, statusFilter, supplierFilter, summary]);

  const totalStock = filteredSummary.reduce((sum, item) => sum + item.currentStock, 0);
  const lowStockCount = filteredSummary.filter((item) => item.currentStock < 10 && item.currentStock > 0).length;
  const outOfStockCount = filteredSummary.filter((item) => item.currentStock === 0).length;
  const totalItems = filteredSummary.length;
  const totalReceived = filteredSummary.reduce((sum, item) => sum + item.totalReceived, 0);
  const totalIssued = filteredSummary.reduce((sum, item) => sum + item.totalIssued, 0);

  const exportToCSV = () => {
    const csvData = [
      ["Stock Summary Report"],
      [`Generated: ${new Date().toLocaleString()}`],
      [],
      ["Item Name", "Description", "Total Received", "Total Issued", "Current Stock", "Supplier", "Status"],
      ...filteredSummary.map(item => [
        item.itemname,
        item.description || "",
        item.totalReceived,
        item.totalIssued,
        item.currentStock,
        item.supplierName || "",
        item.currentStock === 0 ? "Out of Stock" : item.currentStock < 10 ? "Low Stock" : "In Stock"
      ]),
      [],
      ["Summary Statistics"],
      [`Total Items: ${totalItems}`],
      [`Total Stock Units: ${totalStock}`],
      [`Total Received: ${totalReceived}`],
      [`Total Issued: ${totalIssued}`],
      [`Low Stock Items: ${lowStockCount}`],
      [`Out of Stock Items: ${outOfStockCount}`]
    ];

    const csvContent = csvData.map(row => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `stock_summary_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getStockTrend = (item) => {
    const percentageUsed = (item.totalIssued / item.totalReceived) * 100;
    if (percentageUsed >= 80) return "text-red-400";
    if (percentageUsed >= 50) return "text-yellow-400";
    return "text-green-400";
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <BarChart3 /> Stock Summary
        </h1>
        <p className="text-gray-400">Current stock levels across all items</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-slate-800 p-4 rounded-xl hover:bg-slate-700 transition">
          <Package className="text-blue-400 mb-2" size={24} />
          <p className="text-2xl font-bold">{totalItems}</p>
          <p className="text-gray-400 text-sm">Total Items</p>
          <p className="text-xs text-gray-500 mt-1">Filtered results</p>
        </div>
        <div className="bg-slate-800 p-4 rounded-xl hover:bg-slate-700 transition">
          <TrendingDown className="text-green-400 mb-2" size={24} />
          <p className="text-2xl font-bold">{totalStock}</p>
          <p className="text-gray-400 text-sm">Total Stock Units</p>
          <p className="text-xs text-gray-500 mt-1">Current inventory</p>
        </div>
        <div className="bg-slate-800 p-4 rounded-xl hover:bg-slate-700 transition">
          <AlertTriangle className="text-yellow-400 mb-2" size={24} />
          <p className="text-2xl font-bold">{lowStockCount}</p>
          <p className="text-gray-400 text-sm">Low Stock Items</p>
          <p className="text-xs text-yellow-400 mt-1">Below 10 units</p>
        </div>
        <div className="bg-slate-800 p-4 rounded-xl hover:bg-slate-700 transition">
          <AlertTriangle className="text-red-400 mb-2" size={24} />
          <p className="text-2xl font-bold">{outOfStockCount}</p>
          <p className="text-gray-400 text-sm">Out of Stock</p>
          <p className="text-xs text-red-400 mt-1">Need immediate restock</p>
        </div>
      </div>

      {/* Additional Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-slate-800/50 p-4 rounded-xl">
          <p className="text-gray-400 text-sm">Total Received (All Time)</p>
          <p className="text-xl font-bold text-blue-400">{totalReceived}</p>
        </div>
        <div className="bg-slate-800/50 p-4 rounded-xl">
          <p className="text-gray-400 text-sm">Total Issued (All Time)</p>
          <p className="text-xl font-bold text-yellow-400">{totalIssued}</p>
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

          {/* Status Filter */}
          <div className="min-w-[150px]">
            <select
              className="w-full px-4 py-2 bg-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="instock">In Stock (&gt;=10)</option>
              <option value="lowstock">Low Stock (&lt;10 &gt;0)</option>
              <option value="outofstock">Out of Stock (0)</option>
            </select>
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

          {/* Export Button */}
          <button
            onClick={exportToCSV}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg flex items-center gap-2 transition"
          >
            <Download size={18} /> Export CSV
          </button>

          {/* Clear Filters */}
          {(searchTerm || statusFilter !== "all" || supplierFilter !== "all") && (
            <button
              onClick={() => {
                setSearchTerm("");
                setStatusFilter("all");
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
          Showing {filteredSummary.length} of {summary.length} items
          {searchTerm && ` • Search: "${searchTerm}"`}
          {statusFilter !== "all" && ` • Status: ${statusFilter}`}
          {supplierFilter !== "all" && ` • Supplier: ${supplierFilter}`}
        </div>
      </div>

      {/* Stock Table */}
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
                  <th className="p-3 hidden lg:table-cell">Description</th>
                  <th className="p-3">Total Received</th>
                  <th className="p-3">Total Issued</th>
                  <th className="p-3">Current Stock</th>
                  <th className="p-3 hidden md:table-cell">Supplier</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 hidden lg:table-cell">Usage</th>
                </tr>
              </thead>
              <tbody>
                {filteredSummary.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="text-center p-8 text-gray-400">
                      No items found matching your filters
                    </td>
                  </tr>
                ) : (
                  filteredSummary.map((item, index) => {
                    const usagePercentage = (item.totalIssued / item.totalReceived) * 100;
                    return (
                      <tr key={index} className="border-b border-slate-700 hover:bg-slate-700/50 transition">
                        <td className="p-3 font-medium">{item.itemname}</td>
                        <td className="p-3 hidden lg:table-cell text-gray-300">
                          {item.description?.length > 50 ? `${item.description.slice(0, 50)}...` : item.description || "-"}
                        </td>
                        <td className="p-3">{item.totalReceived}</td>
                        <td className="p-3">{item.totalIssued}</td>
                        <td className="p-3">
                          <span className={`font-bold ${
                            item.currentStock === 0 ? "text-red-400" :
                            item.currentStock < 10 ? "text-yellow-400" : "text-green-400"
                          }`}>
                            {item.currentStock}
                          </span>
                        </td>
                        <td className="p-3 hidden md:table-cell">{item.supplierName || "-"}</td>
                        <td className="p-3">
                          <span
                            className={`px-2 py-1 rounded text-sm whitespace-nowrap ${
                              item.currentStock === 0
                                ? "bg-red-600"
                                : item.currentStock < 10
                                ? "bg-yellow-600"
                                : "bg-green-600"
                            }`}
                          >
                            {item.currentStock === 0
                              ? "Out of Stock"
                              : item.currentStock < 10
                              ? "Low Stock"
                              : "In Stock"}
                          </span>
                        </td>
                        <td className="p-3 hidden lg:table-cell">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-slate-600 rounded-full h-2">
                              <div 
                                className={`h-2 rounded-full ${getStockTrend(item)}`}
                                style={{ width: `${Math.min(usagePercentage, 100)}%` }}
                              />
                            </div>
                            <span className="text-xs text-gray-400">
                              {usagePercentage.toFixed(1)}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Recommendations Section for Low Stock */}
      {!loading && (lowStockCount > 0 || outOfStockCount > 0) && (
        <div className="mt-6 bg-yellow-900/30 border border-yellow-500/50 p-4 rounded-xl">
          <h3 className="font-bold text-yellow-400 mb-2 flex items-center gap-2">
            <AlertTriangle size={18} /> Restock Recommendations
          </h3>
          <div className="space-y-2">
            {filteredSummary
              .filter(item => item.currentStock < 10)
              .slice(0, 5)
              .map((item, idx) => (
                <div key={idx} className="text-sm">
                  • <strong>{item.itemname}</strong>: Only {item.currentStock} units remaining 
                  {item.supplierName && ` (Supplier: ${item.supplierName})`}
                  {item.currentStock === 0 && " - URGENT: Out of stock!"}
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}