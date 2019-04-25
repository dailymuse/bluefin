import Client from "../lib/client";
import User from "../lib/user";

const name = "u1avk5hgsr";
const password = "secret";

describe("user", () => {
    let client;
    let conf;
    let u;

    const exists = () => client.value(existsSql, name);

    before(() => {
        conf = {
            password: user => Promise.resolve(password)
        };
        u = new User(conf, name);
        return Client.connect({
            host: "pg",
            password: "postgres",
            port: 5432,
            user: "postgres"
        }).then(c => {
            client = c;
        });
    });

    after(() => {
        if (client) {
            client.disconnect();
        }
    });

    describe("does not exist", () => {
        beforeEach(() => {
            return client.exec(`DROP USER IF EXISTS ${name}`);
        });

        it("exists returns false", () => {
            return u.exists(client).must.eventually.be.false();
        });

        it("drop does nothing", () => {
            return u
                .drop(client)
                .then(exists)
                .must.eventually.be.false();
        });

        it("ensure creates the user", () => {
            return u
                .ensure(client)
                .then(exists)
                .must.eventually.be.true();
        });

        it.skip("simple create allows connection", () => {
            return u
                .create(client)
                .then(() => {
                    return Client.connect({ user: name, database: "postgres", password });
                })
                .then(uc => {
                    uc.must.be.a(Client);
                    return uc.disconnect();
                });
        });

        it("creates using template", () => {
            return u.create;
        });
    });

    describe("does exist", () => {
        beforeEach(() => {
            return exists().then(doesExist => {
                if (!doesExist) {
                    return client.exec(`CREATE USER ${name}`);
                }
            });
        });

        afterEach(() => {
            return client.exec(`DROP USER IF EXISTS ${name}`);
        });

        it("exists returns true", () => {
            return u.exists(client).must.eventually.be.true();
        });

        it("drops the user", () => {
            return u
                .drop(client)
                .then(exists)
                .must.eventually.be.false();
        });
    });
});

const existsSql = "SELECT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = $1)";
