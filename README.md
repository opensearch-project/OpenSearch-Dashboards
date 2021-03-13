# OpenSearch Dashboards

OpenSearch Dashboards is your window into the [OpenSearch Stack](https://www.elastic.co/products). Specifically, it's a browser-based analytics and search dashboard for OpenSearch.

- [Getting Started](#getting-started)
  - [Using a OpenSearch Dashboards Release](#using-a-opensearch-dashboards-release)
  - [Building and Running OpenSearch Dashboards, and/or Contributing Code](#building-and-running-kibana-andor-contributing-code)
- [Documentation](#documentation)
- [Version Compatibility with OpenSearch](#version-compatibility-with-elasticsearch)
- [Questions? Problems? Suggestions?](#questions-problems-suggestions)

## Getting Started

If you just want to try OpenSearch Dashboards out, check out the [OpenSearch Stack Getting Started Page](https://www.elastic.co/start) to give it a whirl.

If you're interested in diving a bit deeper and getting a taste of OpenSearch Dashboards's capabilities, head over to the [OpenSearch Dashboards Getting Started Page](https://www.elastic.co/guide/en/kibana/current/getting-started.html).

### Using a OpenSearch Dashboards Release

If you want to use a OpenSearch Dashboards release in production, give it a test run, or just play around:

- Download the latest version on the [OpenSearch Dashboards Download Page](https://www.elastic.co/downloads/kibana).
- Learn more about OpenSearch Dashboards's features and capabilities on the
[OpenSearch Dashboards Product Page](https://www.elastic.co/products/kibana).
- We also offer a hosted version of OpenSearch Dashboards on our
[Cloud Service](https://www.elastic.co/cloud/as-a-service).

### Building and Running OpenSearch Dashboards, and/or Contributing Code

You might want to build OpenSearch Dashboards locally to contribute some code, test out the latest features, or try
out an open PR:

- [CONTRIBUTING.md](CONTRIBUTING.md) will help you get OpenSearch Dashboards up and running.
- If you would like to contribute code, please follow our [STYLEGUIDE.md](STYLEGUIDE.md).
- For all other questions, check out the [FAQ.md](FAQ.md) and
[wiki](https://github.com/elastic/kibana/wiki).

## Documentation

Visit [Elastic.co](http://www.elastic.co/guide/en/kibana/current/index.html) for the full OpenSearch Dashboards documentation.

For information about building the documentation, see the README in [elastic/docs](https://github.com/elastic/docs).

## Version Compatibility with OpenSearch

Ideally, you should be running OpenSearch and OpenSearch Dashboards with matching version numbers. If your OpenSearch has an older version number or a newer _major_ number than OpenSearch Dashboards, then OpenSearch Dashboards will fail to run. If OpenSearch has a newer minor or patch number than OpenSearch Dashboards, then the OpenSearch Dashboards Server will log a warning.

_Note: The version numbers below are only examples, meant to illustrate the relationships between different types of version numbers._

| Situation                 | Example OpenSearch Dashboards version     | Example OpenSearch version | Outcome |
| ------------------------- | -------------------------- |------------------- | ------- |
| Versions are the same.    | 5.1.2                      | 5.1.2              | 💚 OK      |
| OpenSearch patch number is newer. | 5.1.__2__                  | 5.1.__5__          | ⚠️ Logged warning      |
| OpenSearch minor number is newer. | 5.__1__.2                  | 5.__5__.0          | ⚠️ Logged warning      |
| OpenSearch major number is newer. | __5__.1.2                  | __6__.0.0          | 🚫 Fatal error      |
| OpenSearch patch number is older. | 5.1.__2__                  | 5.1.__0__          | ⚠️ Logged warning      |
| OpenSearch minor number is older. | 5.__1__.2                  | 5.__0__.0          | 🚫 Fatal error      |
| OpenSearch major number is older. | __5__.1.2                  | __4__.0.0          | 🚫 Fatal error      |

## Questions? Problems? Suggestions?

- If you've found a bug or want to request a feature, please create a [GitHub Issue](https://github.com/elastic/kibana/issues/new/choose).
  Please check to make sure someone else hasn't already created an issue for the same topic.
- Need help using OpenSearch Dashboards? Ask away on our [OpenSearch Dashboards Discuss Forum](https://discuss.elastic.co/c/kibana) and a fellow community member or
OpenSearch Dashboards engineer will be glad to help you out.
