import { useEffect, useState } from "react";
import api from "../api";
import { Plus, Pencil, Trash2, X } from "lucide-react";

export default function Customer() {
  // ===================== STATE =====================
  const [customers, setCustomers] = useState([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [query, setQuery] = useState("");

  const [form, setForm] = useState({
    full_name: "",
    national_id: "",
    phone: "",
    email: "",
    address: "",
  });

  // ===================== FETCH =====================
  const fetchCustomers = async () => {
    try {
      const res = await api.get("/customers");
      setCustomers(res.data);
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  // ===================== OPEN ADD MODAL =====================
  const openAdd = () => {
    setForm({
      full_name: "",
      national_id: "",
      phone: "",
      email: "",
      address: "",
    });
    setEditing(null);
    setOpen(true);
  };

  // ===================== OPEN EDIT =====================
  const openEdit = (customer) => {
    setForm(customer);
    setEditing(customer._id);
    setOpen(true);
  };

  // ===================== SUBMIT (CREATE / UPDATE) =====================
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (editing) {
        await api.put(`/customers/${editing}`, form);
      } else {
        await api.post("/customers", form);
      }

      setOpen(false);
      fetchCustomers();
    } catch (err) {
      console.log(err);
    }
  };

  // ===================== DELETE =====================
  const handleDelete = async (id) => {
    if (!window.confirm("Delete this customer?")) return;

    try {
      await api.delete(`/customers/${id}`);
      fetchCustomers();
    } catch (err) {
      console.log(err);
    }
  };

  // ===================== UI =====================
  return (
    <div className="p-6 text-white">

      {/* HEADER */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Customers</h1>

        <button
          onClick={openAdd}
          className="flex items-center gap-2 bg-green-600 px-4 py-2 rounded-lg hover:bg-green-700"
        >
          <Plus size={18} />
          Add Customer
        </button>
      </div>

      {/* SEARCH */}
      <div className="mb-4">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search customers by name, id, phone, email or address"
          aria-label="Search customers"
          className="w-full md:w-1/2 p-2 bg-slate-800 rounded"
        />
      </div>

      {/* TABLE */}
      <div className="overflow-x-auto bg-slate-800 rounded-xl">
        <table className="w-full text-left">
          <thead className="bg-slate-700">
            <tr>
              <th className="p-3">Name</th>
              <th className="p-3 hidden md:table-cell">National ID</th>
              <th className="p-3">Phone</th>
              <th className="p-3 hidden md:table-cell">Email</th>
              <th className="p-3 hidden md:table-cell">Address</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>

          <tbody>
            {(() => {
              const q = query.trim().toLowerCase();
              const filtered = customers.filter((c) => {
                if (!q) return true;
                return (
                  c.full_name?.toLowerCase().includes(q) ||
                  c.national_id?.toLowerCase().includes(q) ||
                  c.phone?.toLowerCase().includes(q) ||
                  c.email?.toLowerCase().includes(q) ||
                  c.address?.toLowerCase().includes(q)
                );
              });

              if (filtered.length === 0) {
                return (
                  <tr>
                    <td className="p-3" colSpan={6}>
                      No customers found.
                    </td>
                  </tr>
                );
              }

              return filtered.map((c) => (
              <tr key={c._id} className="border-b border-slate-700">
                <td className="p-3">{c.full_name}</td>
                <td className="p-3 hidden md:table-cell">{c.national_id}</td>
                <td className="p-3">{c.phone}</td>
                <td className="p-3 hidden md:table-cell">{c.email}</td>
                <td className="p-3 hidden md:table-cell">{c.address}</td>

                <td className="p-3 flex gap-3">
                  <button onClick={() => openEdit(c)} aria-label={`Edit ${c.full_name}`}>
                    <Pencil className="text-blue-400" size={18} />
                  </button>

                  <button onClick={() => handleDelete(c._id)} aria-label={`Delete ${c.full_name}`}>
                    <Trash2 className="text-red-400" size={18} />
                  </button>
                </td>
              </tr>
              ));
            })()}
          </tbody>
        </table>
      </div>

      {/* ===================== MODAL OVERLAY ===================== */}
      {open && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center">

          <div className="bg-slate-900 p-6 w-full h-full md:h-auto md:max-w-md md:rounded-xl md:mx-auto md:my-0 rounded-none overflow-auto">

            {/* CLOSE */}
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">
                {editing ? "Update Customer" : "Add Customer"}
              </h2>

              <button onClick={() => setOpen(false)}>
                <X />
              </button>
            </div>

            {/* FORM */}
            <form onSubmit={handleSubmit} className="space-y-3">

              <input
                className="w-full p-2 bg-slate-800 rounded"
                placeholder="Full Name"
                value={form.full_name}
                onChange={(e) =>
                  setForm({ ...form, full_name: e.target.value })
                }
              />

              <input
                className="w-full p-2 bg-slate-800 rounded"
                placeholder="National ID"
                value={form.national_id}
                onChange={(e) =>
                  setForm({ ...form, national_id: e.target.value })
                }
              />

              <input
                className="w-full p-2 bg-slate-800 rounded"
                placeholder="Phone"
                value={form.phone}
                onChange={(e) =>
                  setForm({ ...form, phone: e.target.value })
                }
              />

              <input
                className="w-full p-2 bg-slate-800 rounded"
                placeholder="Email"
                value={form.email}
                onChange={(e) =>
                  setForm({ ...form, email: e.target.value })
                }
              />

              <input
                className="w-full p-2 bg-slate-800 rounded"
                placeholder="Address"
                value={form.address}
                onChange={(e) =>
                  setForm({ ...form, address: e.target.value })
                }
              />

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