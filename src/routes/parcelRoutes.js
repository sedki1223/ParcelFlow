import express from "express";
import {
  createParcelController,
  getParcelController,
  updateParcelStatusController,
  getParcelsController,
} from "../controllers/parcelController.js";

const router = express.Router();

router.post("/", createParcelController);
router.get("/", getParcelsController);
router.get("/:trackingNumber", getParcelController);
router.patch("/:trackingNumber/status", updateParcelStatusController);

export default router;