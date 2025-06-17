/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  EuiPanel,
  EuiTitle,
  EuiFormRow,
  EuiSelect,
  EuiSwitch,
  EuiFlexGroup,
  EuiFlexItem,
  EuiButton,
} from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { StandardAxes, Positions, AxisRole } from '../types';
import { DebouncedTruncateField, DebouncedText } from './utils';

interface AllAxesOptionsProps {
  standardAxes: StandardAxes[];
  onStandardAxesChange: (categoryAxes: StandardAxes[]) => void;
  disableGrid: boolean;
  onChangeSwitchAxes: (categoryAxes: StandardAxes[]) => void;
}

interface AxesOptionsProps {
  standardAxes: StandardAxes[];
  onStandardAxesChange: (categoryAxes: StandardAxes[]) => void;
  disableGrid: boolean;
}

const getAxisDisplayTitle = (axis: StandardAxes) => {
  if (axis.title?.text && axis.title.text.trim() !== '') {
    return axis.title.text;
  }
  return axis.field?.default.name || '';
};

export const StandardAxesOptions: React.FC<AxesOptionsProps> = ({
  standardAxes,
  onStandardAxesChange,
  disableGrid,
}) => {
  const updateAxis = (index: number, updates: Partial<StandardAxes>) => {
    const updatedAxes = [...standardAxes];
    updatedAxes[index] = {
      ...updatedAxes[index],
      ...updates,
    };

    onStandardAxesChange(updatedAxes);
  };

  return (
    <>
      {standardAxes.map((axis, index) => {
        const isYAxis = axis.axisRole === AxisRole.Y;

        return (
          <div key={axis.id}>
            <EuiFlexGroup gutterSize="s" direction="column" alignItems="flexStart">
              <EuiFlexItem>
                <EuiTitle size="xs">
                  <h4>
                    {i18n.translate('explore.vis.standardAxes.axisRoleLabel', {
                      defaultMessage: isYAxis ? 'Y-Axis' : 'X-Axis',
                    })}
                  </h4>
                </EuiTitle>
              </EuiFlexItem>
              {axis.field?.options && (
                <EuiFlexItem>
                  <EuiFormRow
                    label={i18n.translate('explore.vis.standardAxes.axisField', {
                      defaultMessage: 'Field',
                    })}
                  >
                    <EuiSelect
                      value={axis.field.default.column}
                      onChange={(e) => {
                        const selectedColumn = axis.field?.options?.find(
                          (opt) => opt.column === e.target.value
                        );
                        if (selectedColumn) {
                          updateAxis(index, {
                            field: {
                              ...axis.field,
                              default: selectedColumn,
                            },
                          });
                        }
                      }}
                      options={axis.field.options.map((option) => ({
                        value: option.column,
                        text: option.name,
                      }))}
                    />
                  </EuiFormRow>
                </EuiFlexItem>
              )}
              <EuiFlexItem>
                <EuiFlexGroup alignItems="center" justifyContent="center">
                  <EuiFlexItem>
                    <DebouncedText
                      value={getAxisDisplayTitle(axis)}
                      placeholder="Axis name"
                      onChange={(text) =>
                        updateAxis(index, {
                          title: { ...axis.title, text },
                        })
                      }
                      label={i18n.translate('explore.vis.standardAxes.axisTitle', {
                        defaultMessage: 'Axis title',
                      })}
                    />
                  </EuiFlexItem>

                  <EuiFlexItem>
                    <EuiFormRow
                      label={i18n.translate('explore.vis.standardAxes.axisPosition', {
                        defaultMessage: 'Position',
                      })}
                    >
                      <EuiSelect
                        value={axis.position}
                        onChange={(e) =>
                          updateAxis(index, {
                            position: e.target.value as Positions,
                          })
                        }
                        options={
                          isYAxis
                            ? [
                                { value: 'left', text: 'Left' },
                                { value: 'right', text: 'Right' },
                              ]
                            : [
                                { value: 'bottom', text: 'Bottom' },
                                { value: 'top', text: 'Top' },
                              ]
                        }
                      />
                    </EuiFormRow>
                  </EuiFlexItem>
                </EuiFlexGroup>
              </EuiFlexItem>
              <EuiFlexItem>
                <EuiFormRow>
                  <EuiSwitch
                    label={i18n.translate('explore.vis.standardAxes.showAxisLinesAndLabels', {
                      defaultMessage: 'Show axis lines and labels',
                    })}
                    checked={axis.show}
                    onChange={(e) => updateAxis(index, { show: e.target.checked })}
                  />
                </EuiFormRow>
              </EuiFlexItem>
              {axis.show && (
                <>
                  <EuiFlexItem>
                    <EuiFormRow>
                      <EuiSwitch
                        label={i18n.translate('explore.vis.standardAxes.showLabels', {
                          defaultMessage: 'Show labels',
                        })}
                        checked={axis.labels.show}
                        onChange={(e) =>
                          updateAxis(index, {
                            labels: { ...axis.labels, show: e.target.checked },
                          })
                        }
                      />
                    </EuiFormRow>
                  </EuiFlexItem>

                  {axis.labels.show && (
                    <>
                      <EuiFlexItem>
                        <EuiFlexGroup>
                          <EuiFlexItem>
                            <EuiFormRow
                              label={i18n.translate('explore.vis.standardAxes.labelAlignment', {
                                defaultMessage: 'Aligned',
                              })}
                            >
                              <EuiSelect
                                value={
                                  axis.labels.rotate === 0
                                    ? 'horizontal'
                                    : axis.labels.rotate === -90
                                    ? 'vertical'
                                    : 'angled'
                                }
                                onChange={(e) => {
                                  let rotationValue = 0;
                                  if (e.target.value === 'vertical') rotationValue = -90;
                                  else if (e.target.value === 'angled') rotationValue = -45;

                                  updateAxis(index, {
                                    labels: {
                                      ...axis.labels,
                                      rotate: rotationValue,
                                    },
                                  });
                                }}
                                options={[
                                  { value: 'horizontal', text: 'Horizontal' },
                                  { value: 'vertical', text: 'Vertical' },
                                  { value: 'angled', text: 'Angled' },
                                ]}
                              />
                            </EuiFormRow>
                          </EuiFlexItem>

                          <EuiFlexItem>
                            <DebouncedTruncateField
                              value={axis.labels.truncate ?? 100}
                              onChange={(truncateValue) => {
                                updateAxis(index, {
                                  labels: {
                                    ...axis.labels,
                                    truncate: truncateValue,
                                  },
                                });
                              }}
                              label={i18n.translate('explore.vis.standardAxes.labelTruncate', {
                                defaultMessage: 'Truncate',
                              })}
                            />
                          </EuiFlexItem>
                        </EuiFlexGroup>
                      </EuiFlexItem>
                    </>
                  )}
                </>
              )}
              {!disableGrid && (
                <EuiFlexItem>
                  <EuiSwitch
                    checked={axis.grid?.showLines ?? false}
                    onChange={(e) =>
                      updateAxis(index, {
                        grid: { ...axis.grid, showLines: e.target.checked },
                      })
                    }
                    label={i18n.translate('explore.vis.standardAxes.showAxisGrid.switchLabel', {
                      defaultMessage: 'Show grid lines',
                    })}
                  />
                </EuiFlexItem>
              )}
            </EuiFlexGroup>
          </div>
        );
      })}
    </>
  );
};

export const AllAxesOptions: React.FC<AllAxesOptionsProps> = ({
  standardAxes,
  onStandardAxesChange,
  disableGrid,
  onChangeSwitchAxes,
}) => {
  return (
    <EuiPanel paddingSize="s" data-test-subj="standardAxesPanel">
      <EuiFlexGroup direction="column" gutterSize="xs">
        <EuiFlexItem grow={false}>
          <EuiTitle size="xs">
            <h3>
              {i18n.translate('explore.vis.standardAxes.title', {
                defaultMessage: 'Axes Settings',
              })}
            </h3>
          </EuiTitle>
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          <EuiButton
            onClick={() => onChangeSwitchAxes(standardAxes)}
            data-test-subj="switchAxesButton"
          >
            {i18n.translate('explore.vis.standardAxes.switchXY', {
              defaultMessage: 'Switch X and Y',
            })}
          </EuiButton>
        </EuiFlexItem>
        <EuiFlexItem>
          <StandardAxesOptions
            disableGrid={disableGrid}
            standardAxes={standardAxes}
            onStandardAxesChange={onStandardAxesChange}
          />
        </EuiFlexItem>
      </EuiFlexGroup>
    </EuiPanel>
  );
};
