import { useEffect, useState } from "react";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:4000/api";
const SESSION_KEY = "rapido_session";
const statusFlow = ["Picked Up", "In Transit", "Delivered"];

const defaultCustomerRegister = {
  fullName: "",
  phone: "",
  email: "",
  password: ""
};

const defaultPartnerRegister = {
  fullName: "",
  phone: "",
  email: "",
  password: "",
  aadhaar: "",
  pan: "",
  licenseNumber: "",
  address: "",
  bankAccount: "",
  distanceAwayKm: 1,
  vehicleType: "bike",
  vehicleNumber: "",
  rcNumber: "",
  insuranceNumber: "",
  riderFullName: "",
  riderPhone: "",
  riderLicenseNumber: "",
  riderEmergencyContact: ""
};

const defaultLogin = {
  phone: "",
  password: ""
};

function api(path, options = {}) {
  return fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options
  }).then(async (response) => {
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(payload.message || "Request failed");
    }
    return payload;
  });
}

function SectionTitle({ eyebrow, title, subtitle }) {
  return (
    <div className="section-title">
      <p>{eyebrow}</p>
      <h2>{title}</h2>
      <span>{subtitle}</span>
    </div>
  );
}

function MetricCard({ label, value, accent }) {
  return (
    <div className="metric-card">
      <span>{label}</span>
      <strong style={{ color: accent }}>{value}</strong>
    </div>
  );
}

function formatDate(value) {
  return new Date(value).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit"
  });
}


function DetailRow({ label, value }) {
  return (
    <div className="detail-row">
      <strong>{label}</strong>
      <span>{value || "-"}</span>
    </div>
  );
}

function toRadians(value) {
  return (Number(value) * Math.PI) / 180;
}

function haversineKm(lat1, lng1, lat2, lng2) {
  const earthRadiusKm = 6371;
  const latDelta = toRadians(lat2 - lat1);
  const lngDelta = toRadians(lng2 - lng1);
  const a =
    Math.sin(latDelta / 2) ** 2 +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(lngDelta / 2) ** 2;
  return earthRadiusKm * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

function estimateRoadKmFromCoords(pickupLat, pickupLng, dropLat, dropLng) {
  const straight = haversineKm(pickupLat, pickupLng, dropLat, dropLng);
  const roadMultiplier = 1.3;
  return Math.max(0.5, Number((straight * roadMultiplier).toFixed(2)));
}


function AlertModal({ message, onClose }) {
  if (!message) {
    return null;
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(event) => event.stopPropagation()} role="alertdialog" aria-modal="true">
        <div className="modal-icon">!</div>
        <div className="modal-copy">
          <span className="modal-label">Request issue</span>
          <h3>Something needs attention</h3>
          <p>{message}</p>
        </div>
        <button className="primary modal-button" onClick={onClose}>Okay</button>
      </div>
    </div>
  );
}

