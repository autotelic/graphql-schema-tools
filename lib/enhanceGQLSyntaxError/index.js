const minifyGQLSource = require('../minifyGQLSource')

function enhanceGQLSyntaxError (gqlError) {
  const { source, locations } = gqlError
  if (locations && source) {
    const { line, column } = locations[0]
    const splitSourceLines = source.body.split('\n')
    const preErrorLines = splitSourceLines.slice(0, line - 1).join(' ')
    const errorLine = splitSourceLines[line - 1].split(' ').slice(0, column).join(' ')
    const minifySplit = minifyGQLSource(preErrorLines.concat(errorLine)).split(' ')

    const formattedSnippet = minifySplit[minifySplit.length - 1]
      .replace(/:/g, ': ')
      .replace(/{/g, ' { ')
      .replace(/}/g, ' } ')
      .replace(/\s+/g, ' ')
      .trim()

    gqlError.message = `${gqlError.message} Found near: \`${formattedSnippet}\`.`
  }

  return gqlError
}

module.exports = enhanceGQLSyntaxError
