/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';

export const WORKSPACE_TYPE = 'workspace';

export const WORKSPACE_PATH_PREFIX = '/w';

/**
 * public workspace has parity with global tenant,
 * it includes saved objects with `public` as its workspace or without any workspce info
 */
export const PUBLIC_WORKSPACE_ID = 'public';

export const PUBLIC_WORKSPACE_NAME = i18n.translate('workspaces.public.workspace.default.name', {
  defaultMessage: 'Global workspace',
});
