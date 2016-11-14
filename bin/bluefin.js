
import fs from 'fs'
import program from 'commander'
import Promise from 'bluebird'

import Configuration from '../lib/configuration'
import Client from '../lib/client'

Client.logToConsole = true

function readConf (fpath) {
  fpath = fpath || process.env.BLUEFIN_CONF || 'conf.json'
  return Configuration.read(fpath, fs)
}

function rebuild (dbName, schemaName, cmd) {
  const options = {last: cmd.parent.migration}
  readConf(cmd.parent.conf)
    .then(conf => conf.database(dbName))
    .then(db => {
      const vow = schemaName
        ? db.rebuildSchema(schemaName, options)
        : db.rebuild(options)
      return vow.then(() => db.disconnect())
    })
}

function apply (dbName, schemaName, cmd) {
  const options = {last: cmd.parent.migration}
  readConf(cmd.parent.conf)
    .then(conf => conf.database(dbName))
    .then(db => {
      const vow = schemaName
        ? db.applySchema(schemaName, options)
        : db.apply(options)
      return vow.then(() => db.disconnect())
    })
}

program
  .version('0.0.1')
  .option('-c --conf <path>', 'Path to configuration file')
  .option('-m --migration <ordinal>', 'Only consider migrations with this ordinal or lower', parseInt)
  .option('-l --list', 'List migrations only, do not apply them')

program
  .command('rebuild <db> [schema]')
  .description('Destroy and recreate an entire database or just one schema')
  .action(rebuild)

program
  .command('apply <db> [schema]')
  .description('Apply new migrations to a schema or all schemata in a database')
  .action(apply)

program.parse(process.argv)

