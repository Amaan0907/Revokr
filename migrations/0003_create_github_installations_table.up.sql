CREATE TABLE IF NOT EXISTS github_installations(
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
user_id UUID NOT NULL REFERENCES users(id),
installation_id BIGINT NOT NULL UNIQUE,
created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_github_installation_user_id ON github_installations(user_id);