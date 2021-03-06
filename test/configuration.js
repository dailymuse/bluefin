import Configuration from "../lib/configuration";
import Database from "../lib/database";
import Cluster from "../lib/cluster";
import vfs from "./fixtures/one.js";

describe("configuration", () => {
    let conf;

    before(() => {
        return Configuration.read("/test/conf.json", vfs).then(c => {
            conf = c;
        });
    });

    it("constructs a configuration", function() {
        conf.directory.must.equal("/test");
        conf.file.must.equal("conf.json");
        conf.raw.must.be.an(Object);
        conf.fs.must.be(vfs);
    });

    it("supplies passwords", function() {
        return conf.password("root").must.eventually.equal("abc");
    });

    it("supplies clusters", function() {
        const ep = conf.cluster("production");
        ep.must.be.a(Cluster);
        ep.must.have.property("name", "production");
    });

    it("throws an error for unknown clusters", function() {
        (() => conf.cluster("nork")).must.throw(Error, "unknown cluster nork");
    });

    it("supplies databases via nickname", function() {
        const db = conf.database("prod");
        db.must.be.a(Database);
        db.name.must.equal("appdata");
    });

    it("supplies databases with implicit name", function() {
        const db = conf.database("unit");
        db.must.be.a(Database);
        db.name.must.equal("unit");
    });

    it("thrown an error for unknown databases", function() {
        (() => conf.database("nork")).must.throw(Error, "unknown database nork");
    });
});
