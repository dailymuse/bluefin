import Promise from "bluebird";
import path from "path";

import Program from "./program";

export default class BluefinConfiguration {
    migrations(directory) {
        const fpath = path.resolve(directory, "001-create-table.sql");
        return Promise.resolve(new Program(template, fpath));
    }
}

const template = `CREATE TABLE $schema.migrations (
  ordinal integer NOT NULL,
  schema text NOT NULL,
  name text NOT NULL,
  applied timestamp NOT NULL DEFAULT now()
)
`;
