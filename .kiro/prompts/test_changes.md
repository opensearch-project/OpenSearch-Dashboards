Run Jest unit tests for files changed in the current branch.

Scope: ${1:-branch} (options: branch, staged, unstaged, all-local)
Base ref: ${2:-auto-detect origin/main or origin/mainline}

Steps:
1. Find changed .ts/.tsx/.js files based on scope
2. For test files (*.test.*) in the diff, run them directly
3. For source files, find matching *.test.ts / *.test.tsx / *.test.js
4. Warn about source files with no matching test (non-blocking)
5. Run: yarn test:jest <all discovered test files>
6. Summarize results: files run, missing tests, pass/fail
