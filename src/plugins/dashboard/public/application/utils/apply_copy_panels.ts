/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { SavedObjectsClientContract } from 'src/core/public';
import { DashboardAppStateContainer } from '../../types';
import {
  copyDashboardPanels,
  rollbackPanelCopies,
  CreatedPanelCopy,
  CopyDashboardPanelsOptions,
  PanelCopyFailure,
} from './copy_dashboard_panels';

// Re-exported so call sites can import the type alongside the orchestration
// helpers from a single module.
export {
  CreatedPanelCopy,
  CopyDashboardPanelsOptions,
  CopyPanelsAbortError,
  PanelCopyFailure,
} from './copy_dashboard_panels';

/**
 * Shared "Copy panels" orchestration for the Clone and Save-as save paths.
 *
 * {@link applyCopyPanels} duplicates every by-reference panel's backing object
 * and repoints the app-state panels to the copies, returning the created
 * objects so the caller can compensate if the subsequent dashboard save fails.
 * {@link revertCopyPanels} undoes that: it restores the original panels into
 * app state and best-effort deletes the copies, so a failed (or unconfirmed
 * duplicate-title) save never leaves orphan copies behind.
 *
 * Factoring this out keeps onClone and onSave from re-implementing the same
 * copy/rollback dance (and lets the rollback be unit-tested directly).
 */
export interface AppliedCopyPanels {
  /** The exact panels snapshot that was copied, for a precise revert. */
  originalPanels: ReturnType<DashboardAppStateContainer['getState']>['panels'];
  createdObjects: CreatedPanelCopy[];
  /** Panels whose backing object could not be copied (left shared). */
  failures: PanelCopyFailure[];
}

export async function applyCopyPanels(
  client: SavedObjectsClientContract,
  stateContainer: DashboardAppStateContainer,
  options: CopyDashboardPanelsOptions = {}
): Promise<AppliedCopyPanels> {
  const originalPanels = stateContainer.getState().panels;
  // copyDashboardPanels already rolls back its own partial creates on failure.
  const { panels, createdObjects, failures } = await copyDashboardPanels(
    client,
    originalPanels,
    options
  );
  stateContainer.transitions.set('panels', panels);
  return { originalPanels, createdObjects, failures };
}

export async function revertCopyPanels(
  client: SavedObjectsClientContract,
  stateContainer: DashboardAppStateContainer,
  originalPanels: ReturnType<DashboardAppStateContainer['getState']>['panels'],
  createdObjects: CreatedPanelCopy[]
): Promise<void> {
  stateContainer.transitions.set('panels', originalPanels);
  await rollbackPanelCopies(client, createdObjects);
}
