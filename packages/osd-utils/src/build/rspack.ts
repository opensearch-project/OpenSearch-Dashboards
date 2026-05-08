/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

export function getSwcLoaderConfig({
  targets,
  jsx,
  syntax,
}: {
  targets?: string[];
  jsx?: boolean;
  syntax: string;
}) {
  return {
    loader: 'builtin:swc-loader',
    options: {
      jsc: {
        parser: {
          syntax,
          ...(syntax === 'ecmascript' && jsx ? { jsx: true } : {}),
          ...(syntax === 'typescript' && jsx ? { tsx: true } : {}),
          decorators: true,
          dynamicImport: true,
        },
        externalHelpers: true,
        transform: {
          react: {
            runtime: 'automatic',
          },
          useDefineForClassFields: true,
        },
      },
      env: {
        targets,
        forceAllTransforms: true,
        mode: 'entry',
        coreJs: '3.2.1',
      },
      isModule: 'unknown',
    },
  };
}
