OpenSearch Dashboards Testing Library
======================

The @osd/test package provides ways to run tests. Currently only functional testing is provided by this library, with unit and other testing possibly added here.

Functional Testing
-------------------

### Dependencies

Functional testing methods exist in the `src/functional_tests` directory. They depend on the Functional Test Runner, which is found in [`{OPENSEARCH_DASHBOARDS_ROOT}/src/functional_test_runner`](../../src/functional_test_runner). Ideally libraries provided by opensearch-dashboards packages such as this one should not depend on opensearch-dashboards source code that lives in [`{OPENSEARCH_DASHBOARDS_ROOT}/src`](../../src). The goal is to start pulling test and development utilities out into packages so they can be used across OpenSearch Dashboards and plugins. Accordingly the Functional Test Runner itself will be pulled out into a package (or part of a package), and this package's dependence on it will not be an issue.

### Exposed methods

#### runTests(configPaths: Array<string>)
For each config file specified in configPaths, starts OpenSearch and OpenSearch Dashboards once, runs tests specified in that config file, and shuts down OpenSearch and OpenSearch Dashboards once completed. (Repeats for every config file.)

`configPaths`: array of strings, each an absolute path to a config file that looks like [this](../../test/functional/config.js), following the config schema specified [here](../../src/functional_test_runner/lib/config/schema.js).

Internally the method that starts OpenSearch comes from [osd-opensearch](../../packages/osd-opensearch).

#### startServers(configPath: string)
Starts OpenSearch and OpenSearch Dashboards servers given a specified config.

`configPath`: absolute path to a config file that looks like [this](../../test/functional/config.js), following the config schema specified [here](../../src/functional_test_runner/lib/config/schema.js).

Allows users to start another process to run just the tests while keeping the servers running with this method. Start servers _and_ run tests using the same config file ([see how](../../scripts/README.md)).

## Rationale

### Single config per setup

We think it makes sense to specify the tests to run along with the particular server configuration for OpenSearch and OpenSearch Dashboards servers, because the tests expect a particular configuration. For example, saml api integration tests expect certain xml files to exist in OpenSearch's config directory, and certain saml specific options to be passed in via the command line (or alternatively via the `.yml` config file) to both OpenSearch and OpenSearch Dashboards. It makes sense to keep all these config options together with the list of test files.

### Multiple configs running in succession

We also think it makes sense to have a test runner intelligently (but simply) start servers, run tests, tear down servers, and repeat for each config, uninterrupted. There's nothing special about each kind of config that specifies running some set of functional tests against some kind of OpenSearch/OpenSearch Dashboards servers. There doesn't need to be a separate job to run each kind of setup/test/teardown. These can all be orchestrated sequentially via the current `runTests` implementation. This is how we envision tests to run on CI.

This inherently means that grouping test files in configs matters, such that a group of test files that depends on a particular server config appears together in that config's `testFiles` list. Given how quickly and easily we can start servers using [@osd/opensearch](../../packages/osd-opensearch), it should not impact performance to logically group tests by domain even if multiple groups of tests share the same server config. We can think about how to group test files together across domains when that time comes.
