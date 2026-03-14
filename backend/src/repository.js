import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { query, withTransaction } from "./db.js";
import { activeStatuses, calculatePrice } from "./utils.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const sqlDir = path.resolve(__dirname, "../sql");

function makeId(prefix) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

function mapPricingRule(row) {
  return {
    baseFare: Number(row.base_fare),
    perKm: Number(row.per_km),
    weightGraceKg: Number(row.weight_grace_kg),
    extraWeightCharge: Number(row.extra_weight_charge)
  };
}

function mapUser(row) {
  if (!row) return null;
  return {
    id: row.id,
    fullName: row.full_name,
    phone: row.phone,
    email: row.email,
    role: row.role,
    status: row.status,
    createdAt: row.created_at
  };
}

function mapVehicle(row) {
  return {
    id: row.id,
    partnerUserId: row.partner_user_id,
    vehicleType: row.vehicle_type,
    vehicleNumber: row.vehicle_number,
    rcNumber: row.rc_number,
    insuranceNumber: row.insurance_number,
    isPrimary: row.is_primary,
    createdAt: row.created_at
  };
}

function mapRider(row) {
  return {
    id: row.id,
    partnerUserId: row.partner_user_id,
    fullName: row.full_name,
    phone: row.phone,
    licenseNumber: row.license_number,
    emergencyContact: row.emergency_contact,
    isPrimary: row.is_primary,
    createdAt: row.created_at
  };
}

function mapPartner(row) {
  return {
    id: row.id,
    name: row.full_name,
    phone: row.phone,
    email: row.email,
    verificationStatus: row.verification_status,
    availability: row.availability,
    rating: Number(row.rating),
    distanceAwayKm: Number(row.distance_away_km),
    earningsToday: Number(row.earnings_today),
    aadhaar: row.aadhaar,
    pan: row.pan,
    licenseNumber: row.license_number,
    address: row.address,
    bankAccount: row.bank_account,
    vehicles: [],
    riders: []
  };
}

function mapDelivery(row, history = []) {
  return {
    id: row.id,
    customerId: row.customer_id,
    customerName: row.customer_name,
    customerPhone: row.customer_phone,
    partnerId: row.partner_id,
    partnerName: row.partner_name,
    riderId: row.rider_id,
    riderName: row.rider_name,
    riderPhone: row.rider_phone,
    pickupAddress: row.pickup_address,
    dropAddress: row.drop_address,
    distanceKm: Number(row.distance_km),
    weightKg: Number(row.weight_kg),
    vehicleType: row.vehicle_type,
    zoneId: row.zone_id,
    price: Number(row.price),
    paymentMethod: row.payment_method,
    paymentStatus: row.payment_status,
    status: row.status,
    createdAt: row.created_at,
    history
  };
}

async function runSqlFile(filename) {
  const sql = await fs.readFile(path.join(sqlDir, filename), "utf8");
  await query(sql);
}

async function getCatalog() {
  const [vehiclesResult, zonesResult, pricingResult] = await Promise.all([
    query("SELECT id, name, max_weight, description FROM vehicles ORDER BY name"),
    query("SELECT id, name, max_radius_km, center_label FROM zones ORDER BY name"),
    query("SELECT vehicle_type, base_fare, per_km, weight_grace_kg, extra_weight_charge FROM pricing_rules ORDER BY vehicle_type")
  ]);

  return {
    vehicles: vehiclesResult.rows.map((row) => ({
      id: row.id,
      name: row.name,
      maxWeight: Number(row.max_weight),
      description: row.description
    })),
    zones: zonesResult.rows.map((row) => ({
      id: row.id,
      name: row.name,
      maxRadiusKm: Number(row.max_radius_km),
      centerLabel: row.center_label
    })),
    pricingRules: pricingResult.rows.reduce((accumulator, row) => {
      accumulator[row.vehicle_type] = mapPricingRule(row);
      return accumulator;
    }, {})
  };
}

