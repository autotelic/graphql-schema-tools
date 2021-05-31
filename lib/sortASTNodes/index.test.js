const { test } = require('tap')
const sortASTNodes = require('.')

test('sortASTNodes - unexpected keys and values', async ({ same }) => {
  const nodes = [
    { foo: [], bar: undefined }
  ]

  same(sortASTNodes(nodes), nodes, 'unexpected keys and values should remain unchanged')
})
