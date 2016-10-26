export default class Program {
  constructor (template) {
    this.template = template
  }

  checkContext (context) {
    const re = /\$(\w+)/g
    let match = re.exec(this.template)
    while (match !== null) {
      if (!(match[1] in context)) {
        throw new Error(`Unrecognized variable $${match[1]}`)
      }
      match = re.exec(this.template)
    }
  }

  exec (client, context) {
    const sql = this.resolve(context)
    return client.query(sql)
  }

  execInTransaction (client, context) {
    return this.exec(client, context)
  }

  resolve (context) {
    return this.template.replace(variable, (match, name) => {
      if (!(name in context)) {
        throw new Error(`Unrecognized variable $${name}`)
      }

      return context[name]
    })
  }
}

const variable = /\$(\w+)/g
