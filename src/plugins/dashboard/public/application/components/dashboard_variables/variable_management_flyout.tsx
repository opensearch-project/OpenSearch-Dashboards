/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
  EuiTitle,
  EuiFlexGroup,
  EuiFlexItem,
  EuiText,
  EuiSmallButton,
  EuiSmallButtonEmpty,
  EuiDragDropContext,
  EuiDraggable,
  EuiDroppable,
  EuiIcon,
  EuiPanel,
  EuiBadge,
  EuiEmptyPrompt,
  EuiConfirmModal,
  EuiHorizontalRule,
  DropResult,
  EuiSmallButtonIcon,
  EuiToolTip,
} from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { VariableService } from '../../../variables/variable_service';
import { Variable, VariableType, VariableWithState } from '../../../variables/types';

export interface VariableManagementFlyoutProps {
  variableService: VariableService;
  onClose: () => void;
  onAddVariable: () => void;
  onEditVariable: (variable: Variable) => void;
  panelQueries?: string[];
}

const variableTypeLabels: Record<VariableType, string> = {
  [VariableType.Query]: 'Query',
  [VariableType.Custom]: 'Custom',
};

export const VariableManagementFlyout: React.FC<VariableManagementFlyoutProps> = ({
  variableService,
  onClose,
  onAddVariable,
  onEditVariable,
  panelQueries = [],
}) => {
  const [variables, setVariables] = useState<VariableWithState[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<Variable | null>(null);

  useEffect(() => {
    const subscription = variableService.getVariables$().subscribe((newVariables) => {
      setVariables(newVariables);
    });
    return () => subscription.unsubscribe();
  }, [variableService]);

  const handleDragEnd = useCallback(
    ({ source, destination }: DropResult) => {
      if (source && destination) {
        variableService.reorderVariables(source.index, destination.index);
      }
    },
    [variableService]
  );

  const handleDelete = useCallback((variable: Variable) => {
    setDeleteTarget(variable);
  }, []);

  const confirmDelete = useCallback(() => {
    if (deleteTarget) {
      variableService.removeVariable(deleteTarget.id);
      setDeleteTarget(null);
    }
  }, [deleteTarget, variableService]);

  const handleToggleHide = useCallback(
    (variable: Variable) => {
      variableService.updateVariable(variable.id, { hide: !variable.hide });
    },
    [variableService]
  );

  /** Check if a variable is referenced by other variables or panel queries */
  const isReferenced = useCallback(
    (varName: string): boolean => {
      const pattern = new RegExp(`\\$\\{${varName}\\}|\\$${varName}\\b`);
      // Check other query variables
      const referencedByVariable = variables.some(
        (v) => v.type === VariableType.Query && v.name !== varName && pattern.test(v.query)
      );
      if (referencedByVariable) return true;
      // Check panel queries
      return panelQueries.some((q) => pattern.test(q));
    },
    [variables, panelQueries]
  );

  return (
    <>
      <EuiPanel
        data-test-subj="variableManagementPanel"
        paddingSize="m"
        style={{ width: '500px', marginTop: '8px' }}
      >
        <EuiFlexGroup direction="column">
          <EuiFlexItem>
            <EuiFlexGroup alignItems="center" justifyContent="spaceBetween" responsive={false}>
              <EuiFlexItem>
                <EuiTitle size="s">
                  <h2>
                    {i18n.translate('dashboard.variableManagement.title', {
                      defaultMessage: 'Manage variables',
                    })}
                  </h2>
                </EuiTitle>
              </EuiFlexItem>
              <EuiFlexItem grow={false}>
                <EuiSmallButtonIcon
                  iconType="cross"
                  aria-label={i18n.translate('dashboard.variables.close', {
                    defaultMessage: 'Close',
                  })}
                  onClick={onClose}
                  display="empty"
                />
              </EuiFlexItem>
            </EuiFlexGroup>
          </EuiFlexItem>
          <EuiHorizontalRule margin="none" />
          <EuiFlexItem>
            {variables.length === 0 ? (
              <EuiEmptyPrompt
                iconType="editorCodeBlock"
                title={
                  <h3>
                    {i18n.translate('dashboard.variableManagement.emptyTitle', {
                      defaultMessage: 'No variables yet',
                    })}
                  </h3>
                }
                body={
                  <p>
                    {i18n.translate('dashboard.variableManagement.emptyBody', {
                      defaultMessage:
                        'Variables allow you to create interactive dashboards with dynamic options. Add your first variable to get started.',
                    })}
                  </p>
                }
                actions={
                  <EuiSmallButton iconType="plusInCircle" onClick={onAddVariable} fill>
                    {i18n.translate('dashboard.variableManagement.emptyAddButton', {
                      defaultMessage: 'Add variable',
                    })}
                  </EuiSmallButton>
                }
              />
            ) : (
              <EuiDragDropContext onDragEnd={handleDragEnd}>
                <EuiDroppable droppableId="variableManagementDroppable" spacing="none">
                  {variables.map((variable, index) => (
                    <EuiDraggable
                      key={variable.id}
                      index={index}
                      draggableId={variable.id}
                      customDragHandle
                      spacing="m"
                    >
                      {(provided) => (
                        <EuiPanel paddingSize="s" hasBorder>
                          <EuiFlexGroup alignItems="center" gutterSize="xs" responsive={false}>
                            {/* Drag handle */}
                            <EuiFlexItem grow={false}>
                              <div
                                {...provided.dragHandleProps}
                                aria-label={i18n.translate('dashboard.variables.dragToReorder', {
                                  defaultMessage: 'Drag to reorder',
                                })}
                              >
                                <EuiIcon type="grab" size="m" color="subdued" />
                              </div>
                            </EuiFlexItem>

                            {/* Variable info */}
                            <EuiFlexItem grow style={{ minWidth: 0 }}>
                              <EuiFlexGroup direction="column" gutterSize="none" responsive={false}>
                                <EuiFlexItem>
                                  <EuiFlexGroup
                                    gutterSize="xs"
                                    alignItems="center"
                                    responsive={false}
                                    wrap={false}
                                  >
                                    <EuiFlexItem
                                      grow={false}
                                      style={{
                                        minWidth: 0,
                                        maxWidth: '220px',
                                      }}
                                    >
                                      <EuiText
                                        size="s"
                                        className="eui-textTruncate"
                                        title={variable.name}
                                      >
                                        <strong>{variable.name}</strong>
                                      </EuiText>
                                    </EuiFlexItem>
                                    <EuiFlexItem grow={false}>
                                      <EuiBadge color="hollow">
                                        {variableTypeLabels[variable.type] || variable.type}
                                      </EuiBadge>
                                    </EuiFlexItem>
                                    {variable.multi && (
                                      <EuiFlexItem grow={false}>
                                        <EuiBadge color="primary">Multi</EuiBadge>
                                      </EuiFlexItem>
                                    )}
                                    {variable.hide && (
                                      <EuiFlexItem grow={false}>
                                        <EuiBadge color="warning">Hidden</EuiBadge>
                                      </EuiFlexItem>
                                    )}
                                  </EuiFlexGroup>
                                </EuiFlexItem>
                                {variable.label && (
                                  <EuiFlexItem style={{ minWidth: 0 }}>
                                    <EuiText
                                      size="xs"
                                      color="subdued"
                                      className="eui-textTruncate"
                                      title={variable.label}
                                    >
                                      {variable.label}
                                    </EuiText>
                                  </EuiFlexItem>
                                )}
                              </EuiFlexGroup>
                            </EuiFlexItem>

                            {/* Actions */}
                            <EuiFlexItem grow={false}>
                              <EuiFlexGroup
                                gutterSize="none"
                                alignItems="center"
                                responsive={false}
                              >
                                {isReferenced(variable.name) && (
                                  <EuiFlexItem grow={false}>
                                    <EuiToolTip
                                      content={i18n.translate(
                                        'dashboard.variables.referencedTooltip',
                                        {
                                          defaultMessage:
                                            'This variable is referenced by other variables or dashboard.',
                                        }
                                      )}
                                    >
                                      <EuiIcon type="check" color="success" />
                                    </EuiToolTip>
                                  </EuiFlexItem>
                                )}
                                <EuiFlexItem grow={false}>
                                  <EuiSmallButtonIcon
                                    iconType={variable.hide ? 'eyeClosed' : 'eye'}
                                    aria-label={
                                      variable.hide
                                        ? i18n.translate('dashboard.variables.showVariable', {
                                            defaultMessage: 'Show variable',
                                          })
                                        : i18n.translate('dashboard.variables.hideVariable', {
                                            defaultMessage: 'Hide variable',
                                          })
                                    }
                                    onClick={() => handleToggleHide(variable)}
                                    color="text"
                                  />
                                </EuiFlexItem>
                                <EuiFlexItem grow={false}>
                                  <EuiSmallButtonIcon
                                    iconType="pencil"
                                    aria-label={i18n.translate('dashboard.variables.editVariable', {
                                      defaultMessage: 'Edit variable',
                                    })}
                                    onClick={() => onEditVariable(variable)}
                                    color="text"
                                  />
                                </EuiFlexItem>
                                <EuiFlexItem grow={false}>
                                  <EuiSmallButtonIcon
                                    iconType="trash"
                                    aria-label={i18n.translate(
                                      'dashboard.variables.deleteVariable',
                                      { defaultMessage: 'Delete variable' }
                                    )}
                                    onClick={() => handleDelete(variable)}
                                    color="danger"
                                  />
                                </EuiFlexItem>
                              </EuiFlexGroup>
                            </EuiFlexItem>
                          </EuiFlexGroup>
                        </EuiPanel>
                      )}
                    </EuiDraggable>
                  ))}
                </EuiDroppable>
              </EuiDragDropContext>
            )}
          </EuiFlexItem>
          <EuiHorizontalRule margin="none" />
          <EuiFlexItem>
            <EuiFlexGroup justifyContent="spaceBetween">
              <EuiFlexItem grow={false}>
                <EuiSmallButtonEmpty onClick={onClose}>
                  {i18n.translate('dashboard.variableManagement.close', {
                    defaultMessage: 'Close',
                  })}
                </EuiSmallButtonEmpty>
              </EuiFlexItem>
              <EuiFlexItem grow={false}>
                <EuiSmallButton
                  onClick={() => {
                    onAddVariable();
                  }}
                  data-test-subj="variableManagementAddButton"
                >
                  {i18n.translate('dashboard.variableManagement.addButton', {
                    defaultMessage: 'Add variable',
                  })}
                </EuiSmallButton>
              </EuiFlexItem>
            </EuiFlexGroup>
          </EuiFlexItem>
        </EuiFlexGroup>
      </EuiPanel>

      {/* Delete confirmation modal */}
      {deleteTarget && (
        <EuiConfirmModal
          title={i18n.translate('dashboard.variableManagement.deleteConfirmTitle', {
            defaultMessage: 'Delete variable "{name}"?',
            values: { name: deleteTarget.name },
          })}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={confirmDelete}
          cancelButtonText={i18n.translate('dashboard.variableManagement.deleteCancel', {
            defaultMessage: 'Cancel',
          })}
          confirmButtonText={i18n.translate('dashboard.variableManagement.deleteConfirm', {
            defaultMessage: 'Delete',
          })}
          buttonColor="danger"
        >
          <p>
            {i18n.translate('dashboard.variableManagement.deleteConfirmBody', {
              defaultMessage:
                'This will remove the variable and any references to it in queries will stop working.',
            })}
          </p>
        </EuiConfirmModal>
      )}
    </>
  );
};
