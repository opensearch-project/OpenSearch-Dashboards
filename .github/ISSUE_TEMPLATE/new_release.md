---
name: New release
about: "[wazuh-team] Track the effort of the team to release a new version of Wazuh"
title: Support for Wazuh 4.x.x
labels: level/task, type/enhancement
assignees: ''

---

## Description

Example:
> Wazuh 4.3.8 will be released shortly. Our Wazuh Dashboard app need to support this new version. From our side, no changes will be included, so we only need to bump the version.


## Tasks

### Pre-release
- [ ] Add support for Wazuh 4.x.x (bump).
- [ ] Generate the required tags.
- [ ] Generate the packages.
- [ ] Test the packages, to verify they install, and the app works as expected.
- [ ] [Optional] Run Regression Testing (#issue) 
- [ ] Generate draft releases.
- [ ] Notify the @wazuh/cicd and @wazuh/content teams that the release is good to go, from our side.

### Post-release
- [ ] Make draft releases final and public.
- [ ] Sync branches.

### Supported versions

Same as on [previous releases](https://github.com/wazuh/wazuh-dashboard/wiki/Compatibility)
