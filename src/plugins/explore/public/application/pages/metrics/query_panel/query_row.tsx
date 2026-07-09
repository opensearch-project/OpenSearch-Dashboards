/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useMemo, useState } from 'react';
import { i18n } from '@osd/i18n';
import {
  EuiButton,
  EuiButtonGroup,
  EuiButtonIcon,
  EuiDraggable,
  EuiFlexGroup,
  EuiFlexItem,
  EuiIcon,
  EuiPopover,
  EuiSpacer,
  EuiText,
  EuiToolTip,
} from '@elastic/eui';
import classNames from 'classnames';
import { CodeEditor } from '../../../../../../opensearch_dashboards_react/public';
import { queryEditorOptions } from '../../../../components/query_panel/query_panel_editor/use_query_panel_editor/editor_options';
import { getCommandEnterAction } from '../../../../components/query_panel/query_panel_editor/use_query_panel_editor/command_enter_action';
import { PrometheusClient } from '../explore/services/prometheus_client';
import { PromQLBuilder, parsePromQL } from '../promql_builder';
import type { BuilderState } from '../promql_builder';
import { QueryRow, RowMode, modeButtons } from './row_state';

import '../../../../components/query_panel/query_panel_editor/query_panel_editor.scss';

type DraggableChildFn = Exclude<
  React.ComponentProps<typeof EuiDraggable>['children'],
  React.ReactElement
>;
type DragHandleProps = Parameters<DraggableChildFn>[0]['dragHandleProps'];

export interface QueryRowProps {
  row: QueryRow;
  label: string;
  client: PrometheusClient;
  onBuilderChange: (rowId: string, query: string, state: BuilderState) => void;
  onCodeChange: (rowId: string, query: string) => void;
  onModeChange: (rowId: string, mode: RowMode) => void;
  onRemove: (rowId: string) => void;
  onRun: () => void;
  languageTitle: string;
  canRemove: boolean;
  isDragging: boolean;
  dragHandleProps: DragHandleProps;
}

