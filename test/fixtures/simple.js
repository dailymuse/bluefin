import memfs from 'memfs'

const conf = {
  clusters: {
    local: {
      grants: {
        app1: 'grants/utc.sql'
      }
    }
  },
  databases: {
    bft: {
      name: 'bluefin_test',
      cluster: 'local',
      schema: {
        hoops: {
          name: 'basketball',
          migrations: 'migrations/season',
          grants: {
            app1: 'grants/reader.sql',
            app2: ['grants/reader.sql', 'grants/writer.sql']
          }
        }
      },
      grants: {
        app1: 'usage.sql'
      }
    }
  },
  passwords: 'secret/conf.json',
  users: {
    app1: {
      name: 'application-one',
      create: 'templates/user.sql'
    },
    app2: 'templates/user.sql',
    app3: null
  }
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
    GRANT SELECT ON ALL TABLES IN SCHEMA $schema TO $user`,

  'grants/writer.sql': `
    ALTER ROLE $user SET search_path = $schema
    ALTER DEFAULT PRIVILEGES IN SCHEMA $schema GRANT USAGE ON SEQUENCES TO $user
    ALTER DEFAULT PRIVILEGES IN SCHEMA $schema
      GRANT INSERT, UPDATE, DELETE TABLES TO $user

    GRANT USAGE ON SCHEMA $schema TO $user
    GRANT USAGE ON ALL SEQUENCES IN SCHEMA $schema TO $user
    GRANT INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA $schema TO $user`,

  'grants/utc.sql': `
    ALTER ROLE $user SET timezone = 'UTC'`
}

const vfs = new memfs.Volume()
vfs.mountSync('/test', tree)
vfs.mkdirSync('/test/migrations')
vfs.mkdirSync('/test/migrations/season')
vfs.mkdirSync('/test/grants')

export default vfs
