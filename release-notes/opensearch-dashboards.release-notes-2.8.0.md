## Version 2.8.0 Release Notes

### 🛡 Security

- [CVE-2023-2251] Bump yaml to `2.2.2` ([#3947](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3947))

### 📈 Features/Enhancements

- [Multiple Datasource] Support Amazon OpenSearch Serverless ([#3957](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3957))
- Add support for Node.js >=14.20.1 <19 ([#4071](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4071))
- Bundle Node.js 14 as a fallback for operating systems that cannot run Node.js 18 ([#4151](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4151))
- Enhance grouping for context menus ([#3924](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3924))

### 🐛 Bug Fixes

- [BUG] Fix bottom bar visibility using createPortal ([#3978](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3978))

### 🚞 Infrastructure

- Add threshold to code coverage config to prevent workflow failures ([#4040](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4040))
- [CI] Skip checksum verification on OpenSearch snapshot for cypress tests ([#4188](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4188))

### 🛠 Maintenance

- Use `exec` in the CLI shell scripts to prevent new process creation ([#3955](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3955))
- Remove timeline application ([#3971](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3971))

## 🎉 Welcome

Thank you to all the first-time contributors who made this release possible: @sikhote, @SergeyMyssak!
