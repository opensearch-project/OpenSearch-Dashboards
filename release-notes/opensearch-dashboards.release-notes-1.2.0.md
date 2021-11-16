
* __[1.2][Release] add axios dependency to UI package__

    [Kawika Avilla](mailto:kavilla414@gmail.com) - Mon, 8 Nov 2021 20:14:20 -0800
    
    EAD -&gt; refs/heads/release, refs/remotes/origin/1.2, refs/heads/1.2
    This package was missing from release build so have to add it to this package.
    
    Brought in by custom branding.
    
    Backport PR: 
    https://github.com/opensearch-project/OpenSearch-Dashboards/pull/922
    
    Signed-off-by: Kawika Avilla &lt;kavilla414@gmail.com&gt;
    

* __[1.2] Fix Node selection when using built in node (#912) (#917)__

    [Kawika Avilla](mailto:kavilla414@gmail.com) - Fri, 5 Nov 2021 15:22:14 -0700
    
    
    Fixed node selection to use the node executable instead of the user local node.
    
     Issue resolved:
    
    https://github.com/opensearch-project/OpenSearch-Dashboards/issues/908
     Signed-off-by: Sven R &lt;admin@hackacad.net&gt;
     Co-authored-by: Sven R &lt;admin@hackacad.net&gt;

* __Update the dashboard maps end point (#893) (#899)__

    [Junqiu Lei](mailto:junqiu@amazon.com) - Tue, 2 Nov 2021 16:06:38 -0700
    
    
    Currently the maps end point can&#39;t be accessed from India and China, we are
    going to update maps end point to the new one &#34;maps.opensearch.org&#34; for
    OpenSearch community users, which will solve the pain for opensource users from
    some region can&#39;t access to the existing one.
     https://github.com/opensearch-project/OpenSearch-Dashboards/issues/777
     Signed-off-by: Junqiu Lei &lt;junqiu@amazon.com&gt;

* __[1.x] Custom Branding (#826) (#898)__

    [Kawika Avilla](mailto:kavilla414@gmail.com) - Tue, 2 Nov 2021 16:06:38 -0700
    
    
    * Make top left logo on the main screen configurable
     Add a new config opensearchDashboards.branding.logoUrl in yaml file
    for
    making top left corner logo on the main screen configurable. If
    URL is
    invalid, the default OpenSearch logo will be shown.
     Signed-off-by: Abby Hu &lt;abigailhu2000@gmail.com&gt;
    
    * Welcome page title and logo configurable (#738)
     Add two new configs branding.smallLogoUrl and branding.title
    in the yaml file
    for making the welcome page logo and title
    configurable. If URL is invalid, the default branding will be shown.
     Signed-off-by: Qingyang(Abby) Hu &lt;abigailhu2000@gmail.com&gt;
    
    * Make loading page logo and title configurable (#746)
     Add one new config branding.loadingLogoUrl for making loading page logo
    
    configurable. URL can be in svg and gif format. If no loading logo is found,
    
    the static logo with a horizontal bar loading bar will be shown. If logo is
    also
    not found, the default OpenSearch loading logo and spinner will be shown.
    
     Signed-off-by: Qingyang(Abby) Hu &lt;abigailhu2000@gmail.com&gt;
    
    * Branding configs rename and improvement (#771)
     Change config smallLogoUrl to logoUrl, config logoUrl to fullLogoUrl to
    emphasize that thumbnail version
    of the logo will be used mostly in the
    application. Full version of the logo will only be used on the main
    page nav
    bar. If full logo is not provided, thumbnail logo will be used on the nav bar.
    Some config improvement
    includes fixing the validation error when inputting
    empty string, and add title validation function.
     Signed-off-by: Qingyang(Abby) Hu &lt;abigailhu2000@gmail.com&gt;
    
    * Branding config structure change and renaming (#793)
     Change the branding related config to a map structure in the yml file.
    Also
    rename the configs according to the official branding guidelines.
    The full
    logo on the main page header will be called logo; the small
    logo icon will be
    called mark.
     Signed-off-by: Qingyang(Abby) Hu &lt;abigailhu2000@gmail.com&gt;
    
    * Darkmode configurations for header logo, welcome logo and loading logo (#797)
    
     Add dark mode configs in the yml file that allows user to configure a
    dark
    mode version of the logo. When user toggles dark mode under the
    Advanced
    Setting, the logo will be rendered accordingly.
     Signed-off-by: Qingyang(Abby) Hu &lt;abigailhu2000@gmail.com&gt;
    
    * Add favicon configuration (#801)
     Added a configuration on favicon inside opensearchDashboards.branding
    in the
    yml file. If user inputs a valid URL, we gurantee basic browser
    favicon
    customization, while remaining places show the default browser/device
    favicon
    icon. If user does not provide a valid URL for favicon, the
    opensearch favicon
    icon will be used.
     Signed-off-by: Qingyang(Abby) Hu &lt;abigailhu2000@gmail.com&gt;
    
    * Make home page primary dashboard card logo and title configurable (#809)
     Home page dashboard card logo and title can be customized by config
    
    mark.defaultUrl and mark.darkModeUrl. Unit test and functional test
    are also
    written.
     Signed-off-by: Qingyang(Abby) Hu &lt;abigailhu2000@gmail.com&gt;
    
    * Side menu logo configuration
     Make logo for opensearch dashboard side menu be configurable.
    Use config
    mark.defaultUrl and mark.darkModeUrl.
     Signed-off-by: Abby Hu &lt;abigailhu2000@gmail.com&gt;
    
    * Overview Header Logo Configuration
     Make logo for opensearch dashboard overview header logo be configurable.
    Use
    config mark.defaultUrl and mark.darkModeUrl.
     Signed-off-by: Abby Hu &lt;abigailhu2000@gmail.com&gt;
    
    * Redirect URL not allowed
     Add an addtional parameter to the checkUrlValid function
    so that max redirect
    count is 0. We do not allow URLs that
    can be redirected because of potential
    security issues.
     Signed-off-by: Abby Hu &lt;abigailhu2000@gmail.com&gt;
    
    * Store default opensearch branding asset folder
     Store the original opensearch branding logos in an asset folder,
    instead of
    making API calls.
     Signed-off-by: Abby Hu &lt;abigailhu2000@gmail.com&gt;
    
    * [Branding] handle comments from PR
     Handling the helper function rename and grammar issues.
     To avoid risk, we will not remove the duplicate code for 1.2 and
    everything
    related to those comments (ie function renames).
     That will be handled in 1.3. Here is the issue tracking it:
     https://github.com/opensearch-project/OpenSearch-Dashboards/issues/895
     Signed-off-by: Kawika Avilla &lt;kavilla414@gmail.com&gt;
     Co-authored-by: Kawika Avilla &lt;kavilla414@gmail.com&gt;
     Backport PR:
    
    https://github.com/opensearch-project/OpenSearch-Dashboards/pull/897
     Co-authored-by: Qingyang(Abby) Hu &lt;abigailhu2000@gmail.com&gt;

* __Shorten Import Statements (#688) (#888)__

    [Tommy Markley](mailto:markleyt@amazon.com) - Tue, 2 Nov 2021 16:06:38 -0700
    
    
    Signed-off-by: Merwane Hamadi &lt;merwanehamadi@gmail.com&gt;

* __[1.x] Add ARM build for re2 (#887) (#890)__

    [Anan](mailto:79961084+ananzh@users.noreply.github.com) - Mon, 25 Oct 2021 21:10:53 -0700
    
    
    In Timeline, we use node-re2 for the regular expressions specified by
    the end
    users. Currently, re2 doesn&#39;t have an ARM build and returns an
    error. To solve
    this issue, we create an linux-arm64-64.gz and store it.
     Issue Resolved:
    
    https://github.com/opensearch-project/OpenSearch-Dashboards/issues/660
     Backport PR:
    
    https://github.com/opensearch-project/OpenSearch-Dashboards/pull/887
     Signed-off-by: Anan Zhuang &lt;ananzh@amazon.com&gt;

* __[1.x][Purify] remove references to non-existent versions__

    [Kawika Avilla](mailto:kavilla414@gmail.com) - Fri, 22 Oct 2021 16:14:35 -0700
    
    
    Remove references to versions of OpenSearch Dashboards that do not yet exist
    but carried over from the legacy application.
    
    Backport PR: 
    https://github.com/opensearch-project/OpenSearch-Dashboards/pull/859
    
    Signed-off-by: Kawika Avilla &lt;kavilla414@gmail.com&gt;
    

* __[1.x] FreeBSD Node support (#884)__

    [Anan](mailto:79961084+ananzh@users.noreply.github.com) - Thu, 21 Oct 2021 09:32:06 -0700
    
    
    Backport PR:
    
    https://github.com/opensearch-project/OpenSearch-Dashboards/pull/678
     Signed-off-by: hackacad &lt;admin@hackacad.net&gt;
     Co-authored-by: hackacad &lt;admin@hackacad.net&gt;