async function getDeliveries(whereClause = "", params = []) {
  const deliveriesResult = await query(
    `SELECT d.*, cu.full_name AS customer_name, cu.phone AS customer_phone,
            pu.full_name AS partner_name, pr.full_name AS rider_name, pr.phone AS rider_phone
     FROM deliveries d
     JOIN users cu ON cu.id = d.customer_id
     LEFT JOIN users pu ON pu.id = d.partner_id
     LEFT JOIN partner_riders pr ON pr.id = d.rider_id
     ${whereClause}
     ORDER BY d.created_at DESC`,
    params
  );

  const deliveryIds = deliveriesResult.rows.map((row) => row.id);
  const historyRows = deliveryIds.length
    ? await query(
        `SELECT delivery_id, status, note, created_at
         FROM delivery_history
         WHERE delivery_id = ANY($1::text[])
         ORDER BY created_at DESC`,
        [deliveryIds]
      )
    : { rows: [] };

  const historyByDelivery = historyRows.rows.reduce((accumulator, row) => {
    accumulator[row.delivery_id] = accumulator[row.delivery_id] || [];
    accumulator[row.delivery_id].push({
      status: row.status,
      note: row.note,
      createdAt: row.created_at
    });
    return accumulator;
  }, {});

  return deliveriesResult.rows.map((row) => mapDelivery(row, historyByDelivery[row.id] || []));
}

async function getPartners() {
  const [partnersResult, vehiclesResult, ridersResult] = await Promise.all([
    query(
      `SELECT u.id, u.full_name, u.phone, u.email, p.verification_status, p.availability, p.rating,
              p.distance_away_km, p.earnings_today, p.aadhaar, p.pan, p.license_number, p.address, p.bank_account
       FROM users u
       JOIN partner_profiles p ON p.user_id = u.id
       WHERE u.role = 'partner'
       ORDER BY u.created_at DESC`
    ),
    query("SELECT * FROM partner_vehicles ORDER BY created_at DESC"),
    query("SELECT * FROM partner_riders ORDER BY created_at DESC")
  ]);

  const partnerMap = partnersResult.rows.reduce((accumulator, row) => {
    accumulator[row.id] = mapPartner(row);
    return accumulator;
  }, {});

  for (const row of vehiclesResult.rows) {
    if (partnerMap[row.partner_user_id]) {
      partnerMap[row.partner_user_id].vehicles.push(mapVehicle(row));
    }
  }

  for (const row of ridersResult.rows) {
    if (partnerMap[row.partner_user_id]) {
      partnerMap[row.partner_user_id].riders.push(mapRider(row));
    }
  }

  return Object.values(partnerMap);
}

function buildDashboard(deliveries, partners) {
  return {
    totalDeliveries: deliveries.length,
    activeDeliveries: deliveries.filter((delivery) => activeStatuses.has(delivery.status)).length,
    completedRevenue: deliveries.filter((delivery) => delivery.status === "Delivered").reduce((sum, delivery) => sum + delivery.price, 0),
    onlinePartners: partners.filter((partner) => partner.availability === "online").length,
    pendingPartners: partners.filter((partner) => partner.verificationStatus === "Pending").length,
    failedDeliveries: deliveries.filter((delivery) => delivery.status === "Cancelled").length
  };
}

async function getPrimaryRider(client, partnerUserId) {
  const result = await client.query(
    "SELECT * FROM partner_riders WHERE partner_user_id = $1 ORDER BY is_primary DESC, created_at ASC LIMIT 1",
    [partnerUserId]
  );
  return result.rowCount ? result.rows[0] : null;
}

export async function initializeDatabase() {
  try {
    await query("SELECT 1 FROM users LIMIT 1");
    await query("SELECT 1 FROM partner_riders LIMIT 1");
  } catch (error) {
    throw new Error("Database tables are missing. Re-run backend/sql/schema.sql and backend/sql/seed.sql in pgAdmin first.");
  }
}

export async function installDatabaseScripts() {
  await runSqlFile("schema.sql");
  await runSqlFile("seed.sql");
}

export async function login({ phone, password, role }) {
  const result = await query(
    "SELECT * FROM users WHERE phone = $1 AND password = $2 AND role = $3",
    [phone, password, role]
  );

  if (result.rowCount === 0) {
    throw new Error("Invalid credentials");
  }

  return mapUser(result.rows[0]);
}

export async function registerCustomer(input) {
  return withTransaction(async (client) => {
    const existing = await client.query("SELECT id FROM users WHERE phone = $1", [input.phone]);
    if (existing.rowCount > 0) {
      throw new Error("Phone already registered");
    }

    const id = makeId("customer");
    const result = await client.query(
      `INSERT INTO users (id, full_name, phone, email, password, role, status)
       VALUES ($1, $2, $3, $4, $5, 'customer', 'active')
       RETURNING *`,
      [id, input.fullName, input.phone, input.email || null, input.password]
    );

    return mapUser(result.rows[0]);
  });
}

export async function registerPartner(input) {
  return withTransaction(async (client) => {
    const existing = await client.query("SELECT id FROM users WHERE phone = $1", [input.phone]);
    if (existing.rowCount > 0) {
      throw new Error("Phone already registered");
    }

    const userId = makeId("partner");
    await client.query(
      `INSERT INTO users (id, full_name, phone, email, password, role, status)
       VALUES ($1, $2, $3, $4, $5, 'partner', 'active')`,
      [userId, input.fullName, input.phone, input.email || null, input.password]
    );

    await client.query(
      `INSERT INTO partner_profiles (
        user_id, verification_status, availability, aadhaar, pan, license_number, address, bank_account, distance_away_km
      ) VALUES ($1, 'Pending', 'offline', $2, $3, $4, $5, $6, $7)`,
      [userId, input.aadhaar || null, input.pan || null, input.licenseNumber || null, input.address || null, input.bankAccount || null, Number(input.distanceAwayKm || 0)]
    );

    const vehicleId = makeId("vehicle");
    await client.query(
      `INSERT INTO partner_vehicles (
        id, partner_user_id, vehicle_type, vehicle_number, rc_number, insurance_number, is_primary
      ) VALUES ($1, $2, $3, $4, $5, $6, true)`,
      [vehicleId, userId, input.vehicleType, input.vehicleNumber, input.rcNumber || null, input.insuranceNumber || null]
    );

    const riderId = makeId("rider");
    await client.query(
      `INSERT INTO partner_riders (
        id, partner_user_id, full_name, phone, license_number, emergency_contact, is_primary
      ) VALUES ($1, $2, $3, $4, $5, $6, true)`,
      [riderId, userId, input.riderFullName, input.riderPhone, input.riderLicenseNumber || null, input.riderEmergencyContact || null]
    );

    const userResult = await client.query("SELECT * FROM users WHERE id = $1", [userId]);
    return mapUser(userResult.rows[0]);
  });
}

export async function addPartnerVehicle(partnerUserId, input) {
  const vehicleId = makeId("vehicle");
  const result = await query(
    `INSERT INTO partner_vehicles (
      id, partner_user_id, vehicle_type, vehicle_number, rc_number, insurance_number, is_primary
    ) VALUES ($1, $2, $3, $4, $5, $6, false)
    RETURNING *`,
    [vehicleId, partnerUserId, input.vehicleType, input.vehicleNumber, input.rcNumber || null, input.insuranceNumber || null]
  );

  return mapVehicle(result.rows[0]);
}

export async function addPartnerRider(partnerUserId, input) {
  const riderId = makeId("rider");
  const result = await query(
    `INSERT INTO partner_riders (
      id, partner_user_id, full_name, phone, license_number, emergency_contact, is_primary
    ) VALUES ($1, $2, $3, $4, $5, $6, false)
    RETURNING *`,
    [riderId, partnerUserId, input.fullName, input.phone, input.licenseNumber || null, input.emergencyContact || null]
  );

  return mapRider(result.rows[0]);
}

