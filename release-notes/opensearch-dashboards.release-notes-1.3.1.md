## Version 1.3.1 Release Notes

- **[Branding] Allow for SSL setup failures (#1414)(#1417)**

  [Kawika Avilla](mailto:kavilla414@gmail.com)

  Setup HTTP Agent in the render portion when it did not need to be
  it just needed a one time setup for the life time of the server.

  Also if this fails to read the keys then it would fail. But it's
  only used for custom branding. We shouldn't failed for custom branding
  just rely on default branding.

  Issue Resolved:
  https://discuss.opendistrocommunity.dev/t/is-opensearch-dashboard-server-certificate-and-key-required-to-be-reloaded-everytime-when-gui-is-accessed/9069/13

* **[CI][build] Use BUILD_NUMBER for building bundles (#1371)(#1407)**

  [Kawika Avilla](mailto:kavilla414@gmail.com)

  When running a release build for example:

  ```
  yarn build-platform --linux --skip-os-packages --release
  ```

  The build task runs through get_build_number and
  checks how many commits you have locally and determines the
  build number. From there, and this is the value that
  is used to as a cache busting mechanism.

  However, in the release build repo
  https://github.com/opensearch-project/opensearch-build

  When this gets packaged and verified it actually pulls
  from the specified branch and only retrieves the HEAD
  commit. Thus making the count of commits locally equal
  to `1` and get_build_number always return `1` for releases
  essentially breaking the cache buster.

  The build repo however, sets an env variable of `BUILD_NUMBER`
  so if this value is available it will use it instead of commit
  count.

  The CI runs the unit tests and only gets the latest commit as well
  so instead of setting a env build number and basically creating
  the same unit test only check this locally.

  Issues resolved:

  - opensearch-project/opensearch-build#1769
  - #1363

* **[Improvement] node healthcheck optimization (#1386)**

  [Kawika Avilla](mailto:kavilla414@gmail.com)

  Health check when enabled checked the entire cluster to get
  the value set from the nodeId. Switching the health check to
  query /\_cluster/state/nodes should provide the same data needed
  for the health check without transmitting the rest of the
  cluster state data over the network.

  Issue:
  #1354
