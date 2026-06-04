import { useEffect, useState } from "react";
import api from "../api";
import { Plus, Pencil, Trash2, X } from "lucide-react";

export default function Vehicle() {
  // ===================== STATE =====================
  const [vehicles, setVehicles] = useState([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [query, setQuery] = useState("");

  const [form, setForm] = useState({
    plate_number: "",
    brand: "",
    model: "",
    year: "",
    vehicle_type: "",
    purchase_price: "",
    status: "available",
  });

  // ===================== FETCH VEHICLES =====================
  const fetchVehicles = async () => {
    try {
      const res = await api.get("/vehicles");
      setVehicles(res.data);
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    fetchVehicles();
  }, []);

  // ===================== OPEN ADD =====================
  const openAdd = () => {
    setForm({
      plate_number: "",
      brand: "",
      model: "",
      year: "",
      vehicle_type: "",
      purchase_price: "",
      status: "available",
    });
    setEditing(null);
    setOpen(true);
  };

  // ===================== OPEN EDIT =====================
  const openEdit = (vehicle) => {
    setForm(vehicle);
    setEditing(vehicle._id);
    setOpen(true);
  };

  // ===================== SUBMIT (CREATE / UPDATE) =====================
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (editing) {
        await api.put(`/vehicles/${editing}`, form);
      } else {
        await api.post("/vehicles", form);
      }

      setOpen(false);
      fetchVehicles();
    } catch (err) {
      console.log(err);
    }
  };

  // ===================== DELETE =====================
  const handleDelete = async (id) => {
    if (!window.confirm("Delete this vehicle?")) return;

    try {
      await api.delete(`/vehicles/${id}`);
      fetchVehicles();
    } catch (err) {
      console.log(err);
    }
  };

  // ===================== UI =====================
  return (
    <div className="p-6 text-white">

      {/* HEADER */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Vehicles</h1>

        <button
          onClick={openAdd}
          className="flex items-center gap-2 bg-green-600 px-4 py-2 rounded-lg hover:bg-green-700"
        >
          <Plus size={18} />
          Add Vehicle
        </button>
      </div>

      {/* SEARCH */}
      <div className="mb-4">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search vehicles by plate, brand, model, year, type or status"
          aria-label="Search vehicles"
          className="w-full md:w-1/2 p-2 bg-slate-800 rounded"
        />
      </div>

      {/* TABLE */}
      <div className="overflow-x-auto bg-slate-800 rounded-xl">
        <table className="w-full text-left">
          <thead className="bg-slate-700">
            <tr>
              <th className="p-3">Plate</th>
              <th className="p-3 hidden md:table-cell">Brand</th>
              <th className="p-3 hidden md:table-cell">Model</th>
              <th className="p-3 hidden md:table-cell">Year</th>
              <th className="p-3 hidden md:table-cell">Type</th>
              <th className="p-3 hidden md:table-cell">Price</th>
              <th className="p-3">Status</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>

          <tbody>
            {(() => {
              const q = query.trim().toLowerCase();
              const filtered = vehicles.filter((v) => {
                if (!q) return true;
                return (
                  v.plate_number?.toLowerCase().includes(q) ||
                  v.brand?.toLowerCase().includes(q) ||
                  v.model?.toLowerCase().includes(q) ||
                  String(v.year).toLowerCase().includes(q) ||
                  v.vehicle_type?.toLowerCase().includes(q) ||
                  String(v.purchase_price).toLowerCase().includes(q) ||
                  v.status?.toLowerCase().includes(q)
                );
              });

              if (filtered.length === 0) {
                return (
                  <tr>
                    <td className="p-3" colSpan={8}>
                      No vehicles found.
                    </td>
                  </tr>
                );
              }

              return filtered.map((v) => (
                <tr key={v._id} className="border-b border-slate-700">
                  <td className="p-3">{v.plate_number}</td>
                  <td className="p-3 hidden md:table-cell">{v.brand}</td>
                  <td className="p-3 hidden md:table-cell">{v.model}</td>
                  <td className="p-3 hidden md:table-cell">{v.year}</td>
                  <td className="p-3 hidden md:table-cell">{v.vehicle_type}</td>
                  <td className="p-3 hidden md:table-cell">{v.purchase_price}</td>

                  <td className="p-3">
                    <span
                      className={`px-2 py-1 rounded text-sm ${
                        v.status === "available" ? "bg-green-600" : "bg-red-600"
                      }`}
                    >
                      {v.status}
                    </span>
                  </td>

                  <td className="p-3 flex gap-3">
                    <button onClick={() => openEdit(v)} aria-label={`Edit ${v.plate_number}`}>
                      <Pencil className="text-blue-400" size={18} />
                    </button>

                    <button onClick={() => handleDelete(v._id)} aria-label={`Delete ${v.plate_number}`}>
                      <Trash2 className="text-red-400" size={18} />
                    </button>
                  </td>
                </tr>
              ));
            })()}
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
                {editing ? "Update Vehicle" : "Add Vehicle"}
              </h2>

              <button onClick={() => setOpen(false)}>
                <X />
              </button>
            </div>

            {/* FORM */}
            <form onSubmit={handleSubmit} className="space-y-3">

              <input
                className="w-full p-2 bg-slate-800 rounded"
                placeholder="Plate Number"
                value={form.plate_number}
                onChange={(e) =>
                  setForm({ ...form, plate_number: e.target.value })
                }
              />

              <input
                className="w-full p-2 bg-slate-800 rounded"
                placeholder="Brand"
                value={form.brand}
                onChange={(e) =>
                  setForm({ ...form, brand: e.target.value })
                }
              />

              <input
                className="w-full p-2 bg-slate-800 rounded"
                placeholder="Model"
                value={form.model}
                onChange={(e) =>
                  setForm({ ...form, model: e.target.value })
                }
              />

              <input
                className="w-full p-2 bg-slate-800 rounded"
                placeholder="Year"
                value={form.year}
                onChange={(e) =>
                  setForm({ ...form, year: e.target.value })
                }
              />

              <input
                className="w-full p-2 bg-slate-800 rounded"
                placeholder="Vehicle Type"
                value={form.vehicle_type}
                onChange={(e) =>
                  setForm({ ...form, vehicle_type: e.target.value })
                }
              />

              <input
                className="w-full p-2 bg-slate-800 rounded"
                placeholder="Purchase Price"
                value={form.purchase_price}
                onChange={(e) =>
                  setForm({ ...form, purchase_price: e.target.value })
                }
              />

              <select
                className="w-full p-2 bg-slate-800 rounded"
                value={form.status}
                onChange={(e) =>
                  setForm({ ...form, status: e.target.value })
                }
              >
                <option value="available">Available</option>
                <option value="rented">Rented</option>
                <option value="maintenance">Maintenance</option>
              </select>

              {/* SUBMIT */}
              <button className="w-full bg-blue-600 p-2 rounded hover:bg-blue-700">
                {editing ? "Update" : "Save"}
              </button>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}