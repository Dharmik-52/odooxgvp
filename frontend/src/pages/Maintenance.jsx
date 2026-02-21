import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  Wrench, Plus, Search, Filter, X,
  Eye, Pencil, CheckCircle, Trash2,
  AlertTriangle, ChevronLeft, ChevronRight,
  RefreshCw, Calendar
} from "lucide-react";
import {
  getLogs, getStats, createLog,
  updateLog, resolveLog, deleteLog
} from "../api/maintenance.js";
import { getVehicles } from "../api/vehicles.js";
import { maintenanceSchema, validateForm as zodValidateForm } from '../utils/validation';

const SERVICE_TYPES = [
  "Oil Change", "Tire Replacement", "Engine Repair",
  "Brake Service", "Transmission", "Electrical",
  "Body Work", "Routine Checkup", "Other"
];

const SERVICE_COLORS = {
  "Oil Change": { bg: "rgba(59,130,246,0.15)", color: "#60a5fa" },
  "Tire Replacement": { bg: "rgba(249,115,22,0.15)", color: "#fb923c" },
  "Engine Repair": { bg: "rgba(239,68,68,0.15)", color: "#f87171" },
  "Brake Service": { bg: "rgba(234,179,8,0.15)", color: "#facc15" },
  "Transmission": { bg: "rgba(168,85,247,0.15)", color: "#c084fc" },
  "Electrical": { bg: "rgba(6,182,212,0.15)", color: "#22d3ee" },
  "Body Work": { bg: "rgba(236,72,153,0.15)", color: "#f472b6" },
  "Routine Checkup": { bg: "rgba(34,197,94,0.15)", color: "#4ade80" },
  "Other": { bg: "rgba(107,114,128,0.15)", color: "#9ca3af" },
};

const STATUS_STYLES = {
  "New": { bg: "rgba(107,114,128,0.15)", color: "#9ca3af", border: "#4b5563" },
  "In Progress": { bg: "rgba(234,179,8,0.15)", color: "#facc15", border: "#854d0e" },
  "Resolved": { bg: "rgba(34,197,94,0.15)", color: "#4ade80", border: "#166534" },
};

const EMPTY_FORM = {
  vehicle_id: "", issue: "", service_type: "",
  cost: "", service_date: new Date().toISOString().split("T")[0], notes: ""
};

