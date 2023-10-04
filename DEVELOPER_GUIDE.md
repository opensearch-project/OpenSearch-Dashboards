<p align="center"><img src="https://opensearch.org/assets/brand/SVG/Logo/opensearch_dashboards_logo_darkmode.svg" height="64px"/></p>
<h1 align="center">OpenSearch Dashboards Developer Guide</h1>

This guide applies to all development within the OpenSearch Dashboards project and is recommended for the development of all OpenSearch Dashboards plugins.

- [Getting started guide](#getting-started-guide)
  - [Key technologies](#key-technologies)
  - [Prerequisites](#prerequisites)
  - [Fork and clone OpenSearch Dashboards](#fork-and-clone-opensearch-dashboards)
  - [Bootstrap OpenSearch Dashboards](#bootstrap-opensearch-dashboards)
  - [Run OpenSearch](#run-opensearch)
  - [Run OpenSearch Dashboards](#run-opensearch-dashboards)
  - [Next Steps](#next-steps)
- [Alternative development installations](#alternative-development-installations)
  - [Optional - Run OpenSearch with plugins](#optional---run-opensearch-with-plugins)
  - [Alternative - Run OpenSearch from tarball](#alternative---run-opensearch-from-tarball)
  - [Configure OpenSearch Dashboards for security](#configure-opensearch-dashboards-for-security)
- [Building artifacts](#building-artifacts)
  - [Building the Docker image](#building-the-docker-image)
- [Code guidelines](#code-guidelines)
  - [General](#general)
  - [HTML](#html)
  - [SASS files](#sass-files)
  - [TypeScript/JavaScript](#typescriptjavascript)
  - [React](#react)
  - [API endpoints](#api-endpoints)

## Getting started guide

This guide is for any developer who wants a running local development environment where you can make, see, and test changes. It's opinionated to get you running as quickly and easily as possible, but it's not the only way to set up a development environment.

If you're only interested in installing and running this project, please see the [Installing OpenSearch Dashboards](https://opensearch.org/docs/latest/install-and-configure/install-dashboards) instead.

If you're planning to contribute code (features or fixes) to this repository, great! Make sure to also read the [contributing guide](CONTRIBUTING.md).

### Key technologies

OpenSearch Dashboards is primarily a Node.js web application built using React. To effectively contribute you should be familiar with HTML ([usage guide](#html)), SASS styling ([usage guide](#sass-files)), TypeScript and JavaScript ([usage guide](#typescriptjavascript)), and React ([usage guide](#react)).

### Prerequisites

To develop on OpenSearch Dashboards, you'll need:

- A [GitHub account](https://docs.github.com/en/get-started/onboarding/getting-started-with-your-github-account)
- [`git`](https://git-scm.com/) for version control
- [`Node.js`](https://nodejs.org/), [`npm`](https://www.npmjs.com/), and [`Yarn`](https://yarnpkg.com/) for building and running the project
- A code editor of your choice, configured for JavaScript/TypeScript. If you don't have a favorite editor, we suggest [Visual Studio Code](https://code.visualstudio.com/)

If you already have these installed or have your own preferences for installing them, skip ahead to the [Fork and clone OpenSearch Dashboards](#fork-and-clone-opensearch-dashboards) section.

#### Install `git`

If you don't already have it installed (check with `git --version`) we recommend following the [the `git` installation guide for your OS](https://git-scm.com/downloads).

#### Install `node`

We recommend using [Node Version Manager (nvm)](https://github.com/nvm-sh/nvm) to install and manage different node versions, which may differ between release branches.

1. Install nvm (as specified by the [`nvm` README](https://github.com/nvm-sh/nvm#installing-and-updating)): `curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.3/install.sh | bash`
2. Install the version of the Node.js runtime defined in [`.nvmrc`](https://github.com/opensearch-project/OpenSearch-Dashboards/blob/main/.nvmrc): `nvm install`

If it's the only version of node installed, it will automatically be set to the `default` alias. Otherwise, use `nvm list` to see all installed `node` versions, and `nvm use` to select the node version required by OpenSearch Dashboards.

#### Install `yarn`

OpenSearch Dashboards is set up using yarn, which can be installed through corepack. To install yarn, run:

```bash
$ # Update corepack to the latest version
$ npm i -g corepack

$ # Install the correct version of yarn
$ corepack install
```

(See the [corepack documentation](https://github.com/nodejs/corepack#-corepack) for more information.)

### Fork and clone OpenSearch Dashboards

All local development should be done in a [forked repository](https://docs.github.com/en/get-started/quickstart/fork-a-repo).
Fork OpenSearch Dashboards by clicking the "Fork" button at the top of the [GitHub repository](https://github.com/opensearch-project/OpenSearch-Dashboards).

Clone your forked version of OpenSearch Dashboards to your local machine (replace `opensearch-project` in the command below with your GitHub username):

```bash
$ git clone git@github.com:opensearch-project/OpenSearch-Dashboards.git
```

### Bootstrap OpenSearch Dashboards

If you haven't already, change directories to your cloned repository directory:

```bash
$ cd OpenSearch-Dashboards
```

The `osd bootstrap` command will install the project's dependencies and build all internal packages and plugins. Bootstrapping is necessary any time you need to update packages, plugins, or dependencies, and it's recommended to run it anytime you sync with the latest upstream changes.

```bash
$ yarn osd bootstrap
```

Note: If you experience a network timeout while bootstrapping:

```
| There appears to be trouble with your network connection. Retrying...
```

You can run command with —network-timeout flag:

```
$ yarn osd bootstrap —network-timeout 1000000
```

Or use the timeout by configuring it in the [`.yarnrc`](https://github.com/opensearch-project/OpenSearch-Dashboards/blob/main/.yarnrc). For example:

```
network-timeout 1000000
```

If you've previously bootstrapped the project and need to start fresh, first run:

```bash
$ yarn osd clean
```

### Run OpenSearch

OpenSearch Dashboards requires a running version of OpenSearch to connect to. In a separate terminal you can run the latest snapshot built using:

_(Linux, Windows, Darwin (MacOS) only - for others, you'll need to [set up using Docker](https://github.com/opensearch-project/OpenSearch-Dashboards/blob/main/docs/docker-dev/docker-dev-setup-manual.md) or [run OpenSearch from a tarball](#alternative---run-opensearch-from-tarball) instead)_

```bash
$ yarn opensearch snapshot
```

### Run OpenSearch Dashboards

_**Warning:** Starting the OpenSearch Dashboards instance before the OpenSearch server is fully initialized can cause Dashboards to misbehave. Ensure that the OpenSearch server instance is up and running first. You can validate by running `curl localhost:9200` in another console tab or window (see [OpenSearch developer guide](https://github.com/opensearch-project/OpenSearch/blob/main/DEVELOPER_GUIDE.md#run-opensearch))._

Start the OpenSearch Dashboards development server:

```bash
$ yarn start
```

When the server is up and ready (the console messages will look something like this),

```
[info][listening] Server running at http://localhost:5603/pgt
[info][server][OpenSearchDashboards][http] http server running at http://localhost:5603/pgt
```

click on the link displayed in your terminal to
access it.

Note - it may take a couple minutes to generate all the necessary bundles. If the Dashboards link is not yet accessible, wait for a log message like

```
[success][@osd/optimizer] 28 bundles compiled successfully after 145.9 sec, watching for changes
```

Note: If you run a docker image, an error may occur:

```
Error: max virtual memory areas vm.max_map_count [65530] is too low, increase to at least [262144]
```

This error is because there is not enough memory so more memory must be allowed to be used:

```
$ sudo sysctl -w vm.max_map_count=262144
```

For windows:

```
$ wsl -d docker-desktop
$ sysctl -w vm.max_map_count=262144
```
### Next Steps

Now that you have a development environment to play with, there are a number of different paths you may take next.

#### Learn about the OpenSearch Dashboards architecture and plugins

- [Introduction to OpenSearch Dashboards Plugins](https://opensearch.org/blog/dashboards-plugins-intro/) blog post
- [OpenSearch Dashboards plugin user documentation](https://opensearch.org/docs/latest/install-and-configure/install-dashboards/plugins/) (install, update, and remove)
- Much of the technical architectural information about the plugin system is located in `/src/core`
  - [README](https://github.com/opensearch-project/OpenSearch-Dashboards/blob/main/src/core/README.md)
  - [Plugin principles](https://github.com/opensearch-project/OpenSearch-Dashboards/blob/main/src/core/PRINCIPLES.md)
  - [Plugin conventions](https://github.com/opensearch-project/OpenSearch-Dashboards/blob/main/src/core/CONVENTIONS.md#technical-conventions)
  - [Plugin testing](https://github.com/opensearch-project/OpenSearch-Dashboards/blob/main/src/core/TESTING.md)

#### Review user tutorials to understand the key features and workflows

- The [Quickstart guide for OpenSearch Dashboards](https://opensearch.org/docs/latest/dashboards/quickstart-dashboards/) will show you how to explore, inspect, and visualize sample data
- [Running queries in the Dev Tools Console](https://opensearch.org/docs/latest/dashboards/run-queries/) provides helpful guidance on how to interact with OpenSearch

#### Explore essential plugins and APIs

The easiest way to understand some of the essential plugins and APIs is to run OpenSearch Dashboards with [developer examples](https://github.com/opensearch-project/OpenSearch-Dashboards/blob/main/examples/) turned on:

```bash
$ yarn start --run-examples
```

#### Review code guidelines and conventions

- [Project code guidelines](#code-guidelines)
- [Project testing guidelines](https://github.com/opensearch-project/OpenSearch-Dashboards/blob/main/TESTING.md)
- [Plugin conventions](https://github.com/opensearch-project/OpenSearch-Dashboards/blob/main/src/core/CONVENTIONS.md#technical-conventions)

## Alternative development installations

Although the [getting started guide](#getting-started-guide) covers the recommended development environment setup, there are several alternatives worth being aware of.

### Optional - Run OpenSearch with plugins

By default, the snapshot command will run [a minimal distribution of OpenSearch](https://opensearch.org/downloads.html#minimal), with no plugins installed.

If you would like to run OpenSearch with a particular plugin installed on the cluster snapshot, pass the `--P` flag after `yarn opensearch snapshot`. You can use the flag multiple times to install multiple plugins. The argument value can be a URL to the plugin's zip file, maven coordinates of the plugin, or a local zip file path (use `file://` followed by the absolute or relative path, in that case). For example:

_(Linux, Windows, Darwin (MacOS) only - for others, you'll need to [run OpenSearch from a tarball](#alternative---run-opensearch-from-tarball) instead)_

```bash
$ yarn opensearch snapshot --P https://repo1.maven.org/maven2/org/opensearch/plugin/opensearch-test-plugin/2.4.0.0/opensearch-test-plugin-2.4.0.0.zip
```

Note - if you add the [`security` plugin](https://github.com/opensearch-project/security), you'll also need to [configure OpenSearch Dashboards for security](#configure-opensearch-dashboards-for-security).

#### Other snapshot configuration options

Additional options can be passed after `yarn opensearch snapshot` to further configure the cluster snapshot.

Options:

      --license         Run with a 'oss', 'basic', or 'trial' license [default: oss]
      --version         Version of OpenSearch to download [default: 3.0.0}]
      --base-path       Path containing cache/installations [default: /home/ubuntu/OpenSearch-Dashboards/.opensearch]
      --install-path    Installation path, defaults to 'source' within base-path
      --data-archive    Path to zip or tarball containing an OpenSearch data directory to seed the cluster with.
      --password        Sets password for opensearch user [default: changeme]
      -E                Additional key=value settings to pass to OpenSearch
      --download-only   Download the snapshot but don't actually start it
      --ssl             Sets up SSL on OpenSearch
      --P               OpenSearch plugin artifact URL to install it on the cluster.

```bash
$ yarn opensearch snapshot --version 2.2.0 -E cluster.name=test -E path.data=/tmp/opensearch-data --P org.opensearch.plugin:test-plugin:2.2.0.0 --P file:/home/user/opensearch-test-plugin-2.2.0.0.zip
```

### Alternative - Run OpenSearch from tarball

If you would like to run OpenSearch from the tarball, you'll need to download the minimal distribution, install it, and then run the executable. (You'll also need Java installed and the `JAVA_HOME` environmental variable set - see [OpenSearch developer guide](https://github.com/opensearch-project/OpenSearch/blob/main/DEVELOPER_GUIDE.md#install-prerequisites) for details).

1. Download the latest minimal distribution of OpenSearch from [the downloads page](https://opensearch.org/downloads.html#minimal). Note the version and replace in commands below.
2. Unzip the `tar.gz` file: `tar -xvf opensearch-<OpenSearch-version>-linux-x64.tar.gz`
3. Change directory: `cd opensearch-<OpenSearch-version>`
4. Run the cluster: `./bin/opensearch`

Note - OpenSearch and OpenSearch Dashboards must have matching version strings. Because the tarball is the latest _released_ version of OpenSearch, it's likely behind the version on the `main` branch of OpenSearch Dashboards, which is generally set to the next upcoming major release. So to work from main, update [the OpenSearch Dashboards version in `package.json`](https://github.com/opensearch-project/OpenSearch-Dashboards/blob/main/package.json#L14) to match the OpenSearch version running.

This method can also be used to develop against the [full distribution of OpenSearch](https://opensearch.org/downloads.html#opensearch) instead. In that case, you'll also need to [configure OpenSearch Dashboards for security](#configure-opensearch-dashboards-for-security).

### Configure OpenSearch Dashboards for security

_This step is only mandatory if you have the [`security` plugin](https://github.com/opensearch-project/security) installed on your OpenSearch cluster with https/authentication enabled._

Once the bootstrap of OpenSearch Dashboards is finished, you need to apply some
changes to the default [`opensearch_dashboards.yml`](https://github.com/opensearch-project/OpenSearch-Dashboards/blob/main/config/opensearch_dashboards.yml#L25-L72) in order to connect to OpenSearch.

```yml
opensearch.hosts: ["https://localhost:9200"]
opensearch.username: "admin" # Default username on the docker image
opensearch.password: "admin" # Default password on the docker image
opensearch.ssl.verificationMode: none
```

For more detailed documentation, see [Configure TLS for OpenSearch Dashboards](https://opensearch.org/docs/latest/install-and-configure/install-dashboards/tls).

## Building artifacts

To build the artifacts for all supported platforms, run the following:

```
yarn build --skip-os-packages
```

If you want to build a specific platform, pass the platform flag after `yarn build-platform`. For example, to build darwin x64, run the following:

```
yarn build-platform --darwin
```

You could pass one or multiple flags. If you don't pass any flag, `yarn build-platform` will build an artifact based on your local environment.

Currently, the supported flags for this script are:

- `darwin` (builds Darwin x64)
- `linux` (builds Linux x64)
- `linux-arm` (builds Linux ARM64).
- `windows` (builds Windows x64)

If you would like to build only a DEB x64 artifact, run the following:

```
yarn build --deb --skip-archives
```

If you would like to build only a DEB ARM64 artifact, run the following:

```
yarn build --deb-arm --skip-archives
```

If you would like to build only a RPM x64 artifact, run the following:

```
yarn build --rpm --skip-archives
```

If you would like to build only a RPM ARM64 artifact, run the following:

```
yarn build --rpm-arm --skip-archives
```

### Building the Docker image

To build the Docker image, run the following:

```
yarn osd bootstrap
yarn build --docker
```

## Code guidelines

### General

#### Filenames

All filenames should use `snake_case`.

**Right:** `src/opensearch-dashboards/index_patterns/index_pattern.js`

**Wrong:** `src/opensearch-dashboards/IndexPatterns/IndexPattern.js`

#### Do not comment out code

We use a version management system. If a line of code is no longer needed,
remove it, don't simply comment it out.

#### Prettier and linting

We are gradually moving the OpenSearch Dashboards code base over to Prettier. All TypeScript code
and some JavaScript code (check `.eslintrc.js`) is using Prettier to format code. You
can run `node script/eslint --fix` to fix linting issues and apply Prettier formatting.
We recommend you to enable running ESLint via your IDE.

Whenever possible we are trying to use Prettier and linting over written developer guide rules.
Consider every linting rule and every Prettier rule to be also part of our developer guide
and disable them only in exceptional cases and ideally leave a comment why they are
disabled at that specific place.

### HTML

This part contains developer guide rules around general (framework agnostic) HTML usage.

#### Camel case `id` and `data-test-subj`

Use camel case for the values of attributes such as `id` and `data-test-subj` selectors.

```html
<button id="veryImportantButton" data-test-subj="clickMeButton">Click me</button>
```

The only exception is in cases where you're dynamically creating the value, and you need to use
hyphens as delimiters:

```jsx
buttons.map(btn => (
  <button
    id={`veryImportantButton-${btn.id}`}
    data-test-subj={`clickMeButton-${btn.id}`}
  >
    {btn.label}
  </button>
)
```

#### Capitalization in HTML and CSS should always match

It's important that when you write CSS/SASS selectors using classes, IDs, and attributes
(keeping in mind that we should _never_ use IDs and attributes in our selectors), that the
capitalization in the CSS matches that used in the HTML. HTML and CSS follow different case sensitivity rules, and we can avoid subtle gotchas by ensuring we use the
same capitalization in both of them.

#### How to generate ids?

When labeling elements (and for some other accessibility tasks) you will often need
ids. Ids must be unique within the page i.e. no duplicate ids in the rendered DOM
at any time.

Since we have some components that are used multiple times on the page, you must
make sure every instance of that component has a unique `id`. To make the generation
of those `id`s easier, you can use the `htmlIdGenerator` service in the `@elastic/eui`.

A React component could use it as follows:

```jsx
import { htmlIdGenerator } from '@elastic/eui';

render() {
  // Create a new generator that will create ids deterministic
  const htmlId = htmlIdGenerator();
  return (<div>
    <label htmlFor={htmlId('agg')}>Aggregation</label>
    <input id={htmlId('agg')}/>
  </div>);
}
```

Each id generator you create by calling `htmlIdGenerator()` will generate unique but
deterministic ids. As you can see in the above example, that single generator
created the same id in the label's `htmlFor` as well as the input's `id`.

A single generator instance will create the same id when passed the same argument
to the function multiple times. But two different generators will produce two different
ids for the same argument to the function, as you can see in the following example:

```js
const generatorOne = htmlIdGenerator();
const generatorTwo = htmlIdGenerator();

// Those statements are always true:
// Same generator
generatorOne('foo') === generatorOne('foo');
generatorOne('foo') !== generatorOne('bar');

// Different generator
generatorOne('foo') !== generatorTwo('foo');
```

This allows multiple instances of a single React component to now have different ids.
If you include the above React component multiple times in the same page,
each component instance will have a unique id, because each render method will use a different
id generator.

You can also use this service outside of React.

### SASS files

When writing a new component, create a sibling SASS file of the same name and import directly into the **top** of the JS/TS component file. Doing so ensures the styles are never separated or lost on import and allows for better modularization (smaller individual plugin asset footprint).

All SASS (.scss) files will automatically build with the [EUI](https://elastic.github.io/eui/#/guidelines/sass) & OpenSearch Dashboards invisibles (SASS variables, mixins, functions) from the [`globals_[theme].scss` file](src/core/public/core_app/styles/_globals_v7light.scss).

While the styles for this component will only be loaded if the component exists on the page,
the styles **will** be global and so it is recommended to use a three letter prefix on your
classes to ensure proper scope.

**Example:**

```tsx
// component.tsx

import './component.scss';
// All other imports below the SASS import

export const Component = () => {
  return <div className="plgComponent" />;
};
```

```scss
// component.scss

.plgComponent { ... }
```

Do not use the underscore `_` SASS file naming pattern when importing directly into a javascript file.

### TypeScript/JavaScript

The following developer guide rules apply for working with TypeScript/JavaScript files.

#### TypeScript vs. JavaScript

Whenever possible, write code in TypeScript instead of JavaScript, especially if it's new code.
Check out [TYPESCRIPT.md](TYPESCRIPT.md) for help with this process.

#### Prefer modern JavaScript/TypeScript syntax

You should prefer modern language features in a lot of cases, e.g.:

- Prefer `class` over `prototype` inheritance
- Prefer arrow function over function expressions
- Prefer arrow function over storing `this` (no `const self = this;`)
- Prefer template strings over string concatenation
- Prefer the spread operator for copying arrays (`[...arr]`) over `arr.slice()`
- Use optional chaining (`?.`) and nullish Coalescing (`??`) over `lodash.get` (and similar utilities)

#### Avoid mutability and state

Wherever possible, do not rely on mutable state. This means you should not
reassign variables, modify object properties, or push values to arrays.
Instead, create new variables, and shallow copies of objects and arrays:

```js
// good
function addBar(foos, foo) {
  const newFoo = { ...foo, name: 'bar' };
  return [...foos, newFoo];
}

// bad
function addBar(foos, foo) {
  foo.name = 'bar';
  foos.push(foo);
}
```

#### Avoid `any` whenever possible

Since TypeScript 3.0 and the introduction of the
[`unknown` type](https://mariusschulz.com/blog/the-unknown-type-in-typescript) there are rarely any
reasons to use `any` as a type. Nearly all places of former `any` usage can be replace by either a
generic or `unknown` (in cases the type is really not known).

You should always prefer using those mechanisms over using `any`, since they are stricter typed and
less likely to introduce bugs in the future due to insufficient types.

If you’re not having `any` in your plugin or are starting a new plugin, you should enable the
[`@typescript-eslint/no-explicit-any`](https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/no-explicit-any.md)
linting rule for your plugin via the [`.eslintrc.js`](https://github.com/opensearch-project/OpenSearch-Dashboards/blob/master/.eslintrc.js) config.

#### Avoid non-null assertions

You should try avoiding non-null assertions (`!.`) wherever possible. By using them you tell
TypeScript, that something is not null even though by it’s type it could be. Usage of non-null
assertions is most often a side-effect of you actually checked that the variable is not `null`
but TypeScript doesn’t correctly carry on that information till the usage of the variable.

In most cases it’s possible to replace the non-null assertion by structuring your code/checks slightly different
or using [user defined type guards](https://www.typescriptlang.org/docs/handbook/advanced-types.html#user-defined-type-guards)
to properly tell TypeScript what type a variable has.

Using non-null assertion increases the risk for future bugs. In case the condition under which we assumed that the
variable can’t be null has changed (potentially even due to changes in completely different files), the non-null
assertion would now wrongly disable proper type checking for us.

If you’re not using non-null assertions in your plugin or are starting a new plugin, consider enabling the
[`@typescript-eslint/no-non-null-assertion`](https://github.com/typescript-eslint/typescript-eslint/blob/main/packages/eslint-plugin/docs/rules/no-non-null-assertion.md)
linting rule for you plugin in the [`.eslintrc.js`](https://github.com/opensearch-project/OpenSearch-Dashboards/blob/main/.eslintrc.js) config.

#### Return/throw early from functions

To avoid deep nesting of if-statements, always return a function's value as early
as possible. And where possible, do any assertions first:

```js
// good
function doStuff(val) {
  if (val > 100) {
    throw new Error('Too big');
  }

  if (val < 0) {
    return false;
  }

  // ... stuff
}

// bad
function doStuff(val) {
  if (val >= 0) {
    if (val < 100) {
      // ... stuff
    } else {
      throw new Error('Too big');
    }
  } else {
    return false;
  }
}
```

#### Use object destructuring

This helps avoid temporary references and helps prevent typo-related bugs.

```js
// best
function fullName({ first, last }) {
  return `${first} ${last}`;
}

// good
function fullName(user) {
  const { first, last } = user;
  return `${first} ${last}`;
}

// bad
function fullName(user) {
  const first = user.first;
  const last = user.last;
  return `${first} ${last}`;
}
```

#### Use array destructuring

Directly accessing array values via index should be avoided, but if it is
necessary, use array destructuring:

```js
const arr = [1, 2, 3];

// good
const [first, second] = arr;

// bad
const first = arr[0];
const second = arr[1];
```

#### Avoid magic numbers/strings

These are numbers (or other values) simply used in line in your code. _Do not
use these_, give them a variable name so they can be understood and changed
easily.

```js
// good
const minWidth = 300;

if (width < minWidth) {
  ...
}

// bad
if (width < 300) {
  ...
}
```

#### Use native ES2015 module syntax

Module dependencies should be written using native ES2015 syntax wherever
possible (which is almost everywhere):

```js
// good
import { mapValues } from 'lodash';
export mapValues;

// bad
const _ = require('lodash');
module.exports = _.mapValues;

// worse
define(['lodash'], function (_) {
  ...
});
```

In those extremely rare cases where you're writing server-side JavaScript in a
file that does not pass run through webpack, then use CommonJS modules.

In those even rarer cases where you're writing client-side code that does not
run through webpack, then do not use a module loader at all.

##### Import only top-level modules

The files inside a module are implementation details of that module. They
should never be imported directly. Instead, you must only import the top-level
API that's exported by the module itself.

Without a clear mechanism in place in JS to encapsulate protected code, we make
a broad assumption that anything beyond the root of a module is an
implementation detail of that module.

On the other hand, a module should be able to import parent and sibling
modules.

```js
// good
import foo from 'foo';
import child from './child';
import parent from '../';
import ancestor from '../../../';
import sibling from '../foo';

// bad
import inFoo from 'foo/child';
import inSibling from '../foo/child';
```

#### Avoid global definitions

Don't do this. Everything should be wrapped in a module that can be depended on
by other modules. Even things as simple as a single value should be a module.

#### Use ternary operators only for small, simple code

And _never_ use multiple ternaries together, because they make it more
difficult to reason about how different values flow through the conditions
involved. Instead, structure the logic for maximum readability.

```js
// good, a situation where only 1 ternary is needed
const foo = a === b ? 1 : 2;

// bad
const foo = a === b ? 1 : a === c ? 2 : 3;
```

#### Use descriptive conditions

Any non-trivial conditions should be converted to functions or assigned to
descriptively named variables. By breaking up logic into smaller,
self-contained blocks, it becomes easier to reason about the higher-level
logic. Additionally, these blocks become good candidates for extraction into
their own modules, with unit-tests.

```js
// best
function isShape(thing) {
  return thing instanceof Shape;
}
function notSquare(thing) {
  return !(thing instanceof Square);
}
if (isShape(thing) && notSquare(thing)) {
  ...
}

// good
const isShape = thing instanceof Shape;
const notSquare = !(thing instanceof Square);
if (isShape && notSquare) {
  ...
}

// bad
if (thing instanceof Shape && !(thing instanceof Square)) {
  ...
}
```

#### Name regular expressions

```js
// good
const validPassword = /^(?=.*\d).{4,}$/;

if (password.length >= 4 && validPassword.test(password)) {
  console.log('password is valid');
}

// bad
if (password.length >= 4 && /^(?=.*\d).{4,}$/.test(password)) {
  console.log('losing');
}
```

#### Write small functions

Keep your functions short. A good function fits on a slide that the people in
the last row of a big room can comfortably read. So don't count on them having
perfect vision and limit yourself to ~15 lines of code per function.

#### Use "rest" syntax rather than built-in `arguments`

For expressiveness sake, and so you can be mix dynamic and explicit arguments.

```js
// good
function something(foo, ...args) {
  ...
}

// bad
function something(foo) {
  const args = Array.from(arguments).slice(1);
  ...
}
```

#### Use default argument syntax

Always use the default argument syntax for optional arguments.

```js
// good
function foo(options = {}) {
  ...
}

// bad
function foo(options) {
  if (typeof options === 'undefined') {
    options = {};
  }
  ...
}
```

And put your optional arguments at the end.

```js
// good
function foo(bar, options = {}) {
  ...
}

// bad
function foo(options = {}, bar) {
  ...
}
```

#### Use thunks to create closures, where possible

For trivial examples (like the one that follows), thunks will seem like
overkill, but they encourage isolating the implementation details of a closure
from the business logic of the calling code.

```js
// good
function connectHandler(client, callback) {
  return () => client.connect(callback);
}
setTimeout(connectHandler(client, afterConnect), 1000);

// not as good
setTimeout(() => {
  client.connect(afterConnect);
}, 1000);

// bad
setTimeout(() => {
  client.connect(() => {
    ...
  });
}, 1000);
```

#### Use slashes for comments

Use slashes for both single line and multi line comments. Try to write
comments that explain higher level mechanisms or clarify difficult
segments of your code. _Don't use comments to restate trivial things_.

_Exception:_ Comment blocks describing a function and its arguments
(docblock) should start with `/**`, contain a single `*` at the beginning of
each line, and end with `*/`.

```js
// good

// 'ID_SOMETHING=VALUE' -> ['ID_SOMETHING=VALUE', 'SOMETHING', 'VALUE']
const matches = item.match(/ID_([^\n]+)=([^\n]+)/));

/**
 * Fetches a user from...
 * @param  {string} id - id of the user
 * @return {Promise}
 */
function loadUser(id) {
  // This function has a nasty side effect where a failure to increment a
  // redis counter used for statistics will cause an exception. This needs
  // to be fixed in a later iteration.

  ...
}

const isSessionValid = (session.expires < Date.now());
if (isSessionValid) {
  ...
}

// bad

// Execute a regex
const matches = item.match(/ID_([^\n]+)=([^\n]+)/));

// Usage: loadUser(5, function() { ... })
function loadUser(id, cb) {
  // ...
}

// Check if the session is valid
const isSessionValid = (session.expires < Date.now());
// If the session is valid
if (isSessionValid) {
  ...
}
```

#### Use getters but not setters

Feel free to use getters that are free from [side effects][sideeffect], like
providing a length property for a collection class.

Do not use setters, they cause more problems than they can solve.

[sideeffect]: http://en.wikipedia.org/wiki/Side_effect_(computer_science)

#### Attribution

Parts of the JavaScript developer guide were initially forked from the
[node style guide](https://github.com/felixge/node-style-guide) created by [Felix Geisendörfer](http://felixge.de/) which is
licensed under the [CC BY-SA 3.0](http://creativecommons.org/licenses/by-sa/3.0/)
license.

### React

The following developer guide rules are specific for working with the React framework.

#### Name action functions and prop functions appropriately

Name action functions in the form of a strong verb and passed properties in the form of on<Subject><Change>. E.g:

```jsx
<sort-button onClick={action.sort}/>
<pagerButton onPageNext={action.turnToNextPage} />
```

### API endpoints

The following developer guide rules are targeting development of server side API endpoints.

#### Use only `/api/` as base path

API routes must start with the `/api/` path segment, and should be followed by the plugin id if applicable:

**Right:** `/api/marvel/nodes`

**Wrong:** `/marvel/api/nodes`

#### Use snake_case

OpenSearch Dashboards uses `snake_case` for the entire API, just like OpenSearch. All urls, paths, query string parameters, values, and bodies should be `snake_case` formatted.

_Right:_

```
POST /api/opensearch-dashboards/index_patterns
{
  "id": "...",
  "time_field_name": "...",
  "fields": [
    ...
  ]
}
```
