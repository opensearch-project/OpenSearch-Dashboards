Overview
---
- [General information](#general-information)
- [Requirements](#requirements)
- [Running tests](#running-tests)
  - [Unit tests](#unit-tests)
  - [Integration tests](#integration-tests)
  - [Functional tests](#functional-tests)
- [Continuous Integration](#continuous-integration)
- [Environment misc](#environment-misc) 
- [Misc](#misc) 

# General information
OpenSearch Dashboards uses [Jest](https://jestjs.io/) for unit and integration tests and [Selenium](https://www.selenium.dev/) for functional tests.

In general, we recommend three tiers of tests:
* Unit tests: Unit tests: small and modular tests that utilize mocks for external dependencies.
* Integration tests: higher-level tests that verify interactions between systems (eg. HTTP APIs, OpenSearch API calls, calling other plugin). 
* End-to-end tests (e2e): functional tests that verify behavior in a web browser.

# Requirements
* Install the latest NodeJS, [NPM](https://www.npmjs.com/get-npm) and [Yarn](https://classic.yarnpkg.com/en/docs/install/#mac-stable)
    * `nvm install v10.24.1`
    * `npm install -g yarn`

# Running tests
The following is a cheatsheet of options for running the tests for OpenSearch Dashboards.

### Unit tests
To run all the unit tests:
`yarn test:jest`
To run specific unit tests, pass the path to the test:
`yarn test:jest [test path]`

### Integration tests
To run all the integration tests:
`yarn test:jest_integration`
To run specific integration tests, pass the path to the test:
`yarn test:jest_integration [test path]`

### Functional tests
To run all functional tests:
`yarn test:ftr`
To run specific functional tests, you can run by CI group:
`node scripts/functional_tests.js --include ciGroup1`

To debug functional tests:
Say that you would want to debug a test in CI group 1, you can run the following command in your environment:
`node --debug-brk --inspect scripts/functional_tests.js --config test/functional/config.js --include ciGroup1 --debug`

This will print of an address, to which you could open your chrome browser on your instance and navigate to `chrome://inspect/#devices` and inspect the functional test runner `scripts/functional_tests.js`.

### Additional checks
Make sure you run lint checker before submitting a pull request. To run lint checker:
`node scripts/precommit_hook.js --fix`

Please ensure that you don't introduce any broken links accidently. For any intentional broken link (e.g. dummy url in unit test), you can add it to [lycheeexclude](https://github.com/opensearch-project/OpenSearch-Dashboards/blob/main/.lycheeexclude) allow list specifically. 

# Continuous Integration
Automated testing is provided with Jenkins for Continuous Integration. Jenkins enables developers to build, deploy, and automate projects and provides us to run groups of tests quickly. CI groups are ran from the [Jenkinsfile](https://github.com/opensearch-project/OpenSearch-Dashboards/blob/main/Jenkinsfile). 

# Environment misc
Selenium tests are run in headless mode on CI. Locally the same tests will be executed in a real browser. You can activate headless mode by setting the environment variable:
`export TEST_BROWSER_HEADLESS=1`

By default the version of OpenSearch Dashboards will pull the snapshot of the same version of OpenSearch if available while running a few integration tests and for running functional tests. However, if the version of OpenSearch Dashboards is not available, you can build OpenSearch locally and point the functional test runner to the executable with:
`export TEST_OPENSEARCH_FROM=[local directory of OpenSearch executable]`

# Misc
Although Jest is the standard for this project, there are a few Mocha tests that still exist. You can run these tests by running:
`yarn test:mocha`

However, these tests will eventually be migrated. Please avoid writing new Mocha tests. For further questions or to check the status please see this [issue](https://github.com/opensearch-project/OpenSearch-Dashboards/issues/215).

