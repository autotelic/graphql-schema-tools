const { test } = require('tap')
const { buildSchema, print, buildClientSchema, parse, introspectionFromSchema, buildASTSchema } = require('graphql')
const { stitchSchemas } = require('@graphql-tools/stitch')
const astFromSchema = require('.')

const schemaSDL = `
directive @testing on FIELD_DEFINITION
directive @another on FIELD_DEFINITION

scalar HELLO_WORLD
scalar FOO
scalar BAR

enum Stuff {
  FOO
}

extend enum Stuff {
  HELLO_WORLD
}

extend enum Stuff {
  BAR
}

type Foo {
  bar: String
}

type Bar {
  foo: String
}

type Baz {
  fooBar: String
}

union Something = Foo | Bar

extend union Something = Baz

type Query {
  getFoo(bar: String = "bar"): Foo @testing
}

extend type Query {
  getBar(foo: String): Bar @testing
}

extend type Query {
  getBaz: Baz
  getSomething: Something
  getStuff: Stuff
}
`

test('astFromSchema', async ({ equal }) => {
  const schema = buildSchema(schemaSDL)

  const actual = astFromSchema(schema, {
    filterFields: ['getBaz', 'getBar']
  })
  const expected = `directive @another on FIELD_DEFINITION

directive @testing on FIELD_DEFINITION

scalar BAR

scalar FOO

scalar HELLO_WORLD

enum Stuff {
  BAR
  FOO
  HELLO_WORLD
}

type Bar {
  foo: String
}

type Baz {
  fooBar: String
}

type Foo {
  bar: String
}

type Query {
  getBar(foo: String): Bar @testing
  getBaz: Baz
  getFoo(bar: String = "bar"): Foo @testing
  getSomething: Something
  getStuff: Stuff
}

union Something = Bar | Baz | Foo`
  // Compare printed ASTs so tap doesn't timeout comparing DocumentNodes.
  equal(print(actual), expected)
})

test('astFromSchema - filterTypes, filterDirectives, and filterFields', async ({ equal }) => {
  const schema = buildSchema(schemaSDL)

  const actual = astFromSchema(schema, {
    filterFields: { Query: ['getBaz', 'getBar', 'getSomething', 'getStuff'] },
    filterTypes: ['BAR', 'FOO', 'HELLO_WORLD', 'Stuff', 'Something', 'Bar', 'Baz'],
    filterDirectives: ['another']
  })
  const expected = `directive @testing on FIELD_DEFINITION

type Foo {
  bar: String
}

type Query {
  getFoo(bar: String = "bar"): Foo @testing
}`
  // Compare printed ASTs so tap doesn't timeout comparing DocumentNodes.
  equal(print(actual), expected)
})

test('astFromSchema - filterTypes, filterDirectives, and filterFields accepts functions', async ({ equal }) => {
  const schema = buildSchema(schemaSDL)

  const actual = astFromSchema(schema, {
    filterTypes: ({ name }) => ['Foo', 'Query'].includes(name.value),
    filterDirectives: ({ name }) => ['testing'].includes(name.value),
    filterFields: (field, type) => {
      if (type.name.value === 'Query') {
        return field.name.value === 'getFoo'
      }
      return true
    }
  })

  const expected = `directive @testing on FIELD_DEFINITION

type Foo {
  bar: String
}

type Query {
  getFoo(bar: String = "bar"): Foo @testing
}`
  // Compare printed ASTs so tap doesn't timeout comparing DocumentNodes.
  equal(print(actual), expected)
})

test('astFromSchema - can handle client schemas (undefined astNodes)', async ({ equal }) => {
  const schema = buildClientSchema(introspectionFromSchema(buildASTSchema(parse(schemaSDL))))
  const actual = astFromSchema(schema)

  const expected = `scalar BAR

scalar FOO

scalar HELLO_WORLD

enum Stuff {
  BAR
  FOO
  HELLO_WORLD
}

type Bar {
  foo: String
}

type Baz {
  fooBar: String
}

type Foo {
  bar: String
}

type Query {
  getBar(foo: String): Bar
  getBaz: Baz
  getFoo(bar: String = "bar"): Foo
  getSomething: Something
  getStuff: Stuff
}

union Something = Bar | Baz | Foo`

  // Compare printed ASTs so tap doesn't timeout comparing DocumentNodes.
  equal(print(actual), expected)
})

test('astFromSchema - can handle stitched schemas', async ({ equal }) => {
  const subschemaOne = buildClientSchema(introspectionFromSchema(buildASTSchema(parse(schemaSDL))))
  const subschemaTwo = buildSchema(`
  type Foo {
    id: ID!
  }

  type Query {
    allFoo: [Foo]
  }
  `)

  const stitchedSchema = stitchSchemas({
    subschemas: [subschemaOne, subschemaTwo]
  })

  const actual = astFromSchema(stitchedSchema)
  const expected = `scalar BAR

scalar FOO

scalar HELLO_WORLD

enum Stuff {
  BAR
  FOO
  HELLO_WORLD
}

type Bar {
  foo: String
}

type Baz {
  fooBar: String
}

type Foo {
  bar: String
  id: ID!
}

type Query {
  allFoo: [Foo]
  getBar(foo: String): Bar
  getBaz: Baz
  getFoo(bar: String = "bar"): Foo
  getSomething: Something
  getStuff: Stuff
}

union Something = Bar | Baz | Foo`

  // Compare printed ASTs so tap doesn't timeout comparing DocumentNodes.
  equal(print(actual), expected)
})

test('astFromSchema - can handle undefined property values in extension nodes', async ({ equal, same }) => {
  const schema = {
    toConfig: () => ({
      types: [
        {
          astNode: {
            name: { value: 'MyEnum' },
            kind: 'EnumTypeDefinition',
            values: [{
              kind: 'EnumValueDefinition',
              name: { value: 'MyEnumValue' }
            }]
          },
          extensionASTNodes: [{
            kind: 'EnumTypeExtension',
            name: { value: 'MyEnum' },
            values: undefined,
            directives: [
              {
                kind: 'Directive',
                name: 'deprecated'
              }
            ]
          }]
        }
      ],
      directives: []
    })
  }

  same(astFromSchema(schema), {
    kind: 'Document',
    definitions: [
      {
        name: {
          value: 'MyEnum'
        },
        kind: 'EnumTypeDefinition',
        directives: [
          {
            kind: 'Directive',
            name: 'deprecated'
          }
        ],
        values: [{
          kind: 'EnumValueDefinition',
          name: { value: 'MyEnumValue' }
        }]
      }
    ]
  })
})
