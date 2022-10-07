## Releasing

This project follows [OpenSearch project branching, labelling, and releasing](https://github.com/opensearch-project/.github/blob/main/RELEASING.md).

## Runbook

### Overview

The OpenSearch project releases as versioned distributions of OpenSearch, OpenSearch Dashboards, and the OpenSearch plugins. This runbook describes in detail how to perform an end-to-end major/minor/patch version release for OpenSearch Dashboards project as the release manager (RM) of this release version. RM is responsible for updating the release status broadly on the release tracking issue on github.

#### Important Dates

- Next minor release: [Version 2.4.0 (November 10, 2022)](https://github.com/orgs/opensearch-project/projects/1#column-19044869)
- Code freeze date for next minor release: [Version 2.4.0 (November 03, 2022)](https://github.com/opensearch-project/openSearch-build/issues/2649#issue-1378667303)

### Release Phase 1 - Preparation

To track the major / minor / patch release, a github issue will be created. The issue will be created on the OpenSearch Dashboards repository for major / minor releases, with the overall issue tracked on the OpenSearch build repository. Only an overall issue will be created on the OpenSearch build repository for patch release.

(Example github issues of [major](https://github.com/opensearch-project/OpenSearch-Dashboards/issues/1548) / [minor](https://github.com/opensearch-project/OpenSearch-Dashboards/issues/2230) / [patch](https://github.com/opensearch-project/opensearch-build/issues/2650) release)

The release manager (RM) will be assigned to the OpenSearch Dashboards release issue and will be responsible for reviewing all tasks in this issue for preparation. It's also a good idea to compare the current release issue to the issue of previous release version at this point to ensure that all new processes have been captured.

RM will review the [public roadmap](https://github.com/orgs/opensearch-project/projects/1) and confirm the release scope with other OpenSearch Dashboards [maintainers](https://github.com/opensearch-project/OpenSearch-Dashboards/blob/main/MAINTAINERS.md) as well as feature owners. All features not ready for current release will be relabeled. For example, if current release version is v2.3.0, all features not ready will be labeled as v2.4.0. (or even later by discussing with the feature owner). After then, RM will need to check all PRs for the current release version are merged into main branch and backported PRs are merged with all CI passed.

#### Prepare BWC data and update BWC versions

Backwards Compatibility Tests (BWC) are cypress tests that verify any changes are backwards compatible with previous versions. RM will generate test data and test locally following instructions [here](https://github.com/opensearch-project/OpenSearch-Dashboards/blob/main/TESTING.md#backwards-compatibility-tests) and cut PR to include both generated data and version upgrade for automated build. (See example [PR](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2393/files))

#### Cut release branch for major / minor release

For major / minor release, RM will need to cut the release branch from the parent branch, [following OpenSearch project branching](https://github.com/opensearch-project/.github/blob/main/RELEASING.md#opensearch-branching)

### Release Phase 2 - Pre-Release

The release process for OpenSearch is centralized. Jenkins workflows are in place to run daily snapshot builds for OpenSearch and OpenSearch Dashboards. RM will update the release branch version in the distribution manifest (see example [PR](https://github.com/opensearch-project/opensearch-build/pull/2586/files)) and increment the parent branch version (see example [PR](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2295/files)).

#### Write release notes

OpenSearch Dashboards maintains a [CHANGELOG.md](https://github.com/opensearch-project/OpenSearch-Dashboards/blob/main/CHANGELOG.md) and verifies it as part of the PR checklist step. For the time being, RM will create release notes PR with the label `doc`, referring to the `CHANGELOG.md` (see example [PR](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/2318))

### Release Phase 3 - Release testing

#### Verify integration and BWC test results

The automated integration test and BWC test are executed concurrently with the release artifacts build. RM should examine the test results and assist in triaging the broken test case.

Example build:

x64: https://build.ci.opensearch.org/job/integ-test-opensearch-dashboards/995/

arm64: https://build.ci.opensearch.org/job/integ-test-opensearch-dashboards/996/

Example test results:
https://opensearch-project.github.io/opensearch-dashboards-functional-test/site/?version=2.3.0&build_number=4104&test_number=996

Note: change `arch` to correspond to the build's processor (CPU) architecture

#### Sanity test with tarball and docker image

Once the release candidate artifacts are built, RM will configure the OpenSearch cluster with OpenSearch Dashboards according to the [instructions in the OpenSearch build repo](https://github.com/opensearch-project/opensearch-build/issues/2447#issuecomment-1241406594) and produce sanity tests to identify broken functionalities caused by new features / code changes. If you find any, please file bug reports and assist in triaging the bugfix.

### Release Phase 4 - Release Announcement

Release artifacts and announcements will be available on https://opensearch.org/. Any website documentation changes will require a PR on the [OpenSearch documentation-website repo.](https://github.com/opensearch-project/documentation-website)

### Release Phase 5 - Post-Release

RM will update the [release page](https://github.com/opensearch-project/OpenSearch-Dashboards/releases/) with the latest download URL and release notes after the release tag created. RM is also advised to conduct a retrospective and publish the findings.
