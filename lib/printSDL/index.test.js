const { test } = require('tap')
const { buildSchema } = require('graphql')
const printSDL = require('.')

const source = `directive @testing on FIELD_DEFINITION

type Query {
  foo: String! @testing
}
`

test('printSDL - given a GraphQLSchema and no opts, should return a normalized SDL string', async ({ equal }) => {
  const schema = buildSchema(source)

  const actual = printSDL(schema)

  equal(actual, source)
})

test('printSDL - should return a minified SDL when opts.minify is true', async ({ equal }) => {
  const schema = buildSchema(source)

  const actual = printSDL(schema, { minify: true })
  const expected = 'directive @testing on FIELD_DEFINITION type Query{foo:String! @testing}'

  equal(actual, expected)
})
