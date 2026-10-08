/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { WorkspaceAssociateResult } from '../../../common/types';

/** Default page size of the asset tables, and the sizes offered next to them. */
export const ASSET_TABLE_PAGE_SIZE = 10;
export const ASSET_TABLE_PAGE_SIZE_OPTIONS = [10, 15, 20];

/**
 * Assets fetched and associated per batch, and the cap on how many batches one run may issue.
 *
 * Their product is the most assets a single run can move. The cap is a liveness guarantee rather
 * than a size limit: assets created while a run is walking keep giving it new work, so without a
 * ceiling a run competing with a bulk import would never return -- and the wizard refuses to close
 * while running.
 */
export const MIGRATION_PAGE_SIZE = 100;
export const MAX_MIGRATION_BATCHES = 1000;

/** An asset that could not be migrated, carrying the reason. */
export type MigrationItem = WorkspaceAssociateResult & { title: string };

/** Progress of a run in flight, updated after each round. */
export interface MigrationProgress {
  migrated: number;
  failed: number;
  estimatedTotal: number;
}

export interface MigrationSummary {
  associated: number;
  failed: number;
  dataSources: number;
  failures: MigrationItem[];
  workspaceId: string;
  workspaceName: string;
  /**
   * Why the run stopped before reaching the end of the unassigned set, when it did.
   *
   * Set when the walk itself could not continue -- an expired session, a dropped request -- as opposed
   * to individual assets failing, which is what {@link failures} describes. The assets already moved
   * stay moved, so the run still has a real outcome to report.
   */
  stoppedReason?: string;
}

/** The workspace created by a migration run, once it exists. */
export interface CreatedWorkspace {
  id: string;
  name: string;
  dataSourceCount: number;
}
