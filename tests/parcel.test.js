import test, { after } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import app from "../src/app.js";
import pool from "../src/config/database.js";

const trackingNumber = `PF-TEST-${Date.now()}`;

async function createTestParcel() {
  const response = await request(app)
    .post("/api/parcels")
    .send({
      trackingNumber,
      senderName: "Test Sender",
      recipientName: "Test Recipient",
      origin: "Gafsa",
      destination: "Tunis",
    })
    .expect(201);

  return response.body;
}

test("GET /api/health returns a healthy API and database", async () => {
  const response = await request(app)
    .get("/api/health")
    .expect(200);

  assert.equal(response.body.status, "ok");
  assert.equal(response.body.service, "ParcelFlow API");
  assert.equal(response.body.database, "connected");
});

test("POST /api/parcels rejects missing required fields", async () => {
  const response = await request(app)
    .post("/api/parcels")
    .send({
      trackingNumber: "PF-TEST-MISSING",
      senderName: "Ahmed",
    })
    .expect(400);

  assert.equal(
    response.body.error,
    "Required fields are missing or invalid"
  );

  assert.deepEqual(response.body.fields, [
    "recipientName",
    "origin",
    "destination",
  ]);
});

test("POST /api/parcels creates a parcel with CREATED status", async () => {
  const parcel = await createTestParcel();

  assert.equal(parcel.tracking_number, trackingNumber);
  assert.equal(parcel.status, "CREATED");
});

test("GET /api/parcels/:trackingNumber returns parcel and history", async () => {
  const response = await request(app)
    .get(`/api/parcels/${trackingNumber}`)
    .expect(200);

  assert.equal(response.body.tracking_number, trackingNumber);
  assert.equal(response.body.status, "CREATED");
  assert.equal(response.body.history.length, 1);
  assert.equal(response.body.history[0].status, "CREATED");
});

test("POST /api/parcels rejects duplicate tracking numbers", async () => {
  const response = await request(app)
    .post("/api/parcels")
    .send({
      trackingNumber,
      senderName: "Another Sender",
      recipientName: "Another Recipient",
      origin: "Sfax",
      destination: "Tunis",
    })
    .expect(409);

  assert.equal(
    response.body.error,
    "Tracking number already exists"
  );
});

test("PATCH /api/parcels/:trackingNumber/status allows a valid transition", async () => {
  const response = await request(app)
    .patch(`/api/parcels/${trackingNumber}/status`)
    .send({
      status: "PICKED_UP",
      note: "Test pickup",
    })
    .expect(200);

  assert.equal(response.body.status, "PICKED_UP");
});

test("PATCH /api/parcels/:trackingNumber/status rejects an invalid transition without changing state", async () => {
  const response = await request(app)
    .patch(`/api/parcels/${trackingNumber}/status`)
    .send({
      status: "DELIVERED",
    })
    .expect(400);

  assert.equal(response.body.error, "Invalid status transition");
  assert.equal(response.body.currentStatus, "PICKED_UP");
  assert.equal(response.body.requestedStatus, "DELIVERED");

  const parcelResponse = await request(app)
    .get(`/api/parcels/${trackingNumber}`)
    .expect(200);

  assert.equal(parcelResponse.body.status, "PICKED_UP");
  assert.equal(parcelResponse.body.history.length, 2);
  assert.equal(parcelResponse.body.history[0].status, "CREATED");
  assert.equal(parcelResponse.body.history[1].status, "PICKED_UP");
});

test("GET /api/parcels/:trackingNumber returns 404 for an unknown parcel", async () => {
  await request(app)
    .get("/api/parcels/PF-DOES-NOT-EXIST")
    .expect(404);
});

test("PATCH /api/parcels/:trackingNumber/status rejects an unknown status", async () => {
  const response = await request(app)
    .patch(`/api/parcels/${trackingNumber}/status`)
    .send({ status: "BANANA" })
    .expect(400);

  assert.equal(response.body.error, "Invalid status");
});

test("GET /api/parcels filters parcels by status", async () => {
  const response = await request(app)
    .get("/api/parcels?status=PICKED_UP")
    .expect(200);

  assert.equal(response.body.count, 1);
  assert.equal(response.body.parcels[0].tracking_number, trackingNumber);
});

after(async () => {
  await pool.query(
    "DELETE FROM parcels WHERE tracking_number = $1",
    [trackingNumber]
  );

  await pool.end();
});