export async function getSession(role, userId) {
  const catalog = await getCatalog();

  if (role === "customer") {
    const userResult = await query("SELECT * FROM users WHERE id = $1 AND role = 'customer'", [userId]);
    if (userResult.rowCount === 0) {
      throw new Error("User not found");
    }

    const deliveries = await getDeliveries("WHERE d.customer_id = $1", [userId]);
    return {
      user: mapUser(userResult.rows[0]),
      ...catalog,
      deliveries
    };
  }

  if (role === "partner") {
    const [userResult, partnerResult, vehiclesResult, ridersResult] = await Promise.all([
      query("SELECT * FROM users WHERE id = $1 AND role = 'partner'", [userId]),
      query("SELECT * FROM partner_profiles WHERE user_id = $1", [userId]),
      query("SELECT * FROM partner_vehicles WHERE partner_user_id = $1 ORDER BY created_at DESC", [userId]),
      query("SELECT * FROM partner_riders WHERE partner_user_id = $1 ORDER BY is_primary DESC, created_at ASC", [userId])
    ]);

    if (userResult.rowCount === 0 || partnerResult.rowCount === 0) {
      throw new Error("User not found");
    }

    const deliveries = await getDeliveries("WHERE d.partner_id = $1 OR (d.partner_id IS NULL AND d.status = 'Created')", [userId]);
    return {
      user: mapUser(userResult.rows[0]),
      profile: {
        ...mapPartner({ ...userResult.rows[0], ...partnerResult.rows[0] }),
        vehicles: vehiclesResult.rows.map(mapVehicle),
        riders: ridersResult.rows.map(mapRider)
      },
      ...catalog,
      deliveries
    };
  }

  if (role === "admin") {
    const userResult = await query("SELECT * FROM users WHERE id = $1 AND role = 'admin'", [userId]);
    if (userResult.rowCount === 0) {
      throw new Error("User not found");
    }

    const [partners, deliveries] = await Promise.all([getPartners(), getDeliveries()]);
    return {
      user: mapUser(userResult.rows[0]),
      dashboard: buildDashboard(deliveries, partners),
      partners,
      deliveries,
      ...catalog
    };
  }

  throw new Error("Unsupported role");
}

export async function estimateBooking({ vehicleType, distanceKm, weightKg }) {
  const result = await query(
    "SELECT vehicle_type, base_fare, per_km, weight_grace_kg, extra_weight_charge FROM pricing_rules WHERE vehicle_type = $1",
    [vehicleType]
  );

  if (result.rowCount === 0) {
    throw new Error("Unsupported vehicle type");
  }

  return calculatePrice(mapPricingRule(result.rows[0]), distanceKm, weightKg);
}

export async function createDelivery(input) {
  return withTransaction(async (client) => {
    const customerResult = await client.query("SELECT * FROM users WHERE id = $1 AND role = 'customer'", [input.customerId]);
    if (customerResult.rowCount === 0) {
      throw new Error("Customer not found");
    }

    const pricingResult = await client.query(
      "SELECT vehicle_type, base_fare, per_km, weight_grace_kg, extra_weight_charge FROM pricing_rules WHERE vehicle_type = $1",
      [input.vehicleType]
    );

    if (pricingResult.rowCount === 0) {
      throw new Error("Unsupported vehicle type");
    }

    const pricing = calculatePrice(mapPricingRule(pricingResult.rows[0]), input.distanceKm, input.weightKg);
    const deliveryNumberResult = await client.query("SELECT nextval('delivery_number_seq') AS num");
    const deliveryId = `DLV-${deliveryNumberResult.rows[0].num}`;
    const paymentStatus = input.paymentMethod === "Online" ? "Paid" : "Pending";

    await client.query(
      `INSERT INTO deliveries (
        id, customer_id, partner_id, rider_id, pickup_address, drop_address, distance_km, weight_kg,
        vehicle_type, zone_id, price, payment_method, payment_status, status
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)`,
      [
        deliveryId,
        input.customerId,
        null,
        null,
        input.pickupAddress,
        input.dropAddress,
        Number(input.distanceKm),
        Number(input.weightKg),
        input.vehicleType,
        input.zoneId,
        pricing.total,
        input.paymentMethod,
        paymentStatus,
        "Created"
      ]
    );

    await client.query(
      "INSERT INTO delivery_history (delivery_id, status, note) VALUES ($1,$2,$3)",
      [deliveryId, "Created", "Booking created by customer"]
    );

    const deliveries = await getDeliveries("WHERE d.id = $1", [deliveryId]);
    return deliveries[0];
  });
}

