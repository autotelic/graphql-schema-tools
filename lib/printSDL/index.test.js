const { test } = require('tap')
const { buildSchema } = require('graphql')
const printSDL = require('.')
const normalizeGQLSource = require('../normalizeGQLSource')

const source = `directive @testing on FIELD_DEFINITION
    type Foo {
      id: ID! @testing
      name: String!
    }
    type Bar { id: ID! name: String }

    extend type Foo {
      description: String
    }

    input NewFoo {
      name: String!
      description: String
    }

    type Mutation {
      bar(foo: NewFoo): NewFoo
    }

    type Query {
      foo: Foo
    }
  `

test('printSDL - given a GraphQLSchema, should return a normalized SDL string', async ({ equal }) => {
  const schema = buildSchema(source)

  const actual = printSDL(schema)
  const expected = normalizeGQLSource(source)

  equal(actual, expected.source)
})

test('printSDL - should return a minified SDL when opts.minify is true', async ({ equal }) => {
  const schema = buildSchema(source)

  const actual = printSDL(schema, { minify: true })
  const expected = normalizeGQLSource(source, { minify: true })

  equal(actual, expected.source)
})
