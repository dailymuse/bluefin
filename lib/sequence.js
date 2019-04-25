import Promise from "bluebird";

import Migration from "./migration";
import Program from "./program";

export default class Sequence {
    static readMigrations(fs, dirPath, first = 1, last) {
        return Promise.fromCallback(cb => fs.readdir(dirPath, cb))
            .then(files => {
                const migrations = [];
                let prologue;
                let epilogue;

                for (let ea of files) {
                    if (ea === "prologue.sql") {
                        prologue = Program.fromFile(fs, dirPath, ea);
                    } else if (ea === "epilogue.sql") {
                        epilogue = Program.fromFile(fs, dirPath, ea);
                    } else if (/^\d+-[^.]+.sql/.test(ea)) {
                        migrations.push(Migration.fromFile(fs, dirPath, ea));
                    }
                }

                return Promise.all([prologue, Promise.all(migrations), epilogue]);
            })
            .spread((prologue, migrations, epilogue) => {
                migrations.sort((a, b) => a.ordinal - b.ordinal);

                let lim = migrations.length;
                for (let i = 0; i < lim; i++) {
                    const expected = i + 1;
                    if (migrations[i].ordinal < expected) {
                        throw new Error(`Duplicate migration number ${migrations[i].ordinal}`);
                    }

                    if (migrations[i].ordinal > expected) {
                        throw new Error(`Missing migration number ${migrations[i].ordinal}`);
                    }
                }

                migrations = migrations.filter(ea => ea.ordinal >= first);
                if (last !== undefined) {
                    migrations = migrations.filter(ea => ea.ordinal <= last);
                }

                if (prologue) {
                    migrations.unshift(prologue);
                }
                if (epilogue) {
                    migrations.push(epilogue);
                }
                return new this(...migrations);
            });
    }

    static async getLatestMigration(fs, dirPath) {
        const sequence = await this.readMigrations(fs, dirPath);

        for (let i = sequence.programs.length - 1; i >= 0; i--) {
            if (sequence.programs[i] && sequence.programs[i].ordinal) {
                return sequence.programs[i].ordinal;
            }
        }

        return null;
    }

    constructor() {
        this.programs = [...arguments];
    }

    checkContext(context) {
        this.programs.forEach(ea => ea.checkContext(context));
    }

    exec(client, context, options) {
        let vow = Promise.resolve();
        this.programs.forEach(ea => {
            vow = vow.then(() => ea.exec(client, context, options));
        });
        return vow;
    }

    execInTransaction(client, context, options) {
        return client
            .exec("BEGIN")
            .then(() => this.exec(client, context, options))
            .then(result => client.exec("COMMIT").return(result), err => client.exec("ROLLBACK").throw(err));
    }
}
