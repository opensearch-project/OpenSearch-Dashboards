## Version 2.19.6 Release Notes

Compatible with OpenSearch and OpenSearch Dashboards version 2.19.6

### Bug Fixes

* Fix blank Discover page when saved queries contain object-type (JSON format) query values ([#11533](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/11533))
* Fix opening links in new tab from table fields ([#11456](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/11456))

### Security

* Prevent privilege escalation via unauthorized data source credential access in multi-data-source deployments ([#12259](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/12259))
* Block `config` type in saved-objects import pipeline and align input handling across data source routes ([#12085](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/12085))
* Harden HTTP redirect path handling to reject malformed request paths ([#12193](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/12193))
* Resolve CVE-2026-28292, CVE-2026-33937, and CVE-2026-25639 by bumping simple-git, handlebars, and axios ([#11628](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/11628))
* Resolve multiple high/medium dependency CVEs including lodash, node-forge, dompurify, minimatch, ajv, tar, hono, and others ([#12257](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/12257))

### Infrastructure

* Pin GitHub Actions to commit SHAs to prevent supply chain attacks ([#12041](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/12041))

### Maintenance

* Backport version increment workflow and bump version to 2.19.6 ([#11988](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/11988))
