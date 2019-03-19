import Entity from "./entity";
import Schema from "./schema";
import User from "./user";

export default class Database extends Entity {
  constructor(conf, nickname, raw) {
    super(conf, nickname, raw);
    this.cluster = conf.cluster(raw.cluster);
    this.schema = {};
    for (let nick in this.raw.schema) {
      this.schema[nick] = new Schema(conf, nick, this.raw.schema[nick]);
    }
  }

  connect() {
    if (!this._dbClientVow) this._dbClientVow = this.cluster.connect(this.name);
    return this._dbClientVow;
  }

  pgConnect() {
    if (!this._pgClientVow)
      this._pgClientVow = this.cluster.connect("postgres");
    return this._pgClientVow;
  }

  disconnect() {
    if (this._dbClientVow && this._dbClientVow.isFulfilled()) {
      const client = this._dbClientVow.value();
      if (client) client.disconnect();
      delete this._dbClientVow;
    }
    if (this._pgClientVow && this._pgClientVow.isFulfilled()) {
      const client = this._pgClientVow.value();
      if (client) client.disconnect();
      delete this._pgClientVow;
    }
  }

  apply(options) {
    return this.connect().then(client => {
      let vow = this.ensureUsers(options);

      for (let name in this.schema) {
        const schema = this.schema[name];
        vow = vow
          .then(() => schema.apply(client, options))
          .then(() => schema.grantPrivileges(client, options));
      }

      return vow;
    });
  }

  applySchema(nick, options) {
    return this.connect().then(c => this.schema[nick].apply(c, options));
  }

  getLatestOrdinal(nick) {
    return this.schema[nick].getLatestOrdinal();
  }

  build(options) {
    return this.create()
      .then(() => this.connect())
      .then(c => {
        let vow = Promise.resolve();
        for (let name in this.schema) {
          const s = this.schema[name];
          vow = vow.then(() => s.build(c, options));
        }
        return vow;
      });
  }

  create() {
    return this.pgConnect()
      .then(c => c.exec(`CREATE DATABASE ${this.name}`))
      .then(() => this.connect())
      .then(c => Schema.bluefin().build(c, { first: 1 }));
  }

  drop() {
    if (this.raw.safety) return Promise.reject(new Error("safety"));
    return this.exists().then(exists => {
      if (exists) {
        return this.pgConnect().then(c => c.exec(`DROP DATABASE ${this.name}`));
      }
    });
  }

  ensure() {
    return this.exists().then(exists => {
      if (!exists) return this.create();
    });
  }

  ensureUsers(options) {
    const users = [];
    for (let s in this.schema) {
      for (let name of this.schema[s].userNames) {
        if (!users.includes(name)) users.push(name);
      }
    }
    return this.connect().then(client => {
      let vow = Promise.resolve();
      users.forEach(name => {
        vow = vow.then(() => {
          const user = new User(this.conf, name);
          return user.ensure(client, options);
        });
      });
      return vow;
    });
  }

  exists() {
    return this.pgConnect()
      .then(c => c.value(dbExistsSql, this.name))
      .then(value => !!value);
  }

  getSchemaNames() {
    return this.connect().then(c => c.column(getSchemaNamesSql));
  }

  rebuild(options) {
    // for most entities we drop() and build(), but databases can't be dropped
    // if there are clients connected, so we just rebuild it in place
    return this.ensure()
      .then(() => this.connect())
      .then(client => {
        // ensure all the users exist
        let vow = this.ensureUsers(options);

        // rebuild the bluefin schema first
        const bluefin = Schema.bluefin();
        vow = vow.then(() => bluefin.rebuild(client, { first: 1 }));

        // then rebuild all the schemata in the configuration
        for (let name in this.schema) {
          const schema = this.schema[name];
          vow = vow
            .then(() => schema.rebuild(client, options))
            .then(() => schema.grantPrivileges(client, options));
        }

        return vow;
      });
  }

  rebuildSchema(name, options) {
    return this.connect().then(c => {
      const s = this.schema[name];
      return this.ensureUsers(options)
        .then(() => s.rebuild(c, options))
        .then(() => s.grantPrivileges(c, options));
    });
  }
}

const dbExistsSql = "SELECT 1 FROM pg_database WHERE datname=$1";
const getSchemaNamesSql = `SELECT n.nspname
FROM pg_catalog.pg_namespace n
WHERE n.nspname !~ '^pg_'
  AND n.nspname <> 'information_schema'
ORDER BY n.nspname
`;