export async function acceptDelivery(deliveryId, partnerId, riderId) {
  return withTransaction(async (client) => {
    const deliveryResult = await client.query("SELECT * FROM deliveries WHERE id = $1 FOR UPDATE", [deliveryId]);
    if (deliveryResult.rowCount === 0) {
      throw new Error("Delivery not found");
    }

    const delivery = deliveryResult.rows[0];
    if (delivery.partner_id) {
      throw new Error("Delivery already accepted");
    }
    if (delivery.status === "Cancelled") {
      throw new Error("Cancelled delivery cannot be accepted");
    }

    const partnerResult = await client.query(
      `SELECT u.id, u.full_name, p.verification_status, p.availability
       FROM users u
       JOIN partner_profiles p ON p.user_id = u.id
       WHERE u.id = $1 AND u.role = 'partner'`,
      [partnerId]
    );
    if (partnerResult.rowCount === 0) {
      throw new Error("Partner not found");
    }

    const partner = partnerResult.rows[0];
    if (partner.verification_status !== "Approved") {
      throw new Error("Partner is not approved yet");
    }
    if (partner.availability !== "online") {
      throw new Error("Partner must be online to accept deliveries");
    }

    let rider = null;
    if (riderId) {
      const riderResult = await client.query(
        "SELECT * FROM partner_riders WHERE id = $1 AND partner_user_id = $2",
        [riderId, partnerId]
      );
      if (riderResult.rowCount === 0) {
        throw new Error("Rider not found for this partner");
      }
      rider = riderResult.rows[0];
    } else {
      rider = await getPrimaryRider(client, partnerId);
    }

    if (!rider) {
      throw new Error("Partner must have at least one rider");
    }

    await client.query(
      "UPDATE deliveries SET partner_id = $1, rider_id = $2, status = 'Partner Accepted' WHERE id = $3",
      [partnerId, rider.id, deliveryId]
    );
    await client.query(
      "INSERT INTO delivery_history (delivery_id, status, note) VALUES ($1, $2, $3)",
      [deliveryId, "Partner Accepted", `Accepted by rider ${rider.full_name} (${rider.phone})`]
    );

    const deliveries = await getDeliveries("WHERE d.id = $1", [deliveryId]);
    return deliveries[0];
  });
}

export async function assignDelivery(deliveryId, partnerId) {
  return withTransaction(async (client) => {
    const [deliveryResult, partnerResult] = await Promise.all([
      client.query("SELECT * FROM deliveries WHERE id = $1 FOR UPDATE", [deliveryId]),
      client.query("SELECT * FROM users WHERE id = $1 AND role = 'partner'", [partnerId])
    ]);

    if (deliveryResult.rowCount === 0) {
      throw new Error("Delivery not found");
    }
    if (partnerResult.rowCount === 0) {
      throw new Error("Partner not found");
    }
    if (deliveryResult.rows[0].partner_id) {
      throw new Error("Delivery already accepted");
    }

    const rider = await getPrimaryRider(client, partnerId);
    if (!rider) {
      throw new Error("Selected partner has no rider configured");
    }

    await client.query(
      "UPDATE deliveries SET partner_id = $1, rider_id = $2, status = 'Partner Assigned' WHERE id = $3",
      [partnerId, rider.id, deliveryId]
    );
    await client.query(
      "INSERT INTO delivery_history (delivery_id, status, note) VALUES ($1,$2,$3)",
      [deliveryId, "Partner Assigned", `Manually assigned to rider ${rider.full_name} (${rider.phone})`] 
    );

    const deliveries = await getDeliveries("WHERE d.id = $1", [deliveryId]);
    return deliveries[0];
  });
}

