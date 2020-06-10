module.exports = {
  // TODO: make this `lint:fix` if ever added to `pre-commit`
  // using in `commit-msg` doesn't save fixed changes so
  // in the meantime should error on bad linting when committing
  '*.{js,ts,tsx}': ['yarn lint'],
};
