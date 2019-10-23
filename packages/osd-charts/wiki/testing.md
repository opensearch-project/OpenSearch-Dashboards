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

These  tests are not included in the code coverage yet.

