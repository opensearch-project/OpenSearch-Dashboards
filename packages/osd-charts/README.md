<h1 align="center">
  Elastic Charts
</h1>
<p align="center">
  <a href="(https://travis-ci.org/elastic/elastic-charts"><img alt="Build Status" src="https://travis-ci.org/elastic/elastic-charts.svg?branch=master"></a>
  <a href="https://codecov.io/gh/elastic/elastic-charts"><img alt="Codecov" src="https://img.shields.io/codecov/c/github/elastic/elastic-charts.svg?style=flat">
  </a>
  <a href="https://www.npmjs.com/@elastic/charts"><img alt="NPM version" src="https://img.shields.io/npm/v/@elastic/charts.svg?style=flat"></a>
  <a href="http://commitizen.github.io/cz-cli/"><img alt="Commitizen friendly" src="https://img.shields.io/badge/commitizen-friendly-brightgreen.svg"></a>
  <a href="https://elastic.github.io/elastic-charts"><img alt="Storybook" src="https://github.com/storybooks/press/raw/master/badges/storybook.svg?sanitize=true"></a>
  
</p>

🚨 **WARNING** While open source, the intended consumers of this repository are Elastic products. Read the [FAQ][faq] for details.

---

You should check out our [living style guide][docs], which contains many examples on how charts look and feel, and how to use them in your products.

## Installation

To install the Elastic Charts into an existing project, use the `yarn` CLI (`npm` is not supported).

```
yarn add @elastic/charts
```

## Running Locally

### Node

We depend upon the version of node defined in [.nvmrc](.nvmrc).

You will probably want to install a node version manager. [nvm](https://github.com/creationix/nvm) is recommended.

To install and use the correct node version with `nvm`:

```
nvm install
```

### Development environment

You can run the dev environment locally at [http://localhost:9001](http://localhost:9001/) by running:

```
yarn
yarn start
```

We use [storybook](https://storybook.js.org) to document API, edge-cases, and the usage of the library.
A hosted version is available at [https://elastic.github.io/elastic-charts][docs].

## Goals

The primary goal of this library is to provide reusable set of chart components that can be used throughout Elastic's web products.
As a single source of truth, the framework allows our designers to make changes to our look-and-feel directly in the code. And unit test coverage for the charts components allows us to deliver a stable "API for charts".

## Contributing

You can find documentation around creating and submitting new features in [CONTRIBUTING.md][contributing].

## Wiki

### Consumption

- [Consuming Elastic Charts][consuming]

### Documentation

- [Overview][overview]
- [Theming][theming]

## License

[Apache Licensed][license]. Read the [FAQ][faq] for details.

[license]: LICENSE.md
[faq]: FAQ.md
[docs]: https://elastic.github.io/elastic-charts/
[consuming]: wiki/consuming.md
[overview]: wiki/overview.md
[theming]: wiki/theming.md
[contributing]: CONTRIBUTING.md
