
export default tree = {
  'conf.json': JSON.stringify({
    migrations: 'migrations'
  }),
  'migrations/001-create-zilt.sql': 
    'CREATE TABLE zilt (' +
      'id serial PRIMARY KEY,' +
      'value int DEFAULT 0 NOT NULL' +
    ')', 
  'migrations/002-create-derp.sql': 
    'CREATE TABLE derp (' +
      'id serial PRIMARY KEY,' +
      'value text' +
    ')'
}