CREATE TABLE communities (
                             id BIGSERIAL PRIMARY KEY,
                             name VARCHAR(150) NOT NULL,
                             created_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE users (
                       id BIGSERIAL PRIMARY KEY,
                       email VARCHAR(150) NOT NULL UNIQUE,
                       password VARCHAR(255) NOT NULL,
                       full_name VARCHAR(150) NOT NULL,
                       role VARCHAR(20) NOT NULL,
                       flat_number VARCHAR(20),
                       community_id BIGINT REFERENCES communities(id) ON DELETE CASCADE,
                       created_at TIMESTAMP NOT NULL DEFAULT now()
);