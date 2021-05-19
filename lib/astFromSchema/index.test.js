const { test } = require('tap')
const { buildSchema, print } = require('graphql')
const astFromSchema = require('.')

const source = `directive @testing on FIELD_DEFINITION
    type Foo {
      id: ID! @testing
      name: String!
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

test('astFromSchema - filterTypes and filterDirectives accepts array of names', async ({ equal }) => {
  const schema = buildSchema(source)

  const actual = astFromSchema(schema, {
    filterTypes: ['NewFoo', 'Mutation'],
    filterDirectives: ['testing']
  })

  const expected = `type Foo {
  id: ID! @testing
  name: String!
}

type Query {
  foo: Foo
}
`
  // Compare printed ASTs so tap doesn't timeout comparing DocumentNodes.
  equal(print(actual), expected)
})

test('astFromSchema - filterTypes and filterDirectives accepts functions', async ({ equal }) => {
  const schema = buildSchema(source)

  const actual = astFromSchema(schema, {
    filterTypes: ({ name }) => !['NewFoo', 'Mutation'].includes(name.value),
    filterDirectives: ({ name }) => !['testing'].includes(name.value)
  })

  const expected = `type Foo {
  id: ID! @testing
  name: String!
}

type Query {
  foo: Foo
}
`
  // Compare printed ASTs so tap doesn't timeout comparing DocumentNodes.
  equal(print(actual), expected)
})
