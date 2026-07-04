CREATE TABLE community_join_requests (
                                         id BIGSERIAL PRIMARY KEY,

                                         user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,

                                         community_id BIGINT NOT NULL REFERENCES communities(id) ON DELETE CASCADE,

                                         status VARCHAR(20) NOT NULL DEFAULT 'PENDING',

                                         requested_at TIMESTAMP NOT NULL DEFAULT now(),

                                         decided_at TIMESTAMP,

                                         UNIQUE(user_id, community_id)
);