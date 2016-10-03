import memfs from 'memfs'

export default function mount (base) {
  const vol = new memfs.Volume()
  vol.mountSync(base, tree)
  vol.mkdirSync(`${base}/migrations`)
  vol.mkdirSync(`${base}/migrations/season`)
  vol.mkdirSync(`${base}/grants`)
  return vol
}

const conf = {
  databases: {
    prod: {
      name: 'appdata',
      endpoint: 'production',
      safety: true,
      schema: {
        baseball: 'season',
        hoops: {
          name: 'basketball',
          migrations: 'season'
        }
      },
      users: {
        app1: {
          baseball: ['grants/reader.sql', 'grants/search.sql']
        },
        app2: ['grants/writer.sql'],
        app3: 'reader.sql'
      }
    },
    integration: {
      endpoint: 'staging',
      safety: false,
      baseball: 'season',
      users: {
        app1: ['grants/reader.sql', 'settings/baseball.sql'],
        app2: ['grants/writer.sql'],
        app3: ['grants/reader.sql', 'settings/basketball.sql'],
        tests: 'grants/fixtures.sql'
      }
    },
    unit: {
      endpoint: 'staging',
      tests: 'grants/fixtures.sql'
    }
  },
  endpoints: {
    production: {
      host: 'db.example.com',
      user: 'root'
    },
    staging: {
      port: 15432
    },
    test: {}
  },
  passwords: 'secret/conf.json'
}

const passwords = {
  root: 'abc',
  app1: 'def',
  app2: 'ghi',
  app3: 'jkl',
  tests: 'mno'
}

const tree = {
  'conf.json': JSON.stringify(conf),
  'secret/conf.json': JSON.stringify(passwords),
  'migrations/season/001-create-team.sql': `
    CREATE TABLE team (
      id serial PRIMARY KEY,
      name text NOT NULL,
      city text NOT NULL,
    )`,
  'migrations/season/002-create-game.sql': `
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
    ALTER ROLE $user SET search_path = $schema
    ALTER DEFAULT PRIVILEGES IN SCHEMA $schema GRANT USAGE ON SEQUENCES TO $user
    ALTER DEFAULT PRIVILEGES IN SCHEMA $schema GRANT SELECT TABLES TO $user

    GRANT USAGE ON SCHEMA $schema TO $user
    GRANT USAGE ON ALL SEQUENCES IN SCHEMA $schema TO $user
    GRANT SELECT ON ALL TABLES IN SCHEMA $schema TO $user;`,
  'grants/writer.sql': `
    ALTER ROLE $user SET search_path = $schema
    ALTER DEFAULT PRIVILEGES IN SCHEMA $schema GRANT USAGE ON SEQUENCES TO $user
    ALTER DEFAULT PRIVILEGES IN SCHEMA $schema
      GRANT SELECT, INSERT, UPDATE, DELETE TABLES TO $user

    GRANT USAGE ON SCHEMA $schema TO $user
    GRANT USAGE ON ALL SEQUENCES IN SCHEMA $schema TO $user
    GRANT SELECT, INSERT, UPDATE, DELETE
      ON ALL TABLES IN SCHEMA $schema TO $user;`
}
