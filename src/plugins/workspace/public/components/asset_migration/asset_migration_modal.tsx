/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { i18n } from '@osd/i18n';
import {
  EuiModal,
  EuiModalBody,
  EuiModalFooter,
  EuiModalHeader,
  EuiModalHeaderTitle,
  EuiSmallButton,
  EuiSmallButtonEmpty,
} from '@elastic/eui';
import { CoreStart, SavedObjectsStart } from 'opensearch-dashboards/public';
import { ALL_USE_CASE_ID } from '../../../../../core/public';
import { formatUrlWithWorkspaceId } from '../../../../../core/public/utils';
import { CURRENT_USER_PLACEHOLDER, WORKSPACE_NAVIGATION_APP_ID } from '../../../common/constants';
import { WorkspaceClient } from '../../workspace_client';
import { countUnassignedAssets, findUnassignedAssets, formatError } from './utils';
import {
  CreatedWorkspace,
  MAX_MIGRATION_BATCHES,
  MIGRATION_PAGE_SIZE,
  MigrationItem,
  MigrationProgress,
  MigrationSummary,
} from './types';
import { AssetMigrationReviewStep } from './asset_migration_review_step';
import { AssetMigrationRunningStep } from './asset_migration_running_step';
import { AssetMigrationResultStep } from './asset_migration_result_step';
import {
  DATA_CONNECTION_SAVED_OBJECT_TYPE,
  DATA_SOURCE_SAVED_OBJECT_TYPE,
} from '../../../../data_source/common';
import { useOpenSearchDashboards } from '../../../../opensearch_dashboards_react/public';
import { getDataSourcesList } from '../../utils';

const DEFAULT_WORKSPACE_NAME = i18n.translate('workspace.assetMigration.defaultWorkspaceName', {
  defaultMessage: 'Migrated assets',
});

const MODAL_WIDTH = 720;

type Phase =
  { name: 'review' } | { name: 'running' } | { name: 'result'; summary: MigrationSummary };

export interface AssetMigrationModalProps {
  migratableTypes: string[];
  existingWorkspaceNames: string[];
  onClose: (result?: { migratedAssets: number }) => void;
}

const assetKey = (asset: { id: string; type: string }) => `${asset.type}:${asset.id}`;

const fetchDataSourceIds = async (client: SavedObjectsStart['client']) => {
  const all = await getDataSourcesList(client);
  return {
    dataSources: all.filter((d) => d.type === DATA_SOURCE_SAVED_OBJECT_TYPE).map((d) => d.id),
    dataConnections: all
      .filter((d) => d.type === DATA_CONNECTION_SAVED_OBJECT_TYPE)
      .map((d) => d.id),
  };
};

