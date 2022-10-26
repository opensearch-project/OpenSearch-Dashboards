## Reporting a Vulnerability

If you discover a potential security issue in this project we ask that you notify AWS/Amazon Security via our [vulnerability reporting page](http://aws.amazon.com/security/vulnerability-reporting/) or directly via email to aws-security@amazon.com. Please do **not** create a public GitHub issue.

For Security-CVE related fix - 
1. For direct dependency - Use ```yarn upgrade package``` to update the package and in order to enforce as sub-deps please add nested-dep step 2.

2. For nested dependency/sub-deps - In order to enforce package above Vx.y.z, we can add version in the resolutions [section](https://classic.yarnpkg.com/lang/en/docs/selective-version-resolutions/) for all the package sub-deps or specific package sub-dep. For more on version updates please see 
[Why](https://classic.yarnpkg.com/lang/en/docs/selective-version-resolutions/#toc-why-would-you-want-to-do-this) and [How](https://classic.yarnpkg.com/lang/en/docs/selective-version-resolutions/#toc-how-to-use-it) to upgrade.

