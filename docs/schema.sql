-- Create users table
CREATE TABLE users (
 id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
 username TEXT UNIQUE NOT NULL,
 email TEXT UNIQUE,
 password TEXT NOT NULL,
 role TEXT NOT NULL DEFAULT 'user',
 created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
 updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create deployments table
CREATE TABLE deployments (
 id TEXT PRIMARY KEY,
 resource_type TEXT NOT NULL,
 status TEXT NOT NULL,
 name TEXT NOT NULL,
 environment TEXT NOT NULL,
 region TEXT NOT NULL,
 parameters JSONB,
 outputs JSONB,
 created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
 completed_at TIMESTAMP WITH TIME ZONE,
 requested_by TEXT REFERENCES users(username)
);

-- Create function to handle stalled deployments
CREATE OR REPLACE FUNCTION update_stalled_deployments(timeout_minutes int, new_status text, error_message text)
RETURNS SETOF deployments AS $$
BEGIN
 UPDATE deployments
 SET
 status = new_status,
 outputs = jsonb_set(COALESCE(outputs, '{}'::jsonb), '{error_message}', to_jsonb(error_message)),
 completed_at = NOW()
WHERE
 status = 'pending'
AND created_at < NOW() - (timeout_minutes * interval '1 minute')
AND completed_at IS NULL;
 RETURN QUERY SELECT * FROM deployments
WHERE status = new_status
AND completed_at > NOW() - interval '1 minute';
END;
$$ LANGUAGE plpgsql;