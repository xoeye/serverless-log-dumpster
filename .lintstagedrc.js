module.exports = {
  '*.js': ['prettier-eslint --write', 'mocha', 'eslint'],
  '*.json': ['prettier --write'],
  '*.md': ['prettier --write'],
}
