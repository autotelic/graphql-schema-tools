const sortASTs = require('../sortASTNodes')

const createNameFilter = (names) => ({ name }) => !names.includes(name.value)

function extractASTNodes (obj) {
  let definitions = []
  if (obj.astNode) {
    definitions.push(obj.astNode)
  }
  if (obj.extensionASTNodes) {
    definitions = definitions.concat(obj.extensionASTNodes)
  }
  return definitions
}

function astFromSchema (schema, opts) {
  const {
    filterDirectives = [],
    filterTypes = []
  } = opts

  const handleTypesFilter = Array.isArray(filterTypes)
    ? createNameFilter(filterTypes)
    : filterTypes

  const handleDirectivesFilter = Array.isArray(filterDirectives)
    ? createNameFilter(filterDirectives)
    : filterDirectives

  const {
    types,
    directives
  } = schema.toConfig()

  const typeNodes = types.flatMap(extractASTNodes).filter(handleTypesFilter)
  const directiveNodes = directives.flatMap(extractASTNodes).filter(handleDirectivesFilter)

  return {
    kind: 'Document',
    definitions: sortASTs([...typeNodes, ...directiveNodes])
  }
}

module.exports = astFromSchema
