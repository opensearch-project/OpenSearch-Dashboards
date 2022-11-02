## Reporting a Vulnerability

- If you discover a potential security issue in this project we ask that you notify AWS/Amazon Security via our [vulnerability reporting page](http://aws.amazon.com/security/vulnerability-reporting/) or directly via email to aws-security@amazon.com. Please do **not** create a public GitHub issue.

- For Security-CVE related fix - 
    - For direct dependency - Use ```yarn upgrade package``` to update the package and in order to enforce as sub-deps please add nested-dep step2.

    - For nested dependency/sub-deps - In order to enforce package above Vx.y.z, we can add version in the resolutions [section](https://classic.yarnpkg.com/lang/en/docs/selective-version-resolutions/) for all the package sub-deps or specific package sub-dep. For more on version updates please see 
[Why](https://classic.yarnpkg.com/lang/en/docs/selective-version-resolutions/#toc-why-would-you-want-to-do-this) and [How](https://classic.yarnpkg.com/lang/en/docs/selective-version-resolutions/#toc-how-to-use-it) to upgrade.
    - To add the CVEs fix to previous versions, add label ex: backport 1.x. 
  
      ```
      Example: foobar@1.x vulnerable package and 1.y is the fix 
      step 1: 
      For direct dependency checks: 
              run: yarn upgrade foobar@1.y to update the package.json 
              and yarn install to update the yarn.lock file
      Step 2.
      Check for sub deps foobar in other package. 
              If foobar@1.x exists for subdeps in yarn.lock file
              Then edit the package.json file and add **/foobar@1.y in resolution section as shown below to enforce the 1.y.
                'resolutions': { "**/foobar": "^1.y", 
                                 "**/foo": "^2.x" ,
                                 "**/bar": "^3.k"}
              Then run: yarn install for updating yarn.lock file

    