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
    .catch(err => console.log(err.messsage || err.stack.split("\n")[0]));
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
    .catch(err => console.log(err.messsage));
}

program
  .version("0.0.1")
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

program.parse(process.argv);
