const { parse } = require('graphql')
const { test } = require('tap')
const enhanceGQLSyntaxError = require('.')

test(
  'should return an unmodified error when passed an error without `source` or `locations` properties.',
  async ({ is }) => {
    const error = Error()
    is(enhanceGQLSyntaxError(error), error)
  })

test(
  'should provide a condensed snippet of where a syntax error occurs.',
  async ({ is }) => {
    const expectedMessage = 'Syntax Error: Unexpected "}". Found near: `bar: String } }`.'
    const schemaWithErrorOne = `
      type Foo {
        id: ID!
        bar: String
      }



    }
        `
    let syntaxErrorOne
    try {
      parse(schemaWithErrorOne)
    } catch (error) {
      syntaxErrorOne = error
    }
    is(enhanceGQLSyntaxError(syntaxErrorOne).message, expectedMessage)

    const schemaWithErrorTwo = 'type Foo{id: ID! bar: String}}'
    let syntaxErrorTwo
    try {
      parse(schemaWithErrorTwo)
    } catch (error) {
      syntaxErrorTwo = error
    }
    is(enhanceGQLSyntaxError(syntaxErrorTwo).message, expectedMessage, 'same error should have same snippet regardless of schema formatting.')
  })
