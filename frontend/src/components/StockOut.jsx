import { useEffect, useState } from "react";
import api from "../api";
import { Plus, Pencil, Trash2, X, RotateCcw } from "lucide-react";

export default function Reservations() {
  // ===================== STATE =====================
  const [reservations, setReservations] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [vehicles, setVehicles] = useState([]);

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const [form, setForm] = useState({
    customer_id: "",
    vehicle_id: "",
    reservation_date: "",
    start_date: "",
    end_date: "",
    reservation_status: "pending",
    rental_date: "",
    return_date: "",
    rental_fee: "",
    rental_status: "not_started",
  });

  // ===================== FETCH ALL DATA =====================
  const fetchReservations = async () => {
    const res = await api.get("/reservations");
    setReservations(res.data);
  };

  const fetchCustomers = async () => {
    const res = await api.get("/customers");
    setCustomers(res.data);
  };

  const fetchVehicles = async () => {
    const res = await api.get("/vehicles");
    setVehicles(res.data);
  };

  useEffect(() => {
    fetchReservations();
    fetchCustomers();
    fetchVehicles();
  }, []);

  // ===================== OPEN ADD =====================
  const openAdd = () => {
    setForm({
      customer_id: "",
      vehicle_id: "",
      reservation_date: "",
      start_date: "",
      end_date: "",
      reservation_status: "pending",
      rental_date: "",
      return_date: "",
      rental_fee: "",
      rental_status: "not_started",
    });
    setEditing(null);
    setOpen(true);
  };

  // ===================== OPEN EDIT =====================
  const openEdit = (r) => {
    setForm(r);
    setEditing(r._id);
    setOpen(true);
  };

  // ===================== SUBMIT =====================
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (editing) {
        await api.put(`/reservations/${editing}`, form);
      } else {
        await api.post("/reservations", form);
      }

      setOpen(false);
      fetchReservations();
    } catch (err) {
      console.log(err);
    }
  };

  // ===================== RETURN VEHICLE =====================
  const handleReturn = async (id) => {
    try {
      await api.put(`/reservations/return/${id}`);
      fetchReservations();
    } catch (err) {
      console.log(err);
    }
  };

  // ===================== DELETE =====================
  const handleDelete = async (id) => {
    if (!window.confirm("Delete this reservation?")) return;

    try {
      await api.delete(`/reservations/${id}`);
      fetchReservations();
    } catch (err) {
      console.log(err);
    }
  };

  // ===================== UI =====================
  return (
    <div className="p-6 text-white">

      {/* HEADER */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Reservations & Rentals</h1>

        <button
          onClick={openAdd}
          className="flex items-center gap-2 bg-green-600 px-4 py-2 rounded-lg hover:bg-green-700"
        >
          <Plus size={18} />
          New Reservation
        </button>
      </div>

      {/* TABLE */}
      <div className="overflow-x-auto bg-slate-800 rounded-xl">
        <table className="w-full text-left">
          <thead className="bg-slate-700">
            <tr>
              <th className="p-3">Customer</th>
              <th className="p-3 hidden md:table-cell">Vehicle</th>
              <th className="p-3">Start</th>
              <th className="p-3 hidden md:table-cell">End</th>
              <th className="p-3 hidden md:table-cell">Status</th>
              <th className="p-3 hidden md:table-cell">Rental Status</th>
              <th className="p-3 hidden md:table-cell">Fee</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>

          <tbody>
            {reservations.map((r) => (
              <tr key={r._id} className="border-b border-slate-700">

                <td className="p-3">
                  {r.customer_id?.full_name || "N/A"}
                </td>

                <td className="p-3 hidden md:table-cell">
                  {r.vehicle_id?.plate_number || "N/A"}
                </td>

                <td className="p-3">{r.start_date?.slice(0, 10)}</td>
                <td className="p-3 hidden md:table-cell">{r.end_date?.slice(0, 10)}</td>

                <td className="p-3 hidden md:table-cell">
                  <span className="px-2 py-1 bg-yellow-600 rounded text-sm">
                    {r.reservation_status}
                  </span>
                </td>

                <td className="p-3 hidden md:table-cell">
                  <span className="px-2 py-1 bg-blue-600 rounded text-sm">
                    {r.rental_status}
                  </span>
                </td>

                <td className="p-3 hidden md:table-cell">{r.rental_fee}</td>

                <td className="p-3 flex gap-3">

                  <button onClick={() => openEdit(r)} aria-label={`Edit reservation ${r._id}`}>
                    <Pencil className="text-blue-400" size={18} />
                  </button>

                  <button onClick={() => handleReturn(r._id)} aria-label={`Return ${r._id}`}>
                    <RotateCcw className="text-green-400" size={18} />
                  </button>

                  <button onClick={() => handleDelete(r._id)} aria-label={`Delete ${r._id}`}>
                    <Trash2 className="text-red-400" size={18} />
                  </button>

                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ===================== MODAL ===================== */}
      {open && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center">

          <div className="bg-slate-900 p-6 w-full h-full md:h-auto md:max-w-md md:rounded-xl md:mx-auto md:my-0 rounded-none overflow-auto">

            {/* HEADER */}
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">
                {editing ? "Update Reservation" : "New Reservation"}
              </h2>

              <button onClick={() => setOpen(false)}>
                <X />
              </button>
            </div>

            {/* FORM */}
            <form onSubmit={handleSubmit} className="space-y-3">

              {/* CUSTOMER */}
              <select
                className="w-full p-2 bg-slate-800 rounded"
                value={form.customer_id}
                onChange={(e) =>
                  setForm({ ...form, customer_id: e.target.value })
                }
              >
                <option value="">Select Customer</option>
                {customers.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.full_name}
                  </option>
                ))}
              </select>

              {/* VEHICLE */}
              <select
                className="w-full p-2 bg-slate-800 rounded"
                value={form.vehicle_id}
                onChange={(e) =>
                  setForm({ ...form, vehicle_id: e.target.value })
                }
              >
                <option value="">Select Vehicle</option>
                {vehicles.map((v) => (
                  <option key={v._id} value={v._id}>
                    {v.plate_number}
                  </option>
                ))}
              </select>

              <input
                type="date"
                className="w-full p-2 bg-slate-800 rounded"
                value={form.start_date}
                onChange={(e) =>
                  setForm({ ...form, start_date: e.target.value })
                }
              />

              <input
                type="date"
                className="w-full p-2 bg-slate-800 rounded"
                value={form.end_date}
                onChange={(e) =>
                  setForm({ ...form, end_date: e.target.value })
                }
              />

              <input
                className="w-full p-2 bg-slate-800 rounded"
                placeholder="Rental Fee"
                value={form.rental_fee}
                onChange={(e) =>
                  setForm({ ...form, rental_fee: e.target.value })
                }
              />

              {/* SUBMIT */}
              <button className="w-full bg-blue-600 p-2 rounded hover:bg-blue-700">
                {editing ? "Update" : "Create"}
              </button>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}