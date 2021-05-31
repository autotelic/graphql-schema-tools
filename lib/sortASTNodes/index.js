function defaultCompare (a, b) {
  if (a < b) {
    return -1
  }
  return 1
}

function compareNodeByName (a, b) {
  return defaultCompare(a.name.value, b.name.value)
}

function compareNodeByKind (a, b) {
  const kindOrder = {
    DirectiveDefinition: 1,
    ScalarTypeDefinition: 2,
    EnumTypeDefinition: 3,
    InterfaceTypeDefinition: 4,
    ObjectTypeDefinition: 5,
    UnionTypeDefinition: 6,
    InputObjectTypeDefinition: 7,
    DirectiveExtension: 8,
    ScalarTypeExtension: 9,
    EnumTypeExtension: 10,
    InterfaceTypeExtension: 11,
    ObjectTypeExtension: 12,
    UnionTypeExtension: 13,
    InputObjectTypeExtension: 14,
    SchemaDefinition: 15,
    SchemaExtension: 16,
    OperationDefinition: 17,
    FragmentDefinition: 18
  }
  if (kindOrder[a.kind] < kindOrder[b.kind]) {
    return -1
  }
  return 1
}

function sortDefinitions (definitions) {
  return definitions.sort((a, b) => {
    if (a.kind === b.kind) {
      return compareNodeByName(a, b)
    }
    return compareNodeByKind(a, b)
  })
}

function sortDefinitionNode (definition) {
  return Object.entries(definition).reduce((acc, [key, value]) => {
    if (Array.isArray(value)) {
      if (key === 'fields' || key === 'directives' || key === 'arguments' || key === 'values' || key === 'types' || key === 'interfaces') {
        acc[key] = value.map(sortDefinitionNode).sort(compareNodeByName)
        return acc
      }
      if (key === 'locations') {
        acc[key] = value.sort((a, b) => defaultCompare(a.value, b.value))
        return acc
      }
    }
    acc[key] = value
    return acc
  }, {})
}

function sortASTNodes (astNodes) {
  return sortDefinitions(astNodes).map(sortDefinitionNode)
}

module.exports = sortASTNodes
