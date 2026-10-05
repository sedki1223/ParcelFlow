# ParcelFlow

A RESTful parcel tracking and shipment management API built with Node.js, Express, and PostgreSQL.

The application provides parcel creation and tracking, shipment status management, status history, filtering, validation, and transactional database operations. PostgreSQL runs through Docker Compose for a reproducible local development environment.

## Tech Stack

* Node.js 24.21.0
* Express
* PostgreSQL 18.6
* pg
* Supertest
* Docker
* Docker Compose

## Features

* Parcel creation and tracking
* Parcel status management
* Shipment status history
* Status-based parcel filtering
* Valid shipment state transitions
* Input validation
* Duplicate tracking-number protection
* PostgreSQL transactions
* Automated API integration tests
* Environment-based configuration
* Dockerized PostgreSQL development environment

## Project Structure

```text
ParcelFlow/
├── database/
│   └── schema.sql
├── src/
│   ├── config/
│   │   └── database.js
│   ├── constants/
│   │   └── parcelStatus.js
│   ├── controllers/
│   │   └── parcelController.js
│   ├── routes/
│   │   └── parcelRoutes.js
│   ├── services/
│   │   └── parcelService.js
│   ├── validators/
│   │   └── parcelValidator.js
│   ├── app.js
│   └── server.js
├── tests/
│   └── parcel.test.js
├── .env
├── .gitignore
├── compose.yaml
├── package.json
├── package-lock.json
└── README.md
```

## API Endpoints

### Health

```text
GET /api/health
```

Returns API and database health information.

### Parcels

```text
POST /api/parcels
GET /api/parcels
GET /api/parcels?status=PICKED_UP
GET /api/parcels/{trackingNumber}
PATCH /api/parcels/{trackingNumber}/status
```

## Example Requests

Create a parcel:

```text
POST /api/parcels
```

```json
{
  "trackingNumber": "PF-2026-0001",
  "senderName": "Ahmed Ben Ali",
  "recipientName": "Sami Trabelsi",
  "origin": "Gafsa",
  "destination": "Tunis"
}
```

Track a parcel:

```text
GET /api/parcels/PF-2026-0001
```

Update parcel status:

```text
PATCH /api/parcels/PF-2026-0001/status
```

```json
{
  "status": "IN_TRANSIT",
  "note": "Parcel departed Gafsa sorting facility"
}
```

Filter parcels:

```text
GET /api/parcels?status=IN_TRANSIT
```

## Parcel Lifecycle

```text
CREATED
   ↓
PICKED_UP
   ↓
IN_TRANSIT
   ↓
OUT_FOR_DELIVERY
   ├──→ DELIVERED
   └──→ FAILED_DELIVERY
```

Invalid state transitions are rejected by the application.

## Configuration

Create a local `.env` file containing:

```text
PORT=3000
POSTGRES_USER=postgres
POSTGRES_PASSWORD=parcelflow_dev
POSTGRES_DB=parcelflow
```

The `.env` file is intentionally excluded from version control.

## Running with Docker

Make sure Docker Desktop is installed and running.

Start PostgreSQL:

```bash
docker compose up -d
```

Verify the database container:

```bash
docker ps
```

The PostgreSQL database runs on:

```text
localhost:5432
```

## Running the API

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

The API will be available on:

```text
http://localhost:3000
```

## Database

The application uses PostgreSQL for persistent storage.

The database schema is defined in:

```text
database/schema.sql
```

The database contains:

```text
parcels
parcel_status_history
```

Parcel status changes are stored as history records, while the current parcel status is maintained in the `parcels` table.

Transactions are used when updating parcel state and history together.

## Running Tests

Run the complete integration test suite:

```bash
npm test
```

The test suite covers:

* API health
* Required-field validation
* Parcel creation
* Parcel tracking
* Duplicate tracking numbers
* Valid status transitions
* Invalid status transitions
* Status validation
* Parcel filtering
* Missing parcels

## Purpose

This project was built as a practical backend exercise focused on:

* REST API development with Node.js and Express
* PostgreSQL database integration
* Service/controller architecture
* Transaction handling
* State-machine style business rules
* Input validation
* Shipment tracking workflows
* Automated integration testing
* Docker-based database environments

## Verification

The project has been verified locally with:

```text
npm test                    → 10 tests passed
docker compose up -d        → PostgreSQL container started successfully
GET /api/health             → API and database connected
POST /api/parcels           → parcel creation verified
PATCH /api/parcels/...      → status lifecycle verified
```

## Project Status

Completed and functional.

## Author

Sedki Dabboubi
