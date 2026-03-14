DROP TABLE IF EXISTS delivery_history CASCADE;
DROP TABLE IF EXISTS deliveries CASCADE;
DROP TABLE IF EXISTS partner_riders CASCADE;
DROP TABLE IF EXISTS partner_vehicles CASCADE;
DROP TABLE IF EXISTS partner_profiles CASCADE;
DROP TABLE IF EXISTS pricing_rules CASCADE;
DROP TABLE IF EXISTS zones CASCADE;
DROP TABLE IF EXISTS vehicles CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP SEQUENCE IF EXISTS delivery_number_seq;

CREATE SEQUENCE delivery_number_seq START WITH 1001;

CREATE TABLE users (
  id TEXT PRIMARY KEY,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL UNIQUE,
  email TEXT UNIQUE,
  password TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('customer', 'partner', 'admin')),
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE vehicles (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  max_weight NUMERIC(10, 2) NOT NULL,
  description TEXT NOT NULL
);

CREATE TABLE zones (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  max_radius_km NUMERIC(10, 2) NOT NULL,
  center_label TEXT NOT NULL
);

CREATE TABLE pricing_rules (
  vehicle_type TEXT PRIMARY KEY REFERENCES vehicles(id) ON DELETE CASCADE,
  base_fare NUMERIC(10, 2) NOT NULL,
  per_km NUMERIC(10, 2) NOT NULL,
  weight_grace_kg NUMERIC(10, 2) NOT NULL,
  extra_weight_charge NUMERIC(10, 2) NOT NULL
);

CREATE TABLE partner_profiles (
  user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  verification_status TEXT NOT NULL DEFAULT 'Pending',
  availability TEXT NOT NULL DEFAULT 'offline',
  rating NUMERIC(3, 2) NOT NULL DEFAULT 0,
  distance_away_km NUMERIC(10, 2) NOT NULL DEFAULT 0,
  earnings_today NUMERIC(10, 2) NOT NULL DEFAULT 0,
  aadhaar TEXT,
  pan TEXT,
  license_number TEXT,
  address TEXT,
  bank_account TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE partner_vehicles (
  id TEXT PRIMARY KEY,
  partner_user_id TEXT NOT NULL REFERENCES partner_profiles(user_id) ON DELETE CASCADE,
  vehicle_type TEXT NOT NULL REFERENCES vehicles(id),
  vehicle_number TEXT NOT NULL UNIQUE,
  rc_number TEXT,
  insurance_number TEXT,
  is_primary BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE partner_riders (
  id TEXT PRIMARY KEY,
  partner_user_id TEXT NOT NULL REFERENCES partner_profiles(user_id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  license_number TEXT,
  emergency_contact TEXT,
  is_primary BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE deliveries (
  id TEXT PRIMARY KEY,
  customer_id TEXT NOT NULL REFERENCES users(id),
  partner_id TEXT REFERENCES users(id),
  rider_id TEXT REFERENCES partner_riders(id),
  pickup_address TEXT NOT NULL,
  drop_address TEXT NOT NULL,
  distance_km NUMERIC(10, 2) NOT NULL,
  weight_kg NUMERIC(10, 2) NOT NULL,
  vehicle_type TEXT NOT NULL REFERENCES vehicles(id),
  zone_id TEXT NOT NULL REFERENCES zones(id),
  price NUMERIC(10, 2) NOT NULL,
  payment_method TEXT NOT NULL,
  payment_status TEXT NOT NULL,
  status TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE delivery_history (
  id BIGSERIAL PRIMARY KEY,
  delivery_id TEXT NOT NULL REFERENCES deliveries(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  note TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_deliveries_customer ON deliveries(customer_id, created_at DESC);
CREATE INDEX idx_deliveries_partner ON deliveries(partner_id, created_at DESC);
CREATE INDEX idx_delivery_history_delivery ON delivery_history(delivery_id, created_at DESC);
