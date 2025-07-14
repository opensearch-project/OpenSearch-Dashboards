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
  EuiSpacer,
} from '@elastic/eui';
import { i18n } from '@osd/i18n';
import {
  Positions,
  AxisRole,
  AxisStyleStoredInMapping,
  CompleteAxisWithStyle,
  AxisLabels,
} from '../../types';
import { DebouncedTruncateField, DebouncedText } from '.././utils';
import { StyleAccordion } from '../../style_panel/style_accordion';

interface AllAxesOptionsProps {
  axisColumnMappings: Partial<Record<AxisRole, CompleteAxisWithStyle>>;
  onChangeAxisStyle: (role: AxisRole, updatedStyles: Partial<AxisStyleStoredInMapping>) => void;
}

interface AxesOptionsProps {
  axisColumnMappings: Partial<Record<AxisRole, CompleteAxisWithStyle>>;
  onChangeAxisStyle: (role: AxisRole, updatedStyles: Partial<AxisStyleStoredInMapping>) => void;
}

export const StandardAxesOptions: React.FC<AxesOptionsProps> = ({
  axisColumnMappings,
  onChangeAxisStyle,
}) => {
  const [expandedAxes, setExpandedAxes] = useState<Record<string, boolean>>({});

  const toggleAxisExpansion = (axisId: string) => {
    setExpandedAxes({
      ...expandedAxes,
      [axisId]: !expandedAxes[axisId],
    });
  };

  const getPositionOptions = (role: AxisRole) => {
    if (role === AxisRole.Y) {
      return [
        {
          id: Positions.LEFT,
          label: i18n.translate(`explore.vis.standardAxes.${role}.left`, {
            defaultMessage: 'Left',
          }),
        },
        {
          id: Positions.RIGHT,
          label: i18n.translate(`explore.vis.standardAxes.${role}.right`, {
            defaultMessage: 'Right',
          }),
        },
      ];
    } else if (role === AxisRole.Y_SECOND) {
      return [
        {
          id: Positions.RIGHT,
          label: i18n.translate(`explore.vis.standardAxes.${role}.right`, {
            defaultMessage: 'Right',
          }),
        },
        {
          id: Positions.LEFT,
          label: i18n.translate(`explore.vis.standardAxes.${role}.left`, {
            defaultMessage: 'Left',
          }),
        },
      ];
    } else {
      return [
        {
          id: Positions.BOTTOM,
          label: i18n.translate(`explore.vis.standardAxes.${role}.bottom`, {
            defaultMessage: 'Bottom',
          }),
        },
        {
          id: Positions.TOP,
          label: i18n.translate(`explore.vis.standardAxes.${role}.top`, { defaultMessage: 'Top' }),
        },
      ];
    }
  };

  const getDefaultSelections = (role: AxisRole, axis: CompleteAxisWithStyle) => {
    if (role === AxisRole.Y) {
      return axis.styles?.position ?? Positions.LEFT;
    }
    if (role === AxisRole.Y_SECOND) {
      return axis.styles?.position ?? Positions.RIGHT;
    }
    return axis.styles?.position ?? Positions.BOTTOM;
  };
  return (
    <>
      {Object.entries(axisColumnMappings).map(([role, axis]) => {
        const axisRole = role as AxisRole;
        if (role !== AxisRole.X && role !== AxisRole.Y && role !== AxisRole.Y_SECOND) return null;
        return (
          <EuiSplitPanel.Inner paddingSize="s" key={role} color="subdued">
            <EuiButtonEmpty
              iconSide="left"
              color="text"
              iconType={expandedAxes[role] ? 'arrowDown' : 'arrowRight'}
              onClick={() => toggleAxisExpansion(role)}
              size="xs"
              data-test-subj={`standardAxis-${role}-button`}
            >
              {i18n.translate('explore.vis.gridOptions.categoryXAxis', {
                defaultMessage: role,
              })}
            </EuiButtonEmpty>
            <EuiSpacer size="s" />
            {expandedAxes[role] && (
              <div>
                <EuiFormRow
                  label={i18n.translate('explore.vis.standardAxes.axisPosition', {
                    defaultMessage: 'Position',
                  })}
                >
                  <EuiButtonGroup
                    name={`AxisPosition-${role}`}
                    legend="Select axis position"
                    options={getPositionOptions(axisRole)}
                    idSelected={getDefaultSelections(axisRole, axis)}
                    onChange={(id) =>
                      onChangeAxisStyle(axisRole, {
                        position: id as Positions,
                      })
                    }
                    buttonSize="compressed"
                    isFullWidth
                  />
                </EuiFormRow>
                <EuiFormRow>
                  <EuiSwitch
                    compressed
                    label={i18n.translate('explore.vis.standardAxes.showAxisLinesAndLabels', {
                      defaultMessage: 'Show axis lines and labels',
                    })}
                    checked={axis.styles?.show ?? true}
                    onChange={(e) => onChangeAxisStyle(axisRole, { show: e.target.checked })}
                  />
                </EuiFormRow>
                {axis.styles?.show && (
                  <>
                    <DebouncedText
                      value={axis.styles.title.text || axis.name}
                      placeholder="Axis name"
                      onChange={(text) =>
                        onChangeAxisStyle(axisRole, {
                          title: { ...axis.styles?.title, text },
                        })
                      }
                      label={i18n.translate('explore.vis.standardAxes.axisTitle', {
                        defaultMessage: 'Display name',
                      })}
                    />
                    <EuiFormRow>
                      <EuiSwitch
                        compressed
                        label={i18n.translate('explore.vis.standardAxes.showLabels', {
                          defaultMessage: 'Show labels',
                        })}
                        checked={axis.styles?.labels.show}
                        onChange={(e) =>
                          onChangeAxisStyle(axisRole, {
                            labels: {
                              ...axis.styles?.labels,
                              show: e.target.checked,
                            } as AxisLabels,
                          })
                        }
                      />
                    </EuiFormRow>

                    {axis.styles?.labels.show && (
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
                                compressed
                                value={
                                  axis.styles?.labels.rotate === 0
                                    ? 'horizontal'
                                    : axis.styles?.labels.rotate === -90
                                    ? 'vertical'
                                    : 'angled'
                                }
                                onChange={(e) => {
                                  let rotationValue = 0;
                                  if (e.target.value === 'vertical') rotationValue = -90;
                                  else if (e.target.value === 'angled') rotationValue = -45;

                                  onChangeAxisStyle(axisRole, {
                                    labels: {
                                      ...axis.styles?.labels,
                                      rotate: rotationValue,
                                    } as AxisLabels,
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
                              value={axis.styles?.labels.truncate ?? 100}
                              onChange={(truncateValue) => {
                                onChangeAxisStyle(axisRole, {
                                  labels: {
                                    ...axis.styles?.labels,
                                    truncate: truncateValue,
                                  } as AxisLabels,
                                });
                              }}
                              label={i18n.translate('explore.vis.standardAxes.labelTruncate', {
                                defaultMessage: 'Truncate',
                              })}
                            />
                          </EuiFlexItem>
                        </EuiFlexGroup>
                      </>
                    )}
                  </>
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
  axisColumnMappings,
  onChangeAxisStyle,
}) => {
  return (
    <StyleAccordion
      id="allAxesSection"
      accordionLabel={i18n.translate('explore.stylePanel.tabs.allAxes', {
        defaultMessage: 'Axis',
      })}
      initialIsOpen={true}
      data-test-subj="standardAxesPanel"
    >
      <EuiFlexGroup direction="column" gutterSize="s">
        <EuiFlexItem>
          <StandardAxesOptions
            axisColumnMappings={axisColumnMappings}
            onChangeAxisStyle={onChangeAxisStyle}
          />
        </EuiFlexItem>
      </EuiFlexGroup>
    </StyleAccordion>
  );
};
