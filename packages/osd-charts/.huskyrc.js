const tasks = (arr) => arr.join(' && ');

module.exports = {
  hooks: {
    'commit-msg': 'commitlint -E HUSKY_GIT_PARAMS && yarn typecheck:all && yarn pq && yarn lint --cache',
  },
};
