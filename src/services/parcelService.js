import pool from "../config/database.js";
import {
  ALLOWED_TRANSITIONS,
} from "../constants/parcelStatus.js";

export async function createParcel(parcelData) {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const parcelResult = await client.query(
      `
      INSERT INTO parcels (
        tracking_number,
        sender_name,
        recipient_name,
        origin,
        destination
      )
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
      `,
      [
        parcelData.trackingNumber,
        parcelData.senderName,
        parcelData.recipientName,
        parcelData.origin,
        parcelData.destination,
      ]
    );

    const parcel = parcelResult.rows[0];

    await client.query(
      `
      INSERT INTO parcel_status_history (
        parcel_id,
        status,
        note
      )
      VALUES ($1, $2, $3)
      `,
      [parcel.id, parcel.status, "Parcel created"]
    );

    await client.query("COMMIT");

    return parcel;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function getParcelByTrackingNumber(trackingNumber) {
  const parcelResult = await pool.query(
    `
    SELECT *
    FROM parcels
    WHERE tracking_number = $1
    `,
    [trackingNumber]
  );

  if (parcelResult.rows.length === 0) {
    return null;
  }

  const parcel = parcelResult.rows[0];

  const historyResult = await pool.query(
    `
    SELECT
      id,
      status,
      note,
      created_at
    FROM parcel_status_history
    WHERE parcel_id = $1
    ORDER BY created_at ASC
    `,
    [parcel.id]
  );

  return {
    ...parcel,
    history: historyResult.rows,
  };
}

export async function updateParcelStatus(
  trackingNumber,
  newStatus,
  note = null
) {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const parcelResult = await client.query(
      `
      SELECT *
      FROM parcels
      WHERE tracking_number = $1
      FOR UPDATE
      `,
      [trackingNumber]
    );

    if (parcelResult.rows.length === 0) {
      await client.query("ROLLBACK");
      return null;
    }

    const parcel = parcelResult.rows[0];

    if (!ALLOWED_TRANSITIONS[parcel.status]?.includes(newStatus)) {
      await client.query("ROLLBACK");

      return {
        invalidTransition: true,
        currentStatus: parcel.status,
        requestedStatus: newStatus,
      };
    }

    const updateResult = await client.query(
      `
      UPDATE parcels
      SET status = $1,
          updated_at = NOW()
      WHERE id = $2
      RETURNING *
      `,
      [newStatus, parcel.id]
    );

    await client.query(
      `
      INSERT INTO parcel_status_history (
        parcel_id,
        status,
        note
      )
      VALUES ($1, $2, $3)
      `,
      [parcel.id, newStatus, note]
    );

    await client.query("COMMIT");

    return {
      parcel: updateResult.rows[0],
      invalidTransition: false,
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function getParcels(status = null) {
  let query = `
    SELECT *
    FROM parcels
  `;

  const values = [];

  if (status) {
    query += `
      WHERE status = $1
    `;

    values.push(status);
  }

  query += `
    ORDER BY created_at DESC
  `;

  const result = await pool.query(query, values);

  return result.rows;
}