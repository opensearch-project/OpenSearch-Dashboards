# Example plugin functional tests

This folder contains functional tests for the example plugins.

## Run the test

To run these tests during development you can use the following commands:

```
# Start the test server (can continue running)
node scripts/functional_tests_server.js --config test/examples/config.js
# Start a test run
node scripts/functional_test_runner.js --config test/examples/config.js
```

## Run OpenSearch Dashboards with a test plugin

In case you want to start OpenSearch Dashboards with the example plugins, you can just run:

```
yarn start --run-examples
```

