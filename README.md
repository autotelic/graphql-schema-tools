# GraphQL Schema Tools

### Usage

```sh
npm i @autotelic/graphql-schema-tools
```

### API
##### Contents

  - [`normalizeGQLSource`](#normalizegqlsource-source-string-options-object--object)
  - [`minifyGQLSource`](#minifygqlsource-source-string--string)
  - [`enhanceGQLSyntaxError`](#enhancegqlsyntaxerror-error-graphqlerror--graphqlerror)
  - [`printSDL`](#printsdl-schema-graphqlschema-options-object--documentnode)
  - [`astFromSchema`](#astfromschema-schema-graphqlschema-options-object--documentnode)

#### `normalizeGQLSource`: `(source: string, options?: object) => object`

When passed a string GQL source, `normalizeGQLSource` groups top-level declarations by kind and then alphabetizes them along with their fields, directives, arguments, values, types, interfaces, and locations - all by name.

Accepts an optional `options` object containing the following properties:
  - **`minify`: `boolean`** - If `true`, the returned source will have all redundant whitespace stripped out. Defaults to `false`.

Returns an object with the following properties:
  - **`source`: `string`**- The normalized GQL source.
  - **`error`: `GraphQLError | undefined`** - If an error occurs, it will be added here.

##### Example

```js
const { normalizeGQLSource } = require('@autotelic/graphql-schema-tools')

const schema = `
  type Query {
    products(priceUnder: Float priceOver: Float category: String): [Products]! @paginate @cacheControl(maxAge: 2000 scope: PUBLIC)
    customer(id: ID): Customer
  }

 type Product {
    name: String!
    price: Float!
    category: String!
    id: ID!
  }

  type Customer @cacheControl(scope: PRIVATE maxAge: 1000) {
    name: String!
    address: String!
    id: ID!
  }

  directive @paginate on FIELD_DEFINITION
  directive @cacheControl(scope: CacheScope maxAge: Int) on OBJECT | FIELD_DEFINITION

  enum CacheScope {
    PUBLIC
    PRIVATE
  }
`

const { source, error } = normalizeGQLSource(schema)

```

Given the above `schema`, the returned `source` would look like:

```gql
directive @cacheControl(maxAge: Int, scope: CacheScope) on FIELD_DEFINITION | OBJECT

directive @paginate on FIELD_DEFINITION

enum CacheScope {
  PRIVATE
  PUBLIC
}

type Customer @cacheControl(maxAge: 1000, scope: PRIVATE) {
  address: String!
  id: ID!
  name: String!
}

type Product {
  category: String!
  id: ID!
  name: String!
  price: Float!
}

type Query {
  customer(id: ID): Customer
  products(category: String, priceOver: Float, priceUnder: Float): [Products]! @cacheControl(maxAge: 2000, scope: PUBLIC) @paginate
}

```

#### `minifyGQLSource`: `(source: string) => string`

Returns the provided `source` with all redundant whitespace stripped out.

##### Example

```js
const { minifyGQLSource } = require('@autotelic/graphql-schema-tools')

const schema = `
  type Query {
    foo: String
    bar(foo: String, id: ID): String
  }
`

const minified = minifyGQLSource(schema)
// The resulting minified schema will look like:
// 'type Query{foo:String bar(foo:String,id:ID):String}'
```

#### `enhanceGQLSyntaxError`: `(error: GraphQLError) => GraphQLError`

If the provided `error` contains `source` and `locations` properties, `enhanceGQLSyntaxError` will return the provided `GraphQLError` with a modified `message` - containing a condensed snippet showing where in the source the error occurred.

##### Example

```js
const { enhanceGQLSyntaxError } = require('@autotelic/graphql-schema-tools')

const schemaWithError = `
  type Foo {
    id: ID!
    bar: String
  }



}
    `

try {
  parse(schemaWithError)
} catch (error) {
  const enhancedError = enhanceGQLSyntaxError(error)
  console.log(enhancedError.message)
  // Logs: 'Syntax Error: Unexpected "}". Found near: `bar: String } }`.'
}
```

#### `printSDL`: `(schema: GraphQLSchema, options: object) => DocumentNode`

Returns an SDL string representation of the provided `schema`.

Accepts an optional `options` object containing the following properties:

 - **`minify`: `boolean`** - If `true`, the returned source will have all redundant whitespace stripped out. Defaults to `false`.
 - **`filterTypes`: `string[] | (GraphQLNamedType) => boolean`** - Accepts an array of type names that will be filtered out of the returned AST. Alternatively a custom filter function can be passed in.
 - **`filterDirectives`: `string[] | (GraphQLDirective) => boolean`** - Accepts an array of directive names that will be filtered out of the returned AST. Alternatively a custom filter function can be passed in.

##### Example

```js
const { printSDL } = require('@autotelic/graphql-schema-tools')
const federatedSchema = require('./schema')

const SDL = printSDL(federatedSchema, {
  minify: true,
  filterDirectives: ['key', 'external', 'requires', 'provides', 'extends']
})
```

#### `astFromSchema`: `(schema: GraphQLSchema, options: object) => DocumentNode`

Returns an AST representation of the provided `schema`.

Accepts an optional `options` object containing the following properties:

 - **`filterTypes`: `string[] | (GraphQLNamedType) => boolean`** - Accepts an array of type names that will be filtered out of the returned AST. Alternatively a custom filter function can be passed in.
 - **`filterDirectives`: `string[] | (GraphQLDirective) => boolean`** - Accepts an array of directive names that will be filtered out of the returned AST. Alternatively a custom filter function can be passed in.
 - **`filterFields`: `{ [string]: string[] } | (GraphQLDirective) => boolean`** - Accepts an Object with keys of type names and values of arrays of field names to filter out of the returned AST. Alternatively a custom filter function can be passed in.

##### Example

```js
const { astFromSchema } = require('@autotelic/graphql-schema-tools')
const federatedSchema = require('./schema')

const document = astFromSchema(federatedSchema, {
  filterDirectives: ['key', 'external', 'requires', 'provides', 'extends'],
  filterFields: {
    Query: ['_service', '_entities']
  }
})
```
