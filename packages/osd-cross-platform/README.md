# `@osd/cross-platform` — OpenSearch Dashboards cross-platform helpers

This package contains the helpers to work around the differences across platforms, such as the difference in the path segment separator and the possibility of referencing a path using the short 8.3 name (SFN), a long name, and a long UNC on Windows. 

Some helpers are functions that `standardize` the reference to a path or help `getRepoRoot`, and some are constants referencing the `PROCESS_WORKING_DIR` or `REPO_ROOT`.

### Example

When the relative reference of `path` to the working directory is needed, using the code below would produce different results on Linux that it would on Windows and if the process was started in a Windows shell that used short paths, the results differ from a Windows shell that used long paths.
```js
import { relative } from 'path';

const relativePath = relative(process.cwd(), path);

// Output on Linux: relative-path/to/a/file
//         Windows: relative-path\to\a\file
//     Windows SFN: RELATI~1\to\a\file
```

To avoid those differences, helper functions and constants can be used:
```js
import { relative } from 'path';
import { standardize, PROCESS_WORKING_DIR } from '@osd/cross-platform';

const relativePath = standardize(relative(PROCESS_WORKING_DIR, path));

// Output: relative-path/to/a/file
```