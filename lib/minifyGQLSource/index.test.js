const { parse } = require('graphql')
const { test } = require('tap')
const minifyGQLSource = require('.')

test(
  'should return a GQL source with all redundant whitespace removed',
  async ({ equal, ok }) => {
    const source = `

      type Foo {
        id: ID!
        name: String
      }

      type Bar { id: ID! name: String }

      type Query {
        foo: Foo
        bar(foo: String, id: ID): Bar
      }
    `
    const result = minifyGQLSource(source)
    equal(result, 'type Foo{id:ID! name:String}type Bar{id:ID! name:String}type Query{foo:Foo bar(foo:String,id:ID):Bar}')
    ok(parse(result))
  })
