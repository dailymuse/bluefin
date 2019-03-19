#!/usr/bin/env node

require("reify");
const fs = require("fs");
const program = require("commander");
const Configuration = require("../lib/configuration").default;

function readConf(fpath) {
  fpath = fpath || process.env.BLUEFIN_CONF || "conf.json";
  return Configuration.read(fpath, fs);
}

function readOptions(cmd) {
  const options = { log: true };
  if (cmd.parent.migration) options.last = cmd.parent.migration;
  if (cmd.parent.list) options.list = cmd.parent.list;
  return options;
}

function rebuild(dbName, schemaName, cmd) {
  const options = readOptions(cmd);
  readConf(cmd.parent.conf)
    .then(conf => conf.database(dbName))
    .then(db => {
      const vow = schemaName
        ? db.rebuildSchema(schemaName, options)
        : db.rebuild(options);
      return vow.finally(() => db.disconnect());
    })
    .catch(err => {
      console.error(err.messsage || err.stack.split("\n")[0]);
      process.exit(1);
    });
}

function apply(dbName, schemaName, cmd) {
  const options = readOptions(cmd);
  readConf(cmd.parent.conf)
    .then(conf => conf.database(dbName))
    .then(db => {
      const vow = schemaName
        ? db.applySchema(schemaName, options)
        : db.apply(options);
      return vow.finally(() => db.disconnect());
    })
    .catch(err => {
      console.error(err.messsage);
      process.exit(1);
    });
}

function getLatestOrdinal(dbName, schemaName, cmd) {
  readOptions(cmd);
  readConf(cmd.parent.conf)
    .then(conf => {
      console.log(conf);
      return conf.database(dbName);
    })
    .then(db => db.getLatestOrdinal(schemaName).finally(() => db.disconnect()))
    .then(ordinal => console.log(ordinal))
    .catch(err => {
      console.error(err.messsage || err);
      process.exit(1);
    });
}

program
  .version("0.3.0")
  .option("-c --conf <path>", "Path to configuration file")
  .option(
    "-m --migration <ordinal>",
    "Only consider migrations with this ordinal or lower",
    parseInt
  )
  .option("-l --list", "List migrations only, do not apply them");

program
  .command("rebuild <db> [schema]")
  .description("Destroy and recreate an entire database or just one schema")
  .action(rebuild);

program
  .command("apply <db> [schema]")
  .description("Apply new migrations to a schema or all schemata in a database")
  .action(apply);

program
  .command("latest <db> <schema>")
  .description("Get the latest ordinal to a schema in a database")
  .action(getLatestOrdinal);

program.parse(process.argv);
