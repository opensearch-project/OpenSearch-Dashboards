const isDryRun = process.argv.includes('--dry-run');

/**
 * Semantic release is currently a 1:1 relationship between repo and package.
 * This is fine for our use case as we currently only publish a single package.
 * In the future if/when we publish more than one package we would need to switch
 * to another similar release framework.
 *
 * see https://github.com/semantic-release/semantic-release/issues/193
 */
module.exports = {
  plugins: [
    '@semantic-release/commit-analyzer',
    '@semantic-release/release-notes-generator',
    '@semantic-release/changelog',
    '@semantic-release/github',
    [
      '@semantic-release/npm',
      {
        // must point to the child package
        pkgRoot: 'packages/charts',
      },
    ],
    '@semantic-release/git',
    ...(isDryRun
      ? []
      : [
          'semantic-release-slack-bot',
          {
            notifyOnSuccess: true,
            notifyOnFail: true,
            markdownReleaseNotes: true,
          },
        ]),
  ],
};
