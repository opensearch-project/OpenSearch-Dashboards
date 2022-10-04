# DataSourceManagement Plugin

An OpenSearch Dashboards plugin for managing the creation, updating, and listing actions for data sources.

## Creation
Required inputs:

- Title: the title of the data source which is unique throughout the instance.
- Endpoint URL: the connection endpoint of the data source.
- Authentication: authentication information for the data source; must be one the two types of authentication currently supported:
  - No Authentication: no authentication required, and
  - Username & Password: authenticating using a username and password combination.

## Update
Endpoint URL is immutable; if you need to change an endpoint URL, a new data source connection needs to be created.

---

## Development

See the [OpenSearch Dashboards contributing
guide](https://github.com/opensearch-project/OpenSearch-Dashboards/blob/main/CONTRIBUTING.md) for instructions
setting up your development environment.
