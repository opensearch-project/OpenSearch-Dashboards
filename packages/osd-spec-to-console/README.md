\ mini utility to convert [OpenSearch's REST spec](https://github.com/opensearch-project/OpenSearch/blob/main/rest-api-spec) to Console's (OpenSearch Dashboards) autocomplete format.


It is used to semi-manually update Console's autocompletion rules.

### Retrieving the spec

If you don't have a copy of the OpenSearch repo on your machine, follow these steps to clone only the rest API specs

```
mkdir opensearch-spec && cd opensearch-spec
git init
git remote add origin https://github.com/opensearch-project/OpenSearch
git config core.sparsecheckout true
echo "rest-api-spec/src/main/resources/rest-api-spec/api/*\nx-pack/plugin/src/test/resources/rest-api-spec/api/*" > .git/info/sparse-checkout
git pull --depth=1 origin main
```

### Usage

At the root of the OpenSearch Dashboards repository, run the following commands:

```sh
# OSS
yarn spec_to_console -g "<OPENSEARCH-REPO-FOLDER>/rest-api-spec/src/main/resources/rest-api-spec/api/*" -d "src/plugins/console/server/lib/spec_definitions/json/generated"

```

### Information used in Console that is not available in the REST spec

* Request bodies
* Data fetched at runtime: indices, fields, snapshots, etc
* Ad hoc additions