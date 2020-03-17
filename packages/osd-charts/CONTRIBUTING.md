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

## Linking to Application

There are two ways to "link" a local version of `@elastic/charts` to your application. The following examples have steps that are kibana-specific denoted with ☈.

### Package library and install in app

Easy but time-consuming in terms of repeated runs.
1. Run `npm pack` from `@elastic/charts` root to package the library into a gzip file
1. Locate the full path the the gzip file, typically at the same level of the target library `package.json`
1. Run `yarn add <PATH_TO_GZIP>` from kibana. This will install `@elastic/charts` using that version not the one from the package.json.

Notice that you would need to repeat all these steps for any changes in charts to be reflected in kibana.

> If running repeated runs and you notice changes not being updated after a new install you _may_ need to increment the `@elastic/charts` version for kibana/npm/??? to pick up the changes. This should NOT be commited.

#### Uninstalling
1. Reset changes to `package.json`.
1. Run `yarn kbn bootstrap` ☈. Or `yarn install --force`

### Symlink the library and build in watch mode

The second is a little trickier but the preferred option, especially for debugging.

1. Run `yarn build:watch` from `@elastic/charts`. This builds the scss and other files and then will _watch_ for changes in typescript files and recompile. If you don't run watch and try to rebuild after each change the link _may_ break.
1. ☈ In kibana there is a package called [`@kbn/ui-shared-deps`](https://github.com/elastic/kibana/tree/master/packages/kbn-ui-shared-deps) that optimizes importing shared modules. This causes a _lot_ of complications when linking. The easiest way to fix this is to just remove any and all references of `@elastic/charts` in this directory and then run `yarn kbn bootstrap`.
1. Run `yarn link @elastic/charts` in kibana.
1. If you application uses react hooks, you must link your application react module to `@elastic/charts`. The issue with react hooks is that react requires there only be a single instance of react. This should be solved in your app at build time using yarn [resolutions](https://classic.yarnpkg.com/en/docs/selective-version-resolutions/) to resolve any differing version in the dependency tree to a single version of react. But when symlinking the local `@elastic/charts`, `@elastic/charts` is still using `@elastic/charts/node_modules/react` and not `<PATH_TO_APP>/node_modules/react`. To fix this you need to run `npm link <PATH_TO_APP>/node_modules/react` from `@elastic/charts`. Now elastic-charts and kibana will be using the same instance of react.
1. At this point you can make changes to `@elastic/charts` wait for the new hash to complete and refresh the application to see the changes, it does _not_ hot reload.

#### Unlinking

1. Remove react symlink by running `npm unlink <PATH_TO_APP>/node_modules/react` from `@elastic/charts`.
1. Run `yarn unlink @elastic/charts` in kibana.
1. ☈ Restore changes to [`@kbn/ui-shared-deps`](https://github.com/elastic/kibana/tree/master/packages/kbn-ui-shared-deps)
1. For good measure, delete `@elastic/charts` in kibana `node_modules`. Run `rm -fr <PATH_TO_APP>/node_modules/@elastic/charts`.
1. Run `yarn kbn bootstrap` ☈. Or `yarn install --force`
