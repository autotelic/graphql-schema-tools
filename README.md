# gql-schema-normalizer

Normalize GraphQL string schemas.

### Usage

```sh
npm i @autotelic/gql-schema-normalizer
```

When passed a string GQL source, `normalizeGQLSource` groups top-level declarations by kind and then alphabetizes them along with their fields, directives, arguments, values, types, interfaces, and locations - all by name.

#### Example

```js
const normalizeGQLSource = require('@autotelic/gql-schema-normalizer')

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

### API

#### `normalizeGQLSource`: `(source: string) => object`

Returns an object with the following properties:
  - `source`: `string`- The normalized GQL source.
  - `error`: `GraphQLError | undefined` - If an error occurs, it will be added here.
