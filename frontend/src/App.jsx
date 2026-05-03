import { useEffect, useState } from "react";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:4000/api";
const SESSION_KEY = "rapido_session";
const statusFlow = ["Picked Up", "In Transit", "Delivered"];

const defaultCustomerRegister = { fullName: "", phone: "", email: "", password: "" };

const defaultPartnerRegister = {
  fullName: "", phone: "", email: "", password: "",
  aadhaar: "", pan: "", licenseNumber: "", address: "", bankAccount: "",
  distanceAwayKm: 1, vehicleType: "bike", vehicleNumber: "", rcNumber: "",
  insuranceNumber: "", riderFullName: "", riderPhone: "",
  riderLicenseNumber: "", riderEmergencyContact: ""
};

const defaultLogin = { phone: "", password: "" };

function api(path, options = {}) {
  return fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options
  }).then(async (response) => {
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload.message || "Request failed");
    return payload;
  });
}

function Icon({ name, size = 18 }) {
  const icons = {
    user: <><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></>,
    truck: <><rect x="1" y="3" width="15" height="13" rx="2"/><path d="M16 8h4l3 3v5h-7"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></>,
    shield: <><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></>,
    package: <><line x1="16.5" y1="9.4" x2="7.5" y2="4.21"/><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></>,
    mapPin: <><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></>,
    phone: <><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.62 3.38 2 2 0 0 1 3.6 1.26h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.91 9a16 16 0 0 0 6.1 6.1l.51-2a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 21 16.92z"/></>,
    clock: <><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></>,
    checkCircle: <><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></>,
    xCircle: <><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></>,
    alertCircle: <><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></>,
    trending: <><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></>,
    activity: <><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></>,
    users: <><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></>,
    dollar: <><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></>,
    logout: <><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></>,
    chevronDown: <polyline points="6 9 12 15 18 9"/>,
    chevronUp: <polyline points="18 15 12 9 6 15"/>,
    plus: <><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></>,
    minus: <line x1="5" y1="12" x2="19" y2="12"/>,
    eye: <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>,
    car: <><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></>,
    star: <><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></>,
    check: <polyline points="20 6 9 17 4 12"/>,
  };

  return (
    <svg
      className="icon"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {icons[name] || icons.package}
    </svg>
  );
}

function ToastContainer({ toasts, removeToast }) {
  return (
    <div className="toast-container">
      {toasts.map((toast) => (
        <div key={toast.id} className={`toast toast-${toast.type}`} role="alert">
          <span className="toast-icon">
            <Icon name={toast.type === "error" ? "alertCircle" : "checkCircle"} size={16} />
          </span>
          <span className="toast-message">{toast.message}</span>
          <button className="toast-close" onClick={() => removeToast(toast.id)} aria-label="Close">
            <Icon name="xCircle" size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}

function StatusBadge({ status }) {
  const map = {
    "Created": "badge-created",
    "Picked Up": "badge-picked",
    "In Transit": "badge-transit",
    "Delivered": "badge-delivered",
    "Cancelled": "badge-cancelled",
    "Pending": "badge-pending",
    "Approved": "badge-approved",
    "Rejected": "badge-rejected",
    "Online": "badge-online",
    "Offline": "badge-offline",
  };
  return <span className={`status-badge ${map[status] || "badge-default"}`}>{status}</span>;
}

function DeliveryProgress({ status }) {
  const steps = ["Created", "Picked Up", "In Transit", "Delivered"];
  const current = steps.indexOf(status);
  const cancelled = status === "Cancelled";

  return (
    <div className={`delivery-progress${cancelled ? " progress-cancelled" : ""}`}>
      {cancelled ? (
        <div className="cancelled-track">
          <Icon name="xCircle" size={14} />
          <span>Cancelled</span>
        </div>
      ) : (
        steps.map((step, i) => (
          <div key={step} className={`prog-step${i <= current ? " step-done" : ""}${i === current ? " step-active" : ""}`}>
            <div className="prog-dot">
              {i < current && <Icon name="check" size={9} />}
            </div>
            {i < steps.length - 1 && <div className="prog-line" />}
            <span className="prog-label">{step}</span>
          </div>
        ))
      )}
    </div>
  );
}

function MetricCard({ label, value, accent, icon }) {
  return (
    <div className="metric-card" style={{ "--accent": accent }}>
      <div className="metric-icon-wrap">
        <Icon name={icon || "activity"} size={20} />
      </div>
      <div className="metric-body">
        <span className="metric-label">{label}</span>
        <strong className="metric-value">{value}</strong>
      </div>
    </div>
  );
}

function SectionTitle({ eyebrow, title, subtitle }) {
  return (
    <div className="section-title">
      <p className="section-eyebrow">{eyebrow}</p>
      <h2 className="section-heading">{title}</h2>
      {subtitle && <span className="section-sub">{subtitle}</span>}
    </div>
  );
}

function DetailRow({ label, value }) {
  return (
    <div className="detail-row">
      <strong>{label}</strong>
      <span>{value || "—"}</span>
    </div>
  );
}

function toRadians(v) { return (Number(v) * Math.PI) / 180; }

function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

function estimateRoadKmFromCoords(lat1, lng1, lat2, lng2) {
  return Math.max(0.5, Number((haversineKm(lat1, lng1, lat2, lng2) * 1.3).toFixed(2)));
}

function formatDate(value) {
  return new Date(value).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

function Spinner() {
  return <span className="spinner" aria-hidden="true" />;
}

export default function App() {
  const [selectedRole, setSelectedRole] = useState("customer");
  const [authMode, setAuthMode] = useState("login");
  const [session, setSession] = useState(null);
  const [view, setView] = useState(null);
  const [busy, setBusy] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [loginForm, setLoginForm] = useState(defaultLogin);
  const [customerRegisterForm, setCustomerRegisterForm] = useState(defaultCustomerRegister);
  const [partnerRegisterForm, setPartnerRegisterForm] = useState(defaultPartnerRegister);
  const [bookingForm, setBookingForm] = useState({
    pickupAddress: "", pickupDetails: "", pickupLat: null, pickupLng: null,
    dropAddress: "", dropDetails: "", dropLat: null, dropLng: null,
    distanceKm: 0, weightKg: 2, vehicleType: "bike",
    zoneId: "zone-andheri-west", paymentMethod: "Online"
  });
  const [estimate, setEstimate] = useState(null);
  const [vehicleForm, setVehicleForm] = useState({ vehicleType: "bike", vehicleNumber: "", rcNumber: "", insuranceNumber: "" });
  const [riderForm, setRiderForm] = useState({ fullName: "", phone: "", licenseNumber: "", emergencyContact: "" });
  const [selectedRiders, setSelectedRiders] = useState({});
  const [cancelReasons, setCancelReasons] = useState({});
  const [expandedDeliveries, setExpandedDeliveries] = useState({});
  const [pickupSuggestions, setPickupSuggestions] = useState([]);
  const [dropSuggestions, setDropSuggestions] = useState([]);
  const [showPickupSuggestions, setShowPickupSuggestions] = useState(false);
  const [showDropSuggestions, setShowDropSuggestions] = useState(false);

  function addToast(message, type = "error") {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => removeToast(id), 5000);
  }

  function removeToast(id) {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }

  useEffect(() => {
    const query = bookingForm.pickupAddress?.trim();
    if (!showPickupSuggestions || !query || query.length < 3) { setPickupSuggestions([]); return; }
    const timer = setTimeout(() => {
      fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&limit=6&q=${encodeURIComponent(query)}`)
        .then(r => r.json())
        .then(data => setPickupSuggestions(Array.isArray(data) ? data.map(i => ({ label: i.display_name, lat: Number(i.lat), lng: Number(i.lon) })) : []))
        .catch(() => setPickupSuggestions([]));
    }, 350);
    return () => clearTimeout(timer);
  }, [bookingForm.pickupAddress, showPickupSuggestions]);

  useEffect(() => {
    const query = bookingForm.dropAddress?.trim();
    if (!showDropSuggestions || !query || query.length < 3) { setDropSuggestions([]); return; }
    const timer = setTimeout(() => {
      fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&limit=6&q=${encodeURIComponent(query)}`)
        .then(r => r.json())
        .then(data => setDropSuggestions(Array.isArray(data) ? data.map(i => ({ label: i.display_name, lat: Number(i.lat), lng: Number(i.lon) })) : []))
        .catch(() => setDropSuggestions([]));
    }, 350);
    return () => clearTimeout(timer);
  }, [bookingForm.dropAddress, showDropSuggestions]);

  async function loadSession(role, userId) {
    const payload = await api(`/session?role=${role}&userId=${userId}`);
    setSession({ role, userId });
    setView(payload);
    localStorage.setItem(SESSION_KEY, JSON.stringify({ role, userId }));
  }

  useEffect(() => {
    const saved = localStorage.getItem(SESSION_KEY);
    if (!saved) return;
    const parsed = JSON.parse(saved);
    loadSession(parsed.role, parsed.userId).catch(() => localStorage.removeItem(SESSION_KEY));
  }, []);

  async function handleLogin() {
    setBusy(true);
    try {
      const user = await api("/auth/login", { method: "POST", body: JSON.stringify({ ...loginForm, role: selectedRole }) });
      await loadSession(user.role, user.id);
      addToast(`Welcome back!`, "success");
    } catch (e) { addToast(e.message); }
    finally { setBusy(false); }
  }

  async function handleCustomerRegister() {
    setBusy(true);
    try {
      const user = await api("/auth/register-customer", { method: "POST", body: JSON.stringify(customerRegisterForm) });
      await loadSession(user.role, user.id);
      addToast("Account created successfully!", "success");
    } catch (e) { addToast(e.message); }
    finally { setBusy(false); }
  }

  async function handlePartnerRegister() {
    setBusy(true);
    try {
      const user = await api("/auth/register-partner", { method: "POST", body: JSON.stringify(partnerRegisterForm) });
      await loadSession(user.role, user.id);
      addToast("Partner registered successfully!", "success");
    } catch (e) { addToast(e.message); }
    finally { setBusy(false); }
  }

  async function geocodeNominatim(query) {
    const q = String(query || "").trim();
    if (q.length < 3) return null;
    const response = await fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=${encodeURIComponent(q)}`);
    const data = await response.json().catch(() => []);
    const first = Array.isArray(data) ? data[0] : null;
    if (!first?.lat || !first?.lon) return null;
    return { label: first.display_name, lat: Number(first.lat), lng: Number(first.lon) };
  }

  async function ensureAutoDistance() {
    let { pickupLat, pickupLng, dropLat, dropLng } = bookingForm;
    if (!pickupLat || !pickupLng) {
      const p = await geocodeNominatim(bookingForm.pickupAddress);
      if (p) { pickupLat = p.lat; pickupLng = p.lng; }
    }
    if (!dropLat || !dropLng) {
      const p = await geocodeNominatim(bookingForm.dropAddress);
      if (p) { dropLat = p.lat; dropLng = p.lng; }
    }
    if (!pickupLat || !pickupLng || !dropLat || !dropLng) {
      throw new Error("Could not calculate distance. Please choose from suggestions or enter a more specific address.");
    }
    const distanceKm = estimateRoadKmFromCoords(pickupLat, pickupLng, dropLat, dropLng);
    const next = { ...bookingForm, pickupLat, pickupLng, dropLat, dropLng, distanceKm };
    setBookingForm(next);
    return next;
  }

  async function estimateFare() {
    setBusy(true);
    try {
      const nextForm = await ensureAutoDistance();
      const payload = await api("/bookings/estimate", { method: "POST", body: JSON.stringify(nextForm) });
      setEstimate(payload);
    } catch (e) { addToast(e.message); }
    finally { setBusy(false); }
  }

  async function createBooking() {
    setBusy(true);
    try {
      const nextForm = await ensureAutoDistance();
      await api("/deliveries", { method: "POST", body: JSON.stringify({ ...nextForm, customerId: session.userId }) });
      setEstimate(null);
      await loadSession(session.role, session.userId);
      addToast("Booking created!", "success");
    } catch (e) { addToast(e.message); }
    finally { setBusy(false); }
  }

  async function toggleAvailability() {
    try {
      await api(`/partners/${session.userId}/toggle-availability`, { method: "PATCH" });
      await loadSession(session.role, session.userId);
    } catch (e) { addToast(e.message); }
  }

  async function addVehicle() {
    setBusy(true);
    try {
      await api(`/partners/${session.userId}/vehicles`, { method: "POST", body: JSON.stringify(vehicleForm) });
      setVehicleForm({ vehicleType: "bike", vehicleNumber: "", rcNumber: "", insuranceNumber: "" });
      await loadSession(session.role, session.userId);
      addToast("Vehicle added!", "success");
    } catch (e) { addToast(e.message); }
    finally { setBusy(false); }
  }

  async function addRider() {
    setBusy(true);
    try {
      await api(`/partners/${session.userId}/riders`, { method: "POST", body: JSON.stringify(riderForm) });
      setRiderForm({ fullName: "", phone: "", licenseNumber: "", emergencyContact: "" });
      await loadSession(session.role, session.userId);
      addToast("Rider added!", "success");
    } catch (e) { addToast(e.message); }
    finally { setBusy(false); }
  }

  async function updateDeliveryStatus(deliveryId, status) {
    try {
      await api(`/deliveries/${deliveryId}/status`, { method: "PATCH", body: JSON.stringify({ status }) });
      await loadSession(session.role, session.userId);
      addToast(`Status updated to ${status}`, "success");
    } catch (e) { addToast(e.message); }
  }

  async function acceptDelivery(deliveryId) {
    try {
      await api(`/deliveries/${deliveryId}/accept`, {
        method: "PATCH",
        body: JSON.stringify({ partnerId: session.userId, riderId: selectedRiders[deliveryId] || view.profile.riders[0]?.id || null })
      });
      await loadSession(session.role, session.userId);
      addToast("Job accepted!", "success");
    } catch (e) { addToast(e.message); }
  }

  async function assignDelivery(deliveryId, partnerId) {
    try {
      await api(`/deliveries/${deliveryId}/assign`, { method: "PATCH", body: JSON.stringify({ partnerId }) });
      await loadSession(session.role, session.userId);
      addToast("Partner assigned!", "success");
    } catch (e) { addToast(e.message); }
  }

  async function cancelDelivery(deliveryId) {
    try {
      await api(`/deliveries/${deliveryId}/cancel`, {
        method: "PATCH",
        body: JSON.stringify({ actorRole: session.role, actorId: session.userId, reason: cancelReasons[deliveryId] || "No reason provided" })
      });
      await loadSession(session.role, session.userId);
      addToast("Delivery cancelled", "success");
    } catch (e) { addToast(e.message); }
  }

  async function updatePartnerVerification(partnerId, verificationStatus) {
    try {
      await api(`/partners/${partnerId}/verification`, { method: "PATCH", body: JSON.stringify({ verificationStatus }) });
      await loadSession(session.role, session.userId);
      addToast(`Partner ${verificationStatus.toLowerCase()}`, "success");
    } catch (e) { addToast(e.message); }
  }

  function logout() {
    localStorage.removeItem(SESSION_KEY);
    setSession(null);
    setView(null);
    setLoginForm(defaultLogin);
  }

  function setCancelReason(id, val) { setCancelReasons(p => ({ ...p, [id]: val })); }
  function setSelectedRider(id, rid) { setSelectedRiders(p => ({ ...p, [id]: rid })); }
  function toggleDeliveryExpansion(id) { setExpandedDeliveries(p => ({ ...p, [id]: !p[id] })); }

  // ─── AUTH VIEW ────────────────────────────────────────────────────────────────
  if (!view) {
    const roles = [
      { id: "customer", icon: "user", label: "Customer", desc: "Book & track deliveries" },
      { id: "partner", icon: "truck", label: "Partner", desc: "Manage riders & earn" },
      { id: "admin", icon: "shield", label: "Admin", desc: "Operations control" },
    ];

    return (
      <div className="auth-shell">
        <ToastContainer toasts={toasts} removeToast={removeToast} />

        <div className="auth-brand">
          <div className="brand-logo-row">
            <div className="brand-orb">R</div>
            <span className="brand-name">Rapido</span>
          </div>
          <h1 className="brand-headline">Delivery,<br />reinvented.</h1>
          <p className="brand-tagline">
            A multi-role platform — customers book, partners deliver,
            admins orchestrate.
          </p>

          <div className="role-cards-vertical">
            {roles.map((r) => (
              <button
                key={r.id}
                className={`role-pick-card${selectedRole === r.id ? " role-pick-active" : ""}`}
                onClick={() => { setSelectedRole(r.id); if (r.id === "admin") setAuthMode("login"); }}
              >
                <span className="role-pick-icon"><Icon name={r.icon} size={20} /></span>
                <span className="role-pick-text">
                  <strong>{r.label}</strong>
                  <span>{r.desc}</span>
                </span>
                {selectedRole === r.id && <span className="role-pick-check"><Icon name="checkCircle" size={16} /></span>}
              </button>
            ))}
          </div>

          <div className="brand-chips">
            <span className="brand-chip"><Icon name="checkCircle" size={12} /> OTP-style flow</span>
            <span className="brand-chip"><Icon name="phone" size={12} /> Rider contact visible</span>
            <span className="brand-chip"><Icon name="star" size={12} /> Self-onboarding</span>
          </div>
        </div>

        <div className="auth-form-side">
          <div className="auth-form-card">
            <div className="auth-form-header">
              <div className={`auth-role-badge auth-role-badge-${selectedRole}`}>
                <Icon name={roles.find(r => r.id === selectedRole)?.icon || "user"} size={14} />
                {selectedRole}
              </div>
              <h2 className="auth-form-title">
                {selectedRole === "admin" ? "Admin login" : authMode === "login" ? "Welcome back" : `Register as ${selectedRole}`}
              </h2>
              <p className="auth-form-sub">
                {selectedRole === "admin"
                  ? "Restricted to authorized staff"
                  : authMode === "login"
                  ? "Sign in to your account"
                  : "Create your account in seconds"}
              </p>
            </div>

            {selectedRole !== "admin" && (
              <div className="auth-tab-row">
                <button className={`auth-tab${authMode === "login" ? " auth-tab-active" : ""}`} onClick={() => setAuthMode("login")}>Login</button>
                <button className={`auth-tab${authMode === "register" ? " auth-tab-active" : ""}`} onClick={() => setAuthMode("register")}>Register</button>
              </div>
            )}

            <div className="auth-form-scroll">
              {(authMode === "login" || selectedRole === "admin") && (
                <div className="field-stack">
                  <div className="field">
                    <label>Phone</label>
                    <div className="input-icon-wrap">
                      <span className="input-icon"><Icon name="phone" size={15} /></span>
                      <input
                        value={loginForm.phone}
                        onChange={(e) => setLoginForm({ ...loginForm, phone: e.target.value })}
                        placeholder="Enter phone number"
                        onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                      />
                    </div>
                  </div>
                  <div className="field">
                    <label>Password</label>
                    <input
                      type="password"
                      value={loginForm.password}
                      onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                      placeholder="Enter password"
                      onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                    />
                  </div>
                  <button className="btn-primary btn-full" onClick={handleLogin} disabled={busy}>
                    {busy && <Spinner />} {busy ? "Signing in…" : `Enter ${selectedRole} portal`}
                  </button>
                  {selectedRole === "admin" && (
                    <div className="form-hint-box">
                      <Icon name="alertCircle" size={13} />
                      <span>Seed: <code>9000000000</code> / <code>admin123</code></span>
                    </div>
                  )}
                </div>
              )}

              {selectedRole === "customer" && authMode === "register" && (
                <div className="field-stack">
                  <div className="field-row-2">
                    <div className="field">
                      <label>Full name</label>
                      <input value={customerRegisterForm.fullName} onChange={(e) => setCustomerRegisterForm({ ...customerRegisterForm, fullName: e.target.value })} placeholder="Your full name" />
                    </div>
                    <div className="field">
                      <label>Phone</label>
                      <input value={customerRegisterForm.phone} onChange={(e) => setCustomerRegisterForm({ ...customerRegisterForm, phone: e.target.value })} placeholder="Mobile number" />
                    </div>
                  </div>
                  <div className="field">
                    <label>Email</label>
                    <input type="email" value={customerRegisterForm.email} onChange={(e) => setCustomerRegisterForm({ ...customerRegisterForm, email: e.target.value })} placeholder="your@email.com" />
                  </div>
                  <div className="field">
                    <label>Password</label>
                    <input type="password" value={customerRegisterForm.password} onChange={(e) => setCustomerRegisterForm({ ...customerRegisterForm, password: e.target.value })} placeholder="Create password" />
                  </div>
                  <button className="btn-primary btn-full" onClick={handleCustomerRegister} disabled={busy}>
                    {busy && <Spinner />} {busy ? "Creating account…" : "Create customer account"}
                  </button>
                </div>
              )}

              {selectedRole === "partner" && authMode === "register" && (
                <div className="field-stack">
                  <div className="form-section-label">Partner Details</div>
                  <div className="field-row-2">
                    <div className="field">
                      <label>Full name</label>
                      <input value={partnerRegisterForm.fullName} onChange={(e) => setPartnerRegisterForm({ ...partnerRegisterForm, fullName: e.target.value })} placeholder="Your full name" />
                    </div>
                    <div className="field">
                      <label>Phone</label>
                      <input value={partnerRegisterForm.phone} onChange={(e) => setPartnerRegisterForm({ ...partnerRegisterForm, phone: e.target.value })} placeholder="Mobile number" />
                    </div>
                  </div>
                  <div className="field-row-2">
                    <div className="field">
                      <label>Email</label>
                      <input type="email" value={partnerRegisterForm.email} onChange={(e) => setPartnerRegisterForm({ ...partnerRegisterForm, email: e.target.value })} placeholder="your@email.com" />
                    </div>
                    <div className="field">
                      <label>Password</label>
                      <input type="password" value={partnerRegisterForm.password} onChange={(e) => setPartnerRegisterForm({ ...partnerRegisterForm, password: e.target.value })} placeholder="Create password" />
                    </div>
                  </div>
                  <div className="field-row-2">
                    <div className="field">
                      <label>Aadhaar</label>
                      <input value={partnerRegisterForm.aadhaar} onChange={(e) => setPartnerRegisterForm({ ...partnerRegisterForm, aadhaar: e.target.value })} placeholder="Aadhaar number" />
                    </div>
                    <div className="field">
                      <label>PAN</label>
                      <input value={partnerRegisterForm.pan} onChange={(e) => setPartnerRegisterForm({ ...partnerRegisterForm, pan: e.target.value })} placeholder="PAN card" />
                    </div>
                  </div>
                  <div className="field-row-2">
                    <div className="field">
                      <label>License number</label>
                      <input value={partnerRegisterForm.licenseNumber} onChange={(e) => setPartnerRegisterForm({ ...partnerRegisterForm, licenseNumber: e.target.value })} placeholder="DL number" />
                    </div>
                    <div className="field">
                      <label>Bank account</label>
                      <input value={partnerRegisterForm.bankAccount} onChange={(e) => setPartnerRegisterForm({ ...partnerRegisterForm, bankAccount: e.target.value })} placeholder="Account number" />
                    </div>
                  </div>
                  <div className="field-row-2">
                    <div className="field">
                      <label>Address</label>
                      <input value={partnerRegisterForm.address} onChange={(e) => setPartnerRegisterForm({ ...partnerRegisterForm, address: e.target.value })} placeholder="Full address" />
                    </div>
                    <div className="field">
                      <label>Distance away (km)</label>
                      <input type="number" value={partnerRegisterForm.distanceAwayKm} onChange={(e) => setPartnerRegisterForm({ ...partnerRegisterForm, distanceAwayKm: Number(e.target.value) })} />
                    </div>
                  </div>

                  <div className="form-section-label form-section-accent">Vehicle &amp; Rider Setup</div>
                  <div className="field-row-2">
                    <div className="field">
                      <label>Vehicle type</label>
                      <select value={partnerRegisterForm.vehicleType} onChange={(e) => setPartnerRegisterForm({ ...partnerRegisterForm, vehicleType: e.target.value })}>
                        <option value="bike">Bike</option>
                        <option value="scooter">Scooter</option>
                        <option value="ev-bike">EV Bike</option>
                      </select>
                    </div>
                    <div className="field">
                      <label>Vehicle number</label>
                      <input value={partnerRegisterForm.vehicleNumber} onChange={(e) => setPartnerRegisterForm({ ...partnerRegisterForm, vehicleNumber: e.target.value })} placeholder="MH01AB1234" />
                    </div>
                  </div>
                  <div className="field-row-2">
                    <div className="field">
                      <label>RC number</label>
                      <input value={partnerRegisterForm.rcNumber} onChange={(e) => setPartnerRegisterForm({ ...partnerRegisterForm, rcNumber: e.target.value })} placeholder="RC number" />
                    </div>
                    <div className="field">
                      <label>Insurance number</label>
                      <input value={partnerRegisterForm.insuranceNumber} onChange={(e) => setPartnerRegisterForm({ ...partnerRegisterForm, insuranceNumber: e.target.value })} placeholder="Policy number" />
                    </div>
                  </div>
                  <div className="field-row-2">
                    <div className="field">
                      <label>Rider full name</label>
                      <input value={partnerRegisterForm.riderFullName} onChange={(e) => setPartnerRegisterForm({ ...partnerRegisterForm, riderFullName: e.target.value })} placeholder="Rider name" />
                    </div>
                    <div className="field">
                      <label>Rider phone</label>
                      <input value={partnerRegisterForm.riderPhone} onChange={(e) => setPartnerRegisterForm({ ...partnerRegisterForm, riderPhone: e.target.value })} placeholder="Rider phone" />
                    </div>
                  </div>
                  <div className="field-row-2">
                    <div className="field">
                      <label>Rider license</label>
                      <input value={partnerRegisterForm.riderLicenseNumber} onChange={(e) => setPartnerRegisterForm({ ...partnerRegisterForm, riderLicenseNumber: e.target.value })} placeholder="DL number" />
                    </div>
                    <div className="field">
                      <label>Emergency contact</label>
                      <input value={partnerRegisterForm.riderEmergencyContact} onChange={(e) => setPartnerRegisterForm({ ...partnerRegisterForm, riderEmergencyContact: e.target.value })} placeholder="Emergency phone" />
                    </div>
                  </div>
                  <button className="btn-primary btn-full" onClick={handlePartnerRegister} disabled={busy}>
                    {busy && <Spinner />} {busy ? "Registering…" : "Register partner, vehicle & rider"}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── CUSTOMER VIEW ────────────────────────────────────────────────────────────
  if (session.role === "customer") {
    return (
      <div className="shell shell-customer">
        <ToastContainer toasts={toasts} removeToast={removeToast} />

        <nav className="topnav">
          <div className="topnav-brand">
            <div className="brand-orb brand-orb-sm">R</div>
            <span>Rapido</span>
          </div>
          <div className="topnav-center">
            <span className="role-pill role-pill-customer"><Icon name="user" size={12} /> Customer</span>
            <span className="topnav-name">{view.user.fullName}</span>
          </div>
          <button className="btn-ghost btn-icon-text" onClick={logout}>
            <Icon name="logout" size={15} /> Logout
          </button>
        </nav>

        <main className="dashboard-grid dashboard-grid-customer">
          {/* Booking panel */}
          <section className="panel panel-sticky">
            <SectionTitle eyebrow="New Booking" title="Book a delivery" subtitle="Bookings stay open until a partner accepts." />

            <div className="field-stack mt-16">
              <div className="field">
                <label><Icon name="mapPin" size={13} /> Pickup address</label>
                <div className="osm-field">
                  <input
                    value={bookingForm.pickupAddress}
                    onFocus={() => setShowPickupSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowPickupSuggestions(false), 150)}
                    onChange={(e) => { setBookingForm({ ...bookingForm, pickupAddress: e.target.value, pickupLat: null, pickupLng: null, distanceKm: 0 }); setShowPickupSuggestions(true); }}
                    placeholder="Type pickup address"
                  />
                  {showPickupSuggestions && pickupSuggestions.length > 0 && (
                    <div className="osm-dropdown">
                      {pickupSuggestions.map((item) => (
                        <button type="button" className="osm-item" key={item.label} onMouseDown={() => {
                          setBookingForm((cur) => {
                            const next = { ...cur, pickupAddress: item.label, pickupLat: item.lat, pickupLng: item.lng };
                            if (next.dropLat && next.dropLng) return { ...next, distanceKm: estimateRoadKmFromCoords(next.pickupLat, next.pickupLng, next.dropLat, next.dropLng) };
                            return next;
                          });
                          setShowPickupSuggestions(false);
                        }}>
                          <Icon name="mapPin" size={13} />
                          <span>{item.label}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="field">
                <label>Pickup details</label>
                <input value={bookingForm.pickupDetails} onChange={(e) => setBookingForm({ ...bookingForm, pickupDetails: e.target.value })} placeholder="Flat / wing / floor / landmark" />
              </div>

              <div className="field">
                <label><Icon name="mapPin" size={13} /> Drop address</label>
                <div className="osm-field">
                  <input
                    value={bookingForm.dropAddress}
                    onFocus={() => setShowDropSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowDropSuggestions(false), 150)}
                    onChange={(e) => { setBookingForm({ ...bookingForm, dropAddress: e.target.value, dropLat: null, dropLng: null, distanceKm: 0 }); setShowDropSuggestions(true); }}
                    placeholder="Type drop address"
                  />
                  {showDropSuggestions && dropSuggestions.length > 0 && (
                    <div className="osm-dropdown">
                      {dropSuggestions.map((item) => (
                        <button type="button" className="osm-item" key={item.label} onMouseDown={() => {
                          setBookingForm((cur) => {
                            const next = { ...cur, dropAddress: item.label, dropLat: item.lat, dropLng: item.lng };
                            if (next.pickupLat && next.pickupLng) return { ...next, distanceKm: estimateRoadKmFromCoords(next.pickupLat, next.pickupLng, next.dropLat, next.dropLng) };
                            return next;
                          });
                          setShowDropSuggestions(false);
                        }}>
                          <Icon name="mapPin" size={13} />
                          <span>{item.label}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="field">
                <label>Drop details</label>
                <input value={bookingForm.dropDetails} onChange={(e) => setBookingForm({ ...bookingForm, dropDetails: e.target.value })} placeholder="Building / wing / flat / landmark" />
              </div>

              <div className="field-row-3">
                <div className="field">
                  <label>Distance (km)</label>
                  <input type="number" value={bookingForm.distanceKm} readOnly className="input-readonly" />
                </div>
                <div className="field">
                  <label>Weight (kg)</label>
                  <input type="number" value={bookingForm.weightKg} onChange={(e) => setBookingForm({ ...bookingForm, weightKg: Number(e.target.value) })} />
                </div>
                <div className="field">
                  <label>Payment</label>
                  <select value={bookingForm.paymentMethod} onChange={(e) => setBookingForm({ ...bookingForm, paymentMethod: e.target.value })}>
                    <option value="Online">Online</option>
                    <option value="COD">COD</option>
                  </select>
                </div>
              </div>

              <div className="field-row-2">
                <div className="field">
                  <label>Vehicle type</label>
                  <select value={bookingForm.vehicleType} onChange={(e) => setBookingForm({ ...bookingForm, vehicleType: e.target.value })}>
                    {view.vehicles.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
                  </select>
                </div>
                <div className="field">
                  <label>Zone</label>
                  <select value={bookingForm.zoneId} onChange={(e) => setBookingForm({ ...bookingForm, zoneId: e.target.value })}>
                    {view.zones.map((z) => <option key={z.id} value={z.id}>{z.name}</option>)}
                  </select>
                </div>
              </div>

              {estimate && (
                <div className="estimate-card">
                  <div className="estimate-total">
                    <span>Estimated fare</span>
                    <strong>₹{estimate.total}</strong>
                  </div>
                  <div className="estimate-breakdown">
                    <div className="estimate-line"><span>Base fare</span><span>₹{estimate.baseFare}</span></div>
                    <div className="estimate-line"><span>Distance charge</span><span>₹{estimate.distanceCharge}</span></div>
                    <div className="estimate-line"><span>Weight charge</span><span>₹{estimate.weightCharge}</span></div>
                  </div>
                </div>
              )}

              <div className="btn-row">
                <button className="btn-secondary" onClick={estimateFare} disabled={busy}>
                  {busy ? <Spinner /> : <Icon name="dollar" size={15} />} Estimate fare
                </button>
                <button className="btn-primary" onClick={createBooking} disabled={busy}>
                  {busy ? <Spinner /> : <Icon name="package" size={15} />} Book now
                </button>
              </div>
            </div>
          </section>

          {/* Deliveries panel */}
          <section className="panel">
            <SectionTitle eyebrow="History" title="Your deliveries" subtitle="Full tracking history for every booking." />

            {view.deliveries.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon"><Icon name="package" size={32} /></div>
                <p>No deliveries yet. Book your first one!</p>
              </div>
            ) : (
              <div className="delivery-list mt-16">
                {view.deliveries.map((d) => (
                  <div className="delivery-card" key={d.id}>
                    <div className="delivery-card-top">
                      <div className="delivery-card-meta">
                        <span className="delivery-id">#{d.id}</span>
                        <StatusBadge status={d.status} />
                        <span className="delivery-price">₹{d.price}</span>
                      </div>
                      <button className="btn-ghost btn-xs" onClick={() => toggleDeliveryExpansion(d.id)}>
                        <Icon name={expandedDeliveries[d.id] ? "chevronUp" : "chevronDown"} size={14} />
                        {expandedDeliveries[d.id] ? "Less" : "More"}
                      </button>
                    </div>

                    <div className="delivery-route">
                      <div className="route-point route-pickup">
                        <span className="route-dot route-dot-pickup" />
                        <span>{d.pickupAddress}</span>
                      </div>
                      <div className="route-connector-line" />
                      <div className="route-point route-drop">
                        <span className="route-dot route-dot-drop" />
                        <span>{d.dropAddress}</span>
                      </div>
                    </div>

                    <DeliveryProgress status={d.status} />

                    {d.riderName ? (
                      <div className="rider-chip">
                        <div className="rider-avatar">{d.riderName[0]}</div>
                        <div className="rider-info">
                          <strong>{d.riderName}</strong>
                          <span><Icon name="phone" size={11} /> {d.riderPhone}</span>
                        </div>
                        <span className="rider-label">Your rider</span>
                      </div>
                    ) : (
                      <div className="waiting-chip">
                        <Icon name="clock" size={14} />
                        <span>Waiting for a partner to accept</span>
                      </div>
                    )}

                    {d.status !== "Delivered" && d.status !== "Cancelled" && (
                      <div className="cancel-section">
                        <input
                          className="cancel-input"
                          placeholder="Reason for cancellation (optional)"
                          value={cancelReasons[d.id] || ""}
                          onChange={(e) => setCancelReason(d.id, e.target.value)}
                        />
                        <button className="btn-danger-ghost" onClick={() => cancelDelivery(d.id)}>
                          <Icon name="xCircle" size={14} /> Cancel delivery
                        </button>
                      </div>
                    )}

                    {expandedDeliveries[d.id] && d.history.length > 0 && (
                      <div className="history-timeline">
                        {d.history.map((h, i) => (
                          <div className="timeline-item" key={`${d.id}-${i}`}>
                            <div className="timeline-dot" />
                            <div className="timeline-content">
                              <strong>{h.status}</strong>
                              <span>{h.note}</span>
                              <time>{formatDate(h.createdAt)}</time>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        </main>
      </div>
    );
  }

  // ─── PARTNER VIEW ─────────────────────────────────────────────────────────────
  if (session.role === "partner") {
    const openJobs = view.deliveries.filter((d) => !d.partnerId && d.status === "Created");
    const myJobs = view.deliveries.filter((d) => d.partnerId === session.userId && d.status !== "Cancelled");
    const isOnline = view.profile.availability === "Online";

    return (
      <div className="shell shell-partner">
        <ToastContainer toasts={toasts} removeToast={removeToast} />

        <nav className="topnav">
          <div className="topnav-brand">
            <div className="brand-orb brand-orb-sm">R</div>
            <span>Rapido</span>
          </div>
          <div className="topnav-center">
            <span className="role-pill role-pill-partner"><Icon name="truck" size={12} /> Partner</span>
            <span className="topnav-name">{view.user.fullName}</span>
          </div>
          <button className="btn-ghost btn-icon-text" onClick={logout}>
            <Icon name="logout" size={15} /> Logout
          </button>
        </nav>

        <main className="dashboard-grid dashboard-grid-single">
          {/* Profile & Status */}
          <section className="panel">
            <div className="partner-status-bar">
              <div className="partner-status-left">
                <SectionTitle eyebrow="Profile" title="Partner status" />
                <StatusBadge status={view.profile.verificationStatus} />
              </div>
              <div className="availability-toggle-wrap">
                <span className="avail-label">{isOnline ? "Online" : "Offline"}</span>
                <button
                  className={`avail-switch${isOnline ? " avail-on" : ""}`}
                  onClick={toggleAvailability}
                  aria-label="Toggle availability"
                >
                  <span className="avail-thumb" />
                </button>
              </div>
            </div>

            <div className="metrics-row mt-16">
              <MetricCard label="Verification" value={view.profile.verificationStatus} accent="#f97316" icon="checkCircle" />
              <MetricCard label="Status" value={view.profile.availability} accent={isOnline ? "#10b981" : "#6b7280"} icon="activity" />
              <MetricCard label="Riders" value={view.profile.riders.length} accent="#3b82f6" icon="users" />
              <MetricCard label="Vehicles" value={view.profile.vehicles.length} accent="#8b5cf6" icon="truck" />
            </div>

            <div className="details-grid mt-16">
              <DetailRow label="Aadhaar" value={view.profile.aadhaar} />
              <DetailRow label="PAN" value={view.profile.pan} />
              <DetailRow label="License" value={view.profile.licenseNumber} />
              <DetailRow label="Bank account" value={view.profile.bankAccount} />
              <DetailRow label="Address" value={view.profile.address} />
            </div>

            <div className="two-col-subpanels mt-16">
              <div className="subpanel">
                <h3 className="subpanel-title"><Icon name="truck" size={15} /> Vehicles</h3>
                {view.profile.vehicles.length === 0 ? <p className="muted-text">No vehicles added.</p> : (
                  <div className="item-list">
                    {view.profile.vehicles.map((v) => (
                      <div className="item-row" key={v.id}>
                        <strong>{v.vehicleType}</strong>
                        <span>{v.vehicleNumber}</span>
                        <span className="muted-text">RC {v.rcNumber || "—"}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="subpanel">
                <h3 className="subpanel-title"><Icon name="users" size={15} /> Riders</h3>
                {view.profile.riders.length === 0 ? <p className="muted-text">No riders added.</p> : (
                  <div className="item-list">
                    {view.profile.riders.map((r) => (
                      <div className="item-row" key={r.id}>
                        <div className="rider-mini-avatar">{r.fullName[0]}</div>
                        <div>
                          <strong>{r.fullName}</strong>
                          <span className="muted-text">{r.phone}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="two-col-subpanels mt-16">
              <div className="subpanel subpanel-accent">
                <h3 className="subpanel-title"><Icon name="plus" size={15} /> Add vehicle</h3>
                <div className="field-stack mt-12">
                  <div className="field">
                    <label>Vehicle type</label>
                    <select value={vehicleForm.vehicleType} onChange={(e) => setVehicleForm({ ...vehicleForm, vehicleType: e.target.value })}>
                      {view.vehicles.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
                    </select>
                  </div>
                  <div className="field">
                    <label>Vehicle number</label>
                    <input value={vehicleForm.vehicleNumber} onChange={(e) => setVehicleForm({ ...vehicleForm, vehicleNumber: e.target.value })} placeholder="MH01AB1234" />
                  </div>
                  <div className="field-row-2">
                    <div className="field">
                      <label>RC number</label>
                      <input value={vehicleForm.rcNumber} onChange={(e) => setVehicleForm({ ...vehicleForm, rcNumber: e.target.value })} placeholder="RC number" />
                    </div>
                    <div className="field">
                      <label>Insurance</label>
                      <input value={vehicleForm.insuranceNumber} onChange={(e) => setVehicleForm({ ...vehicleForm, insuranceNumber: e.target.value })} placeholder="Policy number" />
                    </div>
                  </div>
                  <button className="btn-primary" onClick={addVehicle} disabled={busy}>
                    {busy ? <Spinner /> : <Icon name="plus" size={14} />} Add vehicle
                  </button>
                </div>
              </div>

              <div className="subpanel subpanel-accent">
                <h3 className="subpanel-title"><Icon name="plus" size={15} /> Add rider</h3>
                <div className="field-stack mt-12">
                  <div className="field">
                    <label>Full name</label>
                    <input value={riderForm.fullName} onChange={(e) => setRiderForm({ ...riderForm, fullName: e.target.value })} placeholder="Rider full name" />
                  </div>
                  <div className="field">
                    <label>Phone</label>
                    <input value={riderForm.phone} onChange={(e) => setRiderForm({ ...riderForm, phone: e.target.value })} placeholder="Mobile number" />
                  </div>
                  <div className="field-row-2">
                    <div className="field">
                      <label>License</label>
                      <input value={riderForm.licenseNumber} onChange={(e) => setRiderForm({ ...riderForm, licenseNumber: e.target.value })} placeholder="DL number" />
                    </div>
                    <div className="field">
                      <label>Emergency contact</label>
                      <input value={riderForm.emergencyContact} onChange={(e) => setRiderForm({ ...riderForm, emergencyContact: e.target.value })} placeholder="Emergency phone" />
                    </div>
                  </div>
                  <button className="btn-primary" onClick={addRider} disabled={busy}>
                    {busy ? <Spinner /> : <Icon name="plus" size={14} />} Add rider
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* Jobs panel */}
          <section className="panel">
            <SectionTitle eyebrow="Jobs" title="Accept & manage deliveries" subtitle="Open jobs can be accepted once. Accepted jobs track status to Delivered." />

            <div className="two-col-subpanels mt-16">
              <div className="subpanel">
                <h3 className="subpanel-title">
                  <Icon name="package" size={15} /> My jobs
                  {myJobs.length > 0 && <span className="count-badge">{myJobs.length}</span>}
                </h3>
                {myJobs.length === 0 ? (
                  <div className="empty-state-sm">
                    <Icon name="package" size={24} />
                    <span>No jobs assigned yet</span>
                  </div>
                ) : (
                  <div className="job-list">
                    {myJobs.map((d) => {
                      const idx = statusFlow.indexOf(d.status);
                      const next = idx >= 0 ? statusFlow[Math.min(idx + 1, statusFlow.length - 1)] : statusFlow[0];
                      return (
                        <div className="job-card" key={d.id}>
                          <div className="job-card-header">
                            <span className="delivery-id">#{d.id}</span>
                            <StatusBadge status={d.status} />
                          </div>
                          <div className="job-route">
                            <span className="route-dot route-dot-pickup" />{d.pickupAddress}
                          </div>
                          <div className="job-route">
                            <span className="route-dot route-dot-drop" />{d.dropAddress}
                          </div>
                          {d.pickupDetails && <p className="job-detail">Pickup: {d.pickupDetails}</p>}
                          {d.dropDetails && <p className="job-detail">Drop: {d.dropDetails}</p>}
                          <div className="job-meta">
                            <span><Icon name="users" size={12} /> {d.riderName || "—"}</span>
                            <span><Icon name="phone" size={12} /> {d.customerPhone}</span>
                          </div>
                          <div className="btn-row mt-8">
                            {d.status !== "Delivered" && (
                              <button className="btn-primary btn-sm" onClick={() => updateDeliveryStatus(d.id, next)}>
                                Move to {next}
                              </button>
                            )}
                            {d.status !== "Delivered" && (
                              <>
                                <input
                                  className="cancel-input"
                                  placeholder="Cancel reason"
                                  value={cancelReasons[d.id] || ""}
                                  onChange={(e) => setCancelReason(d.id, e.target.value)}
                                />
                                <button className="btn-danger-ghost btn-sm" onClick={() => cancelDelivery(d.id)}>
                                  <Icon name="xCircle" size={13} /> Cancel
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="subpanel subpanel-highlight">
                <h3 className="subpanel-title">
                  <Icon name="activity" size={15} /> Open jobs
                  {openJobs.length > 0 && <span className="count-badge count-badge-orange">{openJobs.length}</span>}
                </h3>
                {openJobs.length === 0 ? (
                  <div className="empty-state-sm">
                    <Icon name="clock" size={24} />
                    <span>No open jobs right now</span>
                  </div>
                ) : (
                  <div className="job-list">
                    {openJobs.map((d) => (
                      <div className="job-card job-card-open" key={d.id}>
                        <div className="job-card-header">
                          <span className="delivery-id">#{d.id}</span>
                          <span className="price-tag">₹{d.price}</span>
                        </div>
                        <div className="job-route">
                          <span className="route-dot route-dot-pickup" />{d.pickupAddress}
                        </div>
                        <div className="job-route">
                          <span className="route-dot route-dot-drop" />{d.dropAddress}
                        </div>
                        <div className="job-meta">
                          <span><Icon name="mapPin" size={12} /> {d.distanceKm} km</span>
                        </div>
                        <div className="field mt-8">
                          <label>Assign rider</label>
                          <select value={selectedRiders[d.id] || view.profile.riders[0]?.id || ""} onChange={(e) => setSelectedRider(d.id, e.target.value)}>
                            {view.profile.riders.map((r) => <option key={r.id} value={r.id}>{r.fullName} — {r.phone}</option>)}
                          </select>
                        </div>
                        <button className="btn-primary btn-full mt-8" onClick={() => acceptDelivery(d.id)}>
                          <Icon name="checkCircle" size={14} /> Accept with rider
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </section>
        </main>
      </div>
    );
  }

  // ─── ADMIN VIEW ───────────────────────────────────────────────────────────────
  return (
    <div className="shell shell-admin">
      <ToastContainer toasts={toasts} removeToast={removeToast} />

      <nav className="topnav">
        <div className="topnav-brand">
          <div className="brand-orb brand-orb-sm">R</div>
          <span>Rapido</span>
        </div>
        <div className="topnav-center">
          <span className="role-pill role-pill-admin"><Icon name="shield" size={12} /> Admin</span>
          <span className="topnav-name">{view.user.fullName}</span>
        </div>
        <button className="btn-ghost btn-icon-text" onClick={logout}>
          <Icon name="logout" size={15} /> Logout
        </button>
      </nav>

      <main className="dashboard-grid dashboard-grid-single">
        {/* Metrics */}
        <section className="panel">
          <SectionTitle eyebrow="Dashboard" title="Operations overview" subtitle="Live metrics across the platform." />
          <div className="metrics-row mt-16">
            <MetricCard label="Total deliveries" value={view.dashboard.totalDeliveries} accent="#0f172a" icon="package" />
            <MetricCard label="Online partners" value={view.dashboard.onlinePartners} accent="#10b981" icon="users" />
            <MetricCard label="Pending approvals" value={view.dashboard.pendingPartners} accent="#f97316" icon="clock" />
            <MetricCard label="Revenue" value={`₹${view.dashboard.completedRevenue}`} accent="#3b82f6" icon="dollar" />
          </div>
        </section>

        {/* Partner review */}
        <section className="panel">
          <SectionTitle eyebrow="Partners" title="Partner & rider review" subtitle="Inspect full onboarding details before approving." />
          <div className="partner-list mt-16">
            {view.partners.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon"><Icon name="users" size={32} /></div>
                <p>No partners registered yet.</p>
              </div>
            ) : view.partners.map((p) => (
              <div className="partner-card" key={p.id}>
                <div className="partner-card-header">
                  <div className="partner-identity">
                    <div className="partner-avatar">{p.name[0]}</div>
                    <div>
                      <strong className="partner-name">{p.name}</strong>
                      <span className="partner-contact">{p.phone} {p.email ? `· ${p.email}` : ""}</span>
                    </div>
                  </div>
                  <div className="partner-actions">
                    <StatusBadge status={p.verificationStatus} />
                    <StatusBadge status={p.availability} />
                    <button className="btn-success-sm" onClick={() => updatePartnerVerification(p.id, "Approved")}>
                      <Icon name="checkCircle" size={13} /> Approve
                    </button>
                    <button className="btn-danger-sm" onClick={() => updatePartnerVerification(p.id, "Rejected")}>
                      <Icon name="xCircle" size={13} /> Reject
                    </button>
                  </div>
                </div>

                <div className="details-grid">
                  <DetailRow label="Aadhaar" value={p.aadhaar} />
                  <DetailRow label="PAN" value={p.pan} />
                  <DetailRow label="License" value={p.licenseNumber} />
                  <DetailRow label="Bank account" value={p.bankAccount} />
                  <DetailRow label="Address" value={p.address} />
                  <DetailRow label="Distance away" value={`${p.distanceAwayKm} km`} />
                </div>

                <div className="two-col-subpanels mt-12">
                  <div>
                    <h4 className="mini-heading"><Icon name="truck" size={13} /> Vehicles</h4>
                    <div className="item-list">
                      {p.vehicles.map((v) => (
                        <div className="item-row" key={v.id}>
                          <strong>{v.vehicleType}</strong>
                          <span>{v.vehicleNumber}</span>
                          <span className="muted-text">RC {v.rcNumber || "—"} · Ins {v.insuranceNumber || "—"}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="mini-heading"><Icon name="users" size={13} /> Riders</h4>
                    <div className="item-list">
                      {p.riders?.map((r) => (
                        <div className="item-row" key={r.id}>
                          <div className="rider-mini-avatar">{r.fullName[0]}</div>
                          <div>
                            <strong>{r.fullName}</strong>
                            <span className="muted-text">{r.phone} · License {r.licenseNumber || "—"}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* All deliveries */}
        <section className="panel">
          <SectionTitle eyebrow="Dispatch" title="All deliveries" subtitle="Full audit trail — assign partners, monitor status, cancel if needed." />
          {view.deliveries.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon"><Icon name="activity" size={32} /></div>
              <p>No deliveries yet.</p>
            </div>
          ) : (
            <div className="delivery-list mt-16">
              {view.deliveries.map((d) => (
                <div className="delivery-card" key={d.id}>
                  <div className="delivery-card-top">
                    <div className="delivery-card-meta">
                      <span className="delivery-id">#{d.id}</span>
                      <StatusBadge status={d.status} />
                      <span className="delivery-price">₹{d.price}</span>
                    </div>
                    <div className="customer-meta">
                      <Icon name="user" size={13} />
                      <span>{d.customerName} · {d.customerPhone}</span>
                    </div>
                  </div>

                  <div className="delivery-route">
                    <div className="route-point route-pickup">
                      <span className="route-dot route-dot-pickup" />
                      <span>{d.pickupAddress}</span>
                    </div>
                    <div className="route-connector-line" />
                    <div className="route-point route-drop">
                      <span className="route-dot route-dot-drop" />
                      <span>{d.dropAddress}</span>
                    </div>
                  </div>

                  <DeliveryProgress status={d.status} />

                  <div className="dispatch-row">
                    {d.riderName ? (
                      <div className="rider-chip">
                        <div className="rider-avatar">{d.riderName[0]}</div>
                        <div className="rider-info">
                          <strong>{d.riderName}</strong>
                          <span>{d.riderPhone}</span>
                        </div>
                        <span className="rider-label">Rider</span>
                      </div>
                    ) : (
                      <div className="waiting-chip"><Icon name="clock" size={14} /> No rider assigned</div>
                    )}

                    {d.partnerId ? (
                      <div className="partner-chip">
                        <Icon name="truck" size={13} />
                        <span>{d.partnerName}</span>
                      </div>
                    ) : d.status === "Created" ? (
                      <div className="assign-select-wrap">
                        <select
                          className="assign-select"
                          onChange={(e) => assignDelivery(d.id, e.target.value)}
                          defaultValue=""
                        >
                          <option value="" disabled>Assign partner…</option>
                          {view.partners
                            .filter((p) => p.verificationStatus === "Approved")
                            .map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                      </div>
                    ) : null}
                  </div>

                  {d.status !== "Delivered" && d.status !== "Cancelled" && (
                    <div className="cancel-section">
                      <input
                        className="cancel-input"
                        placeholder="Cancellation reason"
                        value={cancelReasons[d.id] || ""}
                        onChange={(e) => setCancelReason(d.id, e.target.value)}
                      />
                      <button className="btn-danger-ghost" onClick={() => cancelDelivery(d.id)}>
                        <Icon name="xCircle" size={14} /> Cancel
                      </button>
                    </div>
                  )}

                  {d.history.length > 0 && (
                    <div className="history-timeline">
                      {d.history.map((h, i) => (
                        <div className="timeline-item" key={`${d.id}-${i}`}>
                          <div className="timeline-dot" />
                          <div className="timeline-content">
                            <strong>{h.status}</strong>
                            <span>{h.note}</span>
                            <time>{formatDate(h.createdAt)}</time>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
