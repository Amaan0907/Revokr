CREATE TABLE IF NOT EXISTS users(
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    github_user_id BIGINT NOT NULL UNIQUE,
    username TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);