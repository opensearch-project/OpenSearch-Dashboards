/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 *
 * Any modifications Copyright OpenSearch Contributors. See
 * GitHub history for details.
 */

/**
 * Public surface of the MFE CDN deploy (Phase 4, Story 1).
 *
 * Exposes the publish-only deploy LOGIC: resolving the provisioned CDN location,
 * building the immutable versioned deploy plan, and the CLI orchestrator. The
 * artifacts and the deploy manifest DATA file are read/written from the
 * filesystem at run time — never imported as code constants. The deploy never
 * creates or mutates infra. See docs/01-MFE-DESIGN.md §6.
 */

export { parseEnvFile, resolveCdnConfig } from './cdn_config';
export type { ResolvedCdnConfig } from './cdn_config';

export { buildDeployPlan } from './plan';
export type {
  DeployPlan,
  RemotePlan,
  SharedDepsPlan,
  PlannedFile,
  BuildDeployPlanOptions,
} from './plan';

export { runDeployCli, DEPLOY_MANIFEST_SCHEMA_VERSION } from './deploy_cli';
export type {
  DeployCliConsole,
  DeployCliDeps,
  DeployCliFs,
  CommandRunner,
  CommandResult,
  DeployManifest,
} from './deploy_cli';
