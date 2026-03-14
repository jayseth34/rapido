INSERT INTO users (id, full_name, phone, email, password, role, status) VALUES
  ('admin-1', 'Rapido Admin', '9000000000', 'admin@rapido.local', 'admin123', 'admin', 'active')
ON CONFLICT (id) DO NOTHING;

INSERT INTO vehicles (id, name, max_weight, description) VALUES
  ('bike', 'Bike', 5, 'Fast documents and essentials'),
  ('scooter', 'Scooter', 10, 'Best for small parcel delivery'),
  ('ev-bike', 'EV Bike', 5, 'Eco-friendly short distance trips')
ON CONFLICT (id) DO NOTHING;

INSERT INTO zones (id, name, max_radius_km, center_label) VALUES
  ('zone-andheri-west', 'Andheri West', 6, 'Andheri Circle'),
  ('zone-juhu-vp', 'Juhu - Vile Parle', 8, 'Juhu Signal')
ON CONFLICT (id) DO NOTHING;

INSERT INTO pricing_rules (vehicle_type, base_fare, per_km, weight_grace_kg, extra_weight_charge) VALUES
  ('bike', 30, 10, 2, 5),
  ('scooter', 35, 12, 2, 6),
  ('ev-bike', 32, 9, 2, 5)
ON CONFLICT (vehicle_type) DO NOTHING;
