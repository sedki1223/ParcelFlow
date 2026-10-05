import { PARCEL_STATUSES } from "../constants/parcelStatus.js";

function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

export function validateCreateParcel(data) {
  const requiredFields = [
    "trackingNumber",
    "senderName",
    "recipientName",
    "origin",
    "destination",
  ];

  const missingFields = requiredFields.filter(
    (field) => !isNonEmptyString(data[field])
  );

  if (missingFields.length > 0) {
    return {
      valid: false,
      error: "Required fields are missing or invalid",
      fields: missingFields,
    };
  }

  return { valid: true };
}

export function validateStatus(status) {
  return PARCEL_STATUSES.includes(status);
}