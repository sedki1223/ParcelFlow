CREATE TABLE IF NOT EXISTS parcels (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    tracking_number VARCHAR(50) UNIQUE NOT NULL,
    sender_name VARCHAR(100) NOT NULL,
    recipient_name VARCHAR(100) NOT NULL,
    origin VARCHAR(150) NOT NULL,
    destination VARCHAR(150) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'CREATED',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT parcels_status_check
        CHECK (
            status IN (
                'CREATED',
                'PICKED_UP',
                'IN_TRANSIT',
                'OUT_FOR_DELIVERY',
                'DELIVERED',
                'FAILED_DELIVERY'
            )
        )
);

CREATE TABLE IF NOT EXISTS parcel_status_history (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    parcel_id BIGINT NOT NULL,
    status VARCHAR(30) NOT NULL,
    note VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT history_status_check
        CHECK (
            status IN (
                'CREATED',
                'PICKED_UP',
                'IN_TRANSIT',
                'OUT_FOR_DELIVERY',
                'DELIVERED',
                'FAILED_DELIVERY'
            )
        ),

    CONSTRAINT history_parcel_fk
        FOREIGN KEY (parcel_id)
        REFERENCES parcels(id)
        ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_parcel_status_history_parcel_id
    ON parcel_status_history(parcel_id);