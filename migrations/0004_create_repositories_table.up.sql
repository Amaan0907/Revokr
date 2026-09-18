CREATE TABLE IF NOT EXISTS repositories(
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    installation_id UUID NOT NULL REFERENCES github_installations(id),
    github_repo_id UUID NOT NULL UNIQUE,
    owner TEXT NOT NULL,
    name TEXT NOT NULL,
    enabled BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(owner,name)
);


CREATE INDEX idx_repositories_installation_id ON repositories(installation_id);

