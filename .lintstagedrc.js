module.exports = {
  '*.js': ['prettier-eslint --write', 'eslint'],
  '*.ts': ['prettier-eslint --write', () => 'mocha src/test', 'eslint'],
  '*.json': ['prettier --write'],
  '*.md': ['prettier --write'],
}
