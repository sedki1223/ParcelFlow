import express from "express";
import pool from "./config/database.js";
import parcelRoutes from "./routes/parcelRoutes.js";

const app = express();

app.use(express.json());

app.get("/api/health", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");

    res.json({
      status: "ok",
      service: "ParcelFlow API",
      database: "connected",
      databaseTime: result.rows[0].now,
    });
  } catch (error) {
    console.error("Database connection failed:", error);

    res.status(500).json({
      status: "error",
      service: "ParcelFlow API",
      database: "disconnected",
    });
  }
});

app.use("/api/parcels", parcelRoutes);

export default app;