/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { PublicMethodsOf } from '@osd/utility-types';

import {
  InternalWorkspaceServiceSetup,
  InternalWorkspaceServiceStart,
  WorkspaceService,
} from './workspace_service';

export { InternalWorkspaceServiceSetup, InternalWorkspaceServiceStart } from './workspace_service';

export type WorkspaceSetup = InternalWorkspaceServiceSetup;
export type WorkspaceStart = InternalWorkspaceServiceStart;

export type IWorkspaceService = PublicMethodsOf<WorkspaceService>;
