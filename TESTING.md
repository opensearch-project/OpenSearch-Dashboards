Overview
---
- [General information](#general-information)
- [Requirements](#requirements)
- [Running tests](#running-tests)
    - [Unit tests](#unit-tests)
    - [Integration tests](#integration-tests)
    - [Functional tests](#functional-tests)
    - [Backwards Compatibility tests](#backwards-compatibility-tests)
    - [Additional checks](#additional-checks)
- [Writing Tests](#writing-tests)
- [Continuous Integration](#continuous-integration)
- [Environment misc](#environment-misc)
- [Misc](#misc)

# General information
OpenSearch Dashboards uses [Jest](https://jestjs.io/) for unit and integration tests, [Selenium](https://www.selenium.dev/) for functional tests, and [Cypress](https://www.cypress.io/) for backwards compatibility tests.

In general, we recommend four tiers of tests:
* Unit tests: Unit tests: small and modular tests that utilize mocks for external dependencies.
* Integration tests: higher-level tests that verify interactions between systems (eg. HTTP APIs, OpenSearch API calls, calling other plugin).
* End-to-end tests (e2e): functional tests that verify behavior in a web browser.
* Backwards Compatibility tests: cypress tests that verify any changes are backwards compatible with previous versions.

# Requirements
* Install the latest NodeJS, [NPM](https://www.npmjs.com/get-npm) and [Yarn](https://classic.yarnpkg.com/en/docs/install/#mac-stable)
    * `nvm install v14.20.1`
    * `npm install -g yarn`

# Running tests
The following is a cheatsheet of options for running the tests for OpenSearch Dashboards.

### Unit tests
To run all the unit tests:
`yarn test:jest`
To run specific unit tests, pass the path to the test:
`yarn test:jest [test path]`
To run specific unit test groups:
`yarn test:jest --ci-group=1 --ci-group=2`

### Integration tests
To run all the integration tests:
`yarn test:jest_integration`
To run specific integration tests, pass the path to the test:
`yarn test:jest_integration [test path]`

### Functional tests

Functional testing in OpenSearch Dashboards is migrating to the [opensearch-dashboards-functional-test](https://github.com/opensearch-project/opensearch-dashboards-functional-test) repository. All new functional tests should be written there. When modifying a file that affects an existing functional test, the old test should be migrated to the new repository. The rest of this section outlines how to run the existing functional tests in the repository.

To run all functional tests:
`yarn test:ftr`
To run specific functional tests, you can run by CI group:
`node scripts/functional_tests.js --include ciGroup1`

To debug functional tests:
Say that you would want to debug a test in CI group 1, you can run the following command in your environment:
`node --inspect-brk --inspect scripts/functional_tests.js --config test/functional/config.js --include ciGroup1 --debug`

This will print off an address, to which you could open your chrome browser on your instance and navigate to `chrome://inspect/#devices` and inspect the functional test runner `scripts/functional_tests.js`.

If you prefer to run functional tests using Docker, you can find instructions on how to set up and debug functional tests in a Docker environment in the [Debug Functional Tests](docs/docker-dev/docker-dev-setup-manual.md#debug-functional-tests) section of the `docker-dev-setup-manual.md` file.

### Backwards Compatibility tests
To run all the backwards compatibility tests on OpenSearch Dashboards without security:

`yarn test:bwc -o [test path to opensearch.tar.gz] -d [test path to opensearch-dashboards.tar.gz]`

To run all the backwards compatibility tests on OpenSearch Dashboards with security, pass the security parameter to the test:

`yarn test:bwc -o [test path to opensearch.tar.gz] -d [test path to opensearch-dashboards.tar.gz] -s true`

To run specific versions' backwards compatibility tests, pass the versions to the test:

`yarn test:bwc -o [test path to opensearch.tar.gz] -d [test path to opensearch-dashboards.tar.gz] -v "[test versions]"`

To generate test data that will be utilized for backwards compatibility tests:

`yarn test:bwc -o [test path to opensearch.tar.gz] -d [test path to opensearch-dashboards.tar.gz] -g true`

This will create an archive of the data based on the OpenSearch Dashboards version you have provided. For example, if a tarball of 2.0.0 was passed then an `osd-2.0.0.zip` will be created. This command is intended to be executed when needed per a version. For example, when end-users cannot migrate directly from `vPrevious` to `vNext`. If `osd-vCurrent.zip` does not exist, then this command be ran and the output sourced controlled for future use.

### Additional checks
Make sure you run lint checker before submitting a pull request. To run lint checker:
`node scripts/precommit_hook.js --fix`

Please ensure that you don't introduce any broken links accidently. For any intentional broken link (e.g. dummy url in unit test), you can add it to [lycheeexclude](https://github.com/opensearch-project/OpenSearch-Dashboards/blob/main/.lycheeexclude) allow-list specifically.

# Writing Tests
Conventions and best practices for writing tests can be found in [/src/core/TESTING.md](/src/core/TESTING.md)

# Continuous Integration
Automated testing is provided by Jenkins for Continuous Integration. Jenkins enables developers to build, deploy, and automate projects, and permits us to run groups of tests quickly. CI groups are run from [Jenkinsfile](https://github.com/opensearch-project/OpenSearch-Dashboards/blob/main/Jenkinsfile).

# Environment misc
Selenium tests are run in headless mode on CI. Locally the same tests will be executed in a real browser. You can activate headless mode by setting the environment variable:
`export TEST_BROWSER_HEADLESS=1`

Since local Selenium tests are run in a real browser, the dev environment should have a desktop environment and Google Chrome or Chromium installed to run the tests.

By default the version of OpenSearch Dashboards will pull the snapshot of the same version of OpenSearch if available while running a few integration tests and for running functional tests. However, if the version of OpenSearch Dashboards is not available, you can build OpenSearch locally and point the functional test runner to the executable with:
`export TEST_OPENSEARCH_FROM=[local directory of OpenSearch executable]`

Selinium tests require a chromedriver and a corresponding version of chrome to run properly. Depending on the version of chromedriver used, you may need to use a version of Google Chrome that is not the latest version. You can do this by running:

```sh
# Enter the version of chrome that you want to install
CHROME_VERSION=100.0.4896.127-1

# Download Chrome to a temp directory
curl -sSL "https://dl.google.com/linux/linux_signing_key.pub" | sudo apt-key add -  && wget -O /tmp/chrome.deb "https://dl.google.com/linux/chrome/deb/pool/main/g/google-chrome-stable/google-chrome-stable_${CHROME_VERSION}_amd64.deb"

# Install/Downgrade Chrome
sudo apt-get install -y --allow-downgrades /tmp/chrome.deb
```

# Misc
Although Jest is the standard for this project, there are a few Mocha tests that still exist. You can run these tests by running:
`yarn test:mocha`

However, these tests will eventually be migrated; please avoid writing new Mocha tests. For further questions or to check the status, please see this [issue](https://github.com/opensearch-project/OpenSearch-Dashboards/issues/215).
