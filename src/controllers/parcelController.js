import {
  createParcel,
  getParcelByTrackingNumber,
  updateParcelStatus,
  getParcels,
} from "../services/parcelService.js";

import {
  validateCreateParcel,
  validateStatus,
} from "../validators/parcelValidator.js";

export async function createParcelController(req, res) {
  try {
    const {
      trackingNumber,
      senderName,
      recipientName,
      origin,
      destination,
    } = req.body;

    const validation = validateCreateParcel(req.body);

    if (!validation.valid) {
      return res.status(400).json({
        error: validation.error,
        fields: validation.fields,
      });
    }

    const parcel = await createParcel({
      trackingNumber: trackingNumber.trim(),
      senderName: senderName.trim(),
      recipientName: recipientName.trim(),
      origin: origin.trim(),
      destination: destination.trim(),
    });

    res.status(201).json(parcel);
  } catch (error) {
        if (error.code === "23505") {
        return res.status(409).json({
            error: "Tracking number already exists",
        });
        }
        console.error("Create parcel failed:", error);
    res.status(500).json({
      error: "Failed to create parcel",
    });
  }
}

export async function getParcelController(req, res) {
  try {
    const { trackingNumber } = req.params;

    const parcel = await getParcelByTrackingNumber(trackingNumber);

    if (!parcel) {
      return res.status(404).json({
        error: "Parcel not found",
      });
    }

    res.json(parcel);
  } catch (error) {
    console.error("Get parcel failed:", error);

    res.status(500).json({
      error: "Failed to retrieve parcel",
    });
  }
}

export async function updateParcelStatusController(req, res) {
  try {
    const { trackingNumber } = req.params;
    const { status, note } = req.body;

    if (!status) {
      return res.status(400).json({
        error: "Status is required",
      });
    }

    if (!validateStatus(status)) {
      return res.status(400).json({
        error: "Invalid status",
      });
    }

    const result = await updateParcelStatus(
      trackingNumber,
      status,
      note
    );

    if (!result) {
      return res.status(404).json({
        error: "Parcel not found",
      });
    }

    if (result.invalidTransition) {
      return res.status(400).json({
        error: "Invalid status transition",
        currentStatus: result.currentStatus,
        requestedStatus: result.requestedStatus,
      });
    }

    res.json(result.parcel);
  } catch (error) {
    console.error("Update parcel status failed:", error);

    res.status(500).json({
      error: "Failed to update parcel status",
    });
  }
}

export async function getParcelsController(req, res) {
  try {
    const { status } = req.query;

    if (status && !validateStatus(status)) {
      return res.status(400).json({
        error: "Invalid status filter",
      });
    }

    const parcels = await getParcels(status);

    res.json({
      count: parcels.length,
      parcels,
    });
  } catch (error) {
    console.error("Get parcels failed:", error);

    res.status(500).json({
      error: "Failed to retrieve parcels",
    });
  }
}