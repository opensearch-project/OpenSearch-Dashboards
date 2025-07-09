/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  EuiFormRow,
  EuiButtonGroup,
  EuiSelect,
  EuiSwitch,
  EuiSplitPanel,
  EuiButtonEmpty,
  EuiFlexGroup,
  EuiFlexItem,
  EuiButton,
  EuiSpacer,
} from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { StandardAxes, Positions, AxisRole } from '../types';
import { DebouncedTruncateField, DebouncedText } from './utils';
import { StyleAccordion } from '../style_panel/style_accordion';

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
  const [expandedAxes, setExpandedAxes] = useState<Record<string, boolean>>({});

  const toggleAxisExpansion = (axisId: string) => {
    setExpandedAxes({
      ...expandedAxes,
      [axisId]: !expandedAxes[axisId],
    });
  };

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
          <EuiSplitPanel.Inner paddingSize="s" key={axis.id} color="subdued">
            <EuiButtonEmpty
              iconSide="left"
              color="text"
              iconType={expandedAxes[axis.id] ? 'arrowDown' : 'arrowRight'}
              onClick={() => toggleAxisExpansion(axis.id)}
              size="xs"
              data-test-subj={`standardAxis-${index}-button`}
            >
              {i18n.translate('explore.vis.gridOptions.categoryAxis', {
                defaultMessage: isYAxis ? 'Y-Axis' : 'X-Axis',
              })}
            </EuiButtonEmpty>
            <EuiSpacer size="s" />
            {expandedAxes[axis.id] && (
              <div>
                {axis.field?.options && (
                  <EuiFormRow
                    fullWidth
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
                )}
                <EuiFormRow
                  label={i18n.translate('explore.vis.standardAxes.axisPosition', {
                    defaultMessage: 'Position',
                  })}
                >
                  <EuiButtonGroup
                    name={`AxisPosition-${index}`}
                    legend="Select axis position"
                    options={
                      isYAxis
                        ? [
                            { id: Positions.LEFT, label: 'Left' },
                            { id: Positions.RIGHT, label: 'Right' },
                          ]
                        : [
                            { id: Positions.BOTTOM, label: 'Bottom' },
                            { id: Positions.TOP, label: 'Top' },
                          ]
                    }
                    idSelected={axis.position}
                    onChange={(id) =>
                      updateAxis(index, {
                        position: id as Positions,
                      })
                    }
                    buttonSize="compressed"
                    isFullWidth
                  />
                </EuiFormRow>
                <EuiFormRow
                  label={i18n.translate('explore.vis.standardAxes.showAxisLinesAndLabels', {
                    defaultMessage: 'Show axis lines and labels',
                  })}
                >
                  <EuiSwitch
                    label=""
                    checked={axis.show}
                    onChange={(e) => updateAxis(index, { show: e.target.checked })}
                  />
                </EuiFormRow>
                {axis.show && (
                  <>
                    <DebouncedText
                      value={getAxisDisplayTitle(axis)}
                      placeholder="Axis name"
                      onChange={(text) =>
                        updateAxis(index, {
                          title: { ...axis.title, text },
                        })
                      }
                      label={i18n.translate('explore.vis.standardAxes.axisTitle', {
                        defaultMessage: 'Display name',
                      })}
                    />
                    <EuiFormRow
                      label={i18n.translate('explore.vis.standardAxes.showLabels', {
                        defaultMessage: 'Show labels',
                      })}
                    >
                      <EuiSwitch
                        label=""
                        checked={axis.labels.show}
                        onChange={(e) =>
                          updateAxis(index, {
                            labels: { ...axis.labels, show: e.target.checked },
                          })
                        }
                      />
                    </EuiFormRow>

                    {axis.labels.show && (
                      <>
                        <EuiSpacer size="s" />
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
                        <EuiSpacer size="s" />
                      </>
                    )}
                  </>
                )}
                {!disableGrid && (
                  <EuiFormRow
                    label={i18n.translate('explore.vis.standardAxes.showAxisGrid.switchLabel', {
                      defaultMessage: 'Show grid lines',
                    })}
                  >
                    <EuiSwitch
                      checked={axis.grid?.showLines ?? false}
                      onChange={(e) =>
                        updateAxis(index, {
                          grid: { ...axis.grid, showLines: e.target.checked },
                        })
                      }
                      label=""
                    />
                  </EuiFormRow>
                )}
              </div>
            )}
          </EuiSplitPanel.Inner>
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
    <StyleAccordion
      id="allAxesSection"
      accordionLabel={i18n.translate('explore.stylePanel.tabs.allAxes', {
        defaultMessage: 'Axes Settings',
      })}
      initialIsOpen={true}
      data-test-subj="standardAxesPanel"
    >
      <EuiFlexGroup direction="column" gutterSize="m">
        <EuiFlexItem>
          <StandardAxesOptions
            disableGrid={disableGrid}
            standardAxes={standardAxes}
            onStandardAxesChange={onStandardAxesChange}
          />
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
      </EuiFlexGroup>
    </StyleAccordion>
  );
};
