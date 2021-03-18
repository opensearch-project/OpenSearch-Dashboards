# OpenSearch Dashboards-related packages

This folder contains packages that are intended for use in OpenSearch Dashboards and OpenSearch Dashboards
plugins.

tl;dr:

- Don't publish to npm registry
- Always use the `@osd` namespace
- Always set `"private": true` in `package.json`

## Using these packages

We no longer publish these packages to the npm registry. Now, instead of
specifying a version when including these packages, we rely on yarn workspaces,
which sets up a symlink to the package.

For example if you want to use the `@osd/i18n` package in OpenSearch Dashboards itself, you
can specify the dependency like this:

```
"@osd/i18n": "1.0.0"
```

However, if you want to use this from a OpenSearch Dashboards plugin, you need to use a `link:`
dependency and account for the relative location of the OpenSearch Dashboards repo, so it would
instead be:

```
"@osd/i18n": "link:../../opensearch-dashboards/packages/osd-i18n"
```

How all of this works is described in more detail in the
[`@osd/pm` docs](./osd-pm#how-it-works).

## Creating a new package

Create a new sub-folder. The name of the folder should mirror the `name` in the
package's `package.json`. E.g. if the name is `@osd/i18n` the folder name
should be `osd-i18n`.

All new packages should use the `@osd` namespace, and should be marked with
`"private": true`.

## Unit tests for a package

Currently there are two patterns used to test packages, one using Mocha and one using Jest. These patterns emerged out of convention and we'd like to make them more similar to each other in the near future.

### 1. Mocha
Today a package can follow the pattern of having a `__tests__` directory in each source code directory of a package which contains the tests for that module. These are usually run by Mocha.

If a package's tests should be run with Mocha, you'll have to opt-in to run them by appending the package's test file pattern(s) to OpenSearch Dashboards's `src/dev/mocha/run_mocha_cli.js` file. These will then be run by the unit test runner.

* `yarn test` or `yarn grunt test` runs all unit tests.
* `node scripts/mocha` runs all Mocha tests.

### 2. Jest
A package can also follow the pattern of having `.test.js` files as siblings of the source code files, and these run by Jest.

A package using the `.test.js` naming convention will have those tests automatically picked up by Jest and run by the unit test runner, currently mapped to the OpenSearch Dashboards `test` script in the root `package.json`.

* `yarn test` or `yarn grunt test` runs all unit tests.
* `node scripts/jest` runs all Jest tests in OpenSearch Dashboards.

----
Each package can also specify its own `test` script in the package's `package.json`, for cases where you'd prefer to run the tests from the local package directory.
