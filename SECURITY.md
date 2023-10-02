## Reporting a Vulnerability

If you discover a potential security issue in this project we ask that you notify AWS/Amazon Security via our [vulnerability reporting page](http://aws.amazon.com/security/vulnerability-reporting/) or directly via email to aws-security@amazon.com. Please do **not** create a public GitHub issue.

## Fixing a Vulnerability

- For direct dependencies (listed explicitly in `package.json`) - After identifying a version of the package that is both compatible with OpenSearch Dashboards and includes a fix for the vulnerability, update the dependency in `package.json` and run `yarn osd bootstrap` to build the project and update the `yarn.lock` file.

- For nested dependencies (sub-dependencies)

    - Check the package range in package.json: Open the `package.json` file and locate the dependency entry for the package you're interested in. The version range is specified after the package name, using a combination of version numbers and symbols. Examples of version ranges are ^1.0.0, ~1.0.0, or >=1.0.0 <2.0.0. Ensure that the desired version falls within the specified range.

    - Check the desired version in `yarn.lock`: Open the `yarn.lock` file and search for the package name. If the package is listed, check the version number specified for the package. Compare this version number with the desired version.

    - If the package range is suitable but `yarn.lock` does not include the desired version, edit the `yarn.lock` file and remove the lines corresponding to the package. Then, run `yarn osd bootstrap` to have the latest version of the package, that satisfies the range from `package.json`, added to `yarn.lock`.

    - If the package range is not suitable and there is no resolutions or the package range in the resolutions is not correct, we can add or update version in the resolutions for all the package sub-deps or specific package sub-dep. For more on version updates please see [Why](https://classic.yarnpkg.com/lang/en/docs/selective-version-resolutions/#toc-why-would-you-want-to-do-this) and [How](https://classic.yarnpkg.com/lang/en/docs/selective-version-resolutions/#toc-how-to-use-it) to upgrade.

    ```
    Example: If foobar@1.x exists for subdeps in yarn.lock file. But foobar@1.y is the target version.

    Step 1: remove the entry from lockfile and bootstrap; if a suitable version was installed, you can stop.
    Step 2: use resolutions to require a specific range for the nested dependency in package.json:
    'resolutions': { "**/foobar": "^1.y",
                     "**/foo": "^2.x" ,
                     "**/bar": "^3.k"}
    Step 3: repeat step 1

    ```

    Please be aware of that fixing nested dependencies can be tricky. Sometimes, bumping a parent package of the nested dependency can upgrade several of the nested dependencies at once to solve multiple security vulnerabilities and provide a more maintainable code base.

## Backport a Vulnerability Fix

To backport a CVE fix to previous versions of OpenSearch Dashboards, add the desired backport labels (e.g., backport 1.x) to the PR. Upon merging the PR, a workflow will attempt to backport it. If this process fails, the PR will be updated with a comment detailing the failure, and you'll need to follow the provided instructions to manually backport the changes in a new PR. Keep in mind that some CVEs may require distinct resolutions for each branch, such as a major version bump in the main branch, a minor version bump in the 2.x branch, and a specific resolution in the 1.x branch. Refer to the following steps for guidance:

1. Identify the pull request you want to backport and the target backport version.
2. Create a new local branch from the target version.
3. Cherry-pick the changes from the pull request into the new branch. To do this, you can use the `git cherry-pick` command followed by the hash of the pull request commit. For example: `git cherry-pick 123456`.
4. Resolve any conflicts. This step may require some manual intervention.
5. Run `yarn osd bootstrap` in the root directory. This will update the dependencies, install the latest version of the package that satisfies the range from `package.json`, and add the updated package information to the `yarn.lock` file.
5. Test the changes thoroughly.
6. Push the new branch to the appropriate remote repository.
7. Submit a new pull request to the target version for the backported changes.

```
    Example: backport a pull request with hash 123 in main to 1.3

    * Fetch the latest changes from upstream repo:
    git pull upstream

    * Create a new local branch from the target version:
    git checkout -b backport-cve upstream/1.3

    * Cherry pick the changes:
    git cherry-pick 123

    * Resolve any conflicts.

    * Push to your origin forked repo:
    git push -u origin backport-cve

    * Submit a new pull request to 1.3.

```

It's worth noting that backporting a pull request can be a complex process and depending on the changes involved, additional steps might be required to resolve conflicts. It's important to carefully review and test the changes to ensure they are compatible with the version of OpenSearch Dashboards in the target branch and that the changes are applied correctly.
