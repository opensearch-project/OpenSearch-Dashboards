## Version 1.0.0 Release Notes


* __Revert &#34;Default to converting folder name for cli plugin to kebab-case (#357)&#34; (#578)__

    [Kawika Avilla](mailto:kavilla414@gmail.com) - Thu, 1 Jul 2021 14:39:55 -0700
    
    This reverts commit 747ef8eb6fc15b62c26a9af832561254b3522c42.
     Reverting for now because the full impact is not known and requires
    subsequent commits to mitigate confusion related to CLI output.
     Also, it seems like in the code there exists verification on the code
    that
    plugins should explicitly be camelCase. So this merits more
    discussion.
    
    Issues related:
    
    https://github.com/opensearch-project/OpenSearch-Dashboards/issues/322
    
    https://github.com/opensearch-project/OpenSearch-Dashboards/issues/465
    
    https://github.com/opensearch-project/OpenSearch-Dashboards/issues/366
     
    Signed-off-by: Kawika Avilla &lt;kavilla414@gmail.com&gt;

* __[DOCS] Replace settings and help menu links (#565)__

    [Kawika Avilla](mailto:kavilla414@gmail.com) - Wed, 30 Jun 2021 11:09:10 -0700
    
    Replacing previous upstream references with working links.
    This does not fully
    resolve the current issue due to the link
    being replaced with a temporary
    link, and the link directing
    to related documentation if it exists but some do
    not so it
    sends it to the basic OpenSearch Dashboards documentation which
    is
    a bad experience but better than a 404.
     
    Partially resolves:
    
    https://github.com/opensearch-project/OpenSearch-Dashboards/issues/335
     
    Will track replacement with:
    
    https://github.com/opensearch-project/OpenSearch-Dashboards/issues/335
     
    Signed-off-by: Kawika Avilla &lt;kavilla414@gmail.com&gt;

* __Require `trim-newlines` v3.0.1__

    [Tommy Markley](mailto:markleyt@amazon.com) - Wed, 30 Jun 2021 12:14:56 -0500
    
    
    Addresses https://github.com/advisories/GHSA-7p7h-4mm5-852v
    
    Signed-off-by: Tommy Markley &lt;markleyt@amazon.com&gt;
    

* __Require `front-matter` v4.0.2, fix resolutions__

    [Tommy Markley](mailto:markleyt@amazon.com) - Wed, 30 Jun 2021 11:53:36 -0500
    
    
    Addresses
    [WS-2020-0341](https://github.com/jxson/front-matter/commit/f71652cfef6f296f7b5ab495461914ae61d76da2)
    
    Also removes unnecessary resolutions for dependencies that didn&#39;t have 
    conflicts.
    
    `front-matter` 2.1.2 is a downstream dependency of `sass-lint` which is an
    unmaintained repo without any newer versions. I&#39;ve opened #551 to address this
    as a longer-term solution.
    
    Upgrades [front-matter](https://github.com/jxson/front-matter) from 2.1.2 to
    4.0.2
    - [Release notes](https://github.com/jxson/front-matter/releases)
    - [Commits](https://github.com/jxson/front-matter/compare/v2.1.2...v4.0.2)
    
    Signed-off-by: Tommy Markley &lt;markleyt@amazon.com&gt;
    

* __Bump Node.js from 10.23.1 to 10.24.1__

    [Tommy Markley](mailto:markleyt@amazon.com) - Wed, 30 Jun 2021 11:53:12 -0500
    
    
    Bumps [node](https://github.com/nodejs/node) from 10.23.1 to 10.24.1
    - [Release
    notes](https://github.com/nodejs/node/blob/master/doc/changelogs/CHANGELOG_V10.md#10.24.1)
    
    Signed-off-by: Tommy Markley &lt;markleyt@amazon.com&gt;
    

* __Upgrade chromedriver, match version in Dockerfile__

    [Tommy Markley](mailto:markleyt@amazon.com) - Wed, 30 Jun 2021 11:15:44 -0500
    
    
    Functional tests were failing in Jenkins pipelines because Docker was pulling
    the latest version of Chrome instead of using the same version that is defined
    for `chromedriver`. This changes fixes that bug by fetching a specific version
    of Chrome.
    
    Upgrades [chromedriver](https://github.com/giggio/node-chromedriver) from
    88.0.0 to 91.0.1
    - [Release notes](https://github.com/giggio/node-chromedriver/releases)
    
    Issues Addressed: 
    https://github.com/opensearch-project/OpenSearch-Dashboards/issues/546
    
    Signed-off-by: Tommy Markley &lt;markleyt@amazon.com&gt;
    

* __Require lodash v4.17.21__

    [Tommy Markley](mailto:markleyt@amazon.com) - Tue, 29 Jun 2021 12:24:39 -0500
    
    
    Addresses https://github.com/advisories/GHSA-35jh-r3h4-6jhm
    
    Removes previous resolutions for lodash and adds a single resolution. Also,
    bumps @types/lodash from 4.14.159 to 4.14.170.
    
    Signed-off-by: Tommy Markley &lt;markleyt@amazon.com&gt;
    

* __Bump yeoman-generator from 1.1.1 to 4.13.0__

    [Tommy Markley](mailto:markleyt@amazon.com) - Tue, 29 Jun 2021 12:24:16 -0500
    
    
    Addresses security vulnerabilities related to versions of diff before v3.5.0.
    
    v4.13.0 is the most recent version that supports Node v10. None of the breaking
    changes listed impact the build.
    - [Release notes](https://github.com/yeoman/generator/releases)
    - [Commits](https://github.com/yeoman/generator/compare/v1.1.1...v4.13.0)
    
    Signed-off-by: Tommy Markley &lt;markleyt@amazon.com&gt;
    

* __Bump prismjs from 1.23.0 to 1.24.0__

    [dependabot[bot]](mailto:49699333+dependabot[bot]@users.noreply.github.com) - Tue, 29 Jun 2021 12:12:44 -0500
    
    
    Bumps [prismjs](https://github.com/PrismJS/prism) from 1.23.0 to 1.24.0.
    - [Release notes](https://github.com/PrismJS/prism/releases)
    - [Changelog](https://github.com/PrismJS/prism/blob/master/CHANGELOG.md)
    - [Commits](https://github.com/PrismJS/prism/compare/v1.23.0...v1.24.0)
    
    --- updated-dependencies:
    - dependency-name: prismjs
     dependency-type: indirect
    ...
    
    Signed-off-by: dependabot[bot] &lt;support@github.com&gt;

* __[Test] Remove verify consistency of modes of files (#540)__

    [Anan](mailto:79961084+ananzh@users.noreply.github.com) - Tue, 29 Jun 2021 10:12:18 -0700
    
    
    With existing fixture, test verify consistency of modes of files 
    inside
    zip.test.js fails. This is due to diff file mode in different
    system when
    doing same command or operation. For example,
    in our ubuntu, when create a
    file using mkdir cmd, the file mode
    is 775. But local machine, the file mode
    is 755.
     After unzip executable has mode 777 and not-executable has
    mode 644. These
    two numbers are fixed. They are not dependent
    on diff system or folder mode
    where you unzip the files. However,
    the following two results:
    ```
    path.resolve(tempPath,'executable')
    path.resolve(tempPath,'not-executable')
    ```
    are dependent on tempPath mode because it will use the lower mode.
    For example
    (use mode# directly below):
    1)If tempPath is 775 then:
    ```
    path.resolve(775, 777) —->775
    path.resolve(775, 644) —-> 644
    ```
    2)If tempPath is 755 then:
    ```
    path.resolve(775, 777) —->755
    path.resolve(775, 644) —-> 644
    ```
    Therefore, this
    unit test case result is dependent on the mode of
    tempPath which is affected
    by your system or system settings.
     After investigation and discussion, this PR remove this
    specific test case.
    The meaning of this test case is to test
    whether extractArchive function
    extract files with same
    permission when they archive. However, getMode
    function
    in this test suite is system env dependent which doesn’t
    serve the
    purpose of this test case.
     Since it is a broken test, we will remove this one and open
    an issue to
    investigate alternative ways to check file mode.
     
    Issues resolved:
    
    https://github.com/opensearch-project/OpenSearch-Dashboards/issues/4
     
    Signed-off-by: Anan Zhuang &lt;ananzh@amazon.com&gt;

* __Upgrade glob-parent related dependencies__

    [Tommy Markley](mailto:markleyt@amazon.com) - Mon, 28 Jun 2021 17:48:20 -0500
    
    
    Addresses [CVE-2020-28469](https://github.com/advisories/GHSA-ww39-953v-wcq6)
    
    There are additional dependencies that have a downstream dependency on older
    versions of `glob-parent`, but those packages either don&#39;t have a newer version
    or the newer versions introduce breaking changes. One example is `globby`,
    which introduces many breaking changes. A manual resolution for `glob-parent`
    works in this case to address the CVE.
    
    Signed-off-by: Tommy Markley &lt;markleyt@amazon.com&gt;
    

* __Upgrade merge from 1.2.1 to 2.1.1__

    [Tommy Markley](mailto:markleyt@amazon.com) - Mon, 28 Jun 2021 12:50:35 -0500
    
    efs/remotes/origin/add_unit_test_for_healthcheck, refs/heads/xsrf
    Addresses https://github.com/advisories/GHSA-7wpw-2hjm-89gp
    
    Bumps [merge](https://github.com/yeikos/js.merge) from 1.2.1 to 2.1.1
    - [Release notes](https://github.com/yeikos/js.merge/releases)
    - [Commits](https://github.com/yeikos/js.merge/compare/v1.2.1...v2.1.1)
    
    Merge 1.2.1 is a downstream dependency of `sass-lint` which is an unmaintained
    repo without any newer versions. I&#39;ve opened
    [#551](https://github.com/opensearch-project/OpenSearch-Dashboards/issues/551) 
    to address this as a longer-term solution.
    
    Signed-off-by: Tommy Markley &lt;markleyt@amazon.com&gt;
    

* __Require `ejs` v3.1.6__

    [Tommy Markley](mailto:markleyt@amazon.com) - Mon, 28 Jun 2021 12:50:11 -0500
    
    
    Addresses
    [WS-2021-0153](https://github.com/mde/ejs/commit/abaee2be937236b1b8da9a1f55096c17dda905fd)
    
    `ejs` is a downstream dependency of `yeoman-generator`, and the newest version
    of that package still depends on the older version of `ejs`.
    
    Bumps [ejs](https://github.com/mde/ejs) from 2.7.4/3.1.5 to 3.1.6
    - [Release notes](https://github.com/mde/ejs/releases)
    - [Changelog](https://github.com/mde/ejs/blob/v3.1.6/CHANGELOG.md)
    - [Commits](https://github.com/mde/ejs/compare/v2.7.4...v3.1.6)
    
    Signed-off-by: Tommy Markley &lt;markleyt@amazon.com&gt;
    

* __Upgrade normalize-url related dependencies__

    [Tommy Markley](mailto:markleyt@amazon.com) - Mon, 28 Jun 2021 12:29:54 -0500
    
    
    Addresses https://github.com/advisories/GHSA-px4h-xg32-q955
    
    Require [normalize-url](https://github.com/sindresorhus/normalize-url) 4.5.1
    - [Release notes](https://github.com/sindresorhus/normalize-url/releases)
    
    Bumps
    [mini-css-extract-plugin](https://github.com/webpack-contrib/mini-css-extract-plugin)
    from 0.8.0 to 1.6.0
    - This upgrade removed the need to filter out related warnings from webpack stats.
    - [Release notes](https://github.com/webpack-contrib/mini-css-extract-plugin/releases)
    - [Changelog](https://github.com/webpack-contrib/mini-css-extract-plugin/blob/v1.6.0/CHANGELOG.md)
    - [Commits](https://github.com/webpack-contrib/mini-css-extract-plugin/compare/v0.8.0...v1.6.0)
    
    Bumps [tsd](https://github.com/SamVerschueren/tsd) from 0.13.1 to 0.16.0
    - This is the most recent version that still supports Node.js v10.
    - [Release notes](https://github.com/SamVerschueren/tsd/releases)
    - [Commits](https://github.com/SamVerschueren/tsd/compare/v0.13.1...v0.16.0)
    
    Bumps [ms-chromium-edge-driver](https://github.com/dmlemeshko/ms-edge-driver)
    from 0.2.3 to 0.4.3
    - [Release notes](https://github.com/dmlemeshko/ms-edge-driver/releases)
    - [Commits](https://github.com/dmlemeshko/ms-edge-driver/compare/0.2.3...0.4.3)
    
    Signed-off-by: Tommy Markley &lt;markleyt@amazon.com&gt;
    

* __Bump color-string from 1.5.3 to 1.5.5__

    [dependabot[bot]](mailto:49699333+dependabot[bot]@users.noreply.github.com) - Mon, 28 Jun 2021 11:43:14 -0500
    
    
    Bumps [color-string](https://github.com/Qix-/color-string) from 1.5.3 to 1.5.5.
    - [Release notes](https://github.com/Qix-/color-string/releases)
    - [Changelog](https://github.com/Qix-/color-string/blob/master/CHANGELOG.md)
    - [Commits](https://github.com/Qix-/color-string/commits/1.5.5)
    
    --- updated-dependencies:
    - dependency-name: color-string
     dependency-type: indirect
    ...
    
    Signed-off-by: dependabot[bot] &lt;support@github.com&gt;

* __Bump dot-prop from 4.2.0 to 4.2.1__

    [dependabot[bot]](mailto:49699333+dependabot[bot]@users.noreply.github.com) - Mon, 28 Jun 2021 11:36:31 -0500
    
    
    Bumps [dot-prop](https://github.com/sindresorhus/dot-prop) from 4.2.0 to 4.2.1.
    - [Release notes](https://github.com/sindresorhus/dot-prop/releases)
    - [Commits](https://github.com/sindresorhus/dot-prop/compare/v4.2.0...v4.2.1)
    
    --- updated-dependencies:
    - dependency-name: dot-prop
     dependency-type: indirect
    ...
    
    Signed-off-by: dependabot[bot] &lt;support@github.com&gt;

* __[DOCS] Replace edit_index_pattern link (#553)__

    [Kawika Avilla](mailto:kavilla414@gmail.com) - Sat, 26 Jun 2021 02:23:30 -0700
    
    
    Replacing previous upstream reference within the edit index
    pattern page. This
    does not fully resolve the current issue
    due to the link being replaced with a
    temporary link, and
    the link being related to Mappings API documentation but
    does not fully replace the content that the original provided.
    
    Partially resolves:
    
    https://github.com/opensearch-project/OpenSearch-Dashboards/issues/482
    
    Will track replacement with:
    
    https://github.com/opensearch-project/OpenSearch-Dashboards/issues/335
     
    Signed-off-by: Kawika Avilla &lt;kavilla414@gmail.com&gt;

* __Require kind-of v6.0.3__

    [Tommy Markley](mailto:markleyt@amazon.com) - Fri, 25 Jun 2021 21:57:01 -0500
    
    
    Addresses known CVE: https://github.com/advisories/GHSA-6c8f-qphg-qjgp
    
    Signed-off-by: Tommy Markley &lt;markleyt@amazon.com&gt;
    

* __[Test] Enable unit test suite: telemetry_sender.test.ts (#500)__

    [Anan](mailto:79961084+ananzh@users.noreply.github.com) - Fri, 25 Jun 2021 17:14:57 -0700
    

     All the unit tests related to unused telemetry are temporarily
    skipped at
    forking. Unit tests of the disabled telemetry
    functions should also be
    modified correspondingly. To build
    a clean unit test, we decide to modify and
    enable all the
    working unit tests. This PR remove all the original comment out lines. If needs restore the unit test, can revert this commit.
     
    Signed-off-by: Anan Zhuang &lt;ananzh@amazon.com&gt;

* __[Test] Enable unit test suite: telemetry_service.test.ts (#499) (#502)__

    [Anan](mailto:79961084+ananzh@users.noreply.github.com) - Fri, 25 Jun 2021 17:09:56 -0700
    
    
    All the unit tests related to unused telemetry are temporarily
    skipped after
    the fork. Unit tests of the disabled telemetry
    functions should also be
    modified correspondingly. To build
    a clean unit test, we decide to modify and
    enable all the
    working unit tests. This PR modifies and enables
    telemetry_service.test.ts.
    
    There is one test case left: calls expected URL with 20 minutes
    This test
    case is skipped due to function fetchTelemetry is disabled.
    We should enable
    this test when fetchTelemtry function is restored.
     Partially solved issue:
    
    https://github.com/opensearch-project/OpenSearch-Dashboards/issues/499
     
    Signed-off-by: Anan Zhuang &lt;ananzh@amazon.com&gt;

* __[Test] Enable unit test suite: get_local_stats.test.ts (#528)__

    [Anan](mailto:79961084+ananzh@users.noreply.github.com) - Fri, 25 Jun 2021 17:09:33 -0700
    
    * All the unit tests related to unused telemetry are temporarily
    skipped after
    the fork. Unit tests of the disabled telemetry
    functions should also be
    modified correspondingly. To build
    a clean unit test, we decide to modify and
    enable all the
    working unit tests. This PR checks and enables
    get_local_stats.test.ts.
     
    Signed-off-by: Anan Zhuang &lt;ananzh@amazon.com&gt;
    
    * Remove unit test case related to xpack
     Remove test case: returns expected object with xpack
    This is a unit test case
    related to xpack which does
    not exist in dashboards code.
    
    Signed-off-by: Anan Zhuang &lt;ananzh@amazon.com&gt;

* __[Test] Enable unit test suites in telemetry_management_section (#534)__

    [Anan](mailto:79961084+ananzh@users.noreply.github.com) - Fri, 25 Jun 2021 17:08:40 -0700
    
    
    All the unit tests related to unused telemetry are temporarily
    skipped after
    the fork. Unit tests of the disabled telemetry
    functions should also be
    modified correspondingly. To build
    a clean unit test, we decide to modify and
    enable all the
    working unit tests. This PR checks and enables three test
    suites in src/plugins/telemetry_management_section including   opt_in_example_flyout.test.tsx,
    opt_in_security_example_flyout.test.tsx,
    and
    telemetry_management_section.test.tsx.
     
    Issues resolved:
    
    https://github.com/opensearch-project/OpenSearch-Dashboards/issues/519
    
    https://github.com/opensearch-project/OpenSearch-Dashboards/issues/520
    
    https://github.com/opensearch-project/OpenSearch-Dashboards/issues/521
     
    Signed-off-by: Anan Zhuang &lt;ananzh@amazon.com&gt;

* __Bump path-parse from 1.0.6 to 1.0.7__

    [Tommy Markley](mailto:markleyt@amazon.com) - Fri, 25 Jun 2021 15:23:36 -0500
    
    
    Addresses [CVE-2021-23343](https://nvd.nist.gov/vuln/detail/CVE-2021-23343)
    
    Bumps [path-parse](https://github.com/jbgutierrez/path-parse) from 1.0.6 to
    1.0.7
    - [Release notes](https://github.com/jbgutierrez/path-parse/releases)
    - [CVE Issue](https://github.com/jbgutierrez/path-parse/issues/8)
    
    Signed-off-by: Tommy Markley &lt;markleyt@amazon.com&gt;
    

* __Bump set-getter from 0.1.0 to 0.1.1__

    [dependabot[bot]](mailto:49699333+dependabot[bot]@users.noreply.github.com) - Fri, 25 Jun 2021 15:22:36 -0500
    
    
    Bumps [set-getter](https://github.com/doowb/set-getter) from 0.1.0 to 0.1.1.
    - [Release notes](https://github.com/doowb/set-getter/releases)
    - [Commits](https://github.com/doowb/set-getter/commits/0.1.1)
    
    --- updated-dependencies:
    - dependency-name: set-getter
     dependency-type: indirect
    ...
    
    Signed-off-by: dependabot[bot] &lt;support@github.com&gt;

* __[Test] Enable unit test suites in telemetry/public/components (#532)__

    [Anan](mailto:79961084+ananzh@users.noreply.github.com) - Fri, 25 Jun 2021 12:44:46 -0700
    
    
    All the unit tests related to unused telemetry are temporarily
    skipped after
    the fork. Unit tests of the disabled telemetry
    functions should also be
    modified correspondingly. To build
    a clean unit test, we decide to modify and
    enable all the working unit tests. This PR enables three test suites in dir src/plugins/telemetry/public/components, which includes:
    1)
    opt_in_banner.test.tsx
    2) opt_in_message.test.tsx
    3)
    opted_in_notice_banner.test.tsx
    
    Signed-off-by: Anan Zhuang &lt;ananzh@amazon.com&gt;

* __Add RELEASING.md (#545)__

    [Kawika Avilla](mailto:kavilla414@gmail.com) - Fri, 25 Jun 2021 12:00:14 -0700
    
    
    Add a RELEASING.md that links to the following:
    
    https://github.com/opensearch-project/.github/blob/main/RELEASING.md
     Coming from https://github.com/opensearch-project/.github/issues/13,
    to
    standardized release process for all OpenSearch repos.
    
    Issues resolved:
    
    https://github.com/opensearch-project/OpenSearch-Dashboards/issues/527
     
    Signed-off-by: Kawika Avilla &lt;kavilla414@gmail.com&gt;

* __Bump webpack-dev-server from 3.8.2 to 3.11.0__

    [Tommy Markley](mailto:markleyt@amazon.com) - Fri, 25 Jun 2021 10:41:35 -0500
    
    
    This addresses known security vulnerabilities related to node-forge.
    
    Signed-off-by: Tommy Markley &lt;markleyt@amazon.com&gt;
    

* __[Test] Enable unit test suite: help.test.ts (#487) (#489)__

    [Anan](mailto:79961084+ananzh@users.noreply.github.com) - Thu, 24 Jun 2021 15:53:27 -0700
    
    
    Help.test.ts is skipped for no specific reasons. To make a clean
    unit test, 
    we enabled and modified help.test.ts to match the
    corresponding inline
    snapshots.
    
    Signed-off-by: Anan Zhuang &lt;ananzh@amazon.com&gt;

* __[Test] Enable unit test suite: render_opt_in_banner.test.ts (#503) (#505)__

    [Anan](mailto:79961084+ananzh@users.noreply.github.com) - Wed, 23 Jun 2021 22:58:21 -0700
    
    All the unit tests related to unused telemetry are temporarily
    skipped after
    the fork. Unit tests of the disabled telemetry
    functions should also be
    modified correspondingly. To build
    a clean unit test, we decide to modify and
    enable all the
    working unit tests. This PR modifies and enables
    render_opt_in_banner.test.ts.
     
    Signed-off-by: Anan Zhuang &lt;ananzh@amazon.com&gt;

* __[Test] Enable unit test suite: render_opted_in_notice_banner.test.ts(#504) (#506)__

    [Anan](mailto:79961084+ananzh@users.noreply.github.com) - Wed, 23 Jun 2021 22:57:59 -0700
    
    
    All the unit tests related to unused telemetry are temporarily
    skipped after
    the fork. Unit tests of the disabled telemetry
    functions should also be
    modified correspondingly. To build
    a clean unit test, we decide to modify and
    enable all the
    working unit tests. This PR modifies and enables
    render_opted_in_notice_banner.test.ts.
     
    Signed-off-by: Anan Zhuang &lt;ananzh@amazon.com&gt;

* __[Test] Enable unit test suite:telemetry_notifications (#507) (#522)__

    [Anan](mailto:79961084+ananzh@users.noreply.github.com) - Wed, 23 Jun 2021 22:57:41 -0700
    
    
    All the unit tests related to unused telemetry are temporarily
    skipped after
    the fork. Unit tests of the disabled telemetry
    functions should also be
    modified correspondingly. To build
    a clean unit test, we decide to modify and
    enable all the
    working unit tests. This PR checks and enables
    telemetry_notifications.test.ts.
    
    Signed-off-by: Anan Zhuang &lt;ananzh@amazon.com&gt;

* __[Test] Enable unit test suite: fetcher.test.ts (#508) (#523)__

    [Anan](mailto:79961084+ananzh@users.noreply.github.com) - Wed, 23 Jun 2021 22:57:26 -0700
    
    
    All the unit tests related to unused telemetry are temporarily
    skipped after
    the fork. Unit tests of the disabled telemetry
    functions should also be
    modified correspondingly. To build
    a clean unit test, we decide to modify and
    enable all the
    working unit tests. This PR checks and enables fetcher.test.ts.
    
     The unit test &#39;fetches usage and send telemetry&#39; checks function
    sendIfDue in
    FetcherTask class. The mocked FetcherTask object
    calls function
    updateLastReported which calls another function
    updateTelemetrySavedObject.
    However, there is no parameter
    passed as requested. Therefore, this unit test
    shows a TypeError
    due to undefined parameter.
     We can either 1)mock updateTelemetrySavedObject because
    the purpose of this
    test suite is to test FetcherTask class 2)mock
    a SavedObjectsClientContract
    parameter and pass it to function
    updateTelemetrySavedObject. This PR uses
    option 1.
    
    Signed-off-by: Anan Zhuang &lt;ananzh@amazon.com&gt;

* __[Test] Enable unit test suite: get_cluster_info.test.ts (#509) (#524)__

    [Anan](mailto:79961084+ananzh@users.noreply.github.com) - Wed, 23 Jun 2021 22:56:52 -0700
    
    
    All the unit tests related to unused telemetry are temporarily
    skipped after
    the fork. Unit tests of the disabled telemetry
    functions should also be
    modified correspondingly. To build
    a clean unit test, we decide to modify and
    enable all the
    working unit tests. This PR checks and enables
    get_cluster_info.test.ts.
    
    Signed-off-by: Anan Zhuang &lt;ananzh@amazon.com&gt;

* __[Test] Enable unit test suite: get_cluster_stats.test.ts (#510) (#525)__

    [Anan](mailto:79961084+ananzh@users.noreply.github.com) - Wed, 23 Jun 2021 22:56:31 -0700
    
    
    All the unit tests related to unused telemetry are temporarily
    skipped after
    the fork. Unit tests of the disabled telemetry
    functions should also be
    modified correspondingly. To build
    a clean unit test, we decide to modify and
    enable all the
    working unit tests. This PR checks and enables
    get_cluster_stats.test.ts.
    
    Signed-off-by: Anan Zhuang &lt;ananzh@amazon.com&gt;

* __[Test] Enable unit test suite: get_nodes_usage.test.ts (#513) (#529)__

    [Anan](mailto:79961084+ananzh@users.noreply.github.com) - Wed, 23 Jun 2021 22:55:53 -0700
    
    
    All the unit tests related to unused telemetry are temporarily
    skipped after
    the fork. Unit tests of the disabled telemetry
    functions should also be
    modified correspondingly. To build
    a clean unit test, we decide to modify and
    enable all the
    working unit tests. This PR checks and enables
    get_nodes_usage.test.ts.
    
    Signed-off-by: Anan Zhuang &lt;ananzh@amazon.com&gt;

* __[Test] Enable unit test suite:get_data_telemetry.test.ts (#514) (#530)__

    [Anan](mailto:79961084+ananzh@users.noreply.github.com) - Wed, 23 Jun 2021 22:55:49 -0700
    
    
    All the unit tests related to unused telemetry are temporarily
    skipped after
    the fork. Unit tests of the disabled telemetry
    functions should also be
    modified correspondingly. To build
    a clean unit test, we decide to modify and
    enable all the
    working unit tests. This PR checks and enables  
    get_data_telemetry.test.ts.
    
    Signed-off-by: Anan Zhuang &lt;ananzh@amazon.com&gt;

* __[Test] Enable unit test suite:get_telemetry_saved_object (#515) (#531)__

    [Anan](mailto:79961084+ananzh@users.noreply.github.com) - Wed, 23 Jun 2021 22:55:41 -0700
    
    
    All the unit tests related to unused telemetry are temporarily
    skipped after
    the fork. Unit tests of the disabled telemetry
    functions should also be
    modified correspondingly. To build
    a clean unit test, we decide to modify and
    enable all the
    working unit tests. This PR checks and enables 
    get_telemetry_saved_object.test.ts.
    
    Signed-off-by: Anan Zhuang &lt;ananzh@amazon.com&gt;

* __Bump merge-deep from 3.0.2 to 3.0.3__

    [dependabot[bot]](mailto:49699333+dependabot[bot]@users.noreply.github.com) - Wed, 23 Jun 2021 13:46:29 -0500
    
    
    Bumps [merge-deep](https://github.com/jonschlinkert/merge-deep) from 3.0.2 to
    3.0.3.
    - [Release notes](https://github.com/jonschlinkert/merge-deep/releases)
    - [Commits](https://github.com/jonschlinkert/merge-deep/compare/3.0.2...3.0.3)
    
    --- updated-dependencies:
    - dependency-name: merge-deep
     dependency-type: indirect
    ...
    
    Signed-off-by: dependabot[bot] &lt;support@github.com&gt;

* __Bump node-sass to address LibSass vulnerabilities__

    [Tommy Markley](mailto:markleyt@amazon.com) - Wed, 23 Jun 2021 13:40:53 -0500
    
    
    There are a few known security vulnerabilities related to the version of
    node-sass used in the repo. Both node-sass and LibSass are deprecated, but
    replacing node-sass with dart-sass fails because EUI does not follow the
    standard Sass spec. This results in a SassError:
    `Top-level selectors may not contain the parent selector &#34;&amp;&#34;`. Resolving this
    problem will have to be done in the long-term, but for now there are branches
    of node-sass that exist with a newer version of LibSass that does not contain
    any known security vulnerabilities. Unfortunately, these changes don&#39;t exist in
    any of the main releases, so we must use a specific branch (v5).
    
    Details are on the main Sass website: 
    https://sass-lang.com/blog/libsass-is-deprecated
    
    Signed-off-by: Tommy Markley &lt;markleyt@amazon.com&gt;
    

* __[Test] Enable unit test suite: api.test.ts (#490) (#495)__

    [Anan](mailto:79961084+ananzh@users.noreply.github.com) - Tue, 22 Jun 2021 21:50:29 -0700
    
    
    All the unit tests related to unused newsfeed are temporarily
    skipped at
    forking. To build a clean unit test, we decide to
    check and enable all the
    working unit tests. This PR checks
    and enables api.test.ts.
    
    Signed-off-by: Anan Zhuang &lt;ananzh@amazon.com&gt;

* __[Test] Enable unit test suite: empty_news.test.tsx (#491) (#496)__

    [Anan](mailto:79961084+ananzh@users.noreply.github.com) - Tue, 22 Jun 2021 21:50:11 -0700
    
    
    All the unit tests related to unused newsfeed are temporarily
    skipped at
    forking. To build a clean unit test, we decide to
    check and enable all the
    working unit tests. This PR checks
    and enables empty_news.test.tsx.
    
    Signed-off-by: Anan Zhuang &lt;ananzh@amazon.com&gt;

* __[Test] Enable unit test suite: loading_news.test.tsx (#492) (#497)__

    [Anan](mailto:79961084+ananzh@users.noreply.github.com) - Tue, 22 Jun 2021 21:49:37 -0700
    
    
    All the unit tests related to unused newsfeed are temporarily
    skipped at
    forking. To build a clean unit test, we decide to
    check and enable all the
    working unit tests. This PR checks
    and enables loading_news.test.tsx.
    
    Signed-off-by: Anan Zhuang &lt;ananzh@amazon.com&gt;

* __[Build] deprecate renamed configurations (#493)__

    [Kawika Avilla](mailto:kavilla414@gmail.com) - Tue, 22 Jun 2021 12:01:53 -0700
    
    
    While renaming after the fork, configurations were renamed
    and replaced with
    keywords related to OpenSearch.
     This meant that anyone who migrated to OpenSearch Dashboards
    who had
    configured their YAML file no longer were able to
    carry over those changes and
    run the application. This
    prevented the application from starting due to
    unknown config
    keys. Although, this still does not allow the application to
    
    work out of the box because people will need to make sure
    then rename their
    kibana.yml to opensearch_dashboards.yml,
    but once they do they do not need to
    modify the content
    of the config.
     Added unit tests to test on the server configs.
    
    Issues resolved:
    
    https://github.com/opensearch-project/OpenSearch-Dashboards/issues/440
     Partially resolves:
    
    https://github.com/opensearch-project/OpenSearch-Dashboards/issues/334
    
    Signed-off-by: Kawika Avilla &lt;kavilla414@gmail.com&gt;

* __[Test] Enable unit test suite: schema_error.test.ts (#486) (#488)__

    [Anan](mailto:79961084+ananzh@users.noreply.github.com) - Tue, 22 Jun 2021 08:40:14 -0700
    
    
    Schema_error.test.ts is skipped due to no decision around error
    handling and
    it fails depending on Node version in 2017. There are
    some possible reasons:
    1)nodejs is bumps to 8 in 2018 which
    affected error handling 2)boom is used
    to handle http errors which
    is also dependent on nodejs version. Since we
    forked from v7.10.2
    which has a stable nodejs v10.23.1, we will enable this
    unit test.
    
    Signed-off-by: Anan Zhuang &lt;ananzh@amazon.com&gt;

* __Bump axios related dependencies__

    [Tommy Markley](mailto:markleyt@amazon.com) - Mon, 21 Jun 2021 17:21:45 -0500
    
    
    Dependabot bumped axios from 0.19.2 to 0.21.1 in #434, but the older version of
    axios remained in the lockfile. Using `yarn why axios`, we can see that the
    older version is a dependency of `@percy/agent`,
    `backport`, and `chromedriver`. By bumping each of these to the latest 
    compatible versions we can properly eliminate the old version of axios from the
    lockfile.
    
    Signed-off-by: Tommy Markley &lt;markleyt@amazon.com&gt;
    

* __[Build] use saved config from valid kbn version (#485)__

    [Kawika Avilla](mailto:kavilla414@gmail.com) - Fri, 18 Jun 2021 13:45:10 -0700
    
    
    OpenSearch Dashboards supports restart upgrades from Kibana 6.8.0
    through
    Kibana 7.10.2 and to OpenSearch Dashboards 1.0. Noting that
    the semantic
    version of the application went from high to low. The
    application would check
    if the config saved had a version less than
    or equal to the current version.
    If not then it would skip migrating
    the settings to the current version.
     This updates enables to migrate settings from Kibana 6.8.0 through
    7.10.2 if
    and only if the current version of OpenSearch Dashboards
    is 1.0.0.
    
    Issues partially resolved:
    
    https://github.com/opensearch-project/OpenSearch-Dashboards/issues/334
    
    Signed-off-by: Kawika Avilla &lt;kavilla414@gmail.com&gt;

* __[Build] restore visTypeVega (#484)__

    [Kawika Avilla](mailto:kavilla414@gmail.com) - Thu, 17 Jun 2021 22:41:44 -0700
    
    
    Restoring the visTypeVega.config from openSearchDashboards to
    kibana and then
    updated the tests. This is allowable because this is
    for functional purposes
    and for clusters/plugins that will migrate
    to Dashboards. Their index will not
    require re-indexing for 1.0.0
    and won&#39;t require migration after further
    updates.
     Primarily, from what I can tell, impacted saved maps.
    
    Issues partially resolved: 
    https://github.com/opensearch-project/OpenSearch-Dashboards/issues/334
    
    Signed-off-by: Kawika Avilla &lt;kavilla414@gmail.com&gt;

* __Add proper dependency resolution for immer__

    [Tommy Markley](mailto:markleyt@amazon.com) - Wed, 16 Jun 2021 15:46:45 -0500
    
    
    Dependabot bumped immer from 1.10.0 to 8.0.1 in #433, but it did not add a
    resolution to prevent older versions from remaining in the lockfile.
    
    Signed-off-by: Tommy Markley &lt;markleyt@amazon.com&gt;
    

* __Add proper dependency resolution for locutus__

    [Tommy Markley](mailto:markleyt@amazon.com) - Wed, 16 Jun 2021 15:42:04 -0500
    
    
    Dependabot bumped locutus from 2.0.10 to 2.0.14 in #348, but it edited the
    lockfile directly. This is not the recommended short- or long-term solution.
    
    Signed-off-by: Tommy Markley &lt;markleyt@amazon.com&gt;
    

* __Add proper dependency resolution for url-parse__

    [Tommy Markley](mailto:markleyt@amazon.com) - Wed, 16 Jun 2021 15:41:41 -0500
    
    
    Dependabot bumped url-parse from 1.4.7 to 1.5.1 in #343, but it edited the
    yarn.lock file directly. This is not the recommended short- or long-term
    solution. This is a downstream dependency of @elastic/eui, so this line should
    be removed after that dependency is upgraded.
    
    Signed-off-by: Tommy Markley &lt;markleyt@amazon.com&gt;
    

* __Add proper dependency resolution for ssri__

    [Tommy Markley](mailto:markleyt@amazon.com) - Wed, 16 Jun 2021 15:41:20 -0500
    
    
    Dependabot bumped the dependency from 6.0.1 to 6.0.2 in #332, but it edited the
    yarn.lock file directly. This left older versions of the dependency in the
    lockfile.
    
    Signed-off-by: Tommy Markley &lt;markleyt@amazon.com&gt;
    

* __Add proper dependency resolution for dns-packet__

    [Tommy Markley](mailto:markleyt@amazon.com) - Wed, 16 Jun 2021 15:40:27 -0500
    
    
    Dependabot bumped the dependency from 1.3.1 to 1.3.4 in #381, but it edited the
    yarn.lock file directly. This is not the recommended short- or long-term
    solution.
    
    Signed-off-by: Tommy Markley &lt;markleyt@amazon.com&gt;
    

* __[Bug]Change JetBeats --&gt; BeatsWest to avoid trademark violation (#468)__

    [Anan](mailto:79961084+ananzh@users.noreply.github.com) - Fri, 11 Jun 2021 13:14:16 -0700
    
    
    * change JetBeats --&gt; BeatsWest to avoid trademark violation
    
    Signed-off-by: Anan Zhuang &lt;ananzh@amazon.com&gt;
    
    * clean image and fun test
    
    Signed-off-by: Anan Zhuang &lt;ananzh@amazon.com&gt;
    
    * change image name
    
    Signed-off-by: Anan Zhuang &lt;ananzh@amazon.com&gt;

* __[Tests] updated artifact script (#466)__

    [Kawika Avilla](mailto:kavilla414@gmail.com) - Fri, 11 Jun 2021 11:18:15 -0700
    
    
    Updating artifact to enable running integration tests and functional
    tests to
    pull an artifact from the current hosted distributions.
     At the time of this commit, there is not manifest hosted but there are
    static
    links which can have an unknown amount of RC versions if the
    GA snapshot does
    not exist for that version. But the assumption
    is that it will not be too
    high.
     Deprecating the previous implementation but we can remove that in a
    future
    iteration. Wanted to leave that available incase others use
    that for custom
    manifests.
     Enable tests that depended on snapshots as well.
     
    Issues resolved:

    https://github.com/opensearch-project/OpenSearch-Dashboards/issues/242
    https://github.com/opensearch-project/OpenSearch-Dashboards/issues/19
    
    Signed-off-by: Kawika Avilla &lt;kavilla414@gmail.com&gt;

* __Temporarily remove Tutorials from &#34;Add Data&#34; page (#464)__

    [Anan](mailto:79961084+ananzh@users.noreply.github.com) - Thu, 10 Jun 2021 22:59:53 -0700
    
    
    * temporarily remove tutorial
    
    Signed-off-by: Anan Zhuang &lt;ananzh@amazon.com&gt;
    
    * change text
    
    Signed-off-by: Anan Zhuang &lt;ananzh@amazon.com&gt;
    
    * clean out all tabs contents
    
    Signed-off-by: Anan Zhuang &lt;ananzh@amazon.com&gt;

* __Implement optimized healthcheck for Dashboards (#463)__

    [Bishoy Boktor](mailto:65934617+boktorbb-amzn@users.noreply.github.com) - Thu, 10 Jun 2021 18:39:44 -0700
    
    
    * Implement optimized healthcheck for Dashboards
     Ensures that Dashboards checks only the local OpenSearch node when
    cluster_id
    node attribute is present and all nodes have some cluster_id
    value; Otherwise,
    it uses default behavior
     Closes #330
    
    Signed-off-by: Bishoy Boktor &lt;boktorbb@amazon.com&gt;
    
    * Update optimizedHealthcheck setting to be configurable
    opensearch.optimizedHealthcheck is now {string|undefined} setting that
    corresponds to the user&#39;s node attribute created in OpenSearch.
    Healthcheck
    will now check the node attribute path ending in the value
    of the setting.
    
    Signed-off-by: Bishoy Boktor &lt;boktorbb@amazon.com&gt;
    
    * Simplify getNodeId logic and update documentation
     Simplifies getNodeId code. Also, updates healthcheck param to
    healthcheckAttributeName.

    Signed-off-by: Bishoy Boktor &lt;boktorbb@amazon.com&gt;
    
    * Update opensearch_dashboards.yml with setting example
    
    Signed-off-by: Bishoy Boktor &lt;boktorbb@amazon.com&gt;
    
    * Update healthcheck setting name to optimizedHealthcheckId
    
    Signed-off-by: Bishoy Boktor &lt;boktorbb@amazon.com&gt;

* __Remove Beta label from bug template__

    [Tommy Markley](mailto:markleyt@amazon.com) - Thu, 10 Jun 2021 14:32:39 -0500
    
    
    Signed-off-by: Tommy Markley &lt;markleyt@amazon.com&gt;
    

* __fix em dash__

    [Anan Zhuang](mailto:ananzh@amazon.com) - Tue, 8 Jun 2021 14:52:22 -0500
    
    fix em dash type in readme
    
    Signed-off-by: Anan Zhuang &lt;ananzh@amazon.com&gt;
    

* __update and fix readme__

    [Anan Zhuang](mailto:ananzh@amazon.com) - Tue, 8 Jun 2021 14:52:22 -0500
    
    
    Signed-off-by: Anan Zhuang &lt;ananzh@amazon.com&gt;
    

* __Remove unused dependencies left over from x-pack__

    [Tommy Markley](mailto:markleyt@amazon.com) - Tue, 8 Jun 2021 11:34:51 -0500
    
    
    Issues Resolved: #448
    
    Signed-off-by: Tommy Markley &lt;markleyt@amazon.com&gt;
    

* __Reduce bootstrap warnings__

    [Tommy Markley](mailto:markleyt@amazon.com) - Tue, 8 Jun 2021 11:34:17 -0500
    
    
    Issues Partially Resolved: #320
    
    Signed-off-by: Tommy Markley &lt;markleyt@amazon.com&gt;
    

* __[Patch] Graphite SSRF patch (#392)__

    [Anan](mailto:79961084+ananzh@users.noreply.github.com) - Fri, 4 Jun 2021 15:08:02 -0700
    
    
    This PR is an implementation of ssrf patch. This patch allows customers to choose allowlist (vis_type_timeline.graphiteUrls) or blocklist (vis_type_timeline.blocklist) or both to verify its users' graphite url inputs. Customers can simply enable or disable these settings in the opensearch_dashboards.yml file to control what method they would like to apply for the safety check
    
    Signed-off-by: Anan Zhuang &lt;ananzh@amazon.com&gt;

* __[Build] fix overview default route (#443)__

    [Kawika Avilla](mailto:kavilla414@gmail.com) - Fri, 4 Jun 2021 13:21:35 -0700
    
    
    If default route was stored as kibana_overview, the default route will
    modified in code to the updated opensearch_dashboards_overview.
     
    Issues Partially Resolved:
    https://github.com/opensearch-project/OpenSearch-Dashboards/issues/334
    
    Signed-off-by: Kawika Avilla &lt;kavilla414@gmail.com&gt;

* __[Build] fix overview and default app titles (#442)__

    [Kawika Avilla](mailto:kavilla414@gmail.com) - Fri, 4 Jun 2021 13:18:17 -0700
    
    
    Some minor spacing issues in OpenSearch Dashboards fixed by updating the
    title
    and replacing with Overview.
    
    Issues Resolved:

    https://github.com/opensearch-project/OpenSearch-Dashboards/issues/428
    
    Signed-off-by: Kawika Avilla &lt;kavilla414@gmail.com&gt;

* __[Build] fix icons in stack management (#441)__

    [Kawika Avilla](mailto:kavilla414@gmail.com) - Fri, 4 Jun 2021 13:17:56 -0700
    
    
    Icons were renamed from `kql` to `dql` which doesn&#39;t exist. Restoring the
    correct icon fixes the error in the browser as well.
     
    Issues resolved:
    
    https://github.com/opensearch-project/OpenSearch-Dashboards/issues/431
    
    Signed-off-by: Kawika Avilla &lt;kavilla414@gmail.com&gt;

* __Bump ws from 6.2.1 to 6.2.2__

    [dependabot[bot]](mailto:49699333+dependabot[bot]@users.noreply.github.com) - Fri, 4 Jun 2021 13:07:36 -0500
    
    
    Bumps [ws](https://github.com/websockets/ws) from 6.2.1 to 6.2.2.
    - [Release notes](https://github.com/websockets/ws/releases)
    - [Commits](https://github.com/websockets/ws/commits)
    
    --- updated-dependencies:
    - dependency-name: ws
     dependency-type: indirect
    ...
    
    Signed-off-by: dependabot[bot] &lt;support@github.com&gt;

* __Update maintainers list (#438)__

    [Tommy Markley](mailto:markleyt@amazon.com) - Fri, 4 Jun 2021 01:13:37 -0500
    
    
    Signed-off-by: Tommy Markley &lt;markleyt@amazon.com&gt;

* __Bump node-notifier from 8.0.0 to 8.0.2 (#436)__

    [dependabot[bot]](mailto:49699333+dependabot[bot]@users.noreply.github.com) - Thu, 3 Jun 2021 22:01:52 -0500
    
    
    

* __Bump axios from 0.19.2 to 0.21.1 (#434)__

    [dependabot[bot]](mailto:49699333+dependabot[bot]@users.noreply.github.com) - Thu, 3 Jun 2021 22:01:37 -0500
    
    
    

* __Bump elliptic from 6.5.3 to 6.5.4 (#435)__

    [dependabot[bot]](mailto:49699333+dependabot[bot]@users.noreply.github.com) - Thu, 3 Jun 2021 22:01:17 -0500
    
    
    

* __Bump immer from 1.10.0 to 8.0.1 (#433)__

    [dependabot[bot]](mailto:49699333+dependabot[bot]@users.noreply.github.com) - Thu, 3 Jun 2021 22:01:01 -0500
    
    
    

* __Bump locutus from 2.0.10 to 2.0.14 (#348)__

    [dependabot[bot]](mailto:49699333+dependabot[bot]@users.noreply.github.com) - Thu, 3 Jun 2021 22:00:08 -0500
    
    
    

* __Bump hosted-git-info from 2.5.0 to 2.8.9 (#347)__

    [dependabot[bot]](mailto:49699333+dependabot[bot]@users.noreply.github.com) - Thu, 3 Jun 2021 21:59:50 -0500
    
    
    

* __Bump postcss from 7.0.32 to 8.2.10 (#346)__

    [dependabot[bot]](mailto:49699333+dependabot[bot]@users.noreply.github.com) - Thu, 3 Jun 2021 21:59:35 -0500
    
    
    

* __Bump url-parse from 1.4.7 to 1.5.1 (#345)__

    [dependabot[bot]](mailto:49699333+dependabot[bot]@users.noreply.github.com) - Thu, 3 Jun 2021 21:59:11 -0500
    
    
    

* __Bump grunt from 1.0.4 to 1.3.0 (#344)__

    [dependabot[bot]](mailto:49699333+dependabot[bot]@users.noreply.github.com) - Thu, 3 Jun 2021 21:58:54 -0500
    
    
    

* __Bump ssri from 6.0.1 to 6.0.2 (#332)__

    [dependabot[bot]](mailto:49699333+dependabot[bot]@users.noreply.github.com) - Thu, 3 Jun 2021 15:34:22 -0500
    
    
    

* __Add SVG logo spinner (#387)__

    [Kevin Garcia](mailto:hello@kevingarcia.me) - Thu, 3 Jun 2021 13:30:48 -0700
    
    
    * Add SVG logo spinner, remove horizontal loader
    * Change color on Primary &#34;OpenSearch Dashboards&#34; card in the main home landing
    page
    * replace hardcoded CSS value with  token so dark mode card has enough contrast
    
    Signed-off-by: kgcreative &lt;kvngar@amazon.com&gt;

* __Bump dns-packet from 1.3.1 to 1.3.4 (#381)__

    [dependabot[bot]](mailto:49699333+dependabot[bot]@users.noreply.github.com) - Thu, 3 Jun 2021 15:22:35 -0500
    
    
    

* __Bump lodash from 4.17.20 to 4.17.21 (#349)__

    [dependabot[bot]](mailto:49699333+dependabot[bot]@users.noreply.github.com) - Thu, 3 Jun 2021 15:20:51 -0500
    
    
    

* __Bump handlebars from 4.7.6 to 4.7.7 (#343)__

    [dependabot[bot]](mailto:49699333+dependabot[bot]@users.noreply.github.com) - Thu, 3 Jun 2021 15:20:27 -0500
    
    
    

* __Bump underscore from 1.9.1 to 1.13.1 (#342)__

    [dependabot[bot]](mailto:49699333+dependabot[bot]@users.noreply.github.com) - Thu, 3 Jun 2021 15:19:47 -0500
    
    
    

* __Bump vega from 5.17.1 to 5.17.3 (#405)__

    [dependabot[bot]](mailto:49699333+dependabot[bot]@users.noreply.github.com) - Thu, 3 Jun 2021 08:57:36 -0700
    
    
    Bumps [vega](https://github.com/vega/vega) from 5.17.1 to 5.17.3.
    - [Release notes](https://github.com/vega/vega/releases)
    - [Commits](https://github.com/vega/vega/compare/v5.17.1...v5.17.3)
    

    updated-dependencies:
    - dependency-name: vega
     dependency-type: direct:development
    ...
    
    Signed-off-by: dependabot[bot] &lt;support@github.com&gt;
    
    Co-authored-by: dependabot[bot]
    &lt;49699333+dependabot[bot]@users.noreply.github.com&gt;

* __[Purify] remove upsells and branding from pre-fork (#391)__

    [Kawika Avilla](mailto:kavilla414@gmail.com) - Thu, 3 Jun 2021 00:24:49 -0700
    
    
    Left-over upsells and branding that were missed in previous
    updates since they
    are not easy to catch.
    
    Issues:
    
    https://github.com/opensearch-project/OpenSearch-Dashboards/issues/359
    
    https://github.com/opensearch-project/OpenSearch-Dashboards/issues/388
    
    https://github.com/opensearch-project/OpenSearch-Dashboards/issues/384
    
    Signed-off-by: Kawika Avilla &lt;kavilla414@gmail.com&gt;

* __[Build] restore timelion (#390)__

    [Kawika Avilla](mailto:kavilla414@gmail.com) - Thu, 3 Jun 2021 00:20:53 -0700
    
    
    Restoring the timeline to timelion and then updated the tests
    (unit, integ, and func test all passing). This is allowable because
    this is
    for functional purposes and for clusters/plugins that will
    migrate to
    Dashboards. Their index will not require re-indexing for 1.0.0
    and shouldn&#39;t
    require a full migration after further updates.
     Update telemetry usage to be timelion
     Clean up code
    
    Signed-off-by: Kawika Avilla &lt;kavilla414@gmail.com&gt;


* __Fix beta doc links, truncated help menu label (#382)__

    [Tommy Markley](mailto:markleyt@amazon.com) - Wed, 26 May 2021 15:54:42 -0700
    
    
    * Fix dashboards documentation and DQL links, expand help menu width so label
    isn&#39;t truncated
    
    Signed-off-by: Tommy Markley &lt;markleyt@amazon.com&gt;
    
    * Remove kibana references from doc links, fix aggregation links
    
    Signed-off-by: Tommy Markley &lt;markleyt@amazon.com&gt;

* __Update logos site-wide with new OpenSearch branding (#376)__

    [Tommy Markley](mailto:tommymarkley@protonmail.com) - Wed, 26 May 2021 14:47:05 -0700
    
    
    Signed-off-by: Tommy Markley &lt;markleyt@amazon.com&gt;

* __[Build] restore esTypes (#377)__

    [Kawika Avilla](mailto:kavilla414@gmail.com) - Wed, 26 May 2021 14:41:47 -0700
    
    
    Restoring the opensearchTypes to esTypes and then updated the tests
    (unit, integ, and func test all passing). This is allowable because this is
    for functional purposes and for clusters/plugins that will migrate to
    Dashboards. Their index will not require re-indexing for 1.0.0
    and shouldn&#39;t
    require a full migration after further updates.
    
    Signed-off-by: Kawika Avilla &lt;kavilla414@gmail.com&gt;

* __[Build] restore kibanaSavedObjectMeta (#375)__

    [Kawika Avilla](mailto:kavilla414@gmail.com) - Wed, 26 May 2021 13:55:33 -0700
    
    
    Restoring the index from opensearchDashboardsSavedObjectMeta to
    kibanaSavedObjectMeta and then updated the tests.
     This is allowable because this is for functional purposes and for clusters/plugins that will migrate to Dashboards. Their index will
    not require re-indexing for 1.0.0 and should not require a full migration.
    
    Signed-off-by: Kawika Avilla &lt;kavilla414@gmail.com&gt;

* __Update favicon icons with new OpenSearch branding (#369)__

    [Tommy Markley](mailto:tommymarkley@protonmail.com) - Wed, 26 May 2021 15:32:22 -0500
    
    
    Signed-off-by: Tommy Markley &lt;markleyt@amazon.com&gt;

* __[Build] restore kibana index (#374)__

    [Kawika Avilla](mailto:kavilla414@gmail.com) - Wed, 26 May 2021 13:11:22 -0700
    
    
    * [Build] restore kibana index
     Restoring the index from .opensearch_dashboards to .kibana and then
    updated
    the tests. This is allowable because this is for functional
    purposes and for
    clusters/plugins that will migrate to Dashboards.
    Their index will not require
    re-indexing for 1.0.0 and won&#39;t require
    migration after further updates.
    
    Signed-off-by: Kawika Avilla &lt;kavilla414@gmail.com&gt;
    
    * [Tests] updates tests for consistency
     This doesn&#39;t have impact on the results of tests but to keep
    consistency in
    the index name these updates were missed.
    
    Signed-off-by: Kawika Avilla &lt;kavilla414@gmail.com&gt;

* __Default to converting folder name for cli plugin to kebab-case (#357)__

    [Vacha](mailto:VachaShah@users.noreply.github.com) - Tue, 25 May 2021 10:54:54 -0700
    
    
    Signed-off-by: Vacha Shah &lt;vachshah@amazon.com&gt;

* __Auto-focus on the Field input when clicking Add filter (#355)__

    [Gal Angel](mailto:gal.angel@logz.io) - Mon, 24 May 2021 00:02:31 -0700
    
    efs/remotes/origin/i-335
    Added Auto-focus on Add Filter Input
     Done by setting the initial focus of the popover with the relevant selector
    
    * correct autofocus
    
    Signed-off-by: galangel &lt;gal0angel@gmail.com&gt;
    
    * use class
    
    Signed-off-by: galangel &lt;gal0angel@gmail.com&gt;


