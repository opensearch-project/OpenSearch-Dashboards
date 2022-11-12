/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { schema } from '@osd/config-schema';
import os from 'os';
import path from 'path';
// eslint-disable-next-line @osd/eslint/no-restricted-paths
import { DateConversion } from '../../../src/core/server/logging/layouts/conversions';

const patternSchema = schema.string({
  validate: (string) => {
    DateConversion.validate!(string);
  },
});

const patternLayout = schema.object({
  highlight: schema.maybe(schema.boolean()),
  kind: schema.literal('pattern'),
  pattern: schema.maybe(patternSchema),
});

const jsonLayout = schema.object({
  kind: schema.literal('json'),
});

export const fileAppenderSchema = schema.object(
  {
    kind: schema.literal('file'),
    layout: schema.oneOf([patternLayout, jsonLayout]),
    path: schema.string(),
  },
  {
    defaultValue: {
      kind: 'file',
      layout: {
        kind: 'pattern',
        highlight: true,
      },
      path: path.join(os.tmpdir(), 'opensearch-dashboards-data-source-audit.log'),
    },
  }
);
