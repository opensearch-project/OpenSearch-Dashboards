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

const MONACO_IMPORT_META_FILES = [
  'editor/browser/services/editorWorkerService.js',
  'editor/standalone/browser/services/standaloneWebWorkerService.js',
  'languages/features/css/workerManager.js',
  'languages/features/html/workerManager.js',
  'languages/features/json/workerManager.js',
  'languages/features/typescript/workerManager.js',
];
const REACT_MONACO_EDITOR_FILES = ['index.js', 'editor.js', 'diff.js', 'index.d.ts', 'types.d.ts'];

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
  const tmpFile = `${file}.${process.pid}.tmp`;
  await fs.writeFile(tmpFile, fileContent);
  await fs.rename(tmpFile, file);
};

const assertNotPresent = async (file, text) => {
  if ((await fs.readFile(file, 'utf8')).includes(text)) {
    throw new Error(`postinstall: ${file} still contains "${text}" after patching`);
  }
};

const assertFileIncludes = async (file, snippets) => {
  console.log(`Verifying ${file}`);
  const fileContent = await fs.readFile(file, 'utf8');
  for (const snippet of snippets) {
    if (!fileContent.includes(snippet)) {
      throw new Error(`Expected patched content in ${file}: ${snippet}`);
    }
  }
};

const run = async () => {
  const promises = await removeUnwantedFolders('node_modules', [
    'demo',
    'example',
    'examples',
    'examples-0.7.x', // leaflet-draw/docs/examples-0.7.x/basic.html
  ]);

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
      // OUI's euiFocusRing mixin takes a single argument; drop the extra args.
      {
        from: '@include euiFocusRing(null, 1);',
        to: '@include euiFocusRing;',
      },
      // Wrap legacy Sass division so Dart Sass accepts it.
      {
        from: '$euiSizeXS / 2',
        to: 'calc($euiSizeXS / 2)',
      },
      {
        from: '$euiSizeXS/2',
        to: 'calc($euiSizeXS/2)',
      },
    ])
  );
  promises.push(
    patchFile('node_modules/rison-node/js/rison.js', [
      {
        from: 'return Number(s)',
        to: 'return isFinite(s) && (s > Number.MAX_SAFE_INTEGER || s < Number.MIN_SAFE_INTEGER) ? BigInt(s) : Number(s)',
      },
      {
        from: 's = {',
        to: 's = {\n            bigint: x => x.toString(),',
      },
    ])
  );

  promises.push(
    patchFile('node_modules/deepmerge/index.js', {
      // CVE-2026-93753: explicitly reject prototype-poisoning keys instead of
      // relying on target shape checks.
      from: `// Protects from prototype poisoning and unexpected merging up the prototype chain.
function propertyIsUnsafe(target, key) {
\treturn propertyIsOnObject(target, key) // Properties are safe to merge if they don't exist in the target yet,
\t\t&& !(Object.hasOwnProperty.call(target, key) // unsafe if they exist up the prototype chain,
\t\t\t&& Object.propertyIsEnumerable.call(target, key)) // and also unsafe if they're nonenumerable.
}`,
      to: `function isPrototypePoisoningKey(key) {
\treturn key === '__proto__' || key === 'constructor' || key === 'prototype'
}

// Protects from prototype poisoning and unexpected merging up the prototype chain.
function propertyIsUnsafe(target, key) {
\treturn isPrototypePoisoningKey(key)
\t\t|| (propertyIsOnObject(target, key) // Properties are safe to merge if they don't exist in the target yet,
\t\t\t&& !(Object.hasOwnProperty.call(target, key) // unsafe if they exist up the prototype chain,
\t\t\t\t&& Object.propertyIsEnumerable.call(target, key))) // and also unsafe if they're nonenumerable.
}`,
    })
  );

  promises.push(
    patchFile('node_modules/deepmerge/dist/cjs.js', {
      // CVE-2026-93753: explicitly reject prototype-poisoning keys instead of
      // relying on target shape checks.
      from: `// Protects from prototype poisoning and unexpected merging up the prototype chain.
function propertyIsUnsafe(target, key) {
\treturn propertyIsOnObject(target, key) // Properties are safe to merge if they don't exist in the target yet,
\t\t&& !(Object.hasOwnProperty.call(target, key) // unsafe if they exist up the prototype chain,
\t\t\t&& Object.propertyIsEnumerable.call(target, key)) // and also unsafe if they're nonenumerable.
}`,
      to: `function isPrototypePoisoningKey(key) {
\treturn key === '__proto__' || key === 'constructor' || key === 'prototype'
}

// Protects from prototype poisoning and unexpected merging up the prototype chain.
function propertyIsUnsafe(target, key) {
\treturn isPrototypePoisoningKey(key)
\t\t|| (propertyIsOnObject(target, key) // Properties are safe to merge if they don't exist in the target yet,
\t\t\t&& !(Object.hasOwnProperty.call(target, key) // unsafe if they exist up the prototype chain,
\t\t\t\t&& Object.propertyIsEnumerable.call(target, key))) // and also unsafe if they're nonenumerable.
}`,
    })
  );

  promises.push(
    patchFile('node_modules/deepmerge/dist/umd.js', {
      // CVE-2026-93753: explicitly reject prototype-poisoning keys instead of
      // relying on target shape checks.
      from: `\t// Protects from prototype poisoning and unexpected merging up the prototype chain.
\tfunction propertyIsUnsafe(target, key) {
\t\treturn propertyIsOnObject(target, key) // Properties are safe to merge if they don't exist in the target yet,
\t\t\t&& !(Object.hasOwnProperty.call(target, key) // unsafe if they exist up the prototype chain,
\t\t\t\t&& Object.propertyIsEnumerable.call(target, key)) // and also unsafe if they're nonenumerable.
\t}`,
      to: `\tfunction isPrototypePoisoningKey(key) {
\t\treturn key === '__proto__' || key === 'constructor' || key === 'prototype'
\t}

\t// Protects from prototype poisoning and unexpected merging up the prototype chain.
\tfunction propertyIsUnsafe(target, key) {
\t\treturn isPrototypePoisoningKey(key)
\t\t\t|| (propertyIsOnObject(target, key) // Properties are safe to merge if they don't exist in the target yet,
\t\t\t\t&& !(Object.hasOwnProperty.call(target, key) // unsafe if they exist up the prototype chain,
\t\t\t\t\t&& Object.propertyIsEnumerable.call(target, key))) // and also unsafe if they're nonenumerable.
\t}`,
    })
  );

  promises.push(
    patchFile('node_modules/kbn-handlebars/target/types/packages/kbn-handlebars/src/utils.js', {
      // kbn-handlebars calls new Function() at startup to probe for unsafe-eval support,
      // which fires a CSP violation report on every page load. Since our CSP forbids
      // unsafe-eval, hardcode return false to skip the probe entirely.
      from: `function allowUnsafeEval() {
    try {
        new Function();
        return true;
    }
    catch (e) {
        return false;
    }
}`,
      to: `function allowUnsafeEval() {
    return false;
}`,
    })
  );

  // monaco-editor only uses import.meta.url for fallback worker URLs (Dashboards provides
  // MonacoEnvironment.getWorker), and it breaks plugin Jest suites that load monaco via CommonJS.
  for (const file of MONACO_IMPORT_META_FILES) {
    promises.push(
      patchFile(`node_modules/monaco-editor/esm/vs/${file}`, {
        from: 'import.meta.url',
        to: 'globalThis.location.href',
      })
    );
  }
  for (const file of REACT_MONACO_EDITOR_FILES) {
    promises.push(
      patchFile(`node_modules/react-monaco-editor/lib/${file}`, {
        from: 'monaco-editor/esm/vs/editor/editor.api"',
        to: 'monaco-editor/editor/editor.api.js"',
      })
    );
  }
  promises.push(
    patchFile('node_modules/monaco-editor/esm/vs/base/browser/cssValue.js', {
      from: 'CSS.escape(',
      to: '(globalThis.CSS?.escape ?? String)(',
    })
  );

  await Promise.all(promises);

  await Promise.all([
    assertFileIncludes('node_modules/deepmerge/index.js', [
      "key === '__proto__' || key === 'constructor' || key === 'prototype'",
    ]),
    assertFileIncludes('node_modules/deepmerge/dist/cjs.js', [
      "key === '__proto__' || key === 'constructor' || key === 'prototype'",
    ]),
    assertFileIncludes('node_modules/deepmerge/dist/umd.js', [
      "key === '__proto__' || key === 'constructor' || key === 'prototype'",
    ]),
    ...MONACO_IMPORT_META_FILES.map((file) =>
      assertNotPresent(`node_modules/monaco-editor/esm/vs/${file}`, 'import.meta.url')
    ),
    ...REACT_MONACO_EDITOR_FILES.map((file) =>
      assertNotPresent(
        `node_modules/react-monaco-editor/lib/${file}`,
        'monaco-editor/esm/vs/editor/editor.api"'
      )
    ),
    assertNotPresent('node_modules/monaco-editor/esm/vs/base/browser/cssValue.js', 'CSS.escape('),
  ]);
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
