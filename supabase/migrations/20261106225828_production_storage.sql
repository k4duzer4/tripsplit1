-- Private documents preserve the API's existing account and trip formats.
CREATE SCHEMA tripsplit_private;
REVOKE ALL ON SCHEMA tripsplit_private FROM PUBLIC, anon, authenticated;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'tripsplit_api') THEN
    EXECUTE 'ALTER ROLE tripsplit_api WITH LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS';
  ELSE
    EXECUTE 'CREATE ROLE tripsplit_api LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS';
  END IF;
END $$;
GRANT USAGE ON SCHEMA tripsplit_private TO tripsplit_api;

CREATE TABLE tripsplit_private.users (
  id text PRIMARY KEY,
  document jsonb NOT NULL CHECK (jsonb_typeof(document) = 'object' AND document->>'id' = id),
  email text GENERATED ALWAYS AS (document->>'email') STORED NOT NULL UNIQUE
);
CREATE TABLE tripsplit_private.trips (
  id text PRIMARY KEY,
  document jsonb NOT NULL CHECK (jsonb_typeof(document) = 'object' AND document->>'id' = id),
  owner_id text GENERATED ALWAYS AS (document->>'ownerId') STORED NOT NULL REFERENCES tripsplit_private.users(id)
);
CREATE INDEX trips_owner_idx ON tripsplit_private.trips(owner_id);
CREATE TABLE tripsplit_private.pending_registrations (
  id text PRIMARY KEY,
  document jsonb NOT NULL CHECK (jsonb_typeof(document) = 'object' AND document->>'email' = id)
);
CREATE TABLE tripsplit_private.sessions (
  id text PRIMARY KEY,
  document jsonb NOT NULL CHECK (jsonb_typeof(document) = 'object' AND document->>'tokenHash' = id),
  user_id text GENERATED ALWAYS AS (document->>'userId') STORED NOT NULL REFERENCES tripsplit_private.users(id)
);
CREATE INDEX sessions_user_idx ON tripsplit_private.sessions(user_id);
CREATE TABLE tripsplit_private.password_resets (
  id text PRIMARY KEY,
  document jsonb NOT NULL CHECK (jsonb_typeof(document) = 'object' AND document->>'tokenHash' = id),
  user_id text GENERATED ALWAYS AS (document->>'userId') STORED NOT NULL REFERENCES tripsplit_private.users(id)
);
CREATE INDEX password_resets_user_idx ON tripsplit_private.password_resets(user_id);
CREATE TABLE tripsplit_private.auth_limits (
  id text PRIMARY KEY,
  attempts integer NOT NULL CHECK (attempts > 0),
  expires_at timestamptz NOT NULL
);
CREATE INDEX auth_limits_expiry_idx ON tripsplit_private.auth_limits(expires_at);

DO $$
DECLARE table_name text;
BEGIN
  FOREACH table_name IN ARRAY ARRAY['users', 'trips', 'pending_registrations', 'sessions', 'password_resets', 'auth_limits'] LOOP
    EXECUTE format('ALTER TABLE tripsplit_private.%I ENABLE ROW LEVEL SECURITY', table_name);
    EXECUTE format('REVOKE ALL ON tripsplit_private.%I FROM PUBLIC, anon, authenticated', table_name);
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON tripsplit_private.%I TO tripsplit_api', table_name);
    EXECUTE format('CREATE POLICY backend_access ON tripsplit_private.%I TO tripsplit_api USING (true) WITH CHECK (true)', table_name);
  END LOOP;
END $$;
