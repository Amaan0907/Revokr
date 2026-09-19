UPDATE audit_logs SET action = 'failed' WHERE action = 'not_supported';

ALTER TABLE audit_logs DROP CONSTRAINT IF EXISTS audit_logs_action_check;

ALTER TABLE audit_logs ADD CONSTRAINT audit_logs_action_check CHECK (action IN (
    'detected','validated','risk_scored','auth_requested','approved','denied',
    'key_created','old_key_disabled','gh_secret_updated','verified','resolved','failed'
));
