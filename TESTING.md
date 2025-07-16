Overview
---

- [General information](#general-information)
- [Requirements](#requirements)
- [Test guidelines](#test-guidelines)
  - [Unit tests](#unit-tests)
  - [Integration tests](#integration-tests)
  - [Functional tests](#functional-tests)
  - [Performance tests](#performance-tests)
- [Running tests](#running-tests)
  - [Unit tests](#unit-tests-1)
  - [Integration tests](#integration-tests-1)
  - [Functional tests](#functional-tests-1)
  - [Performance tests](#performance-tests-1)
  - [Backwards Compatibility tests](#backwards-compatibility-tests)
  - [Additional checks](#additional-checks)
- [Writing Tests](#writing-tests)
- [Continuous Integration](#continuous-integration)
- [Environment misc](#environment-misc)
- [Misc](#misc)

# General information

OpenSearch Dashboards uses [Jest](https://jestjs.io/) for unit and integration tests, [Cypress](https://www.cypress.io/) for backwards compatibility tests and functional tests and [Selenium](https://www.selenium.dev/) for some legacy functional tests (Tests should no longer be written in Selenium).

In general, we have these types of tests. See [Test guidelines](#test-guidelines) for recommendations.

- Unit tests: Unit tests: small and modular tests that utilize mocks for external dependencies.
- Integration tests: higher-level tests that verify interactions between systems (eg. HTTP APIs, OpenSearch API calls, calling other plugin).
- Functional tests: end-to-end tests that verify behavior in a web browser.

These tiers should roughly follow the traditional ["testing pyramid"](https://martinfowler.com/articles/practical-test-pyramid.html), where there are more exhaustive testing at the unit level, fewer at the integration level, and very few at the functional level.

Additionally there are a few more types of tests and checks:

- Backwards Compatibility tests: tests that verify any changes are backwards compatible with previous versions.
- Performance tests: tests that measure page render performance using lighthouse.
- TypeScript and linting: static checks to prevent TypeScript ESLint and type errors.

> Contributors submitting pull requests (PRs) to the codebase are required to ensure that their code changes include appropriate testing coverage. This includes, but is not limited to, unit tests, integration tests, functional tests, and backwards compatibility tests where applicable.
> It is the responsibility of the contributor to verify that their code changes do not introduce regressions or break existing functionality. PRs lacking sufficient testing coverage may be subject to delays in review or rejection until adequate tests are provided.

# Requirements

- Install the latest NodeJS, [NPM](https://www.npmjs.com/get-npm) and [Yarn](https://classic.yarnpkg.com/en/docs/install/#mac-stable)
  - `nvm install v20.18.3`
  - `npm install -g yarn`

# Test guidelines

### Unit tests

Unit tests are fast and easy to debug, and they should cover most permutations of logics. OpenSearch Dashboards uses [Codecov](https://app.codecov.io/gh/opensearch-project/OpenSearch-Dashboards) to enforce test coverage in PRs to be above 80%.

**Guidelines**:
- [Jest snapshot testing](https://jestjs.io/docs/snapshot-testing) can be used to validate data structures, but developers should avoid react component snapshots. Those snapshots grow large and are hard to maintain properly.
- Component tests should use react-testing-library, following their conventions like [query priority](https://testing-library.com/docs/queries/about/#priority).
- All components should be developed to be testable. Utils and services should aim for higher (90% - 100%) coverage than react components.
- Every code file that contain logic should have a corresponding test file. This ensures that tests are small and maintainable.
- If a file is expected to not have coverage, add it to the exclude list [here](https://github.com/opensearch-project/OpenSearch-Dashboards/blob/96d2f40f6688a9749cf6013d29c88d86c26300a8/src/plugins/query_enhancements/test/jest.config.js#L18-L18).
- PRs creating or using services should also create or use mocks ([example](https://github.com/opensearch-project/OpenSearch-Dashboards/blob/96d2f40f6688a9749cf6013d29c88d86c26300a8/src/plugins/data/public/mocks.ts#L64)).
- If a component already has coverage through its own unit tests, it can be mocked in other unit tests to minimize duplicated test maintenance efforts.
- The code owner will be responsible for creating and maintaining unit tests.
- Tests and coverage check should pass before PR is merged. Maintainers should be able to override failed Codecov actions to merge, in case of emergency or inaccuracy. Any overridden CI should have a comment on the PR for visibility.

### Integration tests

Integration tests are tests defined by files matching `**/integration_tests/**/*.test.[tj]sx?`. Developers can leverage the [osd_server](/src/core/test_helpers/osd_server.ts#L129) helper to start OpenSearch and OpenSearch Dashboards and verify API behavior against the server endpoint.

**Guidelines**:
* Developers should use Cypress for API testing rather than Jest integration tests. OpenSearch Dashboards does not have an effective way to enforce jest integration test coverage, and it cannot verify that the tests are executing against actual server endpoint rather than mocked servers or responses. Cypress supports API testing as well and unifies test managements in OpenSearch Dashboards.
* The workflow action should pass before PR is merged, unless maintainers override them.

### Functional tests

Functional tests are end-to-end tests that verify behavior in a web browser. OpenSearch Dashboards contains two types of functional tests: Cypress based and Selenium based.

Selenium based functional tests are legacy code. They will be maintained but developers should not add any new tests. Any refactor to Selenium tests should be done by migrating them to Cypress.

Cypress based functional tests can test end-to-end UI workflows as well as API behavior. The test files are in both [opensearch-dashboards-functional-test](https://github.com/opensearch-project/opensearch-dashboards-functional-test) repository and [cypress/integration](/cypress/integration) directory. All new cypress tests should be added to the [cypress/integration](/cypress/integration) directory, which makes it easier to maintain and track changes to tests alongside the features they verify.

**Guidelines**:
* Cypress tests do not need to cover every possible interaction, but they must cover critical workflows such as release blockers. Prioritize test development based on impact.
* Keep tests focused. Do not test multiple features in one test or depend on other tests. Use proper hooks to setup and cleanup environment, remove any side effects.
* Flaky tests need to be fixed to reduce maintenance efforts. Here are some ways to avoid flaky tests:
    * Always use UTC time in tests.
    * Avoid hard coded delays in tests, use `cy.get()` to wait for UI elements or `cy.intercept()` to wait for specific network requests.
    * Use APIs instead of UI to setup test resources before running tests.
    * Use `data-test-subj` attributes to locate elements.
    * Follow [Cypress best practices](https://docs.cypress.io/app/core-concepts/best-practices).
* The workflow action should pass before PR is merged, unless maintainers override them with a comment.
* The code owner will be responsible for creating and maintaining cypress tests.

### Performance tests

Performance tests measures performance against [the pre-defined baselines](/baselines/lighthouse_baseline.json) using lighthouse.

**Guidelines**:
* Performance critical apps (the initial landing app and apps that render a lot of data, like dashboards) should onboard to the [lighthouse testing](/.github/workflows/lighthouse_testing.yml) workflow.
* The workflow action should pass before PR is merged, unless maintainers override them. Any overridden CI should have a comment on the PR for visibility.

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

#### Cypress

To run Cypress based functional tests security plugin:

`yarn cypress:run-with-security`

To run without security plugin:

`yarn cypress:run-without-security`

To run specific tests:
`yarn cypress:run-without-security --spec [test path]`

To open GUI:

`yarn cypress open`

#### Selenium

To install dependencies for Selenium tests on Ubuntu 24.04:

```bash
wget https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb
sudo dpkg -i google-chrome-stable_current_amd64.deb
sudo apt -y --fix-broken install
sudo apt install -y libgtk2.0-0 libgtk-3-0 libgbm-dev libnotify-dev libnss3 libxss1 libasound2t64 libxtst6 xauth xvfb

cd OpenSearch-Dashboards
export DISPLAY=:99
Xvfb -ac :99 -screen 0 1280x1024x16 &
node scripts/upgrade_chromedriver.js
yarn osd bootstrap
node scripts/build_opensearch_dashboards_platform_plugins --no-examples --workers 10
```

To run all Selenium based functional tests:

`yarn test:ftr`

To run specific functional tests, you can run by CI group:

`node scripts/functional_tests.js --include ciGroup1`

To debug functional tests:

Say that you would want to debug a test in CI group 1, you can run the following command in your environment:
`node --inspect-brk --inspect scripts/functional_tests.js --config test/functional/config.js --include ciGroup1 --debug`

This will print off an address, to which you could open your chrome browser on your instance and navigate to `chrome://inspect/#devices` and inspect the functional test runner `scripts/functional_tests.js`.

If you prefer to run functional tests using Docker, you can find instructions on how to set up and debug functional tests in a Docker environment in the [Debug Functional Tests](docs/docker-dev/docker-dev-setup-manual.md#debug-functional-tests) section of the `docker-dev-setup-manual.md` file.

### Performance tests

To run performance tests:

`yarn lhci autorun`

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

Pull request also checks typescript errors, see [TYPESCRIPT.md](/TYPESCRIPT.md) for details.

# Writing Tests

Conventions and best practices for writing tests can be found in [src/core/TESTING.md](/src/core/TESTING.md)

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
