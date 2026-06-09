import { useEffect, useState } from "react";
import api from "../api";
import { Search, Calendar, DollarSign, Package, TrendingUp } from "lucide-react";

export default function SaleDetails() {
  const [saleDetails, setSaleDetails] = useState([]);
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSale, setSelectedSale] = useState(null);
  const [dateFilter, setDateFilter] = useState("");
  const [showSaleModal, setShowSaleModal] = useState(false);

  const fetchData = async () => {
    try {
      // Fetch all sales
      const salesRes = await api.get("/sales");
      setSales(salesRes.data);
      
      // Fetch all sale details for each sale
      const allDetails = [];
      for (const sale of salesRes.data) {
        const detailsRes = await api.get(`/saledetails/${sale._id}`);
        const detailsWithSaleInfo = detailsRes.data.map(detail => ({
          ...detail,
          saleCustomerName: sale.CustomerName,
          saleDate: sale.SaleDate,
          saleTotal: sale.TotalPrice,
          saleId: sale._id
        }));
        allDetails.push(...detailsWithSaleInfo);
      }
      setSaleDetails(allDetails);
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const viewSaleDetails = (saleId) => {
    const sale = sales.find(s => s._id === saleId);
    setSelectedSale(sale);
    setShowSaleModal(true);
  };

  const filteredDetails = saleDetails.filter(detail => {
    const matchesSearch = detail.ItemName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          detail.saleCustomerName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDate = !dateFilter || new Date(detail.saleDate).toDateString() === new Date(dateFilter).toDateString();
    return matchesSearch && matchesDate;
  });

  const totalRevenue = filteredDetails.reduce((sum, detail) => sum + (detail.SubTotalPrice || 0), 0);
  const totalItemsSold = filteredDetails.reduce((sum, detail) => sum + (detail.QuantitySold || 0), 0);
  const uniqueTransactions = new Set(filteredDetails.map(d => d.saleId)).size;

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Sale Details</h1>
        <p className="text-gray-400">View all items sold in each transaction</p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-slate-800 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Total Revenue</p>
              <p className="text-2xl font-bold text-green-400">{totalRevenue.toLocaleString()} RWF</p>
            </div>
            <DollarSign className="text-green-400" size={32} />
          </div>
        </div>
        
        <div className="bg-slate-800 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Items Sold</p>
              <p className="text-2xl font-bold text-blue-400">{totalItemsSold}</p>
            </div>
            <Package className="text-blue-400" size={32} />
          </div>
        </div>
        
        <div className="bg-slate-800 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Transactions</p>
              <p className="text-2xl font-bold text-purple-400">{uniqueTransactions}</p>
            </div>
            <TrendingUp className="text-purple-400" size={32} />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search by item name or customer..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-800 text-white pl-10 pr-4 py-2 rounded-lg border border-slate-700 focus:outline-none focus:border-blue-500"
          />
        </div>
        
        <div className="relative">
          <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="w-full bg-slate-800 text-white pl-10 pr-4 py-2 rounded-lg border border-slate-700 focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {loading ? (
        <p className="text-gray-400">Loading sale details...</p>
      ) : (
        <div className="bg-slate-800 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-700">
                <tr>
                  <th className="p-3">Sale Date</th>
                  <th className="p-3">Customer Name</th>
                  <th className="p-3">Item Name</th>
                  <th className="p-3">Unit Measure</th>
                  <th className="p-3">Quantity Sold</th>
                  <th className="p-3">Unit Price (RWF)</th>
                  <th className="p-3">Subtotal (RWF)</th>
                  <th className="p-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredDetails.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="p-8 text-center text-gray-400">
                      No sale details found
                    </td>
                  </tr>
                ) : (
                  filteredDetails.map((detail, idx) => (
                    <tr key={idx} className="border-b border-slate-700 hover:bg-slate-700/50 transition">
                      <td className="p-3">
                        {new Date(detail.saleDate).toLocaleDateString()}
                      </td>
                      <td className="p-3 font-medium text-blue-400">
                        {detail.saleCustomerName}
                      </td>
                      <td className="p-3 font-medium">{detail.ItemName}</td>
                      <td className="p-3">{detail.UnitMeasure || "-"}</td>
                      <td className="p-3">
                        <span className="text-yellow-400 font-bold">
                          {detail.QuantitySold}
                        </span>
                      </td>
                      <td className="p-3">{detail.UnitPriceAtSale?.toLocaleString() || detail.UnitPrice?.toLocaleString()}</td>
                      <td className="p-3 text-green-400">
                        {detail.SubTotalPrice?.toLocaleString()}
                      </td>
                      <td className="p-3">
                        <button
                          onClick={() => viewSaleDetails(detail.saleId)}
                          className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-sm transition"
                        >
                          View Sale
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              <tfoot className="bg-slate-700">
                <tr>
                  <td colSpan="4" className="p-3 text-right font-bold">Totals:</td>
                  <td className="p-3 font-bold text-yellow-400">{totalItemsSold}</td>
                  <td className="p-3 font-bold text-green-400" colSpan="2">
                    {totalRevenue.toLocaleString()} RWF
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* Sale Details Modal */}
      {showSaleModal && selectedSale && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-xl p-6 w-full max-w-3xl max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">Sale Transaction Details</h2>
              <button
                onClick={() => setShowSaleModal(false)}
                className="text-gray-400 hover:text-white text-2xl"
              >
                ×
              </button>
            </div>
            
            <div className="bg-slate-700 p-4 rounded-lg mb-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-gray-400 text-sm">Customer Name</p>
                  <p className="text-lg font-bold">{selectedSale.CustomerName}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Sale Date</p>
                  <p className="text-lg font-bold">{new Date(selectedSale.SaleDate).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Total Amount</p>
                  <p className="text-lg font-bold text-green-400">{selectedSale.TotalPrice.toLocaleString()} RWF</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Recorded By</p>
                  <p className="text-lg font-bold">{selectedSale.user_id?.UserName || "N/A"}</p>
                </div>
              </div>
            </div>
            
            <h3 className="text-xl font-bold mb-3">Items Purchased</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-700">
                  <tr>
                    <th className="p-2">Item Name</th>
                    <th className="p-2">Specification</th>
                    <th className="p-2">Unit Measure</th>
                    <th className="p-2">Quantity</th>
                    <th className="p-2">Unit Price (RWF)</th>
                    <th className="p-2">Subtotal (RWF)</th>
                  </tr>
                </thead>
                <tbody>
                  {saleDetails
                    .filter(d => d.saleId === selectedSale._id)
                    .map((detail, idx) => (
                      <tr key={idx} className="border-b border-slate-700">
                        <td className="p-2">{detail.ItemName}</td>
                        <td className="p-2">{detail.Specification || "-"}</td>
                        <td className="p-2">{detail.UnitMeasure || "-"}</td>
                        <td className="p-2 text-yellow-400 font-bold">{detail.QuantitySold}</td>
                        <td className="p-2">{detail.UnitPriceAtSale?.toLocaleString()}</td>
                        <td className="p-2 text-green-400">{detail.SubTotalPrice?.toLocaleString()}</td>
                      </tr>
                    ))}
                </tbody>
                <tfoot className="bg-slate-700">
                  <tr>
                    <td colSpan="5" className="p-2 text-right font-bold">Grand Total:</td>
                    <td className="p-2 font-bold text-green-400">{selectedSale.TotalPrice.toLocaleString()} RWF</td>
                  </tr>
                </tfoot>
              </table>
            </div>
            
            <button
              onClick={() => setShowSaleModal(false)}
              className="mt-4 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition w-full"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}