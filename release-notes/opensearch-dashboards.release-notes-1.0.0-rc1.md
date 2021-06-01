## Version 1.0.0-rc1 Release Notes

* __Fix beta doc links, truncated help menu label (#382)__

    [Tommy Markley](mailto:markleyt@amazon.com) - Wed, 26 May 2021 15:54:42 -0700
    
    EAD -&gt; refs/heads/release-notes, refs/remotes/upstream/main, refs/heads/main
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
    (unit, integ, and func test all passing). This is allowable because
    this is
    for functional purposes and for clusters/plugins that will
    migrate to
    Dashboards. Their index will not require re-indexing for 1.0.0
    and shouldn&#39;t
    require a full migration after further updates.
     Signed-off-by: Kawika Avilla &lt;kavilla414@gmail.com&gt;

* __[Build] restore kibanaSavedObjectMeta (#375)__

    [Kawika Avilla](mailto:kavilla414@gmail.com) - Wed, 26 May 2021 13:55:33 -0700
    
    
    Restoring the index from opensearchDashboardsSavedObjectMeta to
    
    kibanaSavedObjectMeta and then updated the tests.
     This is allowable because this is for functional purposes and for
    
    clusters/plugins that will migrate to Dashboards. Their index will
    not require
    re-indexing for 1.0.0 and should not require a full
    migration.
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
    
    efs/remotes/origin/i-335, refs/heads/i-335
    Added Auto-focus on Add Filter Input
     Done by setting the initial focus of the popover with the relevant selector
    
    * correct autofocus
     Signed-off-by: galangel &lt;gal0angel@gmail.com&gt;
    
    * use class
     Signed-off-by: galangel &lt;gal0angel@gmail.com&gt;


