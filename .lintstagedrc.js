module.exports = {
  '*.js': ['prettier-eslint --write', 'jest --findRelatedTests', 'eslint'],
  '*.json': ['prettier --write'],
  '*.md': ['prettier --write'],
}