function StatCard({ title, value, subtitle, icon: Icon, accentColor }) {
  return (
    <div style={{
      background: "#161B22",
      border: `1px solid ${accentColor || "#30363D"}`,
      borderRadius: "12px", padding: "20px"
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
        <Icon size={16} color={accentColor || "#9ca3af"} />
        <span style={{ color: "#9ca3af", fontSize: "13px" }}>{title}</span>
      </div>
      <div style={{ color: "white", fontSize: "28px", fontWeight: 700, marginBottom: "4px" }}>
        {value}
      </div>
      {subtitle && <div style={{ color: "#6b7280", fontSize: "12px" }}>{subtitle}</div>}
    </div>
  );
}

function StatusPill({ status }) {
  const s = STATUS_STYLES[status] || STATUS_STYLES["New"];
  return (
    <span style={{
      background: s.bg, color: s.color, border: `1px solid ${s.border}`,
      borderRadius: "20px", padding: "2px 10px",
      fontSize: "12px", fontWeight: 600, whiteSpace: "nowrap"
    }}>
      {status}
    </span>
  );
}

function ServicePill({ type }) {
  const s = SERVICE_COLORS[type] || SERVICE_COLORS["Other"];
  return (
    <span style={{
      background: s.bg, color: s.color,
      borderRadius: "6px", padding: "2px 8px",
      fontSize: "12px", fontWeight: 500, whiteSpace: "nowrap"
    }}>
      {type}
    </span>
  );
}

function Modal({ isOpen, onClose, title, subtitle, children, maxWidth = "520px" }) {
  useEffect(() => {
    const handleKey = (e) => { if (e.key === "Escape") onClose(); };
    if (isOpen) document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 100,
      background: "rgba(0,0,0,0.75)", display: "flex", alignItems: "center",
      justifyContent: "center", padding: "16px"
    }} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={{
        background: "#161B22", border: "1px solid #30363D",
        borderRadius: "16px", width: "100%",
        maxWidth, maxHeight: "90vh", overflowY: "auto"
      }}>
        <div style={{
          display: "flex", alignItems: "flex-start",
          justifyContent: "space-between", padding: "24px 24px 0"
        }}>
          <div>
            <h2 style={{ color: "white", fontSize: "18px", fontWeight: 700, margin: 0 }}>{title}</h2>
            {subtitle && <p style={{ color: "#9ca3af", fontSize: "13px", margin: "4px 0 0" }}>{subtitle}</p>}
          </div>
          <button onClick={onClose} style={{
            background: "none", border: "none", cursor: "pointer",
            color: "#9ca3af", padding: "4px", borderRadius: "6px", flexShrink: 0
          }}>
            <X size={20} />
          </button>
        </div>
        <div style={{ padding: "20px 24px 24px" }}>{children}</div>
      </div>
    </div>
  );
}

function Field({ label, children, error }) {
  return (
    <div style={{ marginBottom: "16px" }}>
      <label style={{ display: "block", color: "#d1d5db", fontSize: "13px", fontWeight: 500, marginBottom: "6px" }}>{label}</label>
      {children}
      {error && <p style={{ color: "#f87171", fontSize: "12px", marginTop: "4px" }}>{error}</p>}
    </div>
  );
}

const inputStyle = {
  width: "100%", background: "#0D1117", border: "1px solid #30363D", borderRadius: "8px",
  color: "white", padding: "10px 14px", fontSize: "14px", outline: "none", boxSizing: "border-box"
};

export default function Maintenance() {
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showView, setShowView] = useState(false);
  const [showResolve, setShowResolve] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [selected, setSelected] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState({});

  const [search, setSearch] = useState("");
  const [statusF, setStatusF] = useState("");
  const [serviceTypeF, setServiceTypeF] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);
  const PER_PAGE = 10;

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page, per_page: PER_PAGE,
        ...(search && { search }),
        ...(statusF && { status: statusF }),
        ...(serviceTypeF && { service_type: serviceTypeF }),
        ...(dateFrom && { date_from: dateFrom }),
        ...(dateTo && { date_to: dateTo }),
      };
      const res = await getLogs(params);
      setLogs(res.data.items || []);
      setTotal(res.data.total || 0);
      setTotalPages(res.data.total_pages || 1);
    } catch { toast.error("Failed to load maintenance logs"); }
    finally { setLoading(false); }
  }, [page, search, statusF, serviceTypeF, dateFrom, dateTo]);

  const fetchStats = useCallback(async () => {
    try { const res = await getStats(); setStats(res.data); }
    catch { console.error("Stats load failed"); }
  }, []);

  const fetchVehicles = useCallback(async () => {
    try { const res = await getVehicles(); setVehicles(res.data.items || res.data || []); }
    catch { console.error("Vehicles load failed"); }
  }, []);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);
  useEffect(() => { fetchStats(); fetchVehicles(); }, []);
  useEffect(() => { setPage(1); }, [search, statusF, serviceTypeF, dateFrom, dateTo]);

  const setField = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const validateForm = () => {
    const data = {
      vehicle_id: String(form.vehicle_id),
      service_type: form.service_type,
      issue: form.issue || '',
      cost: String(form.cost || ''),
      service_date: form.service_date || '',
      notes: form.notes || '',
    };
    const { success, errors } = zodValidateForm(maintenanceSchema, data);
    setFormErrors(errors || {});
    return success;
  };

  const handleCreate = async () => {
    if (!validateForm()) return;
    setSubmitting(true);
    try {
      const payload = {
        vehicle_id: parseInt(form.vehicle_id),
        issue: form.issue.trim(),
        service_type: form.service_type,
        cost: parseFloat(form.cost) || 0,
        service_date: form.service_date,
        notes: form.notes.trim() || null
      };
      const res = await createLog(payload);
      const vName = res.data.vehicle_name;
      toast.success(`🔧 ${vName} marked as In Shop`);
      if (res.data.cost > 0) toast.success(`₹${res.data.cost} repair expense logged`);
      setShowCreate(false);
      setForm(EMPTY_FORM);
      setFormErrors({});
      await fetchLogs();
      await fetchStats();
    } catch (err) { toast.error(err.response?.data?.detail || "Failed to create log"); }
    finally { setSubmitting(false); }
  };

  const handleUpdate = async () => {
    if (!validateForm()) return;
    setSubmitting(true);
    try {
      const payload = {
        issue: form.issue.trim(),
        service_type: form.service_type,
        cost: parseFloat(form.cost) || 0,
        service_date: form.service_date,
        status: form.status,
        notes: form.notes?.trim() || null
      };
      const res = await updateLog(selected.id, payload);
      toast.success("Service log updated");
      if (res.data.new_vehicle_status) toast.success(`${res.data.vehicle_name} is now ${res.data.new_vehicle_status.replace("_", " ")}`);
      setShowEdit(false);
      setSelected(null);
      await fetchLogs();
      await fetchStats();
    } catch (err) { toast.error(err.response?.data?.detail || "Failed to update log"); }
    finally { setSubmitting(false); }
  };

  const handleResolve = async () => {
    if (!selected) return;
    setSubmitting(true);
    try {
      const res = await resolveLog(selected.id);
      const msg = res.data.vehicle_available
        ? `✅ Resolved! ${res.data.vehicle_name} is now Available`
        : `✅ Resolved! ${res.data.vehicle_name} still In Shop (other active logs)`;
      toast.success(msg);
      setShowResolve(false);
      setSelected(null);
      await fetchLogs();
      await fetchStats();
    } catch (err) { toast.error(err.response?.data?.detail || "Failed to resolve log"); }
    finally { setSubmitting(false); }
  };

  const handleDelete = async () => {
    if (!selected) return;
    setSubmitting(true);
    try {
      await deleteLog(selected.id);
      toast.success("Log deleted");
      setShowDelete(false);
      setSelected(null);
      await fetchLogs();
      await fetchStats();
    } catch (err) { toast.error(err.response?.data?.detail || "Failed to delete log"); }
    finally { setSubmitting(false); }
  };

  const openEdit = (log) => {
    setSelected(log);
    setForm({
      vehicle_id: log.vehicle_id, issue: log.issue, service_type: log.service_type,
      cost: log.cost, service_date: log.service_date, notes: log.notes || "", status: log.status
    });
    setFormErrors({});
    setShowEdit(true);
  };

  const openView = (log) => { setSelected(log); setShowView(true); };
  const openResolve = (log) => { setSelected(log); setShowResolve(true); };
  const openDelete = (log) => { setSelected(log); setShowDelete(true); };

  const resetFilters = () => { setSearch(""); setStatusF(""); setServiceTypeF(""); setDateFrom(""); setDateTo(""); setPage(1); };
  const hasFilters = search || statusF || serviceTypeF || dateFrom || dateTo;

  const renderForm = (isEdit = false) => (
    <>
      {!isEdit ? (
        <Field label="Select Vehicle *" error={formErrors.vehicle_id}>
          <select value={form.vehicle_id} onChange={e => setField("vehicle_id", e.target.value)} style={{ ...inputStyle, cursor: "pointer" }}>
            <option value="">— Choose a vehicle —</option>
            {vehicles.map(v => <option key={v.id} value={v.id}>{v.name} ({v.license_plate}) — {v.status?.replace("_", " ")}</option>)}
          </select>
        </Field>
      ) : (
        <Field label="Vehicle">
          <div style={{ ...inputStyle, color: "#9ca3af", display: "flex", alignItems: "center", gap: "8px" }}>
            🔒 {selected?.vehicle_name} ({selected?.license_plate})
          </div>
        </Field>
      )}

      <Field label="Service Type *" error={formErrors.service_type}>
        <select value={form.service_type} onChange={e => setField("service_type", e.target.value)} style={{ ...inputStyle, cursor: "pointer" }}>
          <option value="">— Select service type —</option>
          {SERVICE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </Field>

      <Field label="Issue / Description *" error={formErrors.issue}>
        <textarea value={form.issue} onChange={e => setField("issue", e.target.value)} maxLength={500} rows={3}
          placeholder="Describe the problem..." style={{ ...inputStyle, resize: "vertical", minHeight: "80px" }} />
        <div style={{ color: "#6b7280", fontSize: "11px", textAlign: "right", marginTop: "2px" }}>{form.issue?.length || 0}/500</div>
      </Field>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
        <Field label="Estimated Cost (₹)">
          <input type="number" min="0" step="0.01" value={form.cost} onChange={e => setField("cost", e.target.value)} placeholder="0.00" style={inputStyle} />
        </Field>
        <Field label="Service Date *" error={formErrors.service_date}>
          <input type="date" value={form.service_date} onChange={e => setField("service_date", e.target.value)} style={inputStyle} />
        </Field>
      </div>

      {isEdit && (
        <Field label="Status">
          <select value={form.status} onChange={e => setField("status", e.target.value)} style={{ ...inputStyle, cursor: "pointer" }}>
            <option value="New">New</option>
            <option value="In Progress">In Progress</option>
            <option value="Resolved">Resolved</option>
          </select>
        </Field>
      )}

      <Field label="Notes (optional)">
        <textarea value={form.notes} onChange={e => setField("notes", e.target.value)} rows={2} placeholder="Additional info..." style={{ ...inputStyle, resize: "vertical" }} />
      </Field>

      {!isEdit && (
        <div style={{ background: "rgba(234,179,8,0.08)", border: "1px solid rgba(234,179,8,0.3)", borderRadius: "8px", padding: "12px", display: "flex", gap: "10px", alignItems: "flex-start" }}>
          <AlertTriangle size={16} color="#facc15" style={{ flexShrink: 0, marginTop: "1px" }} />
          <p style={{ color: "#fbbf24", fontSize: "13px", margin: 0 }}>Creating this log will immediately mark the vehicle as <strong>"In Shop"</strong>.</p>
        </div>
      )}
    </>
  );

  return (
    <div style={{ minHeight: "100vh", background: "#0D1117" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <h1 style={{ color: "white", fontSize: "24px", fontWeight: 700, margin: 0 }}>Maintenance Logs</h1>
          <p style={{ color: "#9ca3af", fontSize: "14px", margin: "4px 0 0" }}>Track vehicle health & service history</p>
        </div>
        <button onClick={() => { setForm(EMPTY_FORM); setFormErrors({}); setShowCreate(true); }}
          style={{ display: "flex", alignItems: "center", gap: "8px", background: "#4ade80", color: "black", border: "none", borderRadius: "8px", padding: "10px 18px", fontWeight: 600, fontSize: "14px", cursor: "pointer" }}>
          <Plus size={18} /> Create New Service
        </button>
      </div>

      {stats?.vehicles_in_shop > 0 && (
        <div style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "10px", padding: "14px 18px", marginBottom: "20px", display: "flex", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
          <AlertTriangle size={18} color="#f87171" />
          <span style={{ color: "#f87171", fontWeight: 600, fontSize: "14px" }}>{stats.vehicles_in_shop} vehicle(s) currently In Shop:</span>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
            {stats.in_shop_vehicles?.map(v => (
              <button key={v.id} style={{ background: "rgba(239,68,68,0.15)", color: "#f87171", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "20px", padding: "2px 10px", fontSize: "12px", fontWeight: 500, cursor: "pointer" }}>
                {v.name} ({v.license_plate})
              </button>
            ))}
          </div>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "16px", marginBottom: "24px" }}>
        <StatCard title="Total Logs" value={stats?.total_logs ?? "—"} icon={Wrench} subtitle="All time" />
        <StatCard title="In Shop Now" value={stats?.vehicles_in_shop ?? "—"} icon={AlertTriangle} accentColor="#f87171" subtitle="Unavailable" />
        <StatCard title="In Progress" value={stats?.in_progress_count ?? "—"} icon={RefreshCw} accentColor="#facc15" subtitle="Being serviced" />
        <StatCard title="Total Cost" value={stats ? `₹${stats.total_cost.toLocaleString()}` : "—"} icon={Calendar} accentColor="#4ade80" subtitle={`Avg ${stats?.avg_resolution_days ?? 0} days`} />
      </div>

      <div style={{ background: "#161B22", border: "1px solid #30363D", borderRadius: "10px", padding: "16px", marginBottom: "20px", display: "flex", flexWrap: "wrap", gap: "10px", alignItems: "center" }}>
        <div style={{ position: "relative", flex: "1", minWidth: "200px" }}>
          <Search size={15} color="#9ca3af" style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)" }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search vehicle, issue..." style={{ ...inputStyle, paddingLeft: "36px", background: "#0D1117" }} />
        </div>
        <select value={serviceTypeF} onChange={e => setServiceTypeF(e.target.value)} style={{ ...inputStyle, width: "auto", minWidth: "160px", cursor: "pointer" }}>
          <option value="">All Service Types</option>
          {SERVICE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <select value={statusF} onChange={e => setStatusF(e.target.value)} style={{ ...inputStyle, width: "auto", minWidth: "130px", cursor: "pointer" }}>
          <option value="">All Statuses</option>
          <option value="New">New</option>
          <option value="In Progress">In Progress</option>
          <option value="Resolved">Resolved</option>
        </select>
        <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} style={{ ...inputStyle, width: "auto" }} />
        <span style={{ color: "#9ca3af", fontSize: "13px" }}>to</span>
        <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} style={{ ...inputStyle, width: "auto" }} />
        {hasFilters && (
          <button onClick={resetFilters} style={{ display: "flex", alignItems: "center", gap: "6px", background: "rgba(239,68,68,0.1)", color: "#f87171", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "8px", padding: "10px 14px", fontSize: "13px", cursor: "pointer" }}>
            <X size={14} /> Reset
          </button>
        )}
      </div>

      <div style={{ background: "#161B22", border: "1px solid #30363D", borderRadius: "12px", overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", minWidth: "900px", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #30363D", background: "#0D1117" }}>
                {["#", "Vehicle", "Service Type", "Issue", "Date", "Cost", "Status", "Days", "Actions"].map(h => (
                  <th key={h} style={{ color: "#9ca3af", fontSize: "12px", fontWeight: 600, textAlign: "left", padding: "12px 16px", whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}>
                    {[...Array(9)].map((_, j) => (
                      <td key={j} style={{ padding: "16px" }}><div style={{ height: "16px", background: "#30363D", borderRadius: "4px", animation: "pulse 1.5s ease-in-out infinite" }} /></td>
                    ))}
                  </tr>
                ))
              ) : logs.length === 0 ? (
                <tr><td colSpan={9} style={{ textAlign: "center", padding: "48px", color: "#6b7280" }}><Wrench size={40} color="#374151" style={{ marginBottom: "12px" }} /><p style={{ margin: 0, fontSize: "15px" }}>No maintenance logs found</p></td></tr>
              ) : (
                logs.map((log, idx) => (
                  <tr key={log.id} style={{ borderBottom: "1px solid #1f2937", transition: "background 0.15s" }}
                    onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.02)"}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                    <td style={{ padding: "14px 16px", color: "#6b7280", fontSize: "13px" }}>{(page - 1) * PER_PAGE + idx + 1}</td>
                    <td style={{ padding: "14px 16px" }}><div style={{ color: "white", fontWeight: 600, fontSize: "14px" }}>{log.vehicle_name}</div><div style={{ color: "#6b7280", fontSize: "12px", fontFamily: "monospace" }}>{log.license_plate}</div></td>
                    <td style={{ padding: "14px 16px" }}><ServicePill type={log.service_type} /></td>
                    <td style={{ padding: "14px 16px", color: "#d1d5db", fontSize: "13px", maxWidth: "200px" }}><div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={log.issue}>{log.issue}</div></td>
                    <td style={{ padding: "14px 16px", color: "#9ca3af", fontSize: "13px", whiteSpace: "nowrap" }}>{new Date(log.service_date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</td>
                    <td style={{ padding: "14px 16px", color: "#4ade80", fontSize: "13px", fontWeight: 600 }}>₹{(log.cost || 0).toLocaleString()}</td>
                    <td style={{ padding: "14px 16px" }}><StatusPill status={log.status} /></td>
                    <td style={{ padding: "14px 16px", color: log.status !== "Resolved" && log.days_open > 7 ? "#f87171" : "#9ca3af", fontSize: "13px", fontWeight: log.days_open > 7 ? 600 : 400 }}>{log.days_open}d</td>
                    <td style={{ padding: "14px 16px" }}>
                      <div style={{ display: "flex", gap: "6px" }}>
                        <button onClick={() => openView(log)} title="View" style={{ background: "rgba(96,165,250,0.1)", color: "#60a5fa", border: "none", borderRadius: "6px", padding: "6px", cursor: "pointer" }}><Eye size={15} /></button>
                        <button onClick={() => openEdit(log)} title="Edit" style={{ background: "rgba(250,204,21,0.1)", color: "#facc15", border: "none", borderRadius: "6px", padding: "6px", cursor: "pointer" }}><Pencil size={15} /></button>
                        {log.status !== "Resolved" && <button onClick={() => openResolve(log)} title="Resolve" style={{ background: "rgba(74,222,128,0.1)", color: "#4ade80", border: "none", borderRadius: "6px", padding: "6px", cursor: "pointer" }}><CheckCircle size={15} /></button>}
                        {log.status === "New" && <button onClick={() => openDelete(log)} title="Delete" style={{ background: "rgba(239,68,68,0.1)", color: "#f87171", border: "none", borderRadius: "6px", padding: "6px", cursor: "pointer" }}><Trash2 size={15} /></button>}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 20px", borderTop: "1px solid #30363D", flexWrap: "wrap", gap: "10px" }}>
          <span style={{ color: "#9ca3af", fontSize: "13px" }}>Showing {Math.min((page - 1) * PER_PAGE + 1, total)}–{Math.min(page * PER_PAGE, total)} of {total} records</span>
          <div style={{ display: "flex", gap: "6px" }}>
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} style={{ background: page === 1 ? "#1f2937" : "#161B22", color: page === 1 ? "#4b5563" : "#9ca3af", border: "1px solid #30363D", borderRadius: "6px", padding: "6px 12px", cursor: page === 1 ? "not-allowed" : "pointer" }}><ChevronLeft size={16} /></button>
            {[...Array(totalPages)].map((_, i) => (
              <button key={i} onClick={() => setPage(i + 1)} style={{ background: page === i + 1 ? "rgba(74,222,128,0.2)" : "#161B22", color: page === i + 1 ? "#4ade80" : "#9ca3af", border: `1px solid ${page === i + 1 ? "#4ade80" : "#30363D"}`, borderRadius: "6px", padding: "6px 12px", cursor: "pointer", fontWeight: page === i + 1 ? 600 : 400 }}>{i + 1}</button>
            ))}
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} style={{ background: page === totalPages ? "#1f2937" : "#161B22", color: page === totalPages ? "#4b5563" : "#9ca3af", border: "1px solid #30363D", borderRadius: "6px", padding: "6px 12px", cursor: page === totalPages ? "not-allowed" : "pointer" }}><ChevronRight size={16} /></button>
          </div>
        </div>
      </div>

      <Modal isOpen={showCreate} onClose={() => { setShowCreate(false); setFormErrors({}); }} title="Log New Service" subtitle="Vehicle will be marked In Shop immediately">
        {renderForm(false)}
        <div style={{ display: "flex", gap: "10px", marginTop: "8px" }}>
          <button onClick={() => setShowCreate(false)} style={{ flex: 1, padding: "11px", background: "transparent", border: "1px solid #30363D", borderRadius: "8px", color: "#9ca3af", cursor: "pointer", fontSize: "14px" }}>Cancel</button>
          <button onClick={handleCreate} disabled={submitting} style={{ flex: 2, padding: "11px", background: submitting ? "#166534" : "#4ade80", color: "black", border: "none", borderRadius: "8px", fontWeight: 600, cursor: submitting ? "wait" : "pointer", fontSize: "14px" }}>{submitting ? "Creating..." : "Create Service Log"}</button>
        </div>
      </Modal>

      <Modal isOpen={showEdit} onClose={() => { setShowEdit(false); setFormErrors({}); }} title={`Edit Service Log #${selected?.id}`}>
        {renderForm(true)}
        <div style={{ display: "flex", gap: "10px", marginTop: "8px" }}>
          <button onClick={() => setShowEdit(false)} style={{ flex: 1, padding: "11px", background: "transparent", border: "1px solid #30363D", borderRadius: "8px", color: "#9ca3af", cursor: "pointer", fontSize: "14px" }}>Cancel</button>
          <button onClick={handleUpdate} disabled={submitting} style={{ flex: 2, padding: "11px", background: submitting ? "#713f12" : "#facc15", color: "black", border: "none", borderRadius: "8px", fontWeight: 600, cursor: submitting ? "wait" : "pointer", fontSize: "14px" }}>{submitting ? "Saving..." : "Save Changes"}</button>
        </div>
      </Modal>

      <Modal isOpen={showView} onClose={() => setShowView(false)} title="Service Log Details">
        {selected && (
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px" }}>
              <ServicePill type={selected.service_type} />
              <StatusPill status={selected.status} />
            </div>
            {[["Vehicle", `${selected.vehicle_name} (${selected.license_plate})`], ["Date", new Date(selected.service_date).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" })], ["Cost", `₹ ${(selected.cost || 0).toLocaleString()}`], ["Days Open", `${selected.days_open} days`]].map(([label, value]) => (
              <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid #1f2937" }}>
                <span style={{ color: "#9ca3af", fontSize: "13px" }}>{label}</span>
                <span style={{ color: "white", fontSize: "13px", fontWeight: 500 }}>{value}</span>
              </div>
            ))}
            <div style={{ marginTop: "16px" }}><p style={{ color: "#9ca3af", fontSize: "12px", marginBottom: "6px" }}>ISSUE</p><p style={{ color: "#d1d5db", fontSize: "14px", lineHeight: "1.6" }}>{selected.issue}</p></div>
            {selected.notes && <div style={{ marginTop: "14px" }}><p style={{ color: "#9ca3af", fontSize: "12px", marginBottom: "6px" }}>NOTES</p><p style={{ color: "#d1d5db", fontSize: "14px", lineHeight: "1.6" }}>{selected.notes}</p></div>}
            <div style={{ marginTop: "16px", padding: "12px", background: "#0D1117", borderRadius: "8px" }}>
              <p style={{ color: "#6b7280", fontSize: "12px", margin: "0 0 4px" }}>Created: {new Date(selected.created_at).toLocaleString("en-IN")}</p>
              <p style={{ color: "#6b7280", fontSize: "12px", margin: 0 }}>Resolved: {selected.resolved_at ? new Date(selected.resolved_at).toLocaleString("en-IN") : "—"}</p>
            </div>
            <div style={{ display: "flex", gap: "8px", marginTop: "20px" }}>
              {selected.status !== "Resolved" && <button onClick={() => { setShowView(false); openResolve(selected); }} style={{ flex: 1, padding: "10px", background: "rgba(74,222,128,0.1)", color: "#4ade80", border: "1px solid rgba(74,222,128,0.3)", borderRadius: "8px", cursor: "pointer", fontSize: "13px", fontWeight: 600 }}>✅ Resolve</button>}
              <button onClick={() => { setShowView(false); openEdit(selected); }} style={{ flex: 1, padding: "10px", background: "rgba(250,204,21,0.1)", color: "#facc15", border: "1px solid rgba(250,204,21,0.3)", borderRadius: "8px", cursor: "pointer", fontSize: "13px", fontWeight: 600 }}>✏️ Edit</button>
              <button onClick={() => setShowView(false)} style={{ flex: 1, padding: "10px", background: "transparent", border: "1px solid #30363D", color: "#9ca3af", borderRadius: "8px", cursor: "pointer", fontSize: "13px" }}>Close</button>
            </div>
          </div>
        )}
      </Modal>

      <Modal isOpen={showResolve} onClose={() => setShowResolve(false)} title="Resolve Service Log?" maxWidth="420px">
        {selected && (
          <div>
            <p style={{ color: "#d1d5db", fontSize: "14px", lineHeight: "1.6", marginBottom: "16px" }}>Marking <strong style={{ color: "white" }}>#{selected.id} — {selected.service_type}</strong> as resolved.</p>
            <div style={{ background: "rgba(74,222,128,0.08)", border: "1px solid rgba(74,222,128,0.2)", borderRadius: "8px", padding: "12px", marginBottom: "20px" }}>
              <p style={{ color: "#4ade80", fontSize: "13px", margin: 0 }}>ℹ️ If this is the only active log, <strong>{selected.vehicle_name}</strong> will automatically become <strong>Available</strong>.</p>
            </div>
            <div style={{ display: "flex", gap: "10px" }}>
              <button onClick={() => setShowResolve(false)} style={{ flex: 1, padding: "11px", background: "transparent", border: "1px solid #30363D", borderRadius: "8px", color: "#9ca3af", cursor: "pointer", fontSize: "14px" }}>Cancel</button>
              <button onClick={handleResolve} disabled={submitting} style={{ flex: 2, padding: "11px", background: submitting ? "#166534" : "#4ade80", color: "black", border: "none", borderRadius: "8px", fontWeight: 600, cursor: submitting ? "wait" : "pointer", fontSize: "14px" }}>{submitting ? "Resolving..." : "Yes, Resolve It"}</button>
            </div>
          </div>
        )}
      </Modal>

      <Modal isOpen={showDelete} onClose={() => setShowDelete(false)} title="Delete Service Log?" maxWidth="400px">
        {selected && (
          <div>
            <p style={{ color: "#d1d5db", fontSize: "14px", lineHeight: "1.6", marginBottom: "20px" }}>Are you sure you want to delete log <strong style={{ color: "white" }}>#{selected.id}</strong> for <strong style={{ color: "white" }}>{selected.vehicle_name}</strong>?</p>
            <div style={{ display: "flex", gap: "10px" }}>
              <button onClick={() => setShowDelete(false)} style={{ flex: 1, padding: "11px", background: "transparent", border: "1px solid #30363D", borderRadius: "8px", color: "#9ca3af", cursor: "pointer", fontSize: "14px" }}>Cancel</button>
              <button onClick={handleDelete} disabled={submitting} style={{ flex: 2, padding: "11px", background: submitting ? "#7f1d1d" : "#ef4444", color: "white", border: "none", borderRadius: "8px", fontWeight: 600, cursor: submitting ? "wait" : "pointer", fontSize: "14px" }}>{submitting ? "Deleting..." : "Delete Log"}</button>
            </div>
          </div>
        )}
      </Modal>

      <style>{`@keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.4; } }`}</style>
    </div>
  );
}
