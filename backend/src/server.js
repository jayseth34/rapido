import cors from "cors";
import express from "express";
import {
  acceptDelivery,
  addPartnerRider,
  addPartnerVehicle,
  assignDelivery,
  cancelDelivery,
  createDelivery,
  estimateBooking,
  getSession,
  initializeDatabase,
  login,
  registerCustomer,
  registerPartner,
  togglePartnerAvailability,
  updateDeliveryStatus,
  updatePartnerVerification
} from "./repository.js";
import { testConnection } from "./db.js";

const app = express();
const port = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

app.get("/api/health", async (_req, res) => {
  try {
    await testConnection();
    res.json({ status: "ok", service: "rapido-backend", database: "connected" });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message, database: "disconnected" });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const user = await login(req.body);
    res.json(user);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

app.post("/api/auth/register-customer", async (req, res) => {
  try {
    const user = await registerCustomer(req.body);
    res.status(201).json(user);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

app.post("/api/auth/register-partner", async (req, res) => {
  try {
    const user = await registerPartner(req.body);
    res.status(201).json(user);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

app.get("/api/session", async (req, res) => {
  try {
    const payload = await getSession(req.query.role, req.query.userId);
    res.json(payload);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

app.post("/api/bookings/estimate", async (req, res) => {
  try {
    const pricing = await estimateBooking(req.body);
    res.json(pricing);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

app.post("/api/deliveries", async (req, res) => {
  try {
    const delivery = await createDelivery(req.body);
    res.status(201).json(delivery);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

app.patch("/api/deliveries/:id/accept", async (req, res) => {
  try {
    const delivery = await acceptDelivery(req.params.id, req.body.partnerId, req.body.riderId);
    res.json(delivery);
  } catch (error) {
    res.status(error.message.includes("not found") ? 404 : 400).json({ message: error.message });
  }
});

app.patch("/api/deliveries/:id/assign", async (req, res) => {
  try {
    const delivery = await assignDelivery(req.params.id, req.body.partnerId);
    res.json(delivery);
  } catch (error) {
    res.status(error.message.includes("not found") ? 404 : 400).json({ message: error.message });
  }
});

app.patch("/api/deliveries/:id/cancel", async (req, res) => {
  try {
    const delivery = await cancelDelivery(req.params.id, req.body.actorRole, req.body.actorId, req.body.reason);
    res.json(delivery);
  } catch (error) {
    res.status(error.message.includes("not found") ? 404 : 400).json({ message: error.message });
  }
});

app.patch("/api/deliveries/:id/status", async (req, res) => {
  try {
    const delivery = await updateDeliveryStatus(req.params.id, req.body.status);
    res.json(delivery);
  } catch (error) {
    res.status(error.message.includes("not found") ? 404 : 400).json({ message: error.message });
  }
});

app.patch("/api/partners/:id/toggle-availability", async (req, res) => {
  try {
    const partner = await togglePartnerAvailability(req.params.id);
    res.json(partner);
  } catch (error) {
    res.status(error.message.includes("not found") ? 404 : 400).json({ message: error.message });
  }
});

app.patch("/api/partners/:id/verification", async (req, res) => {
  try {
    const partner = await updatePartnerVerification(req.params.id, req.body.verificationStatus);
    res.json(partner);
  } catch (error) {
    res.status(error.message.includes("not found") ? 404 : 400).json({ message: error.message });
  }
});

app.post("/api/partners/:id/vehicles", async (req, res) => {
  try {
    const vehicle = await addPartnerVehicle(req.params.id, req.body);
    res.status(201).json(vehicle);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

app.post("/api/partners/:id/riders", async (req, res) => {
  try {
    const rider = await addPartnerRider(req.params.id, req.body);
    res.status(201).json(rider);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

async function startServer() {
  try {
    await initializeDatabase();
    app.listen(port, () => {
      console.log(`Backend running on http://localhost:${port}`);
    });
  } catch (error) {
    console.error("Failed to start backend:", error.message);
    process.exit(1);
  }
}

startServer();