export const AssetMigrationModal = ({
  migratableTypes,
  existingWorkspaceNames,
  onClose,
}: AssetMigrationModalProps) => {
  const {
    services: { savedObjects, application, notifications, workspaceClient, http },
  } = useOpenSearchDashboards<CoreStart & { workspaceClient: WorkspaceClient }>();
  const [phase, setPhase] = useState<Phase>({ name: 'review' });
  /** Set when the user tries to dismiss the wizard mid-run, so the running view can explain why. */
  const [dismissBlocked, setDismissBlocked] = useState(false);
  const [progress, setProgress] = useState<MigrationProgress | undefined>();
  const [workspaceName, setWorkspaceName] = useState(DEFAULT_WORKSPACE_NAME);
  const [nameError, setNameError] = useState<string | undefined>();
  const [createdWorkspace, setCreatedWorkspace] = useState<CreatedWorkspace | undefined>();
  /**
   * Assets moved into this workspace by earlier attempts.
   *
   * Every attempt after the first has to add this in: the assets an earlier attempt moved are now
   * assigned, so they no longer answer the unassigned query and cannot be recounted. Without it the
   * summary would describe only the last attempt rather than the workspace.
   */
  const [carriedAssociated, setCarriedAssociated] = useState(0);

  /** A run can outlive the component, so every update after an await is gated on being mounted. */
  const isMounted = useRef(true);
  useEffect(
    () => () => {
      isMounted.current = false;
    },
    []
  );

  const duplicateNameHint = useMemo(() => {
    if (createdWorkspace) {
      return undefined;
    }
    const normalized = workspaceName.trim().toLowerCase();
    if (!normalized) {
      return undefined;
    }
    return existingWorkspaceNames.some((name) => name.trim().toLowerCase() === normalized)
      ? i18n.translate('workspace.assetMigration.duplicateName', {
          defaultMessage: 'A workspace with this name already exists. Enter a different name.',
        })
      : undefined;
  }, [createdWorkspace, existingWorkspaceNames, workspaceName]);

  const displayedNameError = nameError ?? duplicateNameHint;

  const handleWorkspaceNameChange = useCallback((name: string) => {
    setWorkspaceName(name);
    setNameError(undefined);
  }, []);

  /**
   * Migrate every unassigned asset into `workspaceId`, a bounded page at a time.
   *
   * Never throws: a walk that cannot continue returns what it managed to move plus the reason it
   * stopped. The assets it already moved are moved for good, so discarding that to report only an
   * error would understate what happened and leave the workspace's contents unexplained.
   */
  const migrateAllAssets = useCallback(
    async (workspaceId: string, previouslyMigrated: number, estimatedTotal: number) => {
      const attempted = new Set<string>();
      const failures: MigrationItem[] = [];
      let migrated = 0;
      let batches = 0;
      let stoppedReason: string | undefined;

      try {
        let progressed = true;
        while (progressed) {
          progressed = false;
          let page = 1;

          while (batches < MAX_MIGRATION_BATCHES) {
            const { assets } = await findUnassignedAssets(savedObjects.client, migratableTypes, {
              page,
              perPage: MIGRATION_PAGE_SIZE,
            });
            if (!assets.length) {
              break;
            }

            const unattempted = assets.filter((asset) => !attempted.has(assetKey(asset)));
            if (!unattempted.length) {
              page += 1;
              continue;
            }
            unattempted.forEach((asset) => attempted.add(assetKey(asset)));
            batches += 1;

            const associateResult = await workspaceClient.associate(
              unattempted.map((asset) => ({ id: asset.id, type: asset.type })),
              workspaceId
            );
            if (!associateResult.success) {
              // A whole request failed rather than individual assets, so the walk cannot carry on.
              stoppedReason =
                associateResult.error ||
                i18n.translate('workspace.assetMigration.associateFailed', {
                  defaultMessage: 'Failed to migrate assets',
                });
              return { migrated, failures, stoppedReason };
            }

            const titles = new Map(unattempted.map((asset) => [assetKey(asset), asset.title]));
            (associateResult.result ?? []).forEach((result) => {
              if (!result.error) {
                migrated += 1;
                return;
              }
              failures.push({ ...result, title: titles.get(assetKey(result)) ?? result.id });
            });

            progressed = true;
            if (isMounted.current) {
              setProgress({
                migrated: previouslyMigrated + migrated,
                failed: failures.length,
                estimatedTotal,
              });
            }
          }
        }
      } catch (e) {
        // A rejected lookup or association stops the walk on the same terms as a failed response.
        stoppedReason = formatError(e);
      }

      return { migrated, failures, stoppedReason };
    },
    [migratableTypes, savedObjects.client, workspaceClient]
  );

  /**
   * Runs a migration, or resumes one.
   *
   * Both entry points -- confirming from the review view and retrying from either view -- go through
   * here with no argument: what earlier attempts already moved is held in `carriedAssociated` rather
   * than passed in, so a caller cannot forget to carry it.
   */
  const runMigration = useCallback(async () => {
    const trimmedName = workspaceName.trim();
    if (!createdWorkspace && !trimmedName) {
      setNameError(
        i18n.translate('workspace.assetMigration.nameRequired', {
          defaultMessage: "Name can't be empty or blank.",
        })
      );
      return;
    }
    setNameError(undefined);
    // A fresh run starts without a refused-dismissal notice or a previous run's progress.
    setDismissBlocked(false);
    setProgress(undefined);
    setPhase({ name: 'running' });

    try {
      let workspace = createdWorkspace;
      if (!workspace) {
        const { dataSources, dataConnections } = await fetchDataSourceIds(savedObjects.client);

        const createResult = await workspaceClient.create(
          { name: trimmedName, features: [`use-case-${ALL_USE_CASE_ID}`] },
          {
            // All users have Read and write permission for this workspace.
            permissions: {
              library_write: { users: ['*', CURRENT_USER_PLACEHOLDER] },
              write: { users: [CURRENT_USER_PLACEHOLDER] },
              read: { users: ['*'] },
            },
            dataSources,
            dataConnections,
          }
        );

        if (!createResult.success) {
          if (!isMounted.current) {
            return;
          }
          setPhase({ name: 'review' });
          setNameError(
            createResult.error ||
              i18n.translate('workspace.assetMigration.createFailed', {
                defaultMessage: 'Failed to create the workspace.',
              })
          );
          return;
        }

        workspace = {
          id: createResult.result.id,
          name: trimmedName,
          dataSourceCount: dataSources.length + dataConnections.length,
        };
        if (!isMounted.current) {
          return;
        }
        setCreatedWorkspace(workspace);
      }

      const remaining = await countUnassignedAssets(savedObjects.client, migratableTypes);
      if (!isMounted.current) {
        return;
      }
      const estimatedTotal = carriedAssociated + remaining;
      setProgress({ migrated: carriedAssociated, failed: 0, estimatedTotal });

      const outcome = await migrateAllAssets(workspace.id, carriedAssociated, estimatedTotal);
      if (!isMounted.current) {
        return;
      }

      const associated = carriedAssociated + outcome.migrated;
      setCarriedAssociated(associated);
      setPhase({
        name: 'result',
        summary: {
          // Assets migrated by an earlier attempt still count towards the total.
          associated,
          failed: outcome.failures.length,
          dataSources: workspace.dataSourceCount,
          failures: outcome.failures,
          workspaceId: workspace.id,
          workspaceName: workspace.name,
          stoppedReason: outcome.stoppedReason,
        },
      });
    } catch (e) {
      // Only the workspace creation and the initial count reach here; the walk reports its own
      // interruption through `stoppedReason` instead of throwing.
      if (!isMounted.current) {
        return;
      }
      setPhase({ name: 'review' });
      notifications.toasts.addDanger({
        title: i18n.translate('workspace.assetMigration.failedTitle', {
          defaultMessage: 'Failed to migrate assets',
        }),
        text: formatError(e),
      });
    }
  }, [
    carriedAssociated,
    createdWorkspace,
    migrateAllAssets,
    migratableTypes,
    notifications,
    savedObjects,
    workspaceClient,
    workspaceName,
  ]);

  /** Every dismissal path goes through here. Ignores its argument: `EuiModal` passes a DOM event. */
  const closeModal = useCallback(() => {
    onClose(phase.name === 'result' ? { migratedAssets: phase.summary.associated } : undefined);
  }, [onClose, phase]);

  const openWorkspace = useCallback(
    (workspaceId: string) => {
      const url = formatUrlWithWorkspaceId(
        application.getUrlForApp(WORKSPACE_NAVIGATION_APP_ID, { absolute: false }),
        workspaceId,
        http.basePath
      );
      application.navigateToUrl(url);
    },
    [application, http.basePath]
  );

  return (
    <EuiModal
      // Abandoning a run would leave the caller's listing stale and the next attempt would create a
      // second workspace, so dismissal is refused. `EuiModal` always renders its own dismiss button
      // and its class cannot be styled from a plugin, so the running view explains the refusal.
      onClose={phase.name === 'running' ? () => setDismissBlocked(true) : closeModal}
      style={{ width: MODAL_WIDTH }}
      data-test-subj="assetMigrationModal"
    >
      <EuiModalHeader>
        <EuiModalHeaderTitle>
          {phase.name === 'result'
            ? phase.summary.failed
              ? i18n.translate('workspace.assetMigration.resultTitleWithErrors', {
                  defaultMessage: 'Migration finished with errors',
                })
              : i18n.translate('workspace.assetMigration.resultTitle', {
                  defaultMessage: 'Migration complete',
                })
            : i18n.translate('workspace.assetMigration.title', {
                defaultMessage: 'Migrate existing assets into a workspace',
              })}
        </EuiModalHeaderTitle>
      </EuiModalHeader>

      <EuiModalBody>
        {phase.name === 'review' && (
          <AssetMigrationReviewStep
            migratableTypes={migratableTypes}
            workspaceName={workspaceName}
            onWorkspaceNameChange={handleWorkspaceNameChange}
            nameError={displayedNameError}
            createdWorkspace={createdWorkspace}
          />
        )}
        {phase.name === 'running' && (
          <AssetMigrationRunningStep
            workspaceName={workspaceName}
            progress={progress}
            createdWorkspace={createdWorkspace}
            dismissBlocked={dismissBlocked}
          />
        )}
        {phase.name === 'result' && <AssetMigrationResultStep summary={phase.summary} />}
      </EuiModalBody>

      <EuiModalFooter>
        {phase.name === 'review' && (
          <>
            <EuiSmallButtonEmpty onClick={closeModal}>
              {i18n.translate('workspace.assetMigration.cancel', { defaultMessage: 'Cancel' })}
            </EuiSmallButtonEmpty>
            <EuiSmallButton
              fill
              disabled={!!duplicateNameHint}
              onClick={() => runMigration()}
              data-test-subj="assetMigrationConfirmButton"
            >
              {createdWorkspace
                ? i18n.translate('workspace.assetMigration.retry', {
                    defaultMessage: 'Retry migration',
                  })
                : i18n.translate('workspace.assetMigration.confirm', {
                    defaultMessage: 'Create workspace and migrate',
                  })}
            </EuiSmallButton>
          </>
        )}
        {phase.name === 'result' && (
          <>
            {(!!phase.summary.failed || !!phase.summary.stoppedReason) && (
              <EuiSmallButtonEmpty
                onClick={() => runMigration()}
                data-test-subj="assetMigrationRetryFailedButton"
              >
                {phase.summary.stoppedReason
                  ? i18n.translate('workspace.assetMigration.resume', {
                      defaultMessage: 'Continue migrating',
                    })
                  : i18n.translate('workspace.assetMigration.retryFailed', {
                      defaultMessage: 'Retry failed assets',
                    })}
              </EuiSmallButtonEmpty>
            )}
            <EuiSmallButtonEmpty onClick={closeModal} data-test-subj="assetMigrationCloseButton">
              {i18n.translate('workspace.assetMigration.close', { defaultMessage: 'Close' })}
            </EuiSmallButtonEmpty>
            <EuiSmallButton
              fill
              onClick={() => openWorkspace(phase.summary.workspaceId)}
              data-test-subj="assetMigrationOpenWorkspaceButton"
            >
              {i18n.translate('workspace.assetMigration.openWorkspace', {
                defaultMessage: 'Go to {name}',
                values: { name: phase.summary.workspaceName },
              })}
            </EuiSmallButton>
          </>
        )}
      </EuiModalFooter>
    </EuiModal>
  );
};
