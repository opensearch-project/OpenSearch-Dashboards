/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/* eslint no-restricted-syntax: 0 */

const fs = require('fs/promises');

/**
 * Some libraries pack their demos and examples into their release artifacts.
 * This unwanted content makes our release artifacts larger but more importantly,
 * some contain in-browser references to outdated and vulnerable versions of
 * libraries that are not even mentioned in the dependency tree. This is a
 * problem when vulnerability scanners point them out, and we have no way to fix
 * them. This function looks for folders that are unwanted and deletes them.
 */
const removeUnwantedFolders = async (root, unwantedNames) => {
  const items = await fs.readdir(root, { withFileTypes: true });
  const promises = [];
  for (const item of items) {
    if (!item.isDirectory()) continue;

    if (unwantedNames.includes(item.name)) {
      promises.push(fs.rm(`${root}/${item.name}`, { recursive: true, force: true }));
    } else {
      promises.push(...(await removeUnwantedFolders(`${root}/${item.name}`, unwantedNames)));
    }
  }

  return promises;
};

const patchFile = async (file, patch) => {
  console.log(`Patching ${file}`);
  const patches = Array.isArray(patch) ? patch : [patch];
  let fileContent = await fs.readFile(file, 'utf8');
  for (const { from, to } of patches) {
    // The splitting by `to` is to make sure we don't patch already patched ones
    fileContent = fileContent
      .split(to)
      .map((token) => token.split(from))
      .flat()
      .join(to);
  }
  await fs.writeFile(file, fileContent);
};

const run = async () => {
  const promises = await removeUnwantedFolders('node_modules', ['demo', 'example', 'examples']);

  promises.push(
    patchFile('node_modules/font-awesome/scss/_variables.scss', {
      from: '(30em / 14)',
      to: 'calc(30em / 14)',
    })
  );
  promises.push(
    patchFile('node_modules/@elastic/charts/dist/theme.scss', [
      {
        from: '$legendItemVerticalPadding / 2',
        to: 'calc($legendItemVerticalPadding / 2)',
      },
      {
        from: '$echLegendRowGap / 2',
        to: 'calc($echLegendRowGap / 2)',
      },
      {
        from: '$euiBorderRadius / 2',
        to: 'calc($euiBorderRadius / 2)',
      },
    ])
  );
  promises.push(
    patchFile('node_modules/rison-node/js/rison.js', [
      {
        from: 'return Number(s)',
        to:
          'return isFinite(s) && (s > Number.MAX_SAFE_INTEGER || s < Number.MIN_SAFE_INTEGER) ? BigInt(s) : Number(s)',
      },
      {
        from: 's = {',
        to: 's = {\n            bigint: x => x.toString(),',
      },
    ])
  );

  //Axios's type definition is far too advanced for OSD
  promises.push(
    patchFile('node_modules/axios/index.d.ts', {
      from: '[Key in Method as Lowercase<Key>]: AxiosHeaders;',
      to: '[Key in Method]: AxiosHeaders;',
    })
  );

  await Promise.all(promises);
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
