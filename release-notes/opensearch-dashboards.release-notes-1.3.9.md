# Version 1.3.9 Release Notes

### 🛡 Security

- [CVE-2022-2499] Resolve qs from 6.5.2 and 6.7.0 to 6.11.0 in 1.x ([#3451](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3451))
- [CVE-2020-36632] [REQUIRES PLUGIN VALIDATION] Bump flat from 4.1.1 to 5.0.2 ([#3539](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3539)). To the best of our knowledge, this is a non-breaking change, but if your plugin relies on `mocha` tests, validate that they still work correctly (and plan to migrate them to `jest` [in preparation for `mocha` deprecation](https://github.com/opensearch-project/OpenSearch-Dashboards/issues/1572).
- [CVE-2023-25653] Bump node-jose to 2.2.0 ([#3445](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3445))
- [CVE-2021-23807] Bump jsonpointer from 4.1.0 to 5.0.1 ([#3535](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3535))
- [CVE-2021-23424] Bump ansi-html from 0.0.7 to 0.0.8 ([#3536](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3536))
- [CVE-2022-24999] Bump express from 4.17.1 to 4.18.2 ([#3542](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3542))

### 📈 Features/Enhancements

- [I18n] Register ru, ru-RU locale ([#2817](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2817))

### 🐛 Bug Fixes

- [TSVB] Fix the link to "serial differencing aggregation" documentation ([#3503](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3503))

### 📝 Documentation

- [TSVB] Fix a spelling error in the README file ([#3518](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3518))
- Simplify the in-code instructions for upgrading `re2` ([#3328](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3328))
- [Doc] Improve DEVELOPER_GUIDE to make first time setup quicker and easier ([#3421](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3421))

### 🛠 Maintenance

- Update MAINTAINERS.md formatting and maintainer list ([#3338](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3338))
- Remove `github-checks-reporter`, an unused dependency ([#3126](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3126))
- [Version] Increment to 1.3.9 ([#3375](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3375))
- Remove the unused `renovate.json5` file ([3489](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3489))