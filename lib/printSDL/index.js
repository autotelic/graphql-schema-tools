const { print } = require('graphql')
const astFromSchema = require('../astFromSchema')
const minifyGQLSource = require('../minifyGQLSource')

function printSDL (schema, opts = {}) {
  const { minify, ...astOpts } = opts
  const SDL = print(astFromSchema(schema, astOpts))
  if (minify) {
    return minifyGQLSource(SDL)
  }
  return SDL
}

module.exports = printSDL
