CREATE TABLE IF NOT EXISTS incidents(
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    repository_id UUID NOT NULL REFERENCES repositories(id),
    commit_sha TEXT NOT NULL,
    file_path TEXT NOT NULL,
    line_number INT,
    provider TEXT NOT NULL CHECK(provider IN ('aws','openai','github','gcp','stripe','slack','generic')),
    secret_type TEXT NOT NULL,
    fingerprint TEXT NOT NULL,
    masked_value TEXT NOT NULL,
    is_live BOOLEAN,
    severity TEXT NOT NULL CHECK(severity IN('LOW','MEDIUM','HIGH','CRITICAL')),
    risk_score INT NOT NULL,
    risk_factors JSONB NOT NULL,
    status TEXT NOT NULL CHECK(status IN('DETECTED','VALIDATING','AWAITING_APPROVAL','ROTATING','VERIFYING','RESOLVED','FAILED','REQUIRES_USER_ACTION','NOT_SUPPORTED')),
    simulated BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    resolved_at TIMESTAMPTZ,
    UNIQUE(repository_id,fingerprint)
);

CREATE INDEX idx_incidents_repository_id ON incidents(repository_id);
CREATE INDEX idx_incidents_status ON incidents(status);
CREATE INDEX idx_incidents_created_at ON incidents(created_at);
