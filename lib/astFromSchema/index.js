const { Kind, parse, printType, isIntrospectionType, isType, isSpecifiedScalarType, isSpecifiedDirective } = require('graphql')
const sortASTs = require('../sortASTNodes')

const createNameFilter = (names) => (obj) => !names.includes(obj.name.value)
// Used if schema is either the result of introspection or contains a subschema created via introspection.
const createFallbackAST = (type) => parse(printType(type)).definitions[0]

function astFromSchema (schema, opts = {}) {
  const {
    filterDirectives = [],
    filterTypes = [],
    filterFields = {}
  } = opts

  const handleFieldsFilter = typeof filterFields === 'function'
    ? filterFields
    : (target, parent) => {
        try {
          return !filterFields[parent.name.value].includes(target.name.value)
        } catch (error) {
          return true
        }
      }

  const handleTypesFilter = Array.isArray(filterTypes)
    ? createNameFilter(filterTypes)
    : filterTypes

  const handleDirectivesFilter = Array.isArray(filterDirectives)
    ? createNameFilter(filterDirectives)
    : filterDirectives

  function extractASTNodes (obj) {
    // We want to ignore all built-in definitions.
    if (!isIntrospectionType(obj) && !isSpecifiedScalarType(obj) && !isSpecifiedDirective(obj)) {
      // If a type contains fields, do not extract the top-level astNode and extensionASTNodes.
      // Instead, construct a single astNode containing the nodes of each field.
      if (obj._fields) {
        // Some schemas may contain types and fields with undefined astNodes (ie. client schemas).
        // If an astNode is undefined, we can create our own...
        const { fields: astFields, ...astNode } = obj.astNode || createFallbackAST(obj)
        const objFields = Object.values(obj.getFields())
        astNode.fields = objFields.map(({ name, astNode }) => {
          // If a field does not contain an astNode...
          if (!astNode) {
            // fallback to the field contained in the parent types astNode.
            return astFields.find((ast) => name === ast.name.value)
          }
          return astNode
        })
        astNode.fields = astNode.fields.filter((field) => field && handleFieldsFilter(field, astNode))
        return astNode
      }
      if (obj.astNode) {
        // If extensions exist, merge them and the original astNode into a new astNode.
        if (Array.isArray(obj.extensionASTNodes)) {
          return obj.extensionASTNodes.reduce((acc, extNode) => {
            const { name, description, kind, loc, ...extProps } = extNode
            Object.entries(extProps).forEach(([key, value]) => {
              if (Array.isArray(value)) {
                if (Array.isArray(acc[key])) {
                  acc[key] = acc[key].concat(value)
                } else {
                  acc[key] = value
                }
              }
            })
            return acc
          }, { ...obj.astNode })
        }
        return obj.astNode
      }
      // There is no need to provide fallbacks for directives, as client schemas do not represent
      // any server-internal mechanisms (including directives).
      if (isType(obj)) {
        return createFallbackAST(obj)
      }
    }
  }

  const {
    types,
    directives
  } = schema.toConfig()

  const typeNodes = types.map(extractASTNodes).filter(
    (node) => node && handleTypesFilter(node)
  )
  const directiveNodes = directives.map(extractASTNodes).filter(
    (node) => node && handleDirectivesFilter(node)
  )

  return {
    kind: Kind.DOCUMENT,
    definitions: sortASTs([...typeNodes, ...directiveNodes])
  }
}

module.exports = astFromSchema
