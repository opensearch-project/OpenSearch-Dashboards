/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  EuiCompressedFieldSearch,
  EuiCompressedSuperSelect,
  EuiFlexGroup,
  EuiFlexItem,
  EuiSuperSelectOption,
} from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { WorkspaceRecency, WorkspaceRoleFilter } from './utils';
import { WORKSPACE_ACCESS_LEVEL_NAMES } from '../../constants';

/** Value of the role filter dropdown: 'all' means no role filtering. */
export interface WorkspaceSearchBarProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  recency: WorkspaceRecency;
  onRecencyChange: (value: WorkspaceRecency) => void;
  roleFilter: WorkspaceRoleFilter;
  onRoleFilterChange: (value: WorkspaceRoleFilter) => void;
}

const makeOption = (
  value: WorkspaceRecency,
  label: string
): EuiSuperSelectOption<WorkspaceRecency> => ({
  value,
  inputDisplay: i18n.translate('workspace.initial.searchBar.recency.inputDisplay', {
    defaultMessage: 'Last viewed: {label}',
    values: { label },
  }),
  dropdownDisplay: label,
});

const RECENCY_OPTIONS: Array<EuiSuperSelectOption<WorkspaceRecency>> = [
  makeOption(
    'all',
    i18n.translate('workspace.initial.searchBar.recency.all', { defaultMessage: 'All' })
  ),
  makeOption(
    'today',
    i18n.translate('workspace.initial.searchBar.recency.today', { defaultMessage: 'Today' })
  ),
  makeOption(
    'week',
    i18n.translate('workspace.initial.searchBar.recency.week', { defaultMessage: 'This week' })
  ),
  makeOption(
    'month',
    i18n.translate('workspace.initial.searchBar.recency.month', { defaultMessage: 'This month' })
  ),
];

const makeRoleOption = (
  value: WorkspaceRoleFilter,
  label: string
): EuiSuperSelectOption<WorkspaceRoleFilter> => ({
  value,
  inputDisplay: i18n.translate('workspace.initial.searchBar.role.inputDisplay', {
    defaultMessage: 'Access level: {label}',
    values: { label },
  }),
  dropdownDisplay: label,
});

const ROLE_OPTIONS: Array<EuiSuperSelectOption<WorkspaceRoleFilter>> = [
  makeRoleOption(
    'all',
    i18n.translate('workspace.initial.searchBar.role.all', { defaultMessage: 'All' })
  ),
  makeRoleOption('owner', WORKSPACE_ACCESS_LEVEL_NAMES.admin),
  makeRoleOption('readwrite', WORKSPACE_ACCESS_LEVEL_NAMES.readAndWrite),
  makeRoleOption('readonly', WORKSPACE_ACCESS_LEVEL_NAMES.readOnly),
];

export const WorkspaceSearchBar = ({
  searchQuery,
  onSearchChange,
  recency,
  onRecencyChange,
  roleFilter,
  onRoleFilterChange,
}: WorkspaceSearchBarProps) => {
  return (
    <EuiFlexGroup gutterSize="s" alignItems="center" responsive={false}>
      <EuiFlexItem>
        <EuiCompressedFieldSearch
          fullWidth
          isClearable
          value={searchQuery}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder={i18n.translate('workspace.initial.searchBar.placeholder', {
            defaultMessage: 'Search workspaces by name',
          })}
          aria-label={i18n.translate('workspace.initial.searchBar.ariaLabel', {
            defaultMessage: 'Search workspaces by name',
          })}
          data-test-subj="workspace-initial-search-input"
        />
      </EuiFlexItem>
      <EuiFlexItem grow={false} style={{ minWidth: 160 }}>
        <EuiCompressedSuperSelect
          options={RECENCY_OPTIONS}
          valueOfSelected={recency}
          onChange={(value) => onRecencyChange(value as WorkspaceRecency)}
          hasDividers
          aria-label={i18n.translate('workspace.initial.searchBar.recency.ariaLabel', {
            defaultMessage: 'Filter workspaces by when they were last viewed',
          })}
          data-test-subj="workspace-initial-search-recency-select"
        />
      </EuiFlexItem>
      <EuiFlexItem grow={false} style={{ minWidth: 160 }}>
        <EuiCompressedSuperSelect
          options={ROLE_OPTIONS}
          valueOfSelected={roleFilter}
          onChange={(value) => onRoleFilterChange(value as WorkspaceRoleFilter)}
          hasDividers
          aria-label={i18n.translate('workspace.initial.searchBar.role.ariaLabel', {
            defaultMessage: 'Filter workspaces by access level',
          })}
          data-test-subj="workspace-initial-search-role-select"
        />
      </EuiFlexItem>
    </EuiFlexGroup>
  );
};
