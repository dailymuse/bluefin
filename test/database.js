import Client from "../lib/client";
import Configuration from "../lib/configuration";
import Schema from "../lib/schema";
import vfs from "./fixtures/simple.js";

describe("database", () => {
    let db;
    let pg;

    describe("safety off", () => {
        before(() => {
            return Configuration.read("/test/conf.json", vfs)
                .then(conf => {
                    db = conf.database("bft");
                    return conf.cluster("local").connect();
                })
                .then(client => {
                    pg = client;
                });
        });

        beforeEach(() => {
            Client.clear();
        });

        // we disconnect after each test, because the connection prevents
        // the database from being dropped, which we have to do in forEach()
        afterEach(() => {
            if (db) {
                db.disconnect();
            }
        });

        after(() => {
            if (pg) {
                pg.disconnect();
            }
        });

        it("creates schema", function() {
            db.schema.hoops.must.be.a(Schema);
        });

        describe("database does not exist", () => {
            beforeEach(() => pg.exec(`DROP DATABASE IF EXISTS ${db.name}`));

            it("build creates and builds schema", function() {
                return db.build().then(() =>
                    Promise.all([
                        db.exists().must.eventually.be.true(),
                        db.connect().then(c => {
                            return db
                                .getSchemaNames(c)
                                .then(names => {
                                    names.must.eql(["basketball", "bluefin", "public"]);
                                    return db.schema.hoops.getTableNames(c);
                                })
                                .then(names => {
                                    names.must.include("game");
                                });
                        })
                    ])
                );
            });

            it("applies successfully", function() {
                return db
                    .build({ last: 1 })
                    .then(() => db.apply({ first: 2 }))
                    .then(() => db.connect())
                    .then(c => {
                        return db.schema.hoops.getTableNames(c);
                    })
                    .then(names => {
                        names.must.include("game");
                    });
            });

            it("rebuilds successfully", function() {
                return db
                    .build()
                    .then(() => db.rebuild())
                    .then(() => {
                        return db.connect().then(c => {
                            return db
                                .getSchemaNames(c)
                                .then(names => {
                                    names.must.eql(["basketball", "bluefin", "public"]);
                                    return db.schema.hoops.getTableNames(c);
                                })
                                .then(names => {
                                    names.must.include("game");
                                });
                        });
                    });
            });

            it("drop does nothing", function() {
                Client.clear();
                return db.drop().then(() => {
                    Client.history.some(ea => ea.result.command === "DROP").must.be.false();
                });
            });

            it("ensure creates", function() {
                return db.ensure().then(() =>
                    Promise.all([
                        db.exists().must.eventually.be.true(),
                        db.connect().then(c => {
                            return db.schema.hoops.exists(c).must.eventually.be.false();
                        })
                    ])
                );
            });
        });

        describe("database exists", () => {
            beforeEach(() => db.ensure());

            it("drop destroys database", function() {
                return db.drop().then(() => db.exists().must.eventually.be.false());
            });

            it("ensure does nothing", function() {
                Client.clear();
                return db.ensure().then(() => {
                    Client.history.some(ea => ea.result.command === "CREATE").must.be.false();
                });
            });
        });
    });

    describe("safety on", () => {
        before(() => {
            return Configuration.read("/test/conf.json", vfs).then(conf => {
                db = conf.database("bft");
                db.raw.safety = true;
            });
        });

        it("drop throws error when safety is on", function() {
            return db.drop().must.reject.to.eql(new Error("safety"));
        });
    });
});
