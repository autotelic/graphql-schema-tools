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

#### `normalizeGQLSource`: `(source: string, options?: object) => object`

When passed a string GQL source, `normalizeGQLSource` groups top-level declarations by kind and then alphabetizes them along with their fields, directives, arguments, values, types, interfaces, and locations - all by name.

Accepts an optional `options` object containing the following properties:
  - `minify`: `boolean` - If `true`, the returned source will have all redundant whitespace stripped out. Defaults to `false`.

Returns an object with the following properties:
  - `source`: `string`- The normalized GQL source.
  - `error`: `GraphQLError | undefined` - If an error occurs, it will be added here.

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

If the provided `error` contains `source` and `locations` properties, `enhanceGQLSyntaxError` will return the provided `GraphQLError` with a modified `message` - containing a condensed snipped of where in the source the error occurred.

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
