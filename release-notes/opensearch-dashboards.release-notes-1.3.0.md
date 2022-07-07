
* __[Docs] update branch version to 1.3 (#1333)__

    [Kawika Avilla](mailto:kavilla414@gmail.com) - Tue, 8 Mar 2022 17:25:05 -0800
    
    efs/remotes/upstream/1.3, refs/heads/1.3
    `branch` in the package.json is used for pointing links to the right
    site. For
    example: `https://opensearch.org/docs/1.3/dashboards/index/`.
     NOTE: At the time this commit was made the doc site for `1.3`, is
    not
    available.
     There is an existing issue here:
    
    https://github.com/opensearch-project/documentation-website/issues/296
     We can point this to `latest` but the problem with that is that we
    don&#39;t
    re-release versions. When the next major or minor release
    occurs then `latest`
    will point to that version and now all
    OpenSearch Dashboards 1.3 downloads
    will point to the newest version.
    So to avoid that, I suggest we point this to `1.3` and I got confirmation
    that it will be `1.3`.
    
    Issue resolved:
    n/a
    
    Signed-off-by: Kawika Avilla &lt;kavilla414@gmail.com&gt;

* __[CVE] Decode anchor ID in Discover (#1327) (#1332)__

    [opensearch-trigger-bot[bot]](mailto:98922864+opensearch-trigger-bot[bot]@users.noreply.github.com) - Tue, 8 Mar 2022 16:46:03 -0800
    
    
    Potential way to prevent XSS from being injected into index pattern.

    CVE link:

    https://nvd.nist.gov/vuln/detail/CVE-2022-23707
    
    Issue Resolved:

    https://github.com/opensearch-project/OpenSearch-Dashboards/issues/1312
    
    Signed-off-by: Kawika Avilla &lt;kavilla414@gmail.com&gt;
    
    (cherry picked from commit b2979c81b47f70f625e1d4ae89337517599e9dc1)
    
    Co-authored-by: Kawika Avilla &lt;kavilla414@gmail.com&gt;

* __[Branding] assets folder and SSL support (#1329) (#1331)__

    [opensearch-trigger-bot[bot]](mailto:98922864+opensearch-trigger-bot[bot]@users.noreply.github.com) - Tue, 8 Mar 2022 15:48:41 -0800
    
    
    Adding `assets` folder that gets served up under UI for ease of us.
    SSL support when OpenSearch Dashboards SSL is enabled.
    
    Issue Resolved:
    
    https://github.com/opensearch-project/OpenSearch-Dashboards/issues/1164
    
    Signed-off-by: Kawika Avilla &lt;kavilla414@gmail.com&gt;
    
    (cherry picked from commit 289ad243b888913059365068d8a90943297ba66e)
    
    Co-authored-by: Kawika Avilla &lt;kavilla414@gmail.com&gt;

* __[Bug] Double quotes saved query bug (#1323) (#1326)__

    [opensearch-trigger-bot[bot]](mailto:98922864+opensearch-trigger-bot[bot]@users.noreply.github.com) - Tue, 8 Mar 2022 11:37:22 -0800
    
    
    In Discover, when loading a saved query with double quotes,
    double quotes are
    gone and term query becomes match query.
    
    To do a term query, we need to keep the quotes. When parsing a
    string with
    quotes, JSON.parse function will trim the quotes
    and return its value. For
    example, &#34;Men&#39;s Shoes&#34; is parsed to
    Men&#39;s Shoes. Then dashboards will break
    the term using its analyzer
    and search each word which causes the issue.
    Please check the
    comments in the resolved issue for more details.
    
    To solve this, we added an isObject checker which filters a regular
    string
    from a json string. After we get the regular string, the
    query will use its
    original value and quotes are able to be kept.
    fix comments and modify commit message
    
    Issue Resolved:
    
    https://github.com/opensearch-project/OpenSearch-Dashboards/issues/1254
    
    Signed-off-by: Anan Zhuang &lt;ananzh@amazon.com&gt;
    
    Signed-off-by: Anan &lt;79961084+ananzh@users.noreply.github.com&gt;
    
    (cherry picked from commit 1ecbd3abc819c55b6dd2a9f514b85871367725e8)
    
    Co-authored-by: Anan &lt;79961084+ananzh@users.noreply.github.com&gt;

* __[Plugins] update default url for installing plugins (#1316) (#1328)__

    [opensearch-trigger-bot[bot]](mailto:98922864+opensearch-trigger-bot[bot]@users.noreply.github.com) - Tue, 8 Mar 2022 11:37:08 -0800
    
    
    Update old and invalid reference to custom plugins within
    the OpenSearch
    Project.
    
    Note: At the time that this is committed there is no gurantee
    that the latest
    build is the build that was select as the
    final build.
    
    Issue resolved:
    
    https://github.com/opensearch-project/OpenSearch-Dashboards/issues/1038
    
    Signed-off-by: Kawika Avilla &lt;kavilla414@gmail.com&gt;
    
    (cherry picked from commit 9c82c521a32f9fcc1621783be34ecd9e594fe2c0)
    
    Co-authored-by: Kawika Avilla &lt;kavilla414@gmail.com&gt;

* __[BUG] fix median.ts to work for scripted field (#1302) (#1325)__

    [opensearch-trigger-bot[bot]](mailto:98922864+opensearch-trigger-bot[bot]@users.noreply.github.com) - Tue, 8 Mar 2022 11:36:49 -0800
    
    
    Fix PR comment to replace unused agg to _
    remove write function
    
    Issue Resolved:
    
    https://github.com/opensearch-project/OpenSearch-Dashboards/issues/1296
    
    Signed-off-by: Anan Zhuang &lt;ananzh@amazon.com&gt;
    
    Signed-off-by: Anan &lt;79961084+ananzh@users.noreply.github.com&gt;
    
    (cherry picked from commit 48eec833e240a634a3da7679ec7fcd208cf3e613)
    
    Co-authored-by: Anan &lt;79961084+ananzh@users.noreply.github.com&gt;

* __[1.x] Add option to configure available bucket agg types + jest tests (#1196) (#1309)__

    [Kawika Avilla](mailto:kavilla414@gmail.com) - Mon, 7 Mar 2022 14:37:54 -0800
    
    
    * Add option to configure available bucket agg types + jest tests (#1196)
    * Add option to configure available bucket agg types + jest tests
    * Change key to disableBucketAgg
    * Rephrase
    * made description clearer, csv clarification
    
    Signed-off-by: Royi Sitbon &lt;royi.sitbon@logz.io&gt;
    
    * [Tests] update disable bucket agg feature for tests (#1284)
    
    Test failure introduced:
    https://github.com/opensearch-project/OpenSearch-Dashboards/pull/1196
    
    Updating to handle the if that configuration is not found or if it is
    not an
    array.
    
    Issue:
    
    n/a
    
    Signed-off-by: Kawika Avilla &lt;kavilla414@gmail.com&gt;
    
    Co-authored-by: Royi Sitbon &lt;royi.sitbon@logz.io&gt;

* __docs(Dev Guide): Updates how to run OpenSearch (#1265) (#1317)__

    [opensearch-trigger-bot[bot]](mailto:98922864+opensearch-trigger-bot[bot]@users.noreply.github.com) - Mon, 7 Mar 2022 14:37:35 -0800
    
    
    * docs(Dev Guide): Updates how to run OpenSearch
    * docs(Dev Guide): Updates copy to include warning.
    * docs(Dev Guide): fixes typo
    
    Signed-off-by: Ashwin P Chandran &lt;ashwinpc@amazon.com&gt;
    
    (cherry picked from commit efc7339f80191985b606c95305e9dbd934923a90)
    
    Co-authored-by: Ashwin P Chandran &lt;ashwinpc@amazon.com&gt;

* __[Build] Build ARM64 for deb and rpm (#1285) (#1305)__

    [opensearch-trigger-bot[bot]](mailto:98922864+opensearch-trigger-bot[bot]@users.noreply.github.com) - Wed, 2 Mar 2022 18:11:16 -0800
    
    
    * [Build] Build ARM64 for deb and rpm
     Build ARM64 for deb with the following commands:
    ```
    yarn build --deb-arm --skip-archives
    yarn build --deb-arm --skip-archives --release
    ```
    
    Build ARM64 for rpm with the following commands:
    ```
    yarn build --rpm-arm --skip-archives
    yarn build --rpm-arm --skip-archives --release
    ```
    
    Issue partially resolved:
    
    https://github.com/opensearch-project/OpenSearch-Dashboards/issues/1259
    
    Signed-off-by: Kawika Avilla &lt;kavilla414@gmail.com&gt;
    
    (cherry picked from commit 59410449da4c90eab617f2c86ec9181976c3d179)
    
    Co-authored-by: Kawika Avilla &lt;kavilla414@gmail.com&gt;

* __Run build and test workflow on all branches (#1222) (#1271)__

    [Tommy Markley](mailto:markleyt@amazon.com) - Tue, 22 Feb 2022 16:12:34 -0600
    
    refs/remotes/tommy/1.x
    * Skips feature branches
    * Use the `.nvmrc` file for the `node` version instead of a hard-coded version.
    
    Resolves #1023
    Signed-off-by: Tommy Markley &lt;markleyt@amazon.com&gt;

* __[CI] Add backport action for automated backports (#1233) (#1251)__

    [opensearch-trigger-bot[bot]](mailto:98922864+opensearch-trigger-bot[bot]@users.noreply.github.com) - Mon, 21 Feb 2022 14:03:58 -0600
    
    
    Adding VachaShah/backport@v1.1.4 for automating backport PRs and
    cleaning them up.
    
    Issue:
    
    https://github.com/opensearch-project/OpenSearch-Dashboards/issues/1211
    
    Signed-off-by: Kawika Avilla &lt;kavilla414@gmail.com&gt;
    
    (cherry picked from commit 5b314d2d1a348458802790f66dfcaf10f5d6bd64)
    
    Co-authored-by: Kawika Avilla &lt;kavilla414@gmail.com&gt;

* __[1.x][Bug] fix incorrect import for opensearch aggs (#1192) (#1227)__

    [Kawika Avilla](mailto:kavilla414@gmail.com) - Wed, 9 Feb 2022 17:14:01 -0800
    
    
    Incorrect import statement that was introduced here:
    
    https://github.com/opensearch-project/OpenSearch-Dashboards/pull/688
    
    Verified other imports and the rest look fine.
    
    Issue:
    
    n/a
     
    Backport PR:

    https://github.com/opensearch-project/OpenSearch-Dashboards/pull/1192
    
    Signed-off-by: Kawika Avilla &lt;kavilla414@gmail.com&gt;

* __Bumps `node-fetch` from v2.6.1 to v2.6.7 (#1169) (#1221)__

    [Tommy Markley](mailto:markleyt@amazon.com) - Tue, 8 Feb 2022 15:06:12 -0600
    
    
    Resolves #1162
    
    Signed-off-by: Tommy Markley &lt;markleyt@amazon.com&gt;

* __[LIC] Allows the simplified header for new files (#936) (#1209)__

    [Tommy Markley](mailto:markleyt@amazon.com) - Mon, 7 Feb 2022 12:55:30 -0600
    
    
    Signed-off-by: Ashwin P Chandran &lt;ashwinpc1993@gmail.com&gt;

* __Don&#39;t terminate the server on NodeDeprecationWarning (#1185) (#1210)__

    [Bishoy Boktor](mailto:65934617+boktorbb-amzn@users.noreply.github.com) - Fri, 4 Feb 2022 10:30:56 -0800
    
    
    The last AWS SDK for Javascript that supports Node 10 (v3.45.0) emits a
    NodeDeprecationWarning to indicate that Node 10
    is no longer supported.
    Without this workaround, this crashes the OSD server, so it becomes impossible
    to interact with
    other AWS services from within OSD (e.g., in a custom plugin)
    until the Node 14 upgrade is done.
    
    Signed-off-by: Thilo-Alexander Ginkel &lt;tg@tgbyte.de&gt;
    
    Co-authored-by: Thilo-Alexander Ginkel &lt;tg@tgbyte.de&gt;

* __[1.x][BUG] fix disableWelcomeScreen config (#1143) (#1170)__

    [Kawika Avilla](mailto:kavilla414@gmail.com) - Tue, 1 Feb 2022 10:26:45 -0800
    
    
    disableWelcomeScreen was erroneously removed from being exposed to browser (for
    testing purposes)
    and was not able to pass the config to disable the welcome
    screen showing.
    
    Issue:
    
    https://github.com/opensearch-project/OpenSearch-Dashboards/issues/1138
    
    Backport PR:
    
    https://github.com/opensearch-project/OpenSearch-Dashboards/pull/1143
    
    Signed-off-by: Kawika Avilla &lt;kavilla414@gmail.com&gt;

* __[1.x][Build] remove legacy version check for plugin builds__

    [Kawika Avilla](mailto:kavilla414@gmail.com) - Thu, 13 Jan 2022 02:32:53 -0800
    
    Refs/remotes/hashworks/1.x, refs/remotes/RoyiSitbon/1.x
    Removes the SEMVAR check for external plugins. 7.9 is not relevant to the
    application.
    
    The semvar library was also preventing major.minor.patch.x which is the format
    from OpenSearch plugins.
    
    Related issue: 
    
    https://github.com/opensearch-project/OpenSearch-Dashboards/issues/992
    
    Backport PR: 
    
    https://github.com/opensearch-project/OpenSearch-Dashboards/pull/1029
    
    Signed-off-by: Kawika Avilla &lt;kavilla414@gmail.com&gt;
    

* __[1.x][Docs] remove invalid reference in CONVENTIONS.md__

    [Kawika Avilla](mailto:kavilla414@gmail.com) - Thu, 13 Jan 2022 02:32:53 -0800
    
    
    Removed missed reference in CONVENTIONS.md.
    
    Issue related: 
    
    https://github.com/opensearch-project/OpenSearch-Dashboards/issues/1109
    
    Backport PR: 
    
    https://github.com/opensearch-project/OpenSearch-Dashboards/pull/1110
    
    Signed-off-by: Kawika Avilla &lt;kavilla414@gmail.com&gt;
    

* __[1.x][Backwards Compatibility] restore URL forwarding from legacy app__

    [Kawika Avilla](mailto:kavilla414@gmail.com) - Thu, 13 Jan 2022 02:32:53 -0800
    
    
    Forwarding legacy app to the current format of the application. This enables
    the usage of stored URLs and other links that referenced the format of the
    application URL that mentioned the application name.
    
    Since we changed the URL forwarding we changed this value and released. So
    incase forks were made and depended on this legacy formatted reference of the
    application. It will still work. There are also references of the application.
    
    Issue resolved: 
    
    https://github.com/opensearch-project/OpenSearch-Dashboards/issues/1013
    
    Backport PR: 
    
    https://github.com/opensearch-project/OpenSearch-Dashboards/pull/1021
    
    Signed-off-by: Kawika Avilla &lt;kavilla414@gmail.com&gt;
    

* __[1.x][Map] Remove hardcoded AWS paths__

    [Zuocheng Ding](mailto:zding817@gmail.com) - Thu, 13 Jan 2022 02:32:53 -0800
    
    
    Clean up temp aws paths in code base. Add a configurable flag
    `showRegionBlockedWarning` into map plugin level config file.
    
    Backport PR: 
    
    https://github.com/opensearch-project/OpenSearch-Dashboards/pull/1015
    
    Signed-off-by: Zuocheng Ding &lt;zding817@gmail.com&gt;
    

* __[1.x][Branding] prevent logging when config not set__

    [Kawika Avilla](mailto:kavilla414@gmail.com) - Thu, 13 Jan 2022 02:32:53 -0800
    
    
    Out of the box, the rendering service will check the config and see the default
    value and log an info message saying that the branding config is invalid or not
    set. Everytime you refresh the browser you will get those log messages.
    
    This sets it to only log error messages if the user sets the branding config
    and it is invalid.
    
    Include using default messages.
    
    Backport PR: 
    
    https://github.com/opensearch-project/OpenSearch-Dashboards/pull/941
    
    Signed-off-by: Kawika Avilla &lt;kavilla414@gmail.com&gt;
    

* __[Link] Fix yarnpkg link error__

    [Zuocheng Ding](mailto:zding817@gmail.com) - Mon, 3 Jan 2022 23:05:08 -0800
    
    
    Issue: https://yarnpkg.com/latest.msi is unavailable now and will be rerouted
    to a 404 page. Add it to link checker allow list to unblock the PR process.
    
    Signed-off-by: Zuocheng Ding &lt;zding817@gmail.com&gt;
    

* __Fix Lychee Link Checker Error (#1011)__

    [Zuocheng Ding](mailto:zding817@gmail.com) - Mon, 3 Jan 2022 23:05:08 -0800
    
    
    Signed-off-by: Zuocheng Ding &lt;zding817@gmail.com&gt;

* __Add Lychee Link Checker into OSD (#938)__

    [Zuocheng Ding](mailto:zding817@gmail.com) - Mon, 3 Jan 2022 23:05:08 -0800
    
    
    1. Fix broken links in OSD
    2. Generate lycheeexcude list to filter out false
    negative warnings from test files or external links
    3. Add TODO items for
    internal unavaiable links
    4. Integrate with doc link service change.
    5. Standardize all opensearch url with `https://opensearch.org/` and add
    unavilable urls into noDocument list
    
    Signed-off-by: Zuocheng Ding &lt;zding817@gmail.com&gt;

* __Add versioned document support in OSD__

    [Zuocheng Ding](mailto:zding817@gmail.com) - Mon, 3 Jan 2022 23:05:08 -0800
    
    
    This is PR is to add versioned document support in OSD. 1. Add logic to pick up
    doc version from package.json and convert it to `latest` if we are on default
    `main` branch. 2. Refactor doc_link_service to have 3 urls groups: opensearch,
    opensearchDashboards, and noDocumentation. 3. Update dynamic versioned doc
    links and clean up unused urls 4. Fix known url bug 
    https://github.com/opensearch-project/OpenSearch-Dashboards/issues/769 5. Add
    unit tests for doclinks branch name conversion
    
    Signed-off-by: Zuocheng Ding &lt;zding817@gmail.com&gt;
    

* __[1.x][Version] Bump to 1.3.0__

    [Kawika Avilla](mailto:kavilla414@gmail.com) - Fri, 26 Nov 2021 22:55:07 -0800
    
    refs/remotes/arbuzov/1.x
    Bump OpenSearch Dashboards from 1.2.0 to 1.3.0.
    
    Signed-off-by: Kawika Avilla &lt;kavilla414@gmail.com&gt;
