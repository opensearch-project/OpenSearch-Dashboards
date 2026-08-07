/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { i18n } from '@osd/i18n';
import { FormattedMessage } from '@osd/i18n/react';
import {
  EuiBasicTable,
  EuiCallOut,
  EuiCompressedFieldSearch,
  EuiCompressedFieldText,
  EuiCompressedFormRow,
  EuiSpacer,
  EuiText,
} from '@elastic/eui';
import { CoreStart } from 'opensearch-dashboards/public';
import { useOpenSearchDashboards } from '../../../../opensearch_dashboards_react/public';
import { UnassignedAsset, countUnassignedAssets, findUnassignedAssets, formatError } from './utils';
import { ASSET_TABLE_PAGE_SIZE, ASSET_TABLE_PAGE_SIZE_OPTIONS, CreatedWorkspace } from './types';

export interface AssetMigrationReviewStepProps {
  migratableTypes: string[];
  workspaceName: string;
  onWorkspaceNameChange: (name: string) => void;
  nameError?: string;
  createdWorkspace?: CreatedWorkspace;
}

/**
 * Lets the administrator name the target workspace and browse what is about to be migrated.
 *
 * Paging and search are resolved by the server, so the table stays usable however many assets the
 * deployment holds and never has to claim it is showing a sample.
 */
export const AssetMigrationReviewStep = ({
  migratableTypes,
  workspaceName,
  onWorkspaceNameChange,
  nameError,
  createdWorkspace,
}: AssetMigrationReviewStepProps) => {
  const {
    services: { savedObjects },
  } = useOpenSearchDashboards<CoreStart>();

  const [inputValue, setInputValue] = useState('');
  const [search, setSearch] = useState('');
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(ASSET_TABLE_PAGE_SIZE);
  /**
   * How many assets the migration will move. Counted separately from the table, whose total describes
   * whatever the current search matched.
   */
  const [migratableTotal, setMigratableTotal] = useState(0);
  const [page, setPage] = useState<{ total: number; assets: UnassignedAsset[] }>({
    total: 0,
    assets: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | undefined>();

  /** Only the newest request may write to state: overlapping searches can settle out of order. */
  const latestRequest = useRef(0);

  const fetchPage = useCallback(
    async (request: { page: number; perPage: number; search?: string }) => {
      const requestId = (latestRequest.current += 1);
      setLoading(true);
      try {
        const result = await findUnassignedAssets(savedObjects.client, migratableTypes, request);
        if (requestId !== latestRequest.current) {
          return;
        }
        setPage(result);
        setError(undefined);
      } catch (e) {
        if (requestId !== latestRequest.current) {
          return;
        }
        setPage({ total: 0, assets: [] });
        setError(formatError(e));
      } finally {
        if (requestId === latestRequest.current) {
          setLoading(false);
        }
      }
    },
    [migratableTypes, savedObjects.client]
  );

  useEffect(() => {
    fetchPage({ page: pageIndex + 1, perPage: pageSize, search: search.trim() || undefined });
  }, [fetchPage, pageIndex, pageSize, search]);

  useEffect(() => {
    let cancelled = false;
    countUnassignedAssets(savedObjects.client, migratableTypes)
      .then((total) => {
        if (!cancelled) {
          setMigratableTotal(total);
        }
      })
      // A failure here is already visible through the table's own error state.
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [migratableTypes, savedObjects.client]);

  const onTableChange = ({ page: nextPage }: any) => {
    if (!nextPage) {
      return;
    }
    setPageIndex(nextPage.index);
    setPageSize(nextPage.size);
  };

  return (
    <>
      <EuiCallOut
        size="s"
        iconType="iInCircle"
        title={i18n.translate('workspace.assetMigration.explainTitle', {
          defaultMessage:
            'These assets are not assigned to any workspace, so they are hidden from workspace views',
        })}
      >
        <EuiText size="s">
          {i18n.translate('workspace.assetMigration.explainBody', {
            defaultMessage:
              'They were created before workspaces were enabled and still exist. Moving them into a workspace makes them visible again. Every unassigned asset is migrated, not only the ones shown below, and all data sources are connected to the new workspace so migrated dashboards keep rendering.',
          })}
        </EuiText>
      </EuiCallOut>
      <EuiSpacer size="s" />

      <EuiCompressedFormRow
        label={i18n.translate('workspace.assetMigration.nameLabel', {
          defaultMessage: 'Workspace name',
        })}
        isInvalid={!!nameError}
        error={nameError}
        helpText={
          createdWorkspace
            ? i18n.translate('workspace.assetMigration.nameLockedHelp', {
                defaultMessage:
                  'This workspace was already created. Retrying migrates into it rather than creating another one.',
              })
            : undefined
        }
        fullWidth
      >
        <EuiCompressedFieldText
          fullWidth
          value={createdWorkspace?.name ?? workspaceName}
          disabled={!!createdWorkspace}
          isInvalid={!!nameError}
          onChange={(event) => onWorkspaceNameChange(event.target.value)}
          data-test-subj="assetMigrationWorkspaceName"
        />
      </EuiCompressedFormRow>
      <EuiSpacer size="s" />

      <EuiText size="s" data-test-subj="assetMigrationAssetCount">
        <FormattedMessage
          id="workspace.assetMigration.assetCount"
          defaultMessage="All {total, plural, one {# asset} other {# assets}} will be migrated:"
          values={{ total: migratableTotal }}
        />
      </EuiText>
      <EuiSpacer size="xs" />
      <EuiText size="xs" color="subdued">
        <em>
          {i18n.translate('workspace.assetMigration.filterHint', {
            defaultMessage:
              'Search only changes what is listed here. Every asset is migrated regardless.',
          })}
        </em>
      </EuiText>
      <EuiSpacer size="s" />

      <EuiCompressedFieldSearch
        fullWidth
        value={inputValue}
        data-test-subj="assetMigrationSearchBar"
        placeholder={i18n.translate('workspace.assetMigration.searchPlaceholder', {
          defaultMessage: 'Search assets, then press Enter',
        })}
        onChange={(event) => setInputValue(event.target.value)}
        onSearch={(value) => {
          setSearch(value);
          setPageIndex(0);
        }}
      />
      <EuiSpacer size="s" />

      <EuiBasicTable
        data-test-subj="assetMigrationReviewTable"
        loading={loading}
        error={error}
        items={page.assets}
        tableLayout="auto"
        noItemsMessage={i18n.translate('workspace.assetMigration.noMatches', {
          defaultMessage: 'No assets match this search.',
        })}
        pagination={{
          pageIndex,
          pageSize,
          totalItemCount: page.total,
          pageSizeOptions: ASSET_TABLE_PAGE_SIZE_OPTIONS,
        }}
        onChange={onTableChange}
        columns={[
          {
            field: 'title',
            name: i18n.translate('workspace.assetMigration.column.title', {
              defaultMessage: 'Title',
            }),
          },
          {
            field: 'type',
            name: i18n.translate('workspace.assetMigration.column.type', {
              defaultMessage: 'Type',
            }),
            width: '200px',
          },
        ]}
      />
    </>
  );
};
