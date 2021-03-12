function minifyGQLSource (source) {
  return source.split('\n').join(' ').split(' ').reduce((acc, str) => {
    if (str !== '') {
      return acc.concat(' ' + str).replace(/\s+(?=[{}:,])|(?<=[{}:,])\s+/, '')
    }
    return acc
  }, '').trim()
}

module.exports = minifyGQLSource
