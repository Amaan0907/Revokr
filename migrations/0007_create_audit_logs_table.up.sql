CREATE TABLE IF NOT EXISTS audit_logs(
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    incident_id UUID NOT NULL REFERENCES incidents(id),
    user_id UUID REFERENCES users(id),
    actor TEXT NOT NULL,
    action TEXT NOT NULL CHECK(action IN(
        'detected','validated','risk_scored','auth_requested','approved','denied',
        'key_created','old_key_disabled','gh_secret_updated','verified','resolved','failed'
    )),
    result TEXT NOT NULL CHECK(result IN('success','failure','pending')),
    metadata JSONB,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT now()
);


CREATE INDEX idx_audit_logs_incident_timestamp ON audit_logs(incident_id, timestamp);