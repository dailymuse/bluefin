import path from "path";
import Promise from "bluebird";

const variable = /\$([a-z]\w*)/g;

export default class Program {
  static fromFile(fs, ...segments) {
    const absolute = path.resolve(...segments);
    return Promise.fromCallback(cb => fs.readFile(absolute, "utf8", cb)).then(
      template => new this(template, absolute)
    );
  }

  constructor(template, fpath) {
    this.template = template;
    this.path = fpath;
  }

  checkContext(context) {
    let match = variable.exec(this.template);
    while (match !== null) {
      if (!(match[1] in context)) {
        throw new Error(`Unrecognized variable $${match[1]}`);
      }
      match = variable.exec(this.template);
    }
  }

  exec(client, context, options = {}) {
    if (options.log) this.log(context);
    const sql = this.resolve(context);
    return client.query(sql).catch(e => {
      throw this.format(e, sql);
    });
  }

  execInTransaction(client, context, options) {
    return this.exec(client, context, options);
  }

  log(context) {
    const more = [];
    for (let p in context) more.push(`${p}=${context[p]}`);
    console.log(path.basename(this.path), ...more);
  }

  resolve(context) {
    return this.template.replace(variable, (match, name) => {
      if (!(name in context)) {
        throw new Error(`Unrecognized variable $${name}`);
      }

      return context[name];
    });
  }

  format(e, sql) {
    const position = parseInt(e.position);
    const chunks = [`SQL Error: ${e.message}\n`];
    if (this.path && !isNaN(position)) {
      chunks.push(`${this.path}:${position}\n`);
    } else if (this.path) {
      chunks.push(`${this.path}\n`);
    }

    if (!isNaN(position)) {
      const start = Math.max(position - 20, 0);
      const end = Math.min(position + (position - start));
      if (start > 0) chunks.push("...");
      chunks.push(sql.slice(start, end));
      chunks.push("\n");
      if (start > 0) chunks.push("   ");
      chunks.push(" ".repeat(position - start - 1));
      chunks.push("^\n");
    }
    e.stack = e.stack.replace(/^.*\n/, chunks.join(""));
    return e;
  }
}
