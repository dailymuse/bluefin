import memfs from 'memfs'

export default function mount(base) {
  const vol = new memfs.Volume()
  vol.mountSync(base, tree)
  vol.mkdirSync(`${base}/migrations`)
  vol.mkdirSync(`${base}/grants`)
  return vol
}

const tree = {
  'conf.json': JSON.stringify({
    migrations: 'migrations',
    grants: 'grants'
  }),
  'migrations/001-create-team.sql': `
    CREATE TABLE team (
      id serial PRIMARY KEY,
      name text NOT NULL,
      city text NOT NULL,
    )`, 
  'migrations/002-create-game.sql': `
    CREATE TABLE game (
      id serial PRIMARY KEY,
      home_team integer NOT NULL REFERENCES team(id),
      away_team integer NOT NULL REFERENCES team(id),
      home_score smallint,
      away_score smallint,
      started timestamp with timezone,
      CHECK positive_home_score (home_score >= 0),
      CHECK positive_away_score (away_score >= 0)
    )`,
  'grants/reader.sql': `
    ALTER ROLE $user SET search_path = $schema;
    ALTER DEFAULT PRIVILEGES IN SCHEMA $schema GRANT USAGE ON SEQUENCES TO $user;
    ALTER DEFAULT PRIVILEGES IN SCHEMA $schema GRANT SELECT TABLES TO $user;

    GRANT USAGE ON SCHEMA $schema TO $user;
    GRANT USAGE ON ALL SEQUENCES IN SCHEMA $schema TO $user;
    GRANT SELECT ON ALL TABLES IN SCHEMA $schema TO $user;`,
  'grants/writer.sql': `
    ALTER ROLE $user SET search_path = $schema;
    ALTER DEFAULT PRIVILEGES IN SCHEMA $schema GRANT USAGE ON SEQUENCES TO $user;
    ALTER DEFAULT PRIVILEGES IN SCHEMA $schema 
      GRANT SELECT, INSERT, UPDATE, DELETE TABLES TO $user;

    GRANT USAGE ON SCHEMA $schema TO $user;
    GRANT USAGE ON ALL SEQUENCES IN SCHEMA $schema TO $user;
    GRANT SELECT, INSERT, UPDATE, DELETE 
      ON ALL TABLES IN SCHEMA $schema TO $user;`
}