export default function App() {
  const [selectedRole, setSelectedRole] = useState("customer");
  const [authMode, setAuthMode] = useState("login");
  const [session, setSession] = useState(null);
  const [view, setView] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [loginForm, setLoginForm] = useState(defaultLogin);
  const [customerRegisterForm, setCustomerRegisterForm] = useState(defaultCustomerRegister);
  const [partnerRegisterForm, setPartnerRegisterForm] = useState(defaultPartnerRegister);
  const [bookingForm, setBookingForm] = useState({
    pickupAddress: "",
    pickupLat: null,
    pickupLng: null,
    dropAddress: "",
    dropLat: null,
    dropLng: null,
    distanceKm: 0,
    weightKg: 2,
    vehicleType: "bike",
    zoneId: "zone-andheri-west",
    paymentMethod: "Online"
  });
  const [estimate, setEstimate] = useState(null);
  const [vehicleForm, setVehicleForm] = useState({
    vehicleType: "bike",
    vehicleNumber: "",
    rcNumber: "",
    insuranceNumber: ""
  });
  const [riderForm, setRiderForm] = useState({
    fullName: "",
    phone: "",
    licenseNumber: "",
    emergencyContact: ""
  });
  const [selectedRiders, setSelectedRiders] = useState({});
  const [cancelReasons, setCancelReasons] = useState({});
  const [expandedDeliveries, setExpandedDeliveries] = useState({});
  const [pickupSuggestions, setPickupSuggestions] = useState([]);
  const [dropSuggestions, setDropSuggestions] = useState([]);
  const [showPickupSuggestions, setShowPickupSuggestions] = useState(false);
  const [showDropSuggestions, setShowDropSuggestions] = useState(false);

  useEffect(() => {
    const query = bookingForm.pickupAddress?.trim();
    if (!showPickupSuggestions || !query || query.length < 3) {
      setPickupSuggestions([]);
      return;
    }

    const timer = setTimeout(() => {
      fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&limit=6&q=${encodeURIComponent(query)}`)
        .then((res) => res.json())
        .then((data) => {
          const items = Array.isArray(data)
            ? data.map((item) => ({ label: item.display_name, lat: Number(item.lat), lng: Number(item.lon) }))
            : [];
          setPickupSuggestions(items);
        })
        .catch(() => setPickupSuggestions([]));
    }, 350);

    return () => clearTimeout(timer);
  }, [bookingForm.pickupAddress, showPickupSuggestions]);

  useEffect(() => {
    const query = bookingForm.dropAddress?.trim();
    if (!showDropSuggestions || !query || query.length < 3) {
      setDropSuggestions([]);
      return;
    }

    const timer = setTimeout(() => {
      fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&limit=6&q=${encodeURIComponent(query)}`)
        .then((res) => res.json())
        .then((data) => {
          const items = Array.isArray(data)
            ? data.map((item) => ({ label: item.display_name, lat: Number(item.lat), lng: Number(item.lon) }))
            : [];
          setDropSuggestions(items);
        })
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
    if (!saved) {
      return;
    }

    const parsed = JSON.parse(saved);
    loadSession(parsed.role, parsed.userId).catch(() => {
      localStorage.removeItem(SESSION_KEY);
    });
  }, []);

  async function handleLogin() {
    setBusy(true);
    setError("");
    try {
      const user = await api("/auth/login", {
        method: "POST",
        body: JSON.stringify({ ...loginForm, role: selectedRole })
      });
      await loadSession(user.role, user.id);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleCustomerRegister() {
    setBusy(true);
    setError("");
    try {
      const user = await api("/auth/register-customer", {
        method: "POST",
        body: JSON.stringify(customerRegisterForm)
      });
      await loadSession(user.role, user.id);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  }

  async function handlePartnerRegister() {
    setBusy(true);
    setError("");
    try {
      const user = await api("/auth/register-partner", {
        method: "POST",
        body: JSON.stringify(partnerRegisterForm)
      });
      await loadSession(user.role, user.id);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  }
  async function geocodeNominatim(query) {
    const q = String(query || "").trim();
    if (q.length < 3) {
      return null;
    }

    const response = await fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=${encodeURIComponent(q)}`);
    const data = await response.json().catch(() => []);
    const first = Array.isArray(data) ? data[0] : null;
    if (!first?.lat || !first?.lon) {
      return null;
    }

    return {
      label: first.display_name,
      lat: Number(first.lat),
      lng: Number(first.lon)
    };
  }

  async function ensureAutoDistance() {
    let pickupLat = bookingForm.pickupLat;
    let pickupLng = bookingForm.pickupLng;
    let dropLat = bookingForm.dropLat;
    let dropLng = bookingForm.dropLng;

    if (!pickupLat || !pickupLng) {
      const place = await geocodeNominatim(bookingForm.pickupAddress);
      if (place) {
        pickupLat = place.lat;
        pickupLng = place.lng;
      }
    }

    if (!dropLat || !dropLng) {
      const place = await geocodeNominatim(bookingForm.dropAddress);
      if (place) {
        dropLat = place.lat;
        dropLng = place.lng;
      }
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
    setError("");
    try {
      const nextForm = await ensureAutoDistance();
      const payload = await api("/bookings/estimate", {
        method: "POST",
        body: JSON.stringify(nextForm)
      });
      setEstimate(payload);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  }

  async function createBooking() {
    setBusy(true);
    setError("");
    try {
      const nextForm = await ensureAutoDistance();
      await api("/deliveries", {
        method: "POST",
        body: JSON.stringify({ ...nextForm, customerId: session.userId })
      });
      setEstimate(null);
      await loadSession(session.role, session.userId);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  }

  async function toggleAvailability() {
    await api(`/partners/${session.userId}/toggle-availability`, { method: "PATCH" });
    await loadSession(session.role, session.userId);
  }

  async function addVehicle() {
    setBusy(true);
    setError("");
    try {
      await api(`/partners/${session.userId}/vehicles`, {
        method: "POST",
        body: JSON.stringify(vehicleForm)
      });
      setVehicleForm({ vehicleType: "bike", vehicleNumber: "", rcNumber: "", insuranceNumber: "" });
      await loadSession(session.role, session.userId);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  }

  async function addRider() {
    setBusy(true);
    setError("");
    try {
      await api(`/partners/${session.userId}/riders`, {
        method: "POST",
        body: JSON.stringify(riderForm)
      });
      setRiderForm({ fullName: "", phone: "", licenseNumber: "", emergencyContact: "" });
      await loadSession(session.role, session.userId);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  }

  async function updateDeliveryStatus(deliveryId, status) {
    await api(`/deliveries/${deliveryId}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status })
    });
    await loadSession(session.role, session.userId);
  }

  async function acceptDelivery(deliveryId) {
    await api(`/deliveries/${deliveryId}/accept`, {
      method: "PATCH",
      body: JSON.stringify({
        partnerId: session.userId,
        riderId: selectedRiders[deliveryId] || view.profile.riders[0]?.id || null
      })
    });
    await loadSession(session.role, session.userId);
  }

  async function assignDelivery(deliveryId, partnerId) {
    await api(`/deliveries/${deliveryId}/assign`, {
      method: "PATCH",
      body: JSON.stringify({ partnerId })
    });
    await loadSession(session.role, session.userId);
  }

  async function cancelDelivery(deliveryId) {
    await api(`/deliveries/${deliveryId}/cancel`, {
      method: "PATCH",
      body: JSON.stringify({
        actorRole: session.role,
        actorId: session.userId,
        reason: cancelReasons[deliveryId] || "No reason provided"
      })
    });
    await loadSession(session.role, session.userId);
  }

  async function updatePartnerVerification(partnerId, verificationStatus) {
    await api(`/partners/${partnerId}/verification`, {
      method: "PATCH",
      body: JSON.stringify({ verificationStatus })
    });
    await loadSession(session.role, session.userId);
  }

  function logout() {
    localStorage.removeItem(SESSION_KEY);
    setSession(null);
    setView(null);
    setLoginForm(defaultLogin);
    setError("");
  }

  function setCancelReason(deliveryId, value) {
    setCancelReasons((current) => ({ ...current, [deliveryId]: value }));
  }

  function setSelectedRider(deliveryId, riderId) {
    setSelectedRiders((current) => ({ ...current, [deliveryId]: riderId }));
  }

  function toggleDeliveryExpansion(deliveryId) {
    setExpandedDeliveries((current) => ({ ...current, [deliveryId]: !current[deliveryId] }));
  }

  if (!view) {
    return (
      <div className="app-shell app-shell-auth auth-shell-premium">
        <header className="hero hero-auth hero-auth-premium">
          <div>
            <span className="hero-badge">Three User Journeys</span>
            <h1>Customer booking, partner onboarding, rider assignment, and admin control from one product foundation.</h1>
            <p>
              Customers sign up and book. Partners register themselves, add vehicles, and attach riders. Admin reviews full
              partner and rider details, approves them, and supervises all delivery changes.
            </p>
          </div>
          <div className="hero-metrics hero-metrics-compact">
            <MetricCard label="Roles" value="3" accent="#ff6b35" />
            <MetricCard label="Storage" value="Postgres" accent="#017a5b" />
            <MetricCard label="Assigned rider" value="Visible" accent="#0f172a" />
          </div>
        </header>

        <AlertModal message={error} onClose={() => setError("")} />

        <main className="auth-layout">
          <section className="panel auth-panel auth-panel-sticky">
            <SectionTitle
              eyebrow="Choose Portal"
              title="Pick the journey"
              subtitle="Everything starts here. Switch roles without leaving the screen."
            />

            <div className="role-grid role-grid-compact">
              {["customer", "partner", "admin"].map((role) => (
                <button
                  key={role}
                  className={selectedRole === role ? "role-card active" : "role-card"}
                  onClick={() => {
                    setSelectedRole(role);
                    setAuthMode(role === "admin" ? "login" : authMode);
                  }}
                >
                  <strong>{role}</strong>
                  <span>
                    {role === "customer"
                      ? "Register, book, track, and contact the assigned rider."
                      : role === "partner"
                        ? "Create partner, vehicle, and rider records in one go."
                        : "Approve partners, inspect riders, and control live dispatch."}
                  </span>
                </button>
              ))}
            </div>

            <div className="auth-highlights">
              <div className="highlight-chip">OTP-style journey ready</div>
              <div className="highlight-chip">Rider contact visible</div>
              <div className="highlight-chip">Partner self-onboarding</div>
            </div>
          </section>

          <section className="panel auth-panel auth-panel-wide">
            <SectionTitle
              eyebrow="Access"
              title={selectedRole === "admin" ? "Admin login" : authMode === "login" ? "Login" : `Register ${selectedRole}`}
              subtitle="Compact, role-aware access flow without extra scrolling."
            />

            {selectedRole !== "admin" ? (
              <div className="pill-row form-switch-row form-switch-row-wide">
                <button className={authMode === "login" ? "ghost active-switch" : "ghost"} onClick={() => setAuthMode("login")}>Login</button>
                <button className={authMode === "register" ? "ghost active-switch" : "ghost"} onClick={() => setAuthMode("register")}>Register</button>
              </div>
            ) : null}

            <div className="auth-form-scroll">
              {(authMode === "login" || selectedRole === "admin") ? (
                <div className="form-grid compact-grid compact-grid-tight">
                  <label>
                    Phone
                    <input value={loginForm.phone} onChange={(event) => setLoginForm({ ...loginForm, phone: event.target.value })} />
                  </label>
                  <label>
                    Password
                    <input type="password" value={loginForm.password} onChange={(event) => setLoginForm({ ...loginForm, password: event.target.value })} />
                  </label>
                  <button className="primary full-button" onClick={handleLogin} disabled={busy}>Enter {selectedRole} portal</button>
                  {selectedRole === "admin" ? <span className="muted">Seed admin login: `9000000000` / `admin123`</span> : null}
                </div>
              ) : null}

              {selectedRole === "customer" && authMode === "register" ? (
                <div className="form-grid compact-grid compact-grid-tight">
                  <label>
                    Full name
                    <input value={customerRegisterForm.fullName} onChange={(event) => setCustomerRegisterForm({ ...customerRegisterForm, fullName: event.target.value })} />
                  </label>
                  <label>
                    Phone
                    <input value={customerRegisterForm.phone} onChange={(event) => setCustomerRegisterForm({ ...customerRegisterForm, phone: event.target.value })} />
                  </label>
                  <label>
                    Email
                    <input value={customerRegisterForm.email} onChange={(event) => setCustomerRegisterForm({ ...customerRegisterForm, email: event.target.value })} />
                  </label>
                  <label>
                    Password
                    <input type="password" value={customerRegisterForm.password} onChange={(event) => setCustomerRegisterForm({ ...customerRegisterForm, password: event.target.value })} />
                  </label>
                  <button className="primary full-button" onClick={handleCustomerRegister} disabled={busy}>Create customer account</button>
                </div>
              ) : null}

              {selectedRole === "partner" && authMode === "register" ? (
                <div className="auth-section-stack">
                  <div className="mini-section">
                    <h3>Partner details</h3>
                    <div className="form-grid compact-grid compact-grid-tight">
                      <label>
                        Full name
                        <input value={partnerRegisterForm.fullName} onChange={(event) => setPartnerRegisterForm({ ...partnerRegisterForm, fullName: event.target.value })} />
                      </label>
                      <label>
                        Phone
                        <input value={partnerRegisterForm.phone} onChange={(event) => setPartnerRegisterForm({ ...partnerRegisterForm, phone: event.target.value })} />
                      </label>
                      <label>
                        Email
                        <input value={partnerRegisterForm.email} onChange={(event) => setPartnerRegisterForm({ ...partnerRegisterForm, email: event.target.value })} />
                      </label>
                      <label>
                        Password
                        <input type="password" value={partnerRegisterForm.password} onChange={(event) => setPartnerRegisterForm({ ...partnerRegisterForm, password: event.target.value })} />
                      </label>
                      <label>
                        Aadhaar
                        <input value={partnerRegisterForm.aadhaar} onChange={(event) => setPartnerRegisterForm({ ...partnerRegisterForm, aadhaar: event.target.value })} />
                      </label>
                      <label>
                        PAN
                        <input value={partnerRegisterForm.pan} onChange={(event) => setPartnerRegisterForm({ ...partnerRegisterForm, pan: event.target.value })} />
                      </label>
                      <label>
                        License number
                        <input value={partnerRegisterForm.licenseNumber} onChange={(event) => setPartnerRegisterForm({ ...partnerRegisterForm, licenseNumber: event.target.value })} />
                      </label>
                      <label>
                        Bank account
                        <input value={partnerRegisterForm.bankAccount} onChange={(event) => setPartnerRegisterForm({ ...partnerRegisterForm, bankAccount: event.target.value })} />
                      </label>
                      <label className="full">
                        Address
                        <input value={partnerRegisterForm.address} onChange={(event) => setPartnerRegisterForm({ ...partnerRegisterForm, address: event.target.value })} />
                      </label>
                      <label>
                        Distance away (km)
                        <input type="number" value={partnerRegisterForm.distanceAwayKm} onChange={(event) => setPartnerRegisterForm({ ...partnerRegisterForm, distanceAwayKm: Number(event.target.value) })} />
                      </label>
                    </div>
                  </div>

                  <div className="mini-section mini-section-accent">
                    <h3>Vehicle and rider setup</h3>
                    <div className="form-grid compact-grid compact-grid-tight">
                      <label>
                        Vehicle type
                        <select value={partnerRegisterForm.vehicleType} onChange={(event) => setPartnerRegisterForm({ ...partnerRegisterForm, vehicleType: event.target.value })}>
                          <option value="bike">Bike</option>
                          <option value="scooter">Scooter</option>
                          <option value="ev-bike">EV Bike</option>
                        </select>
                      </label>
                      <label>
                        Vehicle number
                        <input value={partnerRegisterForm.vehicleNumber} onChange={(event) => setPartnerRegisterForm({ ...partnerRegisterForm, vehicleNumber: event.target.value })} />
                      </label>
                      <label>
                        RC number
                        <input value={partnerRegisterForm.rcNumber} onChange={(event) => setPartnerRegisterForm({ ...partnerRegisterForm, rcNumber: event.target.value })} />
                      </label>
                      <label>
                        Insurance number
                        <input value={partnerRegisterForm.insuranceNumber} onChange={(event) => setPartnerRegisterForm({ ...partnerRegisterForm, insuranceNumber: event.target.value })} />
                      </label>
                      <label>
                        Rider full name
                        <input value={partnerRegisterForm.riderFullName} onChange={(event) => setPartnerRegisterForm({ ...partnerRegisterForm, riderFullName: event.target.value })} />
                      </label>
                      <label>
                        Rider phone
                        <input value={partnerRegisterForm.riderPhone} onChange={(event) => setPartnerRegisterForm({ ...partnerRegisterForm, riderPhone: event.target.value })} />
                      </label>
                      <label>
                        Rider license number
                        <input value={partnerRegisterForm.riderLicenseNumber} onChange={(event) => setPartnerRegisterForm({ ...partnerRegisterForm, riderLicenseNumber: event.target.value })} />
                      </label>
                      <label>
                        Rider emergency contact
                        <input value={partnerRegisterForm.riderEmergencyContact} onChange={(event) => setPartnerRegisterForm({ ...partnerRegisterForm, riderEmergencyContact: event.target.value })} />
                      </label>
                      <button className="primary full-button" onClick={handlePartnerRegister} disabled={busy}>Register partner, vehicle, and rider</button>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          </section>
        </main>
      </div>
    );
  }

  if (session.role === "customer") {
    return (
      <div className="app-shell dashboard-shell customer-shell">
        <header className="hero hero-simple hero-dashboard">
          <div>
            <span className="hero-badge">Customer Journey</span>
            <h1>{view.user.fullName}, book and manage your deliveries.</h1>
          </div>
          <button className="ghost" onClick={logout}>Logout</button>
        </header>

        <AlertModal message={error} onClose={() => setError("")} />

        <main className="content-grid">
          <section className="panel">
            <SectionTitle eyebrow="Booking" title="Create a new delivery" subtitle="Bookings stay open until an approved online partner accepts them." />
            <div className="form-grid compact-grid">
              <label className="full">
                Pickup address
                <div className="osm-field">
                  <input
                    value={bookingForm.pickupAddress}
                    onFocus={() => setShowPickupSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowPickupSuggestions(false), 150)}
                    onChange={(event) => {
                      setBookingForm({ ...bookingForm, pickupAddress: event.target.value, pickupLat: null, pickupLng: null, distanceKm: 0 });
                      setShowPickupSuggestions(true);
                    }}
                    placeholder="Type pickup address"
                  />
                  {showPickupSuggestions && pickupSuggestions.length ? (
                    <div className="osm-suggestions">
                      {pickupSuggestions.map((item) => (
                        <button
                          type="button"
                          className="osm-suggestion"
                          key={item.label}
                          onMouseDown={() => {
                            setBookingForm((current) => {
                            const next = { ...current, pickupAddress: item.label, pickupLat: item.lat, pickupLng: item.lng };
                            if (next.dropLat && next.dropLng) {
                              return { ...next, distanceKm: estimateRoadKmFromCoords(next.pickupLat, next.pickupLng, next.dropLat, next.dropLng) };
                            }
                            return next;
                          });
                            setShowPickupSuggestions(false);
                          }}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>
              </label>
              <label className="full">
                Drop address
                <div className="osm-field">
                  <input
                    value={bookingForm.dropAddress}
                    onFocus={() => setShowDropSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowDropSuggestions(false), 150)}
                    onChange={(event) => {
                      setBookingForm({ ...bookingForm, dropAddress: event.target.value, dropLat: null, dropLng: null, distanceKm: 0 });
                      setShowDropSuggestions(true);
                    }}
                    placeholder="Type drop address"
                  />
                  {showDropSuggestions && dropSuggestions.length ? (
                    <div className="osm-suggestions">
                      {dropSuggestions.map((item) => (
                        <button
                          type="button"
                          className="osm-suggestion"
                          key={item.label}
                          onMouseDown={() => {
                            setBookingForm((current) => {
                            const next = { ...current, dropAddress: item.label, dropLat: item.lat, dropLng: item.lng };
                            if (next.pickupLat && next.pickupLng) {
                              return { ...next, distanceKm: estimateRoadKmFromCoords(next.pickupLat, next.pickupLng, next.dropLat, next.dropLng) };
                            }
                            return next;
                          });
                            setShowDropSuggestions(false);
                          }}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>
              </label>
              <label>
                Distance (km)
                <input type="number" value={bookingForm.distanceKm} readOnly />
              </label>
              <label>
                Weight (kg)
                <input type="number" value={bookingForm.weightKg} onChange={(event) => setBookingForm({ ...bookingForm, weightKg: Number(event.target.value) })} />
              </label>
              <label>
                Vehicle type
                <select value={bookingForm.vehicleType} onChange={(event) => setBookingForm({ ...bookingForm, vehicleType: event.target.value })}>
                  {view.vehicles.map((vehicle) => <option key={vehicle.id} value={vehicle.id}>{vehicle.name}</option>)}
                </select>
              </label>
              <label>
                Zone
                <select value={bookingForm.zoneId} onChange={(event) => setBookingForm({ ...bookingForm, zoneId: event.target.value })}>
                  {view.zones.map((zone) => <option key={zone.id} value={zone.id}>{zone.name}</option>)}
                </select>
              </label>
              <label>
                Payment method
                <select value={bookingForm.paymentMethod} onChange={(event) => setBookingForm({ ...bookingForm, paymentMethod: event.target.value })}>
                  <option value="Online">Online</option>
                  <option value="COD">COD</option>
                </select>
              </label>
            </div>
            <div className="action-row">
              <button className="secondary" onClick={estimateFare}>Estimate fare</button>
              <button className="primary" onClick={createBooking}>Create booking</button>
            </div>
            {estimate ? <div className="estimate-card"><strong>Estimated total: Rs {estimate.total}</strong><span>Base Rs {estimate.baseFare}</span><span>Distance Rs {estimate.distanceCharge}</span><span>Weight Rs {estimate.weightCharge}</span></div> : null}
          </section>

          <section className="panel">
            <SectionTitle eyebrow="History" title="Your deliveries" subtitle="Every booking includes full tracking history." />
            <div className="delivery-table">
              {view.deliveries.map((delivery) => (
                <div className="delivery-row delivery-row-history" key={delivery.id}>
                  <div className="delivery-summary">
                    <strong>{delivery.id} - Rs {delivery.price}</strong>
                    <span>{delivery.status} - {delivery.pickupAddress} to {delivery.dropAddress}</span>
                    <span>{delivery.partnerName || "Waiting for partner"}</span>
                    <span>{delivery.riderName ? `Assigned rider: ${delivery.riderName} (${delivery.riderPhone})` : "Rider not assigned yet"}</span>
                    {delivery.status !== "Delivered" && delivery.status !== "Cancelled" ? (
                      <div className="cancel-box">
                        <input
                          placeholder="Cancellation reason"
                          value={cancelReasons[delivery.id] || ""}
                          onChange={(event) => setCancelReason(delivery.id, event.target.value)}
                        />
                        <button className="ghost" onClick={() => cancelDelivery(delivery.id)}>Cancel delivery</button>
                      </div>
                    ) : null}
                  </div>
                  <button className="toggle-history" onClick={() => toggleDeliveryExpansion(delivery.id)}>
                    {expandedDeliveries[delivery.id] ? "Hide tracking journey" : `Show tracking journey (${delivery.history.length})`}
                  </button>
                  {expandedDeliveries[delivery.id] ? (
                    <div className="history-list">
                      {delivery.history.map((item, index) => <div className="history-item" key={`${delivery.id}-${index}`}><strong>{item.status}</strong><span>{item.note}</span><span>{formatDate(item.createdAt)}</span></div>)}
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          </section>
        </main>
      </div>
    );
  }

  if (session.role === "partner") {
    const openJobs = view.deliveries.filter((delivery) => !delivery.partnerId && delivery.status === "Created");
    const myJobs = view.deliveries.filter((delivery) => delivery.partnerId === session.userId && delivery.status !== "Cancelled");
    return (
      <div className="app-shell dashboard-shell partner-shell">
        <header className="hero hero-simple hero-dashboard">
          <div>
            <span className="hero-badge">Partner Journey</span>
            <h1>{view.user.fullName}, manage your onboarding, riders, and delivery jobs.</h1>
            <p>Accepted jobs are tied to a specific rider so the customer always knows who is coming.</p>
          </div>
          <button className="ghost" onClick={logout}>Logout</button>
        </header>

        <AlertModal message={error} onClose={() => setError("")} />

        <main className="content-grid">
          <section className="panel">
            <SectionTitle eyebrow="Profile" title="Partner status" subtitle="Admin can inspect all your submitted details before approval." />
            <div className="metric-grid role-metrics">
              <MetricCard label="Verification" value={view.profile.verificationStatus} accent="#ff6b35" />
              <MetricCard label="Availability" value={view.profile.availability} accent="#017a5b" />
              <MetricCard label="Riders" value={view.profile.riders.length} accent="#0f172a" />
            </div>
            <div className="action-row">
              <button className="ghost" onClick={toggleAvailability}>Toggle availability</button>
            </div>
            <div className="details-grid">
              <DetailRow label="Aadhaar" value={view.profile.aadhaar} />
              <DetailRow label="PAN" value={view.profile.pan} />
              <DetailRow label="License" value={view.profile.licenseNumber} />
              <DetailRow label="Bank account" value={view.profile.bankAccount} />
              <DetailRow label="Address" value={view.profile.address} />
            </div>
            <div className="split-grid">
              <div className="subpanel">
                <h3>Your vehicles</h3>
                {view.profile.vehicles.map((vehicle) => <div className="price-rule" key={vehicle.id}><strong>{vehicle.vehicleType}</strong><span>{vehicle.vehicleNumber} - RC {vehicle.rcNumber || "-"} - Insurance {vehicle.insuranceNumber || "-"}</span></div>)}
              </div>
              <div className="subpanel">
                <h3>Your riders</h3>
                {view.profile.riders.map((rider) => <div className="price-rule" key={rider.id}><strong>{rider.fullName}</strong><span>{rider.phone} - License {rider.licenseNumber || "-"}</span></div>)}
              </div>
            </div>
            <div className="split-grid">
              <div className="subpanel">
                <h3>Add vehicle</h3>
                <div className="form-grid compact-grid">
              <label>
                Vehicle type
                <select value={vehicleForm.vehicleType} onChange={(event) => setVehicleForm({ ...vehicleForm, vehicleType: event.target.value })}>
                  {view.vehicles.map((vehicle) => <option key={vehicle.id} value={vehicle.id}>{vehicle.name}</option>)}
                </select>
              </label>
              <label>
                Vehicle number
                <input value={vehicleForm.vehicleNumber} onChange={(event) => setVehicleForm({ ...vehicleForm, vehicleNumber: event.target.value })} />
              </label>
              <label>
                RC number
                <input value={vehicleForm.rcNumber} onChange={(event) => setVehicleForm({ ...vehicleForm, rcNumber: event.target.value })} />
              </label>
              <label>
                Insurance number
                <input value={vehicleForm.insuranceNumber} onChange={(event) => setVehicleForm({ ...vehicleForm, insuranceNumber: event.target.value })} />
              </label>
              <button className="primary full-button" onClick={addVehicle}>Add vehicle</button>
                </div>
              </div>
              <div className="subpanel">
                <h3>Add rider</h3>
                <div className="form-grid compact-grid">
                  <label>
                    Rider full name
                    <input value={riderForm.fullName} onChange={(event) => setRiderForm({ ...riderForm, fullName: event.target.value })} />
                  </label>
                  <label>
                    Rider phone
                    <input value={riderForm.phone} onChange={(event) => setRiderForm({ ...riderForm, phone: event.target.value })} />
                  </label>
                  <label>
                    Rider license number
                    <input value={riderForm.licenseNumber} onChange={(event) => setRiderForm({ ...riderForm, licenseNumber: event.target.value })} />
                  </label>
                  <label>
                    Emergency contact
                    <input value={riderForm.emergencyContact} onChange={(event) => setRiderForm({ ...riderForm, emergencyContact: event.target.value })} />
                  </label>
                  <button className="primary full-button" onClick={addRider}>Add rider</button>
                </div>
              </div>
            </div>
          </section>

          <section className="panel">
            <SectionTitle eyebrow="Jobs" title="Accept and manage deliveries" subtitle="Open jobs can be accepted once. Accepted jobs can still be cancelled with history recorded." />
            <div className="split-grid">
              <div className="subpanel">
                <h3>Assigned to you</h3>
                {myJobs.length ? myJobs.map((delivery) => {
                  const currentIndex = statusFlow.indexOf(delivery.status);
                  const nextStatus = currentIndex >= 0 ? statusFlow[Math.min(currentIndex + 1, statusFlow.length - 1)] : statusFlow[0];
                  return (
                    <div className="job-item job-item-vertical" key={delivery.id}>
                      <div>
                        <strong>{delivery.id}</strong>
                        <span>{delivery.status} - {delivery.pickupAddress} to {delivery.dropAddress}</span>
                        <span>Assigned rider: {delivery.riderName || "-"} - {delivery.riderPhone || "-"}</span>
                        <span>{delivery.customerName} - {delivery.customerPhone}</span>
                      </div>
                      <div className="action-row multi-action-row">
                        {delivery.status !== "Delivered" ? <button className="secondary" onClick={() => updateDeliveryStatus(delivery.id, nextStatus)}>Move to {nextStatus}</button> : null}
                        {delivery.status !== "Delivered" && delivery.status !== "Cancelled" ? <button className="ghost" onClick={() => cancelDelivery(delivery.id)}>Cancel accepted job</button> : null}
                      </div>
                      <input
                        placeholder="Reason if cancelling"
                        value={cancelReasons[delivery.id] || ""}
                        onChange={(event) => setCancelReason(delivery.id, event.target.value)}
                      />
                    </div>
                  );
                }) : <span className="muted">No jobs assigned yet.</span>}
              </div>
              <div className="subpanel">
                <h3>Unassigned jobs</h3>
                {openJobs.length ? openJobs.map((delivery) => (
                  <div className="job-item job-item-vertical" key={delivery.id}>
                    <div>
                      <strong>{delivery.id}</strong>
                      <span>{delivery.pickupAddress} to {delivery.dropAddress}</span>
                      <span>Rs {delivery.price} - {delivery.distanceKm} km</span>
                    </div>
                    <select value={selectedRiders[delivery.id] || view.profile.riders[0]?.id || ""} onChange={(event) => setSelectedRider(delivery.id, event.target.value)}>
                      {view.profile.riders.map((rider) => <option key={rider.id} value={rider.id}>{rider.fullName} - {rider.phone}</option>)}
                    </select>
                    <button className="primary" onClick={() => acceptDelivery(delivery.id)}>Accept with rider</button>
                  </div>
                )) : <span className="muted">No open jobs right now.</span>}
              </div>
            </div>
          </section>
        </main>
      </div>
    );
  }

  return (
    <div className="app-shell dashboard-shell admin-shell">
      <header className="hero hero-simple hero-dashboard">
        <div>
          <span className="hero-badge">Admin Journey</span>
          <h1>{view.user.fullName}, approve partners and manage live operations.</h1>
        </div>
        <button className="ghost" onClick={logout}>Logout</button>
      </header>

      <AlertModal message={error} onClose={() => setError("")} />

      <main className="content-grid">
        <section className="panel">
          <SectionTitle eyebrow="Dashboard" title="Operations overview" subtitle="Admin sees metrics, partners, and all deliveries." />
          <div className="metric-grid">
            <MetricCard label="Total deliveries" value={view.dashboard.totalDeliveries} accent="#0f172a" />
            <MetricCard label="Online partners" value={view.dashboard.onlinePartners} accent="#017a5b" />
            <MetricCard label="Pending partners" value={view.dashboard.pendingPartners} accent="#ff6b35" />
            <MetricCard label="Completed revenue" value={`Rs ${view.dashboard.completedRevenue}`} accent="#155eef" />
          </div>
        </section>

        <section className="panel">
          <SectionTitle eyebrow="Partners" title="Partner, vehicle, and rider review" subtitle="Admin can inspect the full operational setup before approving the partner." />
          <div className="stack">
            {view.partners.map((partner) => (
              <div className="list-card" key={partner.id}>
                <div className="list-head">
                  <div>
                    <strong>{partner.name}</strong>
                    <span>{partner.phone} - {partner.email || "No email"} - {partner.verificationStatus} - {partner.availability}</span>
                  </div>
                  <div className="pill-row">
                    <button className="ghost" onClick={() => updatePartnerVerification(partner.id, "Approved")}>Approve</button>
                    <button className="ghost" onClick={() => updatePartnerVerification(partner.id, "Rejected")}>Reject</button>
                  </div>
                </div>
                <div className="details-grid">
                  <DetailRow label="Aadhaar" value={partner.aadhaar} />
                  <DetailRow label="PAN" value={partner.pan} />
                  <DetailRow label="License" value={partner.licenseNumber} />
                  <DetailRow label="Bank account" value={partner.bankAccount} />
                  <DetailRow label="Address" value={partner.address} />
                  <DetailRow label="Distance away" value={`${partner.distanceAwayKm} km`} />
                </div>
                <div className="split-grid">
                  <div className="history-list">
                    {partner.vehicles.map((vehicle) => (
                      <div className="history-item" key={vehicle.id}>
                        <strong>{vehicle.vehicleType}</strong>
                        <span>{vehicle.vehicleNumber}</span>
                        <span>RC {vehicle.rcNumber || "-"} - Insurance {vehicle.insuranceNumber || "-"}</span>
                      </div>
                    ))}
                  </div>
                  <div className="history-list">
                    {partner.riders?.map((rider) => (
                      <div className="history-item" key={rider.id}>
                        <strong>{rider.fullName}</strong>
                        <span>{rider.phone}</span>
                        <span>License {rider.licenseNumber || "-"} - Emergency {rider.emergencyContact || "-"}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="panel">
          <SectionTitle eyebrow="Dispatch" title="All deliveries and history" subtitle="Admin can inspect which rider accepted or is assigned to every order." />
          <div className="delivery-table">
            {view.deliveries.map((delivery) => (
              <div className="delivery-row delivery-row-history" key={delivery.id}>
                <div className="delivery-summary">
                  <strong>{delivery.id} - Rs {delivery.price}</strong>
                  <span>{delivery.customerName} - {delivery.customerPhone}</span>
                  <span>{delivery.status} - {delivery.pickupAddress} to {delivery.dropAddress}</span>
                  <span>{delivery.riderName ? `Rider: ${delivery.riderName} (${delivery.riderPhone})` : "Rider not assigned yet"}</span>
                  {delivery.partnerId ? (
                    <span>Partner: {delivery.partnerName}</span>
                  ) : delivery.status === "Created" ? (
                    <select onChange={(event) => assignDelivery(delivery.id, event.target.value)} defaultValue="">
                      <option value="" disabled>Assign partner</option>
                      {view.partners
                        .filter((partner) => partner.verificationStatus === "Approved")
                        .map((partner) => (
                          <option key={partner.id} value={partner.id}>{partner.name}</option>
                        ))}
                    </select>
                  ) : null}
                  {delivery.status !== "Delivered" && delivery.status !== "Cancelled" ? (
                    <div className="cancel-box">
                      <input
                        placeholder="Cancellation reason"
                        value={cancelReasons[delivery.id] || ""}
                        onChange={(event) => setCancelReason(delivery.id, event.target.value)}
                      />
                      <button className="ghost" onClick={() => cancelDelivery(delivery.id)}>Cancel delivery</button>
                    </div>
                  ) : null}
                </div>
                <div className="history-list">
                  {delivery.history.map((item, index) => (
                    <div className="history-item" key={`${delivery.id}-${index}`}>
                      <strong>{item.status}</strong>
                      <span>{item.note}</span>
                      <span>{formatDate(item.createdAt)}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
