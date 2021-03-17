const { test } = require('tap')
const normalizeGQLSource = require('.')
const minifyGQLSource = require('../minifyGQLSource')

// Note: the inconsistent spacing and indentation is intentional and part of the test.
const sourceOne = `
  directive @paginate on FIELD_DEFINITION
type Human implements Mammal & FriendlyMammal & Friendly @auth(requires: USER code: 99) {
  id: ID!
  name: String!
  email: String!
  friends: [Friend]
  address: Address
}

extend type Query {
  friendsOf(zebraID: ID humanID: ID): [Friend] @paginate @awesome
  friend(zebraID: ID humanID: ID): Friend
}

interface Mammal  {
  id: ID!
name: String!
}

interface Friendly {
  friends: [Friend]
}

interface FriendlyMammal implements Mammal & Friendly {
  friends: [Friend]
  name: String!
  id: ID!
}

interface Striped {
    stripes: Int!
}

type Address {
  street: String!
  buildingNum: String!
  zipCode: String!
  city: String!
  country: String!
}
type Zebra implements Striped & Friendly & FriendlyMammal & Mammal @awesome @auth(code: 52, requires: UNKNOWN) {
  name: String!
  id: ID!
  friends: [Friend]
  stripes: Int!
}

directive @awesome on OBJECT | FIELD_DEFINITION
union Friend = Zebra | Human

directive @auth(
  code: Int
requires: Role = ADMIN
) on OBJECT | FIELD_DEFINITION

      enum Role { REVIEWER ADMIN USER UNKNOWN}`

// Same overall schema as sourceOne, just with different spacing and ordering.
const sourceTwo = `
type Address {
  buildingNum: String!
  city: String!
  zipCode: String!
  country: String!
  street: String!
}
  interface Striped {
 stripes: Int!
}

 extend type Query {
  friendsOf(zebraID: ID humanID: ID): [Friend] @paginate @awesome
  friend(zebraID: ID humanID: ID): Friend
}


directive @paginate on FIELD_DEFINITION
interface FriendlyMammal implements Friendly & Mammal  {
  friends: [Friend]
  name: String!
  id: ID!
}

type Zebra implements FriendlyMammal & Friendly & Striped & Mammal @awesome @auth(requires: UNKNOWN code: 52) {
  stripes: Int!
  friends: [Friend]
  name: String!
  id: ID!
}

enum Role {
  UNKNOWN
  ADMIN
  REVIEWER
  USER
}

type Human implements Friendly & FriendlyMammal & Mammal @auth(requires: USER code: 99) {
  email: String!
  name: String!
  address: Address
  friends: [Friend]
  id: ID!
}

interface Friendly {
  friends: [Friend]
}
directive @awesome on OBJECT | FIELD_DEFINITION
interface Mammal  {
  name: String!
  id: ID!
}
union Friend = Zebra | Human

directive @auth(
  requires: Role = ADMIN
  code: Int
) on  OBJECT | FIELD_DEFINITION

`

const expected = `directive @auth(code: Int, requires: Role = ADMIN) on FIELD_DEFINITION | OBJECT

directive @awesome on FIELD_DEFINITION | OBJECT

directive @paginate on FIELD_DEFINITION

enum Role {
  ADMIN
  REVIEWER
  UNKNOWN
  USER
}

interface Friendly {
  friends: [Friend]
}

interface FriendlyMammal implements Friendly & Mammal {
  friends: [Friend]
  id: ID!
  name: String!
}

interface Mammal {
  id: ID!
  name: String!
}

interface Striped {
  stripes: Int!
}

type Address {
  buildingNum: String!
  city: String!
  country: String!
  street: String!
  zipCode: String!
}

type Human implements Friendly & FriendlyMammal & Mammal @auth(code: 99, requires: USER) {
  address: Address
  email: String!
  friends: [Friend]
  id: ID!
  name: String!
}

type Zebra implements Friendly & FriendlyMammal & Mammal & Striped @auth(code: 52, requires: UNKNOWN) @awesome {
  friends: [Friend]
  id: ID!
  name: String!
  stripes: Int!
}

union Friend = Human | Zebra

extend type Query {
  friend(humanID: ID, zebraID: ID): Friend
  friendsOf(humanID: ID, zebraID: ID): [Friend] @awesome @paginate
}
`

test(
  'should group top-level declarations by kind and then alphabetize them along with their fields, directives, arguments, values, types, interfaces, and locations by name.',
  async ({ is }) => {
    const { source: sourceOneResult, error: sourceOneError } = normalizeGQLSource(sourceOne)
    const { source: sourceTwoResult, error: sourceTwoError } = normalizeGQLSource(sourceTwo)

    is(sourceOneResult, sourceTwoResult, 'once normalized, schemas should be exactly the same if there were only stylistic differences previously.')
    is(sourceOneResult, expected)
    is(sourceTwoResult, expected)
    is(sourceOneError, undefined)
    is(sourceTwoError, undefined)
  })

test(
  'should minify normalized GQL source if opts.minify is true',
  async ({ is }) => {
    const { source: sourceOneResult, error: sourceOneError } = normalizeGQLSource(sourceOne, { minify: true })
    const { source: sourceTwoResult, error: sourceTwoError } = normalizeGQLSource(sourceTwo, { minify: true })
    is(sourceOneResult, sourceTwoResult, 'once normalized, schemas should be exactly the same if there were only stylistic differences previously.')
    is(sourceOneResult, minifyGQLSource(expected))
    is(sourceTwoResult, minifyGQLSource(expected))
    is(sourceOneError, undefined)
    is(sourceTwoError, undefined)
  })

test(
  'should return an error nested under an error key if parsing fails',
  async ({ is }) => {
    const schemaWithError = `
      type Query {
        foo(): String
      }`
    const { error } = normalizeGQLSource(schemaWithError)
    is(error.message, 'Syntax Error: Expected Name, found ")". Found near: `Query { foo(): String`.')
  })

test(
  'should throw an Error if not passed a string.',
  async ({ throws }) => {
    throws(() => normalizeGQLSource(), Error('GraphQL Schema Tools: `normalizeGQLSource` expected a string.'))
  })
