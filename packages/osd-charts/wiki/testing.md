## Timezone testing

Every jest test in this code runs in the local timezone.

### Run on every timezone

If you want to run a test suite on multiple timezone, just prepend a `tz` to the
standard `.test.ts` extension like:

```
formatters.tz.test.ts
scales.tz.test.ts
```

Your test will run in the standard local timezone and in all the configured timezones (UTC, America/New_York and Asia/Tokyo).
The local timezone tests results are included in the code coverage.

### Run on a specific timezone

If you are interested into explicitly create test for a timezone (we are now testing only on UTC, America/New_York and Asia/Tokyo) you have to prepend the `tz` but add one of the following postfix before the file extension: `utc`,`ny`,`jp`, for example

```sh
your_file_name.tz.test.utc.ts
your_file_name.tz.test.ny.ts
your_file_name.tz.test.jp.ts
```

Each test with the specific timezone postfix will be executed only on that timezone.

These tests are not included in the code coverage yet.


## Storybook screenshot testing aka VRT

Every story in storybook is tested through a Visual Regression Test suite.
The tests are available in `integration/tests` folder. One main test `all.test.ts` goes through all stories, takes screenshots of each story
and compare it to the existing baseline available at `integration/test/__image_snapshots__`.

To run the suite
```
yarn test:integration
```

This will start a separate storybook server and a docker machine with chromium, controlled by pupetteer and jest, that takes and compare screeshots.

If the screenshot differ from the baseline, a test error is rised and a diff image is stored in `integration/test/__image_snapshots__/__diff_output__`.

If a new test is added, a new screenshot `.png` file is written as part of the baseline.

To update all existing screenshot baselines to the new version run:
```
yarn test:integration -u
```


To run the VRT against your current storybook server (will reduce the running time of the test locally) run:
```
yarn test:integration:local
```

To run a specific test file run
```
yarn test:integration test_file_name
# or
yarn test:integration:local test_file_name
```

To run the test on a specific story name or story group name use `--testNamePattern=<regex>` or `-t`
see [Jest](https://jestjs.io/docs/en/cli.html#--testnamepatternregex). This example will run the integration test
on all.test.ts file for all matching test name in `describe` or `it` with `tree*` regex.

```
yarn test:integration all.test.ts --testNamePattern tree*

# or

yarn test:integration all.test.ts -t tree*

```
