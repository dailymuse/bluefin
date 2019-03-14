import Configuration from "../lib/configuration";
import vfs from "./fixtures/simple.js";

describe("grants", () => {
  let c;
  let db;
  let conf;
  let hoops;

  before(() => {
    return Configuration.read("/test/conf.json", vfs)
      .then(_conf => {
        conf = _conf;
        db = conf.database("bft");
        hoops = db.schema.hoops;
        return db.ensure();
      })
      .then(() => {
        return db.ensureUsers();
      })
      .then(() => {
        return db.connect();
      })
      .then(client => {
        c = client;
        return hoops.ensure(c);
      });
  });

  after(() => {
    if (db) db.disconnect();
  });

  it("revokes privileges", function() {
    return hoops
      .revokePrivileges(c)
      .then(() => hoops.getPrivileges(c))
      .then(grants => {
        grants.length.must.equal(0);
      });
  });

  it("grants privileges", function() {
    return hoops
      .grantPrivileges(c)
      .then(() => hoops.getPrivileges(c))
      .then(grants => {
        grants.length.must.equal(2);
        grants.some(ea => {
          return (
            ea.usename === "app1" &&
            ea.kind === "n" &&
            ea.name === hoops.name &&
            ea.priv === "USAGE"
          );
        });
        grants.some(ea => {
          return (
            ea.usename === "app2" &&
            ea.kind === "n" &&
            ea.name === hoops.name &&
            ea.priv === "USAGE"
          );
        });
      });
  });
});
