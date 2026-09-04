/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';
import { FormattedMessage } from '@osd/i18n/react';
import {
  EuiBasicTableColumn,
  EuiCallOut,
  EuiFlexGroup,
  EuiFlexItem,
  EuiInMemoryTable,
  EuiSpacer,
  EuiStat,
  EuiText,
} from '@elastic/eui';
import {
  ASSET_TABLE_PAGE_SIZE,
  ASSET_TABLE_PAGE_SIZE_OPTIONS,
  MigrationItem,
  MigrationSummary,
} from './types';

export interface AssetMigrationResultStepProps {
  summary: MigrationSummary;
}

const failureColumns: Array<EuiBasicTableColumn<MigrationItem>> = [
  {
    field: 'title',
    name: i18n.translate('workspace.assetMigration.column.asset', { defaultMessage: 'Asset' }),
  },
  {
    field: 'type',
    name: i18n.translate('workspace.assetMigration.column.type', { defaultMessage: 'Type' }),
    width: '160px',
  },
  {
    field: 'error',
    name: i18n.translate('workspace.assetMigration.column.error', { defaultMessage: 'Reason' }),
    render: (error: string | undefined) =>
      error || i18n.translate('workspace.assetMigration.unknownError', { defaultMessage: 'Error' }),
  },
];

/**
 * Reports what a run achieved.
 *
 * Only failures are listed: they are the rows that need an action, and a successful listing could
 * reach tens of thousands of rows while saying nothing the migrated count does not already say.
 *
 * A run that stopped partway is reported as such rather than as a plain success or a plain error: the
 * assets it moved are moved, and the ones it never reached are still unassigned and still migratable.
 */
export const AssetMigrationResultStep = ({ summary }: AssetMigrationResultStepProps) => (
  <>
    {summary.stoppedReason ? (
      <EuiCallOut
        size="s"
        color="warning"
        iconType="alert"
        data-test-subj="assetMigrationStopped"
        title={i18n.translate('workspace.assetMigration.result.stoppedTitle', {
          defaultMessage: 'Migration stopped before it finished',
        })}
      >
        <EuiText size="s">
          <p>{summary.stoppedReason}</p>
          <p>
            <FormattedMessage
              id="workspace.assetMigration.result.stoppedBody"
              defaultMessage="{count, plural, one {# asset} other {# assets}} reached {name} and stayed there. The rest are still unassigned, so running the migration again continues from where this attempt stopped."
              values={{
                count: summary.associated,
                name: <strong>{summary.workspaceName}</strong>,
              }}
            />
          </p>
        </EuiText>
      </EuiCallOut>
    ) : (
      <EuiCallOut
        size="s"
        color={summary.failed ? (summary.associated ? 'warning' : 'danger') : 'success'}
        iconType={summary.failed ? 'alert' : 'check'}
        title={
          summary.associated ? (
            <FormattedMessage
              id="workspace.assetMigration.result.successTitle"
              defaultMessage="{count, plural, one {# asset is} other {# assets are}} now available in {name}"
              values={{
                count: summary.associated,
                name: <strong>{summary.workspaceName}</strong>,
              }}
            />
          ) : (
            i18n.translate('workspace.assetMigration.result.noneTitle', {
              defaultMessage: 'No assets were migrated',
            })
          )
        }
      />
    )}
    <EuiSpacer size="m" />

    <EuiFlexGroup gutterSize="l">
      <EuiFlexItem>
        <EuiStat
          titleSize="m"
          title={summary.associated}
          titleColor={summary.associated ? 'success' : 'subdued'}
          description={i18n.translate('workspace.assetMigration.stat.migrated', {
            defaultMessage: 'Assets migrated',
          })}
        />
      </EuiFlexItem>
      <EuiFlexItem>
        <EuiStat
          titleSize="m"
          title={summary.failed}
          titleColor={summary.failed ? 'danger' : 'subdued'}
          description={i18n.translate('workspace.assetMigration.stat.failed', {
            defaultMessage: 'Failed',
          })}
        />
      </EuiFlexItem>
      <EuiFlexItem>
        <EuiStat
          titleSize="m"
          title={summary.dataSources}
          description={i18n.translate('workspace.assetMigration.stat.dataSources', {
            defaultMessage: 'Data sources connected',
          })}
        />
      </EuiFlexItem>
    </EuiFlexGroup>

    {!!summary.failures.length && (
      <>
        <EuiSpacer size="m" />
        <EuiText size="s">
          {i18n.translate('workspace.assetMigration.result.failureTableTitle', {
            defaultMessage: 'Assets that could not be migrated',
          })}
        </EuiText>
        <EuiSpacer size="xs" />
        <EuiInMemoryTable
          data-test-subj="assetMigrationResultTable"
          items={summary.failures}
          tableLayout="auto"
          pagination={{
            initialPageSize: ASSET_TABLE_PAGE_SIZE,
            pageSizeOptions: ASSET_TABLE_PAGE_SIZE_OPTIONS,
          }}
          columns={failureColumns}
        />
        <EuiSpacer size="s" />
        <EuiText size="xs" color="subdued">
          {i18n.translate('workspace.assetMigration.result.retryHint', {
            defaultMessage:
              'Failed assets are still unassigned, so you can run the migration again to retry them.',
          })}
        </EuiText>
      </>
    )}
  </>
);
