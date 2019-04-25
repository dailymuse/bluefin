import memfs from "memfs";

const conf = {
    clusters: {
        production: {},
        staging: {},
        test: {}
    },
    databases: {
        integration: {
            cluster: "staging",
            grants: {
                app1: ["grants/reader.sql", "settings/baseball.sql"],
                app2: ["grants/writer.sql"],
                app3: ["grants/reader.sql", "settings/basketball.sql"],
                tests: "grants/fixtures.sql"
            },
            safety: false,
            schema: {
                baseball: "migrations/season"
            }
        },
        prod: {
            cluster: "production",
            grants: {
                app1: "usage.sql"
            },
            name: "appdata",
            safety: true,
            schema: {
                baseball: "migrations/season",
                hoops: {
                    grants: {
                        app1: "grants/reader.sql",
                        app2: ["grants/reader.sql", "grants/writer.sql"]
                    },
                    migrations: "migrations/season",
                    name: "basketball"
                }
            }
        },
        unit: {
            cluster: "staging",
            grants: {
                tests: "grants/fixtures.sql"
            }
        }
    },
    passwords: "secret/conf.json",
    users: {
        app1: {
            create: "templates/user.sql",
            name: "application-one"
        },
        app2: "templates/user.sql",
        app3: null
    }
};

const passwords = {
    app1: "def",
    app2: "ghi",
    app3: "jkl",
    root: "abc",
    tests: "mno"
};

const tree = {
    "conf.json": JSON.stringify(conf),
    "grants/reader.sql": `
    ALTER ROLE $user SET search_path = $schema
    ALTER DEFAULT PRIVILEGES IN SCHEMA $schema GRANT USAGE ON SEQUENCES TO $user
    ALTER DEFAULT PRIVILEGES IN SCHEMA $schema GRANT SELECT TABLES TO $user

    GRANT USAGE ON SCHEMA $schema TO $user
    GRANT USAGE ON ALL SEQUENCES IN SCHEMA $schema TO $user
    GRANT SELECT ON ALL TABLES IN SCHEMA $schema TO $user;`,
    "grants/writer.sql": `
    ALTER ROLE $user SET search_path = $schema
    ALTER DEFAULT PRIVILEGES IN SCHEMA $schema GRANT USAGE ON SEQUENCES TO $user
    ALTER DEFAULT PRIVILEGES IN SCHEMA $schema
      GRANT SELECT, INSERT, UPDATE, DELETE TABLES TO $user

    GRANT USAGE ON SCHEMA $schema TO $user
    GRANT USAGE ON ALL SEQUENCES IN SCHEMA $schema TO $user
    GRANT SELECT, INSERT, UPDATE, DELETE
      ON ALL TABLES IN SCHEMA $schema TO $user;`,
    "migrations/season/001-create-team.sql": `
    CREATE TABLE team (
      id serial PRIMARY KEY,
      name text NOT NULL,
      city text NOT NULL
    )`,
    "migrations/season/002-create-game.sql": `
    CREATE TABLE game (
      id serial PRIMARY KEY,
      home_team integer NOT NULL REFERENCES team(id),
      away_team integer NOT NULL REFERENCES team(id),
      home_score smallint,
      away_score smallint,
      started timestamp with time zone,
      CONSTRAINT positive_home_score CHECK (home_score >= 0),
      CONSTRAINT positive_away_score CHECK (away_score >= 0)
    )`,
    "secret/conf.json": JSON.stringify(passwords)
};

const vfs = new memfs.Volume();
vfs.mountSync("/test", tree);
if (!vfs.existsSync("/test/migrations")) {
    vfs.mkdirSync("/test/migrations");
}
if (!vfs.existsSync("/test/migrations/season")) {
    vfs.mkdirSync("/test/migrations/season");
}
if (!vfs.existsSync("/test/grants")) {
    vfs.mkdirSync("/test/grants");
}

export default vfs;