export async function cancelDelivery(deliveryId, actorRole, actorId, reason) {
  return withTransaction(async (client) => {
    const deliveryResult = await client.query("SELECT * FROM deliveries WHERE id = $1 FOR UPDATE", [deliveryId]);
    if (deliveryResult.rowCount === 0) {
      throw new Error("Delivery not found");
    }

    const delivery = deliveryResult.rows[0];
    if (delivery.status === "Delivered") {
      throw new Error("Delivered delivery cannot be cancelled");
    }
    if (delivery.status === "Cancelled") {
      throw new Error("Delivery already cancelled");
    }
    if (actorRole === "customer" && delivery.customer_id !== actorId) {
      throw new Error("Customer cannot cancel another customer's delivery");
    }
    if (actorRole === "partner" && delivery.partner_id !== actorId) {
      throw new Error("Partner can only cancel accepted deliveries");
    }

    const keepPartner = actorRole === "customer" || actorRole === "admin" ? delivery.partner_id : null;
    const keepRider = actorRole === "customer" || actorRole === "admin" ? delivery.rider_id : null;
    await client.query(
      "UPDATE deliveries SET status = 'Cancelled', partner_id = $1, rider_id = $2 WHERE id = $3",
      [keepPartner, keepRider, deliveryId]
    );
    await client.query(
      "INSERT INTO delivery_history (delivery_id, status, note) VALUES ($1, $2, $3)",
      [deliveryId, "Cancelled", `Cancelled by ${actorRole}${reason ? `: ${reason}` : ""}`]
    );

    const deliveries = await getDeliveries("WHERE d.id = $1", [deliveryId]);
    return deliveries[0];
  });
}

export async function updateDeliveryStatus(deliveryId, status) {
  return withTransaction(async (client) => {
    const deliveryResult = await client.query("SELECT * FROM deliveries WHERE id = $1", [deliveryId]);
    if (deliveryResult.rowCount === 0) {
      throw new Error("Delivery not found");
    }
    if (deliveryResult.rows[0].status === "Cancelled") {
      throw new Error("Cancelled delivery cannot be updated");
    }

    const paymentStatus =
      status === "Delivered" && deliveryResult.rows[0].payment_method === "COD"
        ? "Collected"
        : deliveryResult.rows[0].payment_status;

    await client.query(
      "UPDATE deliveries SET status = $1, payment_status = $2 WHERE id = $3",
      [status, paymentStatus, deliveryId]
    );
    await client.query(
      "INSERT INTO delivery_history (delivery_id, status, note) VALUES ($1,$2,$3)",
      [deliveryId, status, `Status moved to ${status}`]
    );

    const deliveries = await getDeliveries("WHERE d.id = $1", [deliveryId]);
    return deliveries[0];
  });
}

export async function togglePartnerAvailability(partnerId) {
  const result = await query(
    `UPDATE partner_profiles
     SET availability = CASE WHEN availability = 'online' THEN 'offline' ELSE 'online' END
     WHERE user_id = $1
     RETURNING *`,
    [partnerId]
  );

  if (result.rowCount === 0) {
    throw new Error("Partner not found");
  }

  return result.rows[0];
}

export async function updatePartnerVerification(partnerId, verificationStatus) {
  const result = await query(
    "UPDATE partner_profiles SET verification_status = $1 WHERE user_id = $2 RETURNING *",
    [verificationStatus, partnerId]
  );

  if (result.rowCount === 0) {
    throw new Error("Partner not found");
  }

  return result.rows[0];
}
