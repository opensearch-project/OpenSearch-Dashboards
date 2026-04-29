/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/* eslint-disable max-classes-per-file */

/*
 * Typed errors carrying operator recovery instructions in their message text
 * so restarting OpenSearchDashboards in a loop never becomes a workaround
 * for a poisoned or partial migration destination.
 */

import { MigrationReconciliationReport } from './migration_reconciliation';

export class SavedObjectsMigrationPoisonedDestError extends Error {
  constructor(public readonly report: MigrationReconciliationReport) {
    const reason = report.sentinel?.abortReason ?? 'unknown';
    const abortedAt = report.sentinel?.abortedAt ?? 'unknown';
    super(
      `Migration halted: destination index ${report.destIndex} is marked aborted ` +
        `(reason: ${reason}, abortedAt: ${abortedAt}). ` +
        `Alias not swapped. Source index still active. ` +
        `To retry: (1) inspect ${report.destIndex} contents, ` +
        `(2) DELETE ${report.destIndex} via the OpenSearch API, ` +
        `(3) restart OpenSearchDashboards. Source index remains the live data; ` +
        `no customer impact during this operation.`
    );
    this.name = 'SavedObjectsMigrationPoisonedDestError';
  }
}

export class SavedObjectsMigrationStalePeerError extends Error {
  constructor(public readonly report: MigrationReconciliationReport) {
    const lastHeartbeat = report.sentinel?.lastHeartbeatAt ?? 'never';
    super(
      `Migration halted: destination index ${report.destIndex} appears to be an abandoned ` +
        `in-progress migration (last sentinel heartbeat ${lastHeartbeat}; no new heartbeat ` +
        `in the configured probe window). No peer instance is actively migrating. ` +
        `Alias not swapped. ` +
        `To retry: DELETE ${report.destIndex} via the OpenSearch API and restart ` +
        `OpenSearchDashboards.`
    );
    this.name = 'SavedObjectsMigrationStalePeerError';
  }
}

export class SavedObjectsMigrationPartialDestError extends Error {
  constructor(public readonly report: MigrationReconciliationReport) {
    super(
      `Migration halted: destination index ${report.destIndex} appears partial ` +
        `(${report.totalDest}/${report.totalSource} docs, delta=${report.totalDelta}). ` +
        `Alias not swapped. Source index still active. ` +
        `To retry: DELETE ${report.destIndex} via the OpenSearch API and restart ` +
        `OpenSearchDashboards.`
    );
    this.name = 'SavedObjectsMigrationPartialDestError';
  }
}
