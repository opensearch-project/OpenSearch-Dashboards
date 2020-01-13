## Contributing to Elastic Charts

🙌 Thanks for your interest in contributing to Elastic Charts! 🙌

We are trying to enforce some good practices in this library:

- All commits must follow the [conventional commits](https://www.conventionalcommits.org/en/v1.0.0-beta.2/)
- [semantic-release](https://semantic-release.gitbook.io) is used as an automated release manager suite.
  This will automatically publish on NPM on every push on master, will automatically create the changelog and bump the correct semver depending on the commits. To avoid too many new releases, especially in this initial phase of the project, we are going to work against a `dev` branch and then merge on master periodically.
- Every commit count in the version bump: this means that we can merge a PR with two methods:
  - merge all the PR commit history (please follow the commit convention or squash partial commits)
  - squash and merge all commits using a single commit that follows the conventions.

The following tools are used to ensure this convention:

- `commitlint` hook ensure that you are following correctly the convention,
- `yarn cz` can be used to start `commitizen` as a cli tool that prompts you with selections and questions to help you in writing a conventional commit.

## Backporting

In rare cases we may need to patch an existing version of elastic-charts where we are unable to upgrade to the latest master version. In this case we can use the backport npm package, as used in kibana.

> Before being able to use the backport cli you must setup you [global config](https://github.com/sqren/backport/blob/master/docs/configuration.md#global-config-backportconfigjson) under `~/.backport/config.json`

To backport a version you should first create the *remote* branch for the target verion. For example, if I wanted to target `15.x` with a new feature but master is on `16.x.x`, I would create the branch `15.x` from the latest `v15.x.x` tag, let's say it's `15.4.2`.

```bash
git checkout -b 15.x v15.4.2
git push <Upstream remote> # must push to remote fork!

# where
git checkout -b <New Branch Name> <TAG Name>
```

Once you have the new branch added to `elastic/elastic-charts` add the new branch to `branches` in [`.backportrc.json`](.backportrc.json). The branch name should follow the [maintenance branch convention](https://github.com/semantic-release/semantic-release/blob/0785a844fa8ac1320383452ce531898be3b01f92/docs/recipes/maintenance-releases.md#publishing-maintenance-releases) of `semantic-release`.

> `N.N.x` or `N.x.x` or `N.x` with `N` being a `number`

From there, run the backport command and follow cli prompts to select code, targets, etc. in which to backport. You may want to use the [cli arguments](https://github.com/sqren/backport/blob/master/README.md#cli-arguments) to simplify the selection.

```bash
yarn backport
```

> The first time this is run it will fork the repo locally to `~./.backport/repositories/elastic/elastic-charts`
>
> If there are any conflicts with the backport you will need to address those merge conflicts in this *backport* fork, *NOT* your main fork.

This will automatically generate a pr to merge into the target branch. Once the pr is merged the ci will trigger the release of the package version according to the [conventional commit](https://www.conventionalcommits.org/en/v1.0.0-beta.2/) syntax. This is subject to [restrictions](https://semantic-release.gitbook.io/semantic-release/usage/workflow-configuration#pushing-to-a-maintenance-branch) from existing branches, tags and version.

> Note: The version will __ONLY__ be published from branches following the [maintenance branch convention](https://github.com/semantic-release/semantic-release/blob/0785a844fa8ac1320383452ce531898be3b01f92/docs/recipes/maintenance-releases.md#publishing-maintenance-releases)
