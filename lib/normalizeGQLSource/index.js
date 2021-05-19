const { print, parse } = require('graphql')
const enhanceGQLSyntaxError = require('../enhanceGQLSyntaxError')
const minifyGQLSource = require('../minifyGQLSource')
const sortASTNodes = require('../sortASTNodes')

function normalizeGQLSource (source, opts = {}) {
  if (typeof source !== 'string') {
    throw Error('GraphQL Schema Tools: `normalizeGQLSource` expected a string.')
  }
  const result = { source }
  try {
    const document = parse(source)
    document.definitions = sortASTNodes(document.definitions)
    result.source = opts.minify ? minifyGQLSource(print(document)) : print(document)
  } catch (err) {
    result.error = enhanceGQLSyntaxError(err)
  }
  return result
}

module.exports = normalizeGQLSource
