const tasks = (arr) => arr.join(' && ');

module.exports = {
  hooks: {
    'pre-commit': tasks([
      'pretty-quick --staged',
      'yarn run typecheck:all',
      'yarn run lint',
      'yarn run test',
      'yarn run test:tz',
    ]),
    'commit-msg': 'commitlint -E HUSKY_GIT_PARAMS',
  },
};
