/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';
import { FormattedMessage } from '@osd/i18n/react';
import {
  EuiFlexGroup,
  EuiFlexItem,
  EuiIcon,
  EuiLoadingSpinner,
  EuiProgress,
  EuiSpacer,
  EuiText,
} from '@elastic/eui';
import { CreatedWorkspace, MigrationProgress } from './types';

export interface AssetMigrationRunningStepProps {
  workspaceName: string;
  /** Absent until the run has counted what it is about to move. */
  progress?: MigrationProgress;
  createdWorkspace?: CreatedWorkspace;
  /** Set when the user tried to dismiss the wizard mid-run, so the refusal can be explained. */
  dismissBlocked?: boolean;
}

/**
 * Reports the two operations the confirm button promises, each with its own state.
 *
 * A run walks the assets a page at a time and can last minutes, so the second step shows real
 * progress. The denominator is what was there when the run started, hence "about".
 */
export const AssetMigrationRunningStep = ({
  workspaceName,
  progress,
  createdWorkspace,
  dismissBlocked,
}: AssetMigrationRunningStepProps) => {
  const done = progress ? progress.migrated + progress.failed : 0;
  const hasEstimate = !!progress?.estimatedTotal;

  return (
    <>
      <EuiSpacer size="s" />
      <EuiFlexGroup
        direction="column"
        gutterSize="m"
        alignItems="flexStart"
        data-test-subj="assetMigrationRunningStep"
      >
        <EuiFlexItem grow={false}>
          <EuiFlexGroup gutterSize="s" alignItems="center" responsive={false}>
            <EuiFlexItem grow={false}>
              {createdWorkspace ? (
                <EuiIcon type="checkInCircleFilled" color="success" />
              ) : (
                <EuiLoadingSpinner size="m" />
              )}
            </EuiFlexItem>
            <EuiFlexItem grow={false}>
              <EuiText size="s">
                {createdWorkspace ? (
                  <FormattedMessage
                    id="workspace.assetMigration.running.workspaceCreated"
                    defaultMessage="Workspace {name} created"
                    values={{ name: <strong>{createdWorkspace.name}</strong> }}
                  />
                ) : (
                  <FormattedMessage
                    id="workspace.assetMigration.running.creatingWorkspace"
                    defaultMessage="Creating workspace {name}..."
                    values={{ name: <strong>{workspaceName.trim()}</strong> }}
                  />
                )}
              </EuiText>
            </EuiFlexItem>
          </EuiFlexGroup>
        </EuiFlexItem>

        <EuiFlexItem grow={false}>
          <EuiFlexGroup gutterSize="s" alignItems="center" responsive={false}>
            <EuiFlexItem grow={false}>
              {createdWorkspace ? (
                <EuiLoadingSpinner size="m" />
              ) : (
                <EuiIcon type="dot" color="subdued" />
              )}
            </EuiFlexItem>
            <EuiFlexItem grow={false}>
              <EuiText
                size="s"
                color={createdWorkspace ? 'default' : 'subdued'}
                data-test-subj="assetMigrationProgressLabel"
              >
                {hasEstimate ? (
                  <FormattedMessage
                    id="workspace.assetMigration.running.progress"
                    defaultMessage="Migrated {done} of about {total} assets..."
                    values={{ done, total: progress!.estimatedTotal }}
                  />
                ) : (
                  i18n.translate('workspace.assetMigration.running.counting', {
                    defaultMessage: 'Migrating assets...',
                  })
                )}
              </EuiText>
            </EuiFlexItem>
          </EuiFlexGroup>
        </EuiFlexItem>

        {hasEstimate && (
          <EuiFlexItem grow={false} style={{ width: '100%' }}>
            <EuiProgress
              size="s"
              color="primary"
              value={Math.min(done, progress!.estimatedTotal)}
              max={progress!.estimatedTotal}
              data-test-subj="assetMigrationProgressBar"
            />
          </EuiFlexItem>
        )}

        <EuiFlexItem grow={false}>
          <EuiText size="xs" color="subdued">
            {i18n.translate('workspace.assetMigration.runningHint', {
              defaultMessage: 'This may take a moment for a large number of assets.',
            })}
          </EuiText>
        </EuiFlexItem>

        {dismissBlocked && (
          <EuiFlexItem grow={false}>
            <EuiText size="xs" color="warning" data-test-subj="assetMigrationDismissBlocked">
              {i18n.translate('workspace.assetMigration.dismissBlocked', {
                defaultMessage:
                  'The migration is still running and cannot be cancelled. This dialog closes on its own once it finishes.',
              })}
            </EuiText>
          </EuiFlexItem>
        )}
      </EuiFlexGroup>
    </>
  );
};
