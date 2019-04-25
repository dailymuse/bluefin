import Configuration from "../lib/configuration";
import Migration from "../lib/migration";
import vfs from "./fixtures/simple.js";

describe("migration", () => {
    describe("creation", function() {
        it("parses filenames", function() {
            const m = new Migration("ignore", "/migration/1-test.sql");
            m.ordinal.must.equal(1);
            m.name.must.equal("test");
        });

        it("handles leading zeros", function() {
            const m = new Migration("ignore", "/migration/001-test.sql");
            m.ordinal.must.equal(1);
            m.name.must.equal("test");
        });

        it("handles multi-dash-name", function() {
            const m = new Migration("ignore", "/migration/001-multi-dash-name.sql");
            m.ordinal.must.equal(1);
            m.name.must.equal("multi-dash-name");
        });

        it("handles camelCaseName", function() {
            const m = new Migration("ignore", "/migration/001-camelCaseName.sql");
            m.ordinal.must.equal(1);
            m.name.must.equal("camelCaseName");
        });

        it("handles underscore_name", function() {
            const m = new Migration("ignore", "/migration/001-underscore_name.sql");
            m.ordinal.must.equal(1);
            m.name.must.equal("underscore_name");
        });

        it("throws on no ordinal", function() {
            const create = () => new Migration("ignore", "/migration/gong.sql");
            create.must.throw(Error, "Malformed filename 'gong.sql'");
        });

        it("throws on no SQL extension", function() {
            const create = () => new Migration("ignore", "/migration/001-gong");
            create.must.throw(Error, "Malformed filename '001-gong'");
        });
    });

    describe("execution", function() {
        let client;
        let db;

        before(() => {
            return Configuration.read("/test/conf.json", vfs)
                .then(conf => {
                    db = conf.database("bft");
                    return db.ensure();
                })
                .then(() => db.connect())
                .then(c => c.exec("TRUNCATE TABLE bluefin.migrations"));
        });

        after(() => {
            if (client) {
                client.disconnect();
            }
        });

        it("inserts a migration record", function() {
            const m = new Migration("SELECT 1", "3-some-migration.sql");
            const context = { schema: "migration_test" };
            return db
                .connect()
                .then(c => {
                    return m.exec(c, context).then(() => c.table("SELECT * FROM bluefin.migrations"));
                })
                .then(rows => {
                    rows.length.must.equal(1);
                    rows[0].schema.must.equal("migration_test");
                    rows[0].ordinal.must.equal(3);
                    rows[0].name.must.equal("some-migration");
                });
        });
    });
});
