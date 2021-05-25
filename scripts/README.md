# OpenSearch Dashboards Dev Scripts

This directory contains scripts useful for interacting with OpenSearch Dashboards tools in development. Use the node executable and `--help` flag to learn about how they work:

```sh
node scripts/{{script name}} --help
```

## For Developers

This directory is excluded from the build and tools within it should help users discover their capabilities. Each script in this directory must:

- require `src/setup_node_env` to bootstrap NodeJS environment
- call out to source code in the [`src`](../src) or [`packages`](../packages) directories
- react to the `--help` flag
- run everywhere OR check and fail fast when a required OS or toolchain is not available

## Functional Test Scripts

**`node scripts/functional_tests [--config test/functional/config.js --config test/api_integration/config.js]`**

Runs all the functional tests: selenium tests and api integration tests. List configs with multiple `--config` arguments. Uses the [@osd/test](../packages/osd-test) library to run OpenSearch and OpenSearch Dashboards servers and tests against those servers, for multiple server+test setups. In particular, calls out to [`runTests()`](../packages/osd-test/src/functional_tests/tasks.js). Can be run on a single config.

**`node scripts/functional_tests_server [--config test/functional/config.js]`**

Starts just the OpenSearch and OpenSearch Dashboards servers given a single config, i.e. via `--config test/functional/config.js` or `--config test/api_integration/config`. Allows the user to start just the servers with this script, and keep them running while running tests against these servers. The idea is that the same config file configures both OpenSearch and OpenSearch Dashboards servers. Uses the [`startServers()`](../packages/osd-test/src/functional_tests/tasks.js#L52-L80) method from [@osd/test](../packages/osd-test) library.

Example. Start servers _and_ run tests, separately, but using the same config:

```sh
# Just the servers
node scripts/functional_tests_server --config path/to/config
```

In another terminal:

```sh
# Just the tests--against the running servers
node scripts/functional_test_runner --config path/to/config
```

For details on how the internal methods work, [read this readme](../packages/osd-test/README.md).

### OpenSearch archiver 

#### Loading data

If you wish to load up specific opensearch archived data for your test, you can do so via:

```
node scripts/opensearch_archiver.js load <archive> [--opensearch-url=http://username:password@localhost:9200] [--opensearch-dashboards-url=http://username:password@localhost:5601/{basepath?}]
```

That will load the specified archive located in the archive directory specified by the default functional config file, located in `test/functional/config.js`. To load archives from other function config files you can pass `--config path/to/config.js`.

*Note:* The `--opensearch-url` and `--opensearch-dashboards-url` options may or may not be neccessary depending on your current OpenSearch Dashboards configuration settings, and their values
may also change based on those settings (for example if you are not running with security you will not need the `username:password` portion).

#### Saving data

You can save existing data into an archive by using the `save` command:

 ```
node scripts/opensearch_archiver.js save <archive name for opensearch_dashboards data> [space separated list of index patterns to include]
```

You may want to store the .kibana index separate from data. Since adding a lot of data will bloat our repo size, we have many tests that reuse the same
data indices but use their own `.kibana` index. 