export const QueryRowComponent: React.FC<QueryRowProps> = React.memo(
  ({
    row,
    label,
    client,
    onBuilderChange,
    onCodeChange,
    onModeChange,
    onRemove,
    onRun,
    languageTitle,
    canRemove,
    isDragging,
    dragHandleProps,
  }) => {
    const [showCodeConfirm, setShowCodeConfirm] = useState(false);

    const parsed = useMemo(() => (row.query ? parsePromQL(row.query) : null), [row.query]);

    const handleBuilderQueryChange = useCallback(
      (query: string) => {
        const result = parsePromQL(query);
        if (result.canBuild) {
          onBuilderChange(row.id, query, result.state);
        } else if (row.builderState) {
          onBuilderChange(row.id, query, row.builderState);
        }
      },
      [row.id, row.builderState, onBuilderChange]
    );

    const canSwitchToBuilder = row.mode === 'builder' || !parsed || parsed.canBuild;
    const modeToggleTooltip =
      row.mode === 'code' && !canSwitchToBuilder
        ? i18n.translate('explore.promqlBuilder.cannotSwitchToBuilder', {
            defaultMessage:
              'This query cannot be represented in Builder mode. Simplify it or use Code mode.',
          })
        : row.mode === 'builder'
        ? i18n.translate('explore.promqlBuilder.codeMayBeIrreversible', {
            defaultMessage: 'Switching to Code mode may prevent switching back to Builder mode.',
          })
        : undefined;

    const handleModeChange = useCallback(
      (id: string) => {
        const newMode = id as RowMode;
        if (row.mode === 'builder' && newMode === 'code' && parsed && !parsed.canBuild) {
          setShowCodeConfirm(true);
        } else {
          onModeChange(row.id, newMode);
        }
      },
      [row.id, row.mode, parsed, onModeChange]
    );

    return (
      <div
        className={classNames('mqpQueryRow', {
          'mqpQueryRow--dragging': isDragging,
          'mqpQueryRow--builder': row.mode === 'builder',
        })}
        data-test-subj={`queryRow-${label}`}
      >
        <EuiFlexGroup gutterSize="s" alignItems="flexStart" responsive={false}>
          <EuiFlexItem grow={false}>
            <EuiFlexGroup gutterSize="xs" direction="column" alignItems="center" responsive={false}>
              <EuiFlexItem grow={false}>
                <EuiText size="xs" className="mqpRowLabel">
                  {label}
                </EuiText>
              </EuiFlexItem>
              {canRemove && (
                <EuiFlexItem grow={false}>
                  <div
                    {...dragHandleProps}
                    aria-label={i18n.translate('explore.metricsQueryPanel.dragToReorder', {
                      defaultMessage: 'Drag to reorder',
                    })}
                    className="mqpDragHandle"
                  >
                    <EuiIcon type="grab" size="s" />
                  </div>
                </EuiFlexItem>
              )}
            </EuiFlexGroup>
          </EuiFlexItem>

          <EuiFlexItem>
            {row.mode === 'builder' && row.builderState ? (
              <PromQLBuilder
                client={client}
                onQueryChange={handleBuilderQueryChange}
                initialState={row.builderState}
              />
            ) : (
              <div className="exploreQueryPanelEditor" data-test-subj="exploreQueryPanelEditor">
                <CodeEditor
                  languageId="PROMQL"
                  value={row.query}
                  onChange={(val) => onCodeChange(row.id, val)}
                  options={queryEditorOptions}
                  useLatestTheme
                  editorDidMount={(editor) => {
                    editor.addAction(getCommandEnterAction(onRun));
                    editor.onDidContentSizeChange(() => {
                      const contentHeight = editor.getContentHeight();
                      const maxHeight = 100;
                      const finalHeight = Math.min(contentHeight, maxHeight);
                      editor.layout({
                        width: editor.getLayoutInfo().width,
                        height: finalHeight,
                      });
                      editor.updateOptions({
                        scrollBeyondLastLine: false,
                        scrollbar: {
                          vertical: contentHeight > maxHeight ? 'visible' : 'hidden',
                        },
                      });
                    });
                  }}
                />
                {!row.query && (
                  <div className="exploreQueryPanelEditor__placeholder">
                    {i18n.translate('explore.metricsQueryPanel.codePlaceholder', {
                      defaultMessage: 'Search using </> {language}',
                      values: { language: languageTitle },
                    })}
                  </div>
                )}
              </div>
            )}
          </EuiFlexItem>

          <EuiFlexItem grow={false}>
            <div className="mqpRowActions">
              <EuiPopover
                isOpen={showCodeConfirm}
                closePopover={() => setShowCodeConfirm(false)}
                anchorPosition="downRight"
                button={
                  <EuiToolTip content={modeToggleTooltip} position="top">
                    <EuiButtonGroup
                      legend={i18n.translate('explore.metricsQueryPanel.queryModeLabel', {
                        defaultMessage: 'Query {label} mode',
                        values: { label },
                      })}
                      options={modeButtons}
                      idSelected={row.mode}
                      onChange={handleModeChange}
                      buttonSize="compressed"
                    />
                  </EuiToolTip>
                }
              >
                <div className="pqbCodeConfirmPopover">
                  <EuiText size="s">
                    <p>
                      {i18n.translate('explore.promqlBuilder.switchToCodeWarning', {
                        defaultMessage:
                          'This query cannot be represented in Builder mode. Switching to Code is irreversible.',
                      })}
                    </p>
                  </EuiText>
                  <EuiSpacer />
                  <EuiFlexGroup gutterSize="s" justifyContent="flexEnd" responsive={false}>
                    <EuiFlexItem grow={false}>
                      <EuiButton size="s" onClick={() => setShowCodeConfirm(false)}>
                        {i18n.translate('explore.promqlBuilder.switchToCodeCancel', {
                          defaultMessage: 'Cancel',
                        })}
                      </EuiButton>
                    </EuiFlexItem>
                    <EuiFlexItem grow={false}>
                      <EuiButton
                        size="s"
                        color="warning"
                        fill
                        onClick={() => {
                          setShowCodeConfirm(false);
                          onModeChange(row.id, 'code');
                        }}
                      >
                        {i18n.translate('explore.promqlBuilder.switchToCodeConfirm', {
                          defaultMessage: 'Switch',
                        })}
                      </EuiButton>
                    </EuiFlexItem>
                  </EuiFlexGroup>
                </div>
              </EuiPopover>
              {canRemove && (
                <EuiToolTip
                  content={i18n.translate('explore.metricsQueryPanel.removeQuery', {
                    defaultMessage: 'Remove query',
                  })}
                >
                  <EuiButtonIcon
                    iconType="cross"
                    color="text"
                    size="s"
                    aria-label={i18n.translate('explore.metricsQueryPanel.removeQuery', {
                      defaultMessage: 'Remove query',
                    })}
                    onClick={() => onRemove(row.id)}
                  />
                </EuiToolTip>
              )}
            </div>
          </EuiFlexItem>
        </EuiFlexGroup>
      </div>
    );
  }
);
