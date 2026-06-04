import { useEffect, useState } from "react";
import api from "../api";
import { FileText, Printer, Download } from "lucide-react";

export default function Report() {
  // ===================== STATE =====================
  const [reservations, setReservations] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [selectedDate, setSelectedDate] = useState("");
  const [showReport, setShowReport] = useState(false);

  // ===================== FETCH DATA =====================
  const fetchData = async () => {
    try {
      const res = await api.get("/reservations");
      setReservations(res.data);
      setFiltered(res.data);
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // ===================== FILTER BY DATE =====================
  const handleFilter = () => {
    if (!selectedDate) {
      alert("Please select a date");
      return;
    }

    const filteredData = reservations.filter((r) => {
      const resDate = r.start_date?.slice(0, 10);
      return resDate === selectedDate;
    });

    setFiltered(filteredData);
    setShowReport(true);
  };

  // ===================== PRINT =====================
  const handlePrint = () => {
    window.print();
  };

  // ===================== DOWNLOAD (CSV) =====================
  const handleDownload = () => {
    if (filtered.length === 0) {
      alert("No data to download");
      return;
    }

    // Prepare CSV headers (expanded)
    const headers = [
      "Customer Full Name",
      "Customer National ID",
      "Customer Phone",
      "Vehicle Plate",
      "Vehicle Brand",
      "Vehicle Model",
      "Vehicle Year",
      "Vehicle Type",
      "Reservation Date",
      "Rental Start",
      "Rental End",
      "Reservation Status",
      "Return Date",
      "Rental Fee",
      "Rental Status",
    ];

    // Prepare CSV rows
    const rows = filtered.map((r) => [
      r.customer_id?.full_name || "N/A",
      r.customer_id?.national_id || "N/A",
      r.customer_id?.phone || "N/A",
      r.vehicle_id?.plate_number || "N/A",
      r.vehicle_id?.brand || "N/A",
      r.vehicle_id?.model || "N/A",
      r.vehicle_id?.year || "N/A",
      r.vehicle_id?.vehicle_type || "N/A",
      r.reservation_date?.slice(0, 10) || "N/A",
      r.start_date?.slice(0, 10) || "N/A",
      r.end_date?.slice(0, 10) || "N/A",
      r.reservation_status || "N/A",
      r.return_date?.slice(0, 10) || "N/A",
      r.rental_fee || "N/A",
      r.rental_status || "N/A",
    ]);

    // Combine headers and rows
    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    // Create blob and download
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);

    link.setAttribute("href", url);
    link.setAttribute("download", `VRS_Report_${selectedDate}.csv`);
    link.style.visibility = "hidden";

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // ===================== UI =====================
  return (
    <div className="p-6 text-white">

      {/* HEADER */}
      <h1 className="text-2xl font-bold mb-4 flex items-center gap-2">
        <FileText /> Reports
      </h1>

      {/* FILTER */}
      <div className="bg-slate-800 p-4 rounded-xl mb-4 flex flex-wrap gap-3">

        <input
          type="date"
          className="p-2 bg-slate-700 rounded"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
        />

        <button
          onClick={handleFilter}
          className="bg-blue-600 px-4 py-2 rounded hover:bg-blue-700"
        >
          Generate
        </button>

        {showReport && (
          <>
            <button
              onClick={handlePrint}
              className="bg-green-600 px-4 py-2 rounded flex items-center gap-2"
            >
              <Printer size={18} /> Print
            </button>

            <button
              onClick={handleDownload}
              className="bg-purple-600 px-4 py-2 rounded flex items-center gap-2"
            >
              <Download size={18} /> Download
            </button>
          </>
        )}
      </div>

      {/* REPORT TABLE - Only show if generated */}
      {showReport && (
        <div
          id="report"
          className="bg-slate-800 p-4 rounded-xl overflow-x-auto"
        >
          <h2 className="text-xl font-bold mb-3">
            VRS Reservation Report - {selectedDate}
          </h2>

          {filtered.length === 0 ? (
            <p className="text-gray-400">No reservations found for this date.</p>
          ) : (
            <>
              {/* Mobile card list */}
              <div className="md:hidden space-y-3">
                {filtered.map((r) => (
                  <div key={r._id} className="bg-slate-700 p-3 rounded">
                    <div className="font-semibold text-white">{r.customer_id?.full_name || "N/A"}</div>
                    <div className="text-sm text-gray-300">{r.customer_id?.national_id || ""} {r.customer_id?.phone ? `· ${r.customer_id.phone}` : ""}</div>

                    <div className="mt-2 text-sm">
                      <span className="font-semibold">Vehicle:</span> {r.vehicle_id?.plate_number || "N/A"}
                    </div>
                    <div className="text-sm text-gray-300">{[r.vehicle_id?.brand, r.vehicle_id?.model, r.vehicle_id?.year].filter(Boolean).join(' ')}</div>

                    <div className="mt-2 flex flex-wrap gap-2">
                      <span className="px-2 py-1 bg-yellow-600 rounded text-sm">{r.reservation_status || 'N/A'}</span>
                      <span className="px-2 py-1 bg-blue-600 rounded text-sm">{r.rental_status || 'N/A'}</span>
                    </div>

                    <div className="mt-2 text-sm">Start: {r.start_date?.slice(0,10) || 'N/A'}</div>
                    <div className="text-sm">End: {r.end_date?.slice(0,10) || 'N/A'}</div>
                    <div className="text-sm">Reservation Date: {r.reservation_date?.slice(0,10) || 'N/A'}</div>
                    <div className="text-sm">Return Date: {r.return_date?.slice(0,10) || 'N/A'}</div>
                    <div className="mt-2 text-sm">Fee: {r.rental_fee || 'N/A'}</div>
                  </div>
                ))}
              </div>

              {/* Desktop table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-700">
                    <tr>
                      <th className="p-2">Customer Full Name</th>
                      <th className="p-2">C_National_ID</th>
                      <th className="p-2">C_Phone</th>
                      <th className="p-2">Vehicle Plate</th>
                      <th className="p-2">Vehicle Brand</th>
                      <th className="p-2">Vehicle Model</th>
                      <th className="p-2">Year</th>
                      <th className="p-2">Type</th>
                      <th className="p-2">Reservation Date</th>
                      <th className="p-2">Rental Start</th>
                      <th className="p-2">Rental End</th>
                      <th className="p-2">Reservation Status</th>
                      <th className="p-2">Return Date</th>
                      <th className="p-2">Rental Fee</th>
                      <th className="p-2">Rental Status</th>
                    </tr>
                  </thead>

                  <tbody>
                    {filtered.map((r) => (
                      <tr key={r._id} className="border-b border-slate-700">
                        <td className="p-2">{r.customer_id?.full_name || "N/A"}</td>
                        <td className="p-2">{r.customer_id?.national_id || "N/A"}</td>
                        <td className="p-2">{r.customer_id?.phone || "N/A"}</td>

                        <td className="p-2">{r.vehicle_id?.plate_number || "N/A"}</td>
                        <td className="p-2">{r.vehicle_id?.brand || "N/A"}</td>
                        <td className="p-2">{r.vehicle_id?.model || "N/A"}</td>
                        <td className="p-2">{r.vehicle_id?.year || "N/A"}</td>
                        <td className="p-2">{r.vehicle_id?.vehicle_type || "N/A"}</td>

                        <td className="p-2">{r.reservation_date?.slice(0, 10) || "N/A"}</td>
                        <td className="p-2">{r.start_date?.slice(0, 10) || "N/A"}</td>
                        <td className="p-2">{r.end_date?.slice(0, 10) || "N/A"}</td>

                        <td className="p-2">{r.reservation_status || "N/A"}</td>
                        <td className="p-2">{r.return_date?.slice(0, 10) || "N/A"}</td>
                        <td className="p-2">{r.rental_fee || "N/A"}</td>
                        <td className="p-2">{r.rental_status || "N/A"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}

    </div>
  );
}