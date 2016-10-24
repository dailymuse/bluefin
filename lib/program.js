export default class Program {
  constructor (template) {
    this.template = template
  }

  exec (client, context) {
    const sql = this.template.replace(variable, (match, name) => {
      if (!(name in context)) {
        throw new Error(`Unrecognized variable $${name}`)
      }

      return context[name]
    })
    return client.exec(sql)
  }
}

const variable = /\$(\w+)/g
