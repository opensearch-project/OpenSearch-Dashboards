# @osd/opensearch

> A command line utility for running opensearch from source or archive.

## Getting started
If running opensearch from source, opensearch needs to be cloned to a sibling directory of OpenSearch Dashboards.

To run, go to the OpenSearch Dashboards root and run `node scripts/opensearch --help` to get the latest command line options.

### Examples

Run a snapshot 
```
node scripts/opensearch snapshot 
```

Run from source with a configured data directory
```
node scripts/opensearch source --Epath.data=/home/me/opensearch_data
```

## API

### run
Start a cluster
```
var opensearch = require('@osd/opensearch');
opensearch.run({
  version: 1.0.0,
})
.catch(function (e) {
  console.error(e);
  process.exitCode = 1;
});
```

#### Options

##### options.version

Type: `String`

Desired opensearch version

##### options['source-path']

Type: `String`

Cloned location of opensearch repository, used when running from source

##### options['base-path']

Type: `String`

Location where snapshots are cached