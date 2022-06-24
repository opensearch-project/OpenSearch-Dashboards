## Version 1.1.0 Release Notes

* __[1.1] Fix yarn build docs and update test (#844)__

    [Anan](mailto:79961084+ananzh@users.noreply.github.com) - Tue, 5 Oct 2021 12:55:30 -0700
    
    yarn build flags in /src/dev/build/cli.ts are not updated to match the renamed flags in de-couple PR (#795). This PR fixes the issue
    and update the tests. Also modify words in DEVELOPER_GUIDE.md.
     
    PR resolved: 
    https://github.com/opensearch-project/OpenSearch-Dashboards/issues/836
    
    Backport PR:  
    https://github.com/opensearch-project/OpenSearch-Dashboards/pull/840
    
    Signed-off-by: Anan Zhuang &lt;ananzh@amazon.com&gt;

* __[1.1] Ensure DCO Workflow Check (#846)__

    [Anan](mailto:79961084+ananzh@users.noreply.github.com) - Tue, 5 Oct 2021 12:55:08 -0700
        
    Issue Resolved:    
    https://github.com/opensearch-project/OpenSearch-Dashboards/issues/834
    
    Backport PR:    
    https://github.com/opensearch-project/OpenSearch-Dashboards/pull/841
    
    Signed-off-by: Anan Zhuang &lt;ananzh@amazon.com&gt;

* __[1.1] De-Couple Dashboards linux building process (#843)__

    [Anan](mailto:79961084+ananzh@users.noreply.github.com) - Tue, 5 Oct 2021 11:44:48 -0700
    
    When running yarn build --skip-os-packages it will build 4 tarballs for Dashboards (2x linux, 1x macOS, 1x windows) and takes 10+min to do so.
    
    In this PR, we break the building process to allow single linux to build. If run `yarn build-platform --linux-x64` only linux x64 tarball is created. Same for linux arm64 and darwin x64. You could run `yarn build-platform
    --linux-arm64` and `yarn build-platform darwin-x64`.
    
    partially solved:  
    https://github.com/opensearch-project/OpenSearch-Dashboards/issues/473
    
    backport PR:    
    https://github.com/opensearch-project/OpenSearch-Dashboards/pull/795
    
    Signed-off-by: Anan Zhuang &lt;ananzh@amazon.com&gt;

* __[1.1][Bug] Restore timeline legacy functions and filters__

    [Kawika Avilla](mailto:kavilla414@gmail.com) - Tue, 28 Sep 2021 12:38:11 -0700
        
    While renaming we changed values from legacy naming schema to OpenSearch
    Dashboards naming schema. However, after realizing we impacted backwards
    compatibility, we restored some of the
    &#34;under the hood&#34; components backed to legacy application to allow for seemless
    migration.
    
    However, upon attempting to restore Timeline to work with saved objects we
    neglected to restore the Timeline functions.
    
    Previously users could set kibana=false to ignore filters on the dashboards
    being applied to their Timeline visualizations. Now, if users tried to set it
    then it would fail because it didn&#39;t know what that function was.
    
    This commit fixes this issue by keeping the update since we do not want to
    impact people who have now updated their functions and re-added the legacy
    functions.
    
    In this commit, I also restore the aliases for &#34;elasticsearch&#34; and now included
    &#34;opensearch&#34; for Timeline queries.
    
    Finally, the key was incorrect for actually accessing the filter so it never
    applied the filters in the default state.
    
    Issue resolved: 
    https://github.com/opensearch-project/OpenSearch-Dashboards/issues/820
    
    Backport PR: 
    https://github.com/opensearch-project/OpenSearch-Dashboards/pull/825
    
    Signed-off-by: Kawika Avilla &lt;kavilla414@gmail.com&gt;    

* __[1.1] Update release notes for 1.1 release (#822)__

    [Anan](mailto:79961084+ananzh@users.noreply.github.com) - Mon, 27 Sep 2021 11:07:07 -0500
        
    Backport PR:
    https://github.com/opensearch-project/OpenSearch-Dashboards/pull/821
    
    Signed-off-by: Anan Zhuang &lt;ananzh@amazon.com&gt;

* __Bump prismjs from 1.24.0 to 1.25.0 (#805) (#817)__

    [Tommy Markley](mailto:markleyt@amazon.com) - Fri, 24 Sep 2021 15:46:06 -0500
    
    Bumps [prismjs](https://github.com/PrismJS/prism) from 1.24.0 to 1.25.0.
    - [Release notes](https://github.com/PrismJS/prism/releases)
    - [Changelog](https://github.com/PrismJS/prism/blob/master/CHANGELOG.md)
    - [Commits](https://github.com/PrismJS/prism/compare/v1.24.0...v1.25.0)
    
    ---
    updated-dependencies:
    - dependency-name: prismjs
     dependency-type: indirect
    ...
     Signed-off-by: dependabot[bot] &lt;support@github.com&gt;

* __Bump tmpl from 1.0.4 to 1.0.5 (#807) (#819)__

    [Tommy Markley](mailto:markleyt@amazon.com) - Fri, 24 Sep 2021 15:45:18 -0500
    
    
    Bumps [tmpl](https://github.com/daaku/nodejs-tmpl) from 1.0.4 to 1.0.5.
    - [Release notes](https://github.com/daaku/nodejs-tmpl/releases)
    - [Commits](https://github.com/daaku/nodejs-tmpl/commits/v1.0.5)
    
    ---
    updated-dependencies:
    - dependency-name: tmpl
     dependency-type: indirect
    ...
     Signed-off-by: dependabot[bot] &lt;support@github.com&gt;

* __Revert &#34;[1.1] Upgrade `immer` from 8.0.1 to 9.0.6 (#788)&#34; (#813)__

    [Tommy Markley](mailto:markleyt@amazon.com) - Fri, 24 Sep 2021 15:13:59 -0500
    
    
    This reverts commit 9f57b182e159e23838fa04ae85e141d6bd518a2f.
     This introduces breaking changes; it will need to wait for 2.0.
     Signed-off-by: Tommy Markley &lt;markleyt@amazon.com&gt;


* __Bump `axios` from 0.21.1 to 0.21.4 (#779)__

    [Tommy Markley](mailto:markleyt@amazon.com) - Fri, 10 Sep 2021 08:35:07 -0700
    
    Addresses https://github.com/advisories/GHSA-cph5-m8f7-6c5x
     Bumps [axios](https://github.com/axios/axios) from 0.21.1 to 0.21.4
    - [Release notes](https://github.com/axios/axios/releases/tag/v0.21.4)
    - [Changelog](https://github.com/axios/axios/blob/v0.21.4/CHANGELOG.md)
    - [Commits](https://github.com/axios/axios/compare/v0.21.1...v0.21.4)
     Signed-off-by: Tommy Markley &lt;markleyt@amazon.com&gt;

* __Upgrade `immer` from 8.0.1 to 9.0.6 (#780)__

    [Tommy Markley](mailto:markleyt@amazon.com) - Fri, 10 Sep 2021 08:32:48 -0700
     
    Addresses:
    - https://github.com/advisories/GHSA-c36v-fmgq-m8hx
    - https://github.com/advisories/GHSA-33f9-j839-rf8h
     Upgrades [immer](https://github.com/immerjs/immer) from 8.0.1 to 9.0.6
    - [Release notes](https://github.com/immerjs/immer/releases)
    - [Commits](https://github.com/immerjs/immer/compare/v8.0.1...v9.0.6)
     Signed-off-by: Tommy Markley &lt;markleyt@amazon.com&gt;

* __Update TESTING.md (#770)__

    [Bishoy Boktor](mailto:65934617+boktorbb-amzn@users.noreply.github.com) - Wed, 8 Sep 2021 12:00:31 -0700
    
    Signed-off-by: Bishoy Boktor &lt;boktorbb@amazon.com&gt;

* __Correct copyright notices in README (#712)__

    [Tommy Markley](mailto:markleyt@amazon.com) - Tue, 7 Sep 2021 13:20:44 -0500
       
    Resolves https://github.com/opensearch-project/OpenSearch-Dashboards/issues/711
    
     Signed-off-by: Tommy Markley &lt;markleyt@amazon.com&gt;

* __Bump `tar` from 6.1.6 to 6.1.11 (#762)__

    [Tommy Markley](mailto:markleyt@amazon.com) - Thu, 2 Sep 2021 13:48:15 -0500
      
    Addresses https://github.com/advisories/GHSA-5955-9wpr-37jh
     Bumps [tar](https://github.com/npm/node-tar) from 6.1.6 to 6.1.11.
    - [Release notes](https://github.com/npm/node-tar/releases)
    - [Changelog](https://github.com/npm/node-tar/blob/main/CHANGELOG.md)
    - [Commits](https://github.com/npm/node-tar/compare/v6.1.6...v6.1.11)
     Signed-off-by: Tommy Markley &lt;markleyt@amazon.com&gt;

* __Upgrade `tar` from 4.4.13/6.0.2 to 6.1.6 (#704)__

    [Tommy Markley](mailto:markleyt@amazon.com) - Wed, 1 Sep 2021 13:51:36 -0500    
    
    Addresses https://github.com/advisories/GHSA-3jfq-g458-7qm9
    Requires [tar](https://github.com/npm/node-tar) 6.1.6 - upgrade from 4.4.13
    and 6.0.2
    - [Release notes](https://github.com/npm/node-tar/releases/tag/v6.1.6)
    - [Changelog](https://github.com/npm/node-tar/blob/main/CHANGELOG.md)
    - [Commits](https://github.com/npm/node-tar/compare/v4.4.13...v6.1.6)
     There are no breaking changes from 4.4 to 6.0, so I chose to upgrade
    instead of bumping each of the minor versions.
     Signed-off-by: Tommy Markley &lt;markleyt@amazon.com&gt;

* __Bump jszip from 3.3.0 to 3.7.1 (#728)__

    [dependabot[bot]](mailto:49699333+dependabot[bot]@users.noreply.github.com) - Wed, 1 Sep 2021 13:43:19 -0500    
    
    Bumps [jszip](https://github.com/Stuk/jszip) from 3.3.0 to 3.7.1.
    - [Release notes](https://github.com/Stuk/jszip/releases)
    - [Changelog](https://github.com/Stuk/jszip/blob/main/CHANGES.md)
    - [Commits](https://github.com/Stuk/jszip/compare/v3.3.0...v3.7.1)
    
    updated-dependencies:
    - dependency-name: jszip
      dependency-type: indirect

     Signed-off-by: dependabot[bot] &lt;support@github.com&gt;

* __Bump url-parse from 1.5.1 to 1.5.3 (#727)__

    [dependabot[bot]](mailto:49699333+dependabot[bot]@users.noreply.github.com) - Wed, 1 Sep 2021 13:42:29 -0500    
    
    Bumps [url-parse](https://github.com/unshiftio/url-parse) from 1.5.1 to 1.5.3.
    - [Release notes](https://github.com/unshiftio/url-parse/releases)
    - [Commits](https://github.com/unshiftio/url-parse/compare/1.5.1...1.5.3)
    
    updated-dependencies:
    - dependency-name: url-parse
     dependency-type: indirect

     Signed-off-by: dependabot[bot] &lt;support@github.com&gt;

* __[Build] use saved legacy config for 1.x (#743)__

    [Kawika Avilla](mailto:kavilla414@gmail.com) - Tue, 31 Aug 2021 15:29:23 -0700
    
    
    An original update to enable taking settings from a valid legacy version and
    applying to current OpenSearch Dashboards was made here:
     https://github.com/opensearch-project/OpenSearch-Dashboards/pull/485
    However, it explicitly checked for current version being 1.0.0, which is too strict because ideally all versions of 1.x is compatible.
    This makes the config check more relaxed and will taking settings from a legacy version if the current version is 1.x.
    
    Issue resolved:
    
    https://github.com/opensearch-project/OpenSearch-Dashboards/issues/741
    
    Signed-off-by: Kawika Avilla &lt;kavilla414@gmail.com&gt;

* __[Purify] Remove deprecation message in batchSearches settings (#735)__

    [Kawika Avilla](mailto:kavilla414@gmail.com) - Mon, 30 Aug 2021 21:33:29 -0700
    
    Remove deprecation message from batchSearches in advanced settings.
    It referenced OpenSearch Dashboards 8.0, which is just from the legacy application. No plan to deprecate yet.
    
    Issue resolved:
    
    https://github.com/opensearch-project/OpenSearch-Dashboards/issues/363
    
    Signed-off-by: Kawika Avilla &lt;kavilla414@gmail.com&gt;

* __[Build] build:types and uiFramework run successfully (#734)__

    [Kawika Avilla](mailto:kavilla414@gmail.com) - Mon, 30 Aug 2021 21:33:03 -0700
    
    Allowing for the following builds to complete successfully:
    * `yarn build:types`
    * `yarn uiFramework:build`
    * `yarn uiFramework:start`
    
    Not positive about the expected results when running uiFramework:start
    but it seems to be on par with the legacy 7.10.2 version.
    
    Issue resolved:
    
    https://github.com/opensearch-project/OpenSearch-Dashboards/issues/680
    
    Signed-off-by: Kawika Avilla &lt;kavilla414@gmail.com&gt;

* __[Docs] Update doc refs from beta to prod (#733)__

    [Kawika Avilla](mailto:kavilla414@gmail.com) - Thu, 26 Aug 2021 19:51:39 -0700
    
    Updating references to the doc site from docs-beta.opensearch.org to the production site of opensearch.org/docs. Did not remove the TODOs because we do not have replacements for the content yet.
    
    Issue partially resolved:
    
    https://github.com/opensearch-project/OpenSearch-Dashboards/issues/335
    
    Signed-off-by: Kawika Avilla &lt;kavilla414@gmail.com&gt;

* __[Build] Dashboards working with legacy engines 7.10.2 (#724)__

    [Kawika Avilla](mailto:kavilla414@gmail.com) - Mon, 23 Aug 2021 18:12:26 -0700
    
    Enables the version check to work specifically in the case of OSD 1.X and legacy 7.10.2. This will avoid conflicts in future versions of the application where Dashboards is not compatible with the Engines on version differences. Testing for verifying compatible legacy version.
    
    Issues resolved:
    
    https://github.com/opensearch-project/OpenSearch-Dashboards/issues/720
    
    Signed-off-by: Kawika Avilla &lt;kavilla414@gmail.com&gt;

* __docs(docker): add .dockerignore, add build instructions (#299)__

    [Denys Vitali](mailto:denys@denv.it) - Sat, 21 Aug 2021 22:51:11 -0500
    
    
    Signed-off-by: Denys Vitali &lt;denys@denv.it&gt;

* __[Build] Version bump for 1.1 release (#722)__

    [Kawika Avilla](mailto:kavilla414@gmail.com) - Wed, 18 Aug 2021 15:10:59 -0700  
    
    Bumps the minor to 1.1 for the 1.0 release.Needed to modify the artifact.js file to the newly formatted artifact URL so that tests work out of the box.
    
    Issue resolved:
    
    https://github.com/opensearch-project/OpenSearch-Dashboards/issues/681
    
    Signed-off-by: Kawika Avilla &lt;kavilla414@gmail.com&gt;

* __[Docs] Improve the getting started section of the developer guide (#710)__

    [Rémi Weislinger](mailto:2735603+closingin@users.noreply.github.com) - Wed, 18 Aug 2021 15:06:34 -0700
    
    - Add more detailed explanations to setup a dev environment
    - Recommend the docker version of OpenSearch as the default backend
    - Improve the UI of the guide with a new header
    - Remove the nvm installation section, and link to its docs instead
    
    Signed-off-by: closingin &lt;2735603+closingin@users.noreply.github.com&gt;

* __[Docs] Added SECURITY.md (#715)__

    [Kawika Avilla](mailto:kavilla414@gmail.com) - Wed, 18 Aug 2021 14:57:30 -0700
      
    Adding SECURITY.md as it is defined in the README. Will inform developers how to report security issues.
    
    Issue resolved:
    
    https://github.com/opensearch-project/OpenSearch-Dashboards/issues/714
    
    Signed-off-by: Kawika Avilla &lt;kavilla414@gmail.com&gt;

* __[Docs] Added TESTING.md (#713)__

    [Kawika Avilla](mailto:kavilla414@gmail.com) - Thu, 12 Aug 2021 11:02:26 -0700
    
    Adding TESTING.md to the project as referenced in the README. The content is some general information about testing and should not
    be considered exhaustive.
    
    Issue resolved:
    
    https://github.com/opensearch-project/OpenSearch-Dashboards/issues/667
    
    Signed-off-by: Kawika Avilla &lt;kavilla414@gmail.com&gt;

* __[Bug] remove tutorials from router temporarily (#675)__

    [Kawika Avilla](mailto:kavilla414@gmail.com) - Wed, 4 Aug 2021 16:27:21 -0700
    
    We removed the ability to access the tutorials page because we do not have replacement for the links provided by the tutorials.However, users could directly navigate to those pages if they typed
    into the browser or had a bookmark. This removes those routes from the router.
    
    Issues resolved:
    
    https://github.com/opensearch-project/OpenSearch-Dashboards/issues/647
    
    Signed-off-by: Kawika Avilla &lt;kavilla414@gmail.com&gt;

* __Bump `ws` from 7.3.1 to 7.5.3 (#699)__

    [Tommy Markley](mailto:markleyt@amazon.com) - Wed, 4 Aug 2021 14:48:05 -0500
    
    Addresses https://github.com/advisories/GHSA-6fc8-4gx4-v693
    Bumps [ws](https://github.com/websockets/ws) from 7.3.1 to 7.5.3
    - [Release notes](https://github.com/websockets/ws/releases/tag/7.5.3)
    - [Commits](https://github.com/websockets/ws/compare/7.3.1...7.5.3)
    
    Signed-off-by: Tommy Markley &lt;markleyt@amazon.com&gt;

* __Bump `postcss` from 7.0.32 to 7.0.36 (#698)__

    [Tommy Markley](mailto:markleyt@amazon.com) - Wed, 4 Aug 2021 14:47:38 -0500
    
    Addresses https://github.com/advisories/GHSA-hwj9-h5mp-3pm3
    Bumps [postcss](https://github.com/postcss/postcss) from 7.0.32 to 7.0.36
    - [Release notes](https://github.com/postcss/postcss/releases/tag/7.0.36)
    - [Changelog](https://github.com/postcss/postcss/blob/7.0.36/CHANGELOG.md)
    - [Commits](https://github.com/postcss/postcss/compare/7.0.32...7.0.36)
    
    Signed-off-by: Tommy Markley &lt;markleyt@amazon.com&gt;

* __Update FieldEditor test snapshots (#691)__

    [Tommy Markley](mailto:markleyt@amazon.com) - Wed, 4 Aug 2021 14:47:10 -0500
     
    Previous PR #674 did not include updated snapshots.Related to
    https://github.com/opensearch-project/OpenSearch-Dashboards/issues/673
    
    Signed-off-by: Tommy Markley &lt;markleyt@amazon.com&gt;

* __Add Getting Started section to the Developer Guide (#685)__

    [Tommy Markley](mailto:markleyt@amazon.com) - Tue, 3 Aug 2021 12:18:07 -0500
    
    * Add development environment setup link to Welcome section of the README.
    * Remove broken Admin Responsibilities link from the README.
    
    Resolves
    https://github.com/opensearch-project/OpenSearch-Dashboards/issues/666
    
    Signed-off-by: Tommy Markley &lt;markleyt@amazon.com&gt;

* __[BUG] fix CODE_OF_CONDUCT link in README.md (#676) (#677)__

    [Sagar Rout](mailto:sagar_rout@hotmail.com) - Wed, 28 Jul 2021 13:19:37 -0700
    
    Add CODE_OF_CONDUCT file, Copy CODE_OF_CONDUCT file from https://github.com/opensearch-project/OpenSearch repository.
    
    Signed-off-by: Sagar Rout &lt;sagar@sagarrout.com&gt;

* __[Test] Fix console warning in field_editor.test.tsx (#674)__

    [Anan](mailto:79961084+ananzh@users.noreply.github.com) - Wed, 28 Jul 2021 11:15:42 -0700
    
    Currently, unit test field_editor.test.tsx shows a console warning:
    
    `React.createElement: type is invalid -- expected a string
    (for built-in components) or a class/function (for composite components)
    but got: undefined. `

    This warning is because EuiCodeEditor is missing in the mock of elastic/eui, which causes undefined EuiCodeEditor in the test.
     
    PR Resolved:
    
    https://github.com/opensearch-project/OpenSearch-Dashboards/issues/673
    
    Signed-off-by: Anan Zhuang &lt;ananzh@amazon.com&gt;

* __[Test] Fix console error in search_service.test.ts  (#595)__

    [Anan](mailto:79961084+ananzh@users.noreply.github.com) - Mon, 26 Jul 2021 08:33:16 -0700
    
    Run unit test suite search_service.test.ts has a console error:
    ```
    UnhandledPromiseRejectionWarning: TypeError: Cannot read aggs property of undefined
    ```
    
    This is caused by a missing promise result check in the setup fun
    in search_service.ts. If the promise result is empty (or null/undefined), then any properties of the empty result is undefined. In our case,
    `aggs` in `if (value.search.aggs.shardDelay.enabled)` is undefined.
    In this PR, we fixed this issue by adding a value check in setup fun.
    
    Issues resolved:
    
    https://github.com/opensearch-project/OpenSearch-Dashboards/issues/594
    
    Signed-off-by: Anan Zhuang &lt;ananzh@amazon.com&gt;

* __[Bug] fix timeline icon in Visualize list (#659)__

    [Kawika Avilla](mailto:kavilla414@gmail.com) - Mon, 26 Jul 2021 08:24:01 -0700  
    
    Icon was not loading in the Visualize list because it was
    referencing a non-existant icon. Other parts of the code loads the icon correctly, so updated the icon to an existing
    icon.
    
    Issues resolved:
    
    https://github.com/opensearch-project/OpenSearch-Dashboards/issues/658
    
    Signed-off-by: Kawika Avilla &lt;kavilla414@gmail.com&gt;

* __Update MAINTAINERS.md (#600)__

    [Andrew Hopp](mailto:andrew.hopp@me.com) - Fri, 23 Jul 2021 12:41:53 -0500  
    
    * Add path to .github maintainer doc
    * Add path to CONTRIBUTING.md
    
    Signed-off-by: Tommy Markley &lt;markleyt@amazon.com&gt;
    Co-authored-by: Tommy Markley &lt;markleyt@amazon.com&gt;

* __Update CONTRIBUTING.md (#598)__

    [Andrew Hopp](mailto:andrew.hopp@me.com) - Fri, 23 Jul 2021 12:41:10 -0500 
    
    * Move ToC to top to match the OpenSearch repo
    * Minor formatting changes
    * Remove reference to pre-alpha state
    * Add links for opening issues
    * Remove &#34;w00t!!!&#34; from end of file
    
    Signed-off-by: Tommy Markley &lt;markleyt@amazon.com&gt;
    Co-authored-by: Tommy Markley &lt;markleyt@amazon.com&gt;

* __Clean up README.md (#596)__

    [Andrew Hopp](mailto:andrew.hopp@me.com) - Fri, 23 Jul 2021 12:36:12 -0500
      
    * Add darkmode logo
    * Add a ToC and relevant sections
    * Add Project Resources to replace how can you help&#34;, &#34;running tests&#34;, &#34;guiding
    principles&#34;, etc.
    * Add CoC
    * Add License
    * Add Copyright
    
    Signed-off-by: Tommy Markley &lt;markleyt@amazon.com&gt;
    Co-authored-by: Andrew Hopp &lt;andrew.hopp@me.com&gt;

* __[Test] Wrap FunComponent in unit test with IntlProvider (#654)__

    [Anan](mailto:79961084+ananzh@users.noreply.github.com) - Fri, 23 Jul 2021 09:01:00 -0700
       
    In the FunctionComponent unit tests, we see many console errors:
    `Could not find required intl object. &lt;IntlProvider&gt; needs to
    exist in the
    component ancestry. `
     This is because for some unit tests, we mount the FunctionComponent
    (with Enzyme&#39;s mount()) , which access to the react-intl context by
    
    FormattedMessage without their &lt;IntlProvider /&gt; parent wrapper.
    This PR solves 7 out of 8 unit tests with this issue by wrapping the &lt;IntlProvider /&gt; either through original enzyme_helper functions or a simple wrapper wrapWithIntl.
    
    Partically Resolved:
    
    https://github.com/opensearch-project/OpenSearch-Dashboards/issues/593
    
    Signed-off-by: Anan Zhuang &lt;ananzh@amazon.com&gt;

* __Increase filters popover size and use full width in form components  (#352)__

    [Gal Angel](mailto:gal0angel@gmail.com) - Tue, 20 Jul 2021 10:33:10 -0700
    
    * use full width
     Signed-off-by: galangel &lt;gal0angel@gmail.com&gt;
    
    * Update width
     Signed-off-by: galangel &lt;gal0angel@gmail.com&gt;
    
    * observer
    
    Signed-off-by: galangel &lt;gal0angel@gmail.com&gt;

* __[Purify] update general info in run_fpm (#644)__

    [Kawika Avilla](mailto:kavilla414@gmail.com) - Mon, 19 Jul 2021 09:41:35 -0700
       
    Updating references from Elastic to OpenSearch for building
    and packaging.
    Originated from the error message from:
    
    https://github.com/opensearch-project/OpenSearch-Dashboards/issues/601
    
    Signed-off-by: Kawika Avilla &lt;kavilla414@gmail.com&gt;

* __[Tests] ARM64 artifacts for testing (#641)__

    [Kawika Avilla](mailto:kavilla414@gmail.com) - Tue, 13 Jul 2021 09:34:30 -0700  
    
    Removing the graceful failures for ARM64 snapshot testing and
    updating tests.
    Previously, snapshots for ARM64 were not available but now they are
    so this allows developers to run tests for that arch out of the box
    whereas before
    they had to set the snapshot manually.
    
    Partially resolves:
    
    https://github.com/opensearch-project/OpenSearch-Dashboards/issues/475
    
    Signed-off-by: Kawika Avilla &lt;kavilla414@gmail.com&gt;

* __[Bug] Replace kibana issue in /packages/osd-optimizer/README.md (#608)__

    [Anan](mailto:79961084+ananzh@users.noreply.github.com) - Mon, 12 Jul 2021 14:37:36 -0700
       
    /packages/osd-optimizer/README.md has a kibana issue reference. This PR replaces the kibana issue with an open discuss issue.
    
    Partically Resolved:
    
    https://github.com/opensearch-project/OpenSearch-Dashboards/issues/592
    
    Signed-off-by: Anan Zhuang &lt;ananzh@amazon.com&gt;

* __[PURIFY] Remove certs and PKCS12 files temporarily (#616)__

    [Kawika Avilla](mailto:kavilla414@gmail.com) - Fri, 9 Jul 2021 11:42:06 -0700
    
    
    Removed the generated keys from Elastic. Since we did not own those
    and do not
    have the private key for the cert authority then it will
    be safer.
    This should not have any impact on runtime, might impact security
    related to x-pack with demo certs but none of the certs where
    for production. Otherwise,
    this is strictly for testing.
    
    To be clear, this can be emptied out because it is ONLY for demo
    and testing purposes. The demo security can be accomplished by
    using:
     
    https://github.com/opensearch-project/security/blob/main/tools/install_demo_configuration.sh
    
    Eventually we should take the certs from that file and copy those over but will just ignore the tests for now.
     
    Signed-off-by: Kawika Avilla &lt;kavilla414@gmail.com&gt;

* __[Bug] Remove license concepts in packages/osd-opensearch (#602)__

    [Anan](mailto:79961084+ananzh@users.noreply.github.com) - Fri, 9 Jul 2021 11:31:04 -0700
       
    Currenlty, /packages/osd-opensearch/README.md still have license
    concepts.
    This PR cleans the concepts.
    Partially Resolved:
    
    https://github.com/opensearch-project/OpenSearch-Dashboards/issues/592
    
    Signed-off-by: Anan Zhuang &lt;ananzh@amazon.com&gt;

* __[Bug] Fix broken links in packages/opensearch-safter-lodash-set (#607)__

    [Anan](mailto:79961084+ananzh@users.noreply.github.com) - Fri, 9 Jul 2021 11:08:52 -0700
    
    
    Both LICENSE and package.json in packages/opensearch-safter-lodash-set
    have
    broken links. This PR fixes links in these two files.
    
    Partically Resolved:
    
    https://github.com/opensearch-project/OpenSearch-Dashboards/issues/592
    
    Signed-off-by: Anan Zhuang &lt;ananzh@amazon.com&gt;

* __[Bug] Clean elastic-eslint-config-kibana in packages/osd-pm/README.md (#611)__

    [Anan](mailto:79961084+ananzh@users.noreply.github.com) - Fri, 9 Jul 2021 11:07:27 -0700
    
    
    Currently, packages/osd-pm/README.md still mentions old package name.
    This PR
    replaces package name from elastic-eslint-config-kibana
    to
    opensearch-eslint-config-opensearch-dashboards. Meanwhile, there
    is a
    duplicate README.md in packages/osd-pm/src which is deleted.
     Partically Resolved:
    
    https://github.com/opensearch-project/OpenSearch-Dashboards/issues/592
     Signed-off-by: Anan Zhuang &lt;ananzh@amazon.com&gt;

* __[Bug] Clean concepts in packages/osd-plugin-helpers/README.md (#610)__

    [Anan](mailto:79961084+ananzh@users.noreply.github.com) - Fri, 9 Jul 2021 11:06:34 -0700
    
    
    The versions in packages/osd-plugin-helpers/README.md are still 6.3
    which
    should be updated to 1.0. Meanwhile, there are some old concepts,
    like
    checking versions, which should be cleaned. This PR fixes the
    versions and
    cleans out the old concepts.
     Partically Resolved:
    
    https://github.com/opensearch-project/OpenSearch-Dashboards/issues/592
     Signed-off-by: Anan Zhuang &lt;ananzh@amazon.com&gt;

* __[Bug] Clean concepts in packages/osd-plugin-generator/README.md (#609)__

    [Anan](mailto:79961084+ananzh@users.noreply.github.com) - Fri, 9 Jul 2021 11:05:41 -0700
    
    
    The versions in packages/osd-plugin-generator/README.md are still 6.x
    which
    should be updated to 1.0. Meanwhile, there are some old concepts,
    like test
    using mocha, which should be cleaned. This PR fixes the versions
    and cleans
    out the old concepts.
     Partically Resolved:
    
    https://github.com/opensearch-project/OpenSearch-Dashboards/issues/592
     Signed-off-by: Anan Zhuang &lt;ananzh@amazon.com&gt;

* __[Bug] Replace words in /packages/opensearch-datemath/readme.md (#606)__

    [Anan](mailto:79961084+ananzh@users.noreply.github.com) - Fri, 9 Jul 2021 11:03:07 -0700
    
    
    /packages/opensearch-datemath/readme.md still has old concepts.
    This PR
    replaces the word Kibana to OpenSearch Dashboards.
     Partically Resolved:
    
    https://github.com/opensearch-project/OpenSearch-Dashboards/issues/592
     Signed-off-by: Anan Zhuang &lt;ananzh@amazon.com&gt;

* __[Bug] Fix broken links in opensearch-eslint-config-opensearch-dashboards (#605)__

    [Anan](mailto:79961084+ananzh@users.noreply.github.com) - Fri, 9 Jul 2021 11:02:42 -0700
    
    
    Both package.json and README.md in
    /packages/opensearch-eslint-config-opensearch-dashboards
    have some broken
    links or old concepts. This PR fixes these two files.
     Partically Resolved:
    
    https://github.com/opensearch-project/OpenSearch-Dashboards/issues/592
    
    Signed-off-by: Anan Zhuang &lt;ananzh@amazon.com&gt;

* __[Bug] Fix broken link in package.json (#604)__

    [Anan](mailto:79961084+ananzh@users.noreply.github.com) - Fri, 9 Jul 2021 11:01:50 -0700
    
    
    Package.json has a broken homepage link. This PR fixes this link.
     Partically Resolved:
    
    https://github.com/opensearch-project/OpenSearch-Dashboards/issues/592
     Signed-off-by: Anan Zhuang &lt;ananzh@amazon.com&gt;

* __[Bug] Remove appKey in github-checks-reporter (#603)__

    [Anan](mailto:79961084+ananzh@users.noreply.github.com) - Fri, 9 Jul 2021 11:01:14 -0700
    
    
    github-checks-reporter is a task wrapper that provides expressive
    CI feedback
    via GitHub checks. Currently, we don’t have our own
    appKey. To avoid any
    confusions, this PR removed the old key.
     Partically Resolved:
    
    https://github.com/opensearch-project/OpenSearch-Dashboards/issues/592
     Signed-off-by: Anan Zhuang &lt;ananzh@amazon.com&gt;

* __[Bug] remove incorrect reference in testing.md (#597)__

    [Anan](mailto:79961084+ananzh@users.noreply.github.com) - Fri, 9 Jul 2021 10:58:58 -0700
    
    
    There is a kibana closed issue reference under test
    &#34;authenticated / non-authenticated user access&#34;.
    We removed the reference in
    this PR.
     Partially Resolved:
    
    https://github.com/opensearch-project/OpenSearch-Dashboards/issues/592
     Signed-off-by: Anan Zhuang &lt;ananzh@amazon.com&gt;

* __[Bug] replace words in PRINCIPLES.md (#599)__

    [Anan](mailto:79961084+ananzh@users.noreply.github.com) - Fri, 9 Jul 2021 09:17:55 -0700
    
    
    Partially Resolved:
    
    https://github.com/opensearch-project/OpenSearch-Dashboards/issues/592
     Signed-off-by: Anan Zhuang &lt;ananzh@amazon.com&gt;

* __Update readme for dashboards 1.0.0 (#579)__

    [Anan](mailto:79961084+ananzh@users.noreply.github.com) - Fri, 2 Jul 2021 13:19:38 -0700
    
    
    Update RC state to GA state
     Issues resolved:
    
    https://github.com/opensearch-project/OpenSearch-Dashboards/issues/577
     Signed-off-by: Anan Zhuang &lt;ananzh@amazon.com&gt;


