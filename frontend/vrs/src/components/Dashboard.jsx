import { useEffect, useState } from "react";
import api from "../api";
import {
  Users,
  Car,
  ClipboardList,
  CheckCircle,
  TrendingUp,
} from "lucide-react";

export default function Dashboard() {
  // ===================== IMPORTS =====================
  // ===================== STATE =====================
  const [customers, setCustomers] = useState(0);
  const [vehicles, setVehicles] = useState(0);
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);

  // ===================== FETCH DATA =====================
  const fetchData = async () => {
    try {
      setLoading(true);

      const [cRes, vRes, rRes] = await Promise.all([
        api.get("/customers"),
        api.get("/vehicles"),
        api.get("/reservations"),
      ]);

      setCustomers(cRes.data.length);
      setVehicles(vRes.data.length);
      setReservations(rRes.data);
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
  const activeReservations = reservations.filter(
    (r) => r.reservation_status === "pending" || r.rental_status !== "returned"
  ).length;

  const completedRentals = reservations.filter(
    (r) => r.rental_status === "returned"
  ).length;

  // ===================== UI =====================
  return (
    <div className="p-6 text-white">

      {/* HEADER */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <TrendingUp /> VRS Dashboard
        </h1>
        <p className="text-gray-400">
          System overview and analytics
        </p>
      </div>

      {/* LOADING */}
      {loading && (
        <p className="text-gray-400">Loading dashboard...</p>
      )}

      {/* STATS CARDS */}
      {!loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">

          {/* CUSTOMERS */}
          <div className="bg-slate-800 p-5 rounded-xl shadow">
            <div className="flex items-center justify-between">
              <Users className="text-blue-400" />
              <span className="text-2xl font-bold">{customers}</span>
            </div>
            <p className="text-gray-400 mt-2">Total Customers</p>
          </div>

          {/* VEHICLES */}
          <div className="bg-slate-800 p-5 rounded-xl shadow">
            <div className="flex items-center justify-between">
              <Car className="text-green-400" />
              <span className="text-2xl font-bold">{vehicles}</span>
            </div>
            <p className="text-gray-400 mt-2">Total Vehicles</p>
          </div>

          {/* ACTIVE RESERVATIONS */}
          <div className="bg-slate-800 p-5 rounded-xl shadow">
            <div className="flex items-center justify-between">
              <ClipboardList className="text-yellow-400" />
              <span className="text-2xl font-bold">
                {activeReservations}
              </span>
            </div>
            <p className="text-gray-400 mt-2">Active Reservations</p>
          </div>

          {/* COMPLETED RENTALS */}
          <div className="bg-slate-800 p-5 rounded-xl shadow">
            <div className="flex items-center justify-between">
              <CheckCircle className="text-emerald-400" />
              <span className="text-2xl font-bold">
                {completedRentals}
              </span>
            </div>
            <p className="text-gray-400 mt-2">Completed Rentals</p>
          </div>

        </div>
      )}

      {/* RECENT ACTIVITY */}
      {!loading && (
        <div className="mt-8 bg-slate-800 p-5 rounded-xl">
          <h2 className="text-xl font-bold mb-4">
            Recent Reservations
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-700">
                <tr>
                  <th className="p-2">Customer</th>
                  <th className="p-2 hidden md:table-cell">Vehicle</th>
                  <th className="p-2">Start</th>
                  <th className="p-2">Status</th>
                </tr>
              </thead>

              <tbody>
                {reservations.slice(0, 5).map((r) => (
                  <tr
                    key={r._id}
                    className="border-b border-slate-700"
                  >
                    <td className="p-2">
                      {r.customer_id?.full_name || "N/A"}
                    </td>

                    <td className="p-2 hidden md:table-cell">
                      {r.vehicle_id?.plate_number || "N/A"}
                    </td>

                    <td className="p-2">
                      {r.start_date?.slice(0, 10)}
                    </td>

                    <td className="p-2">
                      <span
                        className={`px-2 py-1 rounded text-sm ${
                          r.rental_status === "returned"
                            ? "bg-green-600"
                            : "bg-yellow-600"
                        }`}
                      >
                        {r.rental_status}
                      </span>
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