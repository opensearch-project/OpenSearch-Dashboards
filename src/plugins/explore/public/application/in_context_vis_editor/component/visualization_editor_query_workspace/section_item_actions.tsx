/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { EuiButtonIcon, EuiFlexGroup, EuiFlexItem } from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { SectionItem } from './utils';

export interface QueryItemActionsProps {
  item: SectionItem;
  canRemove: boolean;
  onRemove?: (refId: string) => void;
  onToggleHide?: (refId: string) => void;
  onDuplicate?: (refId: string) => void;
}

export const QueryItemActions = ({
  item,
  canRemove,
  onRemove,
  onToggleHide,
  onDuplicate,
}: QueryItemActionsProps) => (
  <EuiFlexGroup gutterSize="xs" alignItems="center" responsive={false}>
    {onToggleHide && (
      <EuiFlexItem grow={false}>
        <EuiButtonIcon
          iconType={item.isHidden ? 'eyeClosed' : 'eye'}
          color="text"
          aria-label={
            item.isHidden
              ? i18n.translate('explore.queryWorkspace.showQueryAriaLabel', {
                  defaultMessage: 'Show query {label}',
                  values: { label: item.label },
                })
              : i18n.translate('explore.queryWorkspace.hideQueryAriaLabel', {
                  defaultMessage: 'Hide query {label}',
                  values: { label: item.label },
                })
          }
          onClick={() => onToggleHide(item.id)}
          data-test-subj={`queryHideButton-${item.id}`}
        />
      </EuiFlexItem>
    )}
    {onDuplicate && (
      <EuiFlexItem grow={false}>
        <EuiButtonIcon
          iconType="copy"
          color="text"
          aria-label={i18n.translate('explore.queryWorkspace.duplicateQueryAriaLabel', {
            defaultMessage: 'Duplicate query {label}',
            values: { label: item.label },
          })}
          onClick={() => onDuplicate(item.id)}
          data-test-subj={`queryDuplicateButton-${item.id}`}
        />
      </EuiFlexItem>
    )}
    <EuiFlexItem grow={false}>
      <EuiButtonIcon
        iconType="trash"
        color="text"
        aria-label={i18n.translate('explore.queryWorkspace.removeQueryAriaLabel', {
          defaultMessage: 'Remove query {label}',
          values: { label: item.label },
        })}
        isDisabled={!canRemove}
        onClick={() => onRemove?.(item.id)}
        data-test-subj={`queryRemoveButton-${item.id}`}
      />
    </EuiFlexItem>
  </EuiFlexGroup>
);

export interface TransformItemActionsProps {
  item: SectionItem;
  onToggleHide: (instanceId: string) => void;
  onRemove: (instanceId: string) => void;
}

export const TransformItemActions = ({
  item,
  onToggleHide,
  onRemove,
}: TransformItemActionsProps) => (
  <EuiFlexGroup gutterSize="xs" alignItems="center" responsive={false}>
    <EuiFlexItem grow={false}>
      <EuiButtonIcon
        iconType={item.isHidden ? 'eyeClosed' : 'eye'}
        color="text"
        aria-label={
          item.isHidden
            ? i18n.translate('explore.queryWorkspace.showTransformationAriaLabel', {
                defaultMessage: 'Show transformation',
              })
            : i18n.translate('explore.queryWorkspace.hideTransformationAriaLabel', {
                defaultMessage: 'Hide transformation',
              })
        }
        onClick={() => onToggleHide(item.id)}
        data-test-subj={`transformHideButton-${item.id}`}
      />
    </EuiFlexItem>
    <EuiFlexItem grow={false}>
      <EuiButtonIcon
        iconType="trash"
        color="text"
        aria-label={i18n.translate('explore.queryWorkspace.removeTransformationAriaLabel', {
          defaultMessage: 'Remove transformation',
        })}
        onClick={() => onRemove(item.id)}
        data-test-subj={`transformRemoveButton-${item.id}`}
      />
    </EuiFlexItem>
  </EuiFlexGroup>
);

export const QueryAddButton = ({ onAdd }: { onAdd?: () => void }) => (
  <EuiButtonIcon
    iconType="plus"
    color="text"
    aria-label={i18n.translate('explore.queryWorkspace.addQueryAriaLabel', {
      defaultMessage: 'Add query',
    })}
    isDisabled={!onAdd}
    onClick={onAdd}
    className="queryWorkspaceSection__addButton"
    data-test-subj="sectionAddButton-queries"
  />
);
