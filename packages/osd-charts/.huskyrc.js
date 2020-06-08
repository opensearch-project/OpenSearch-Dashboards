module.exports = {
  hooks: {
    'commit-msg': 'commitlint -E HUSKY_GIT_PARAMS && yarn typecheck:all && yarn pq && lint-staged',
  },
};
