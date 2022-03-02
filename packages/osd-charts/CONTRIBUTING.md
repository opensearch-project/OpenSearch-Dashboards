## Contributing to Elastic Charts

🙌 Thanks for your interest in contributing to Elastic Charts! 🙌

### General good practices

- All commits must follow the [conventional commits](https://www.conventionalcommits.org/en/v1.0.0-beta.2/)
- [semantic-release](https://semantic-release.gitbook.io) is used as an automated release manager suite.
  This will automatically publish on NPM on every push on master, will automatically create the changelog and bump the correct semver depending on the commits. To avoid too many new releases, especially in this initial phase of the project, we are going to work against a `dev` branch and then merge on master periodically.
- Every commit count in the version bump: this means that we can merge a PR with two methods:
  - merge all the PR commit history (please follow the commit convention or squash partial commits)
  - squash and merge all commits using a single commit that follows the conventions.

The following tools are used to ensure this convention:

- `commitlint` hook ensure that you are following correctly the convention,
- `yarn cz` can be used to start `commitizen` as a cli tool that prompts you with selections and questions to help you in writing a conventional commit.

### PR reviews

These are the best practices we are currently following during a PR review

### Fixing a review comment

When fixing a comment, use meaningful titles in commits and avoid abstract descriptions whenever possible: a commit like `fix: PR review comments` should be avoided. A meaningful title/description helps other reviewers too.

### Reply to a review comment

If the reviewer left a comment on a line/file, please reply to that comment adding a link to the fixing **commit hash** like `fixed in b7f0cb4`
Leave the comment **unresolved** and let the reviewer marks it as resolved. This will allow double-checking the fix by the reviewer keeping the discussion open if required.

### GitHub Suggestions

Whenever possible, avoid clicking on `commit suggestion`. The only reasonable case for committing directly a suggestion is on textual changes like in a JSDoc comment or a MarkDown file.
Take every **suggestion** as they are: **suggestions**. Consider that a suggestion may only partially cover the required changes in the file.


### Squash and merge your PR

When everything is marked as resolved and the reviewers mark your PR as approved, please **double-check the squash and merge commit message AND its description**.
Both fields should adhere to used [conventional commits](https://www.conventionalcommits.org/en/v1.0.0-beta.2/) standard.
To quickly summarize the standard:
- the **title** should be in the form of
```
<type>[optional scope]: <description>
```
- the **description** should be in the form of
```
[optional body]

[optional footer(s)]
```
Where the **body** should contain a meaningful description of your PR, usually a reviewed version of the GitHub PR description. It can contain multiple paragraphs or bullet points and can use MarkDown syntax.

If your PR contains breaking changes, please include a paragraph starting with `BREAKING CHANGE: `
(text BREAKING CHANGE, followed by a colon, space, and description). Include this section after the body leaving a blank line in between.

If your PR fix or close any issue, please include in the footer a paragraph that list all the fixed in the following way `fix #123, close #111`. Include this section after the BREAKING CHANGE section if any or anyway after the body, leaving a blank line in between.

This is an example that cover all cases:

```
feat(brush): add multi axis brushing (#625)

This commit allows the consumer to configure the direction used for the brush tool. The direction is, by default, along the X-axis, but can be changed to be along the Y-axis or have a rectangular selection along both axes.
For each Y-axis defined (usually determined by an associated `groupId`) we return a scaled set of `[min, max]` values.

BREAKING CHANGE: The type used by the `BrushEndListener` is now in the following form `{ x?: [number, number]; }` where `x` contains an array of `[min, max]` values, and the  `y` property is an optional array of objects, containing the `GroupId` and the values of the brush for that specific axis.

fix #587, fix #620

Signed-off-by: name 1 <email1@email1.com>
Co-authored-by: name 2 <email2@email2.com>

```

The main reason for this practice is that the commit history is used to automatically generate the CHANGELOG file and to automatically and semantically bump the library version depending on these commits.


## Backporting

In rare cases we may need to patch an existing version of elastic-charts where we are unable to upgrade to the latest master version. In this case we can use the backport npm package, as used in Kibana.

> Before being able to use the backport cli you must setup you [global config](https://github.com/sqren/backport/blob/master/docs/configuration.md#global-config-backportconfigjson) under `~/.backport/config.json`

To backport a version you should first create the *remote* branch for the target version. For example, if I wanted to target `15.x` with a new feature but master is on `16.x.x`, I would create the branch `15.x` from the latest `v15.x.x` tag, let's say it's `15.4.2`.

```bash
git checkout -b 15.x v15.4.2
git push <Upstream remote> # must push to remote fork!

# where
git checkout -b <New Branch Name> <TAG Name>
```

> The branch name should follow the [maintenance branch convention](https://github.com/semantic-release/semantic-release/blob/0785a844fa8ac1320383452ce531898be3b01f92/docs/recipes/maintenance-releases.md#publishing-maintenance-releases) of `semantic-release`.
> (e.g. `N.N.x` or `N.x.x` or `N.x` with `N` being a `number`)

From there, run the backport command and follow cli prompts to select code, targets, etc. in which to backport. You may want to use the [cli arguments](https://github.com/sqren/backport/blob/master/README.md#cli-arguments) to simplify the selection.

```bash
# use cli to select commit to backport
yarn backport --branch 15.x
yarn backport --branch <New Branch Name>

# specify the pr number to backport
yarn backport --branch 15.x --pr 1000
yarn backport --branch <New Branch Name> --pr <PR number to backport>
```

> The first time this is run it will fork the repo locally to `~./.backport/repositories/elastic/elastic-charts`
>
> If there are any conflicts with the backport you will need to address those merge conflicts in this *backport* fork, *NOT* your main fork.

This will automatically generate a pr to merge into the target branch. Once the pr is merged the ci will trigger the release of the package version according to the [conventional commit](https://www.conventionalcommits.org/en/v1.0.0-beta.2/) syntax. This is subject to [restrictions](https://semantic-release.gitbook.io/semantic-release/usage/workflow-configuration#pushing-to-a-maintenance-branch) from existing branches, tags and version.

> Note: The version will __ONLY__ be published from branches following the [maintenance branch convention](https://github.com/semantic-release/semantic-release/blob/0785a844fa8ac1320383452ce531898be3b01f92/docs/recipes/maintenance-releases.md#publishing-maintenance-releases)

## Linking to Kibana

To link `@elastic/charts` to kibana we need to perform a few workarounds. Fortunately, this is done automatically by a custom built linking scripts.

## Before linking
Before you link kibana be sure to have a kibana instance up and running locally and pointing at whatever elasticsearch cluster you want.

> Note: ⚠️ Make sure that there is no `@elastic/charts` directory within the kibana `kbn-ui-shared-deps` directory (i.e. `<path_to_kibana>/packages/kbn-ui-shared-deps/node_modules/@elastic/charts` should not exist). If this does exist please delete it and run `yarn kbn bootstrap --no-cache` then restart kibana. The issue is that this package should be hoisted to the top-level `node_modules`, if it is not at the top-level the linking will update the wrong package and not work properly.

### Linking

In order to create link run...

```
yarn link:kibana
```

This will prompt you for the following inputs:

- Select the `Link` action
- Select the path to kibana (default: `../kibana`)
- Confirm kibana is running

The reset is handled automatically! If any errors occur in the build method, they will be surfaced in the terminal and pause the build process until corrected.

If you encounter and issue or close the watch mode following the linking process, you can run the script is watch mode. Do so by running...

```
yarn link:kibana
```

- Select the `Watch mode` action

### Unlinking

In order to remove the link and restore kibana to state prior to linking, run...

```
yarn link:kibana
```

- Select the `Unlink` action
