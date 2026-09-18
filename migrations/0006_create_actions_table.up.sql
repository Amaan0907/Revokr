CREATE TABLE IF NOT EXISTS actions(
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    incident_id UUID NOT NULL REFERENCES incidents(id),
    action_type TEXT NOT NULL CHECK(action_type IN(
        'VALIDATE_CREDENTIAL','ROTATE_CREDENTIAL','UPDATE_GITHUB_SECRET',
        'DISABLE_OLD_CREDENTIAL','SEND_NOTIFICATION','CLEAN_HISTORY'
    )),
    status TEXT NOT NULL CHECK(status IN('PENDING','RUNNING','SUCCEEDED','FAILED')),
    idempotency_key TEXT NOT NULL UNIQUE,
    error TEXT,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ
);

CREATE INDEX idx_actions_incident_id ON actions(incident_id);