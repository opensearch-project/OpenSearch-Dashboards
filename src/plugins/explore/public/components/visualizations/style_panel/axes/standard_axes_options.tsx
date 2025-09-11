/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  EuiFormRow,
  EuiButtonGroup,
  EuiSelect,
  EuiSwitch,
  EuiSplitPanel,
  EuiText,
  EuiSpacer,
} from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { StandardAxes, Positions, AxisRole, VisColumn } from '../../types';
import { DebouncedTruncateField, DebouncedText } from '.././utils';
import { StyleAccordion } from '../../style_panel/style_accordion';

interface AllAxesOptionsProps {
  standardAxes: StandardAxes[];
  onStandardAxesChange: (categoryAxes: StandardAxes[]) => void;
  axisColumnMappings: Partial<Record<AxisRole, VisColumn>>;
  disableGrid?: boolean;
  switchAxes?: boolean;
}

export const AllAxesOptions: React.FC<AllAxesOptionsProps> = ({
  standardAxes,
  onStandardAxesChange,
  axisColumnMappings,
  disableGrid = false,
  switchAxes = false,
}) => {
  const updateAxisByRole = (role: AxisRole, updates: Partial<StandardAxes>) => {
    const updatedAxes = standardAxes.map((axis) =>
      axis.axisRole === role ? { ...axis, ...updates } : axis
    );

    onStandardAxesChange(updatedAxes);
  };

  const getTitleByAxisRole = (axis: StandardAxes) => {
    if (axis.title?.text && axis.title.text.trim() !== '') {
      return axis.title.text;
    }
    return axisColumnMappings[axis.axisRole]?.name || '';
  };

  const getPositionsForAxis = (axis: StandardAxes) => {
    const isY = axis.axisRole === AxisRole.Y;
    const flipped = !!switchAxes;

    // if switch axes, only switch label
    // the style switch happens in vege rendering
    const mapLabel = (pos: Positions): string => {
      if (!flipped) {
        switch (pos) {
          case Positions.LEFT:
            return 'Left';
          case Positions.RIGHT:
            return 'Right';
          case Positions.TOP:
            return 'Top';
          case Positions.BOTTOM:
            return 'Bottom';
          default:
            return pos;
        }
      } else {
        switch (pos) {
          case Positions.LEFT:
            return 'Bottom';
          case Positions.RIGHT:
            return 'Top';
          case Positions.TOP:
            return 'Right';
          case Positions.BOTTOM:
            return 'Left';
          default:
            return pos;
        }
      }
    };

    const positions = isY ? [Positions.LEFT, Positions.RIGHT] : [Positions.TOP, Positions.BOTTOM];

    return positions.map((pos) => ({
      id: pos,
      label: mapLabel(pos),
    }));
  };

  if (!standardAxes) {
    return null;
  }
  const orderedAxes = switchAxes
    ? [...standardAxes].sort((a, b) => (a.axisRole === AxisRole.Y ? -1 : 1))
    : [...standardAxes].sort((a, b) => (a.axisRole === AxisRole.X ? -1 : 1));

  return (
    <StyleAccordion
      id="allAxesSection"
      accordionLabel={i18n.translate('explore.stylePanel.tabs.allAxes', {
        defaultMessage: 'Axes',
      })}
      initialIsOpen={true}
      data-test-subj="standardAxesPanel"
    >
      {orderedAxes.map((axis, index) => {
        const isYAxis = axis.axisRole === AxisRole.Y;

        return (
          <EuiSplitPanel.Inner paddingSize="s" key={axis.id} color="subdued">
            <EuiText size="s" style={{ fontWeight: 600 }}>
              {(switchAxes ? !isYAxis : isYAxis)
                ? i18n.translate('explore.vis.standardAxes.yAxis', {
                    defaultMessage: 'Y-Axis',
                  })
                : i18n.translate('explore.vis.standardAxes.xAxis', {
                    defaultMessage: 'X-Axis',
                  })}
            </EuiText>
            <EuiSpacer size="m" />
            <div>
              <EuiFormRow>
                <EuiSwitch
                  compressed
                  label={i18n.translate('explore.vis.standardAxes.showAxis', {
                    defaultMessage: 'Show axis',
                  })}
                  data-test-subj="showAxisSwitch"
                  checked={axis.show}
                  onChange={(e) => updateAxisByRole(axis.axisRole, { show: e.target.checked })}
                />
              </EuiFormRow>
              {axis.show && (
                <>
                  <DebouncedText
                    value={axis.title.text ?? ''}
                    placeholder="Axis name"
                    onChange={(text) =>
                      updateAxisByRole(axis.axisRole, {
                        title: { ...axis.title, text },
                      })
                    }
                    label={i18n.translate('explore.vis.standardAxes.axisTitle', {
                      defaultMessage: 'Title',
                    })}
                  />

                  <EuiFormRow
                    label={i18n.translate('explore.vis.standardAxes.axisPosition', {
                      defaultMessage: 'Position',
                    })}
                  >
                    <EuiButtonGroup
                      name={`AxisPosition-${axis.axisRole}`}
                      legend="Select axis position"
                      options={getPositionsForAxis(axis)}
                      idSelected={axis.position}
                      onChange={(id) =>
                        updateAxisByRole(axis.axisRole, {
                          position: id as Positions,
                        })
                      }
                      buttonSize="compressed"
                      isFullWidth
                    />
                  </EuiFormRow>

                  {!disableGrid && (
                    <EuiFormRow>
                      <EuiSwitch
                        compressed
                        checked={axis.grid?.showLines ?? false}
                        onChange={(e) =>
                          updateAxisByRole(axis.axisRole, {
                            grid: { ...axis.grid, showLines: e.target.checked },
                          })
                        }
                        label={i18n.translate('explore.vis.standardAxes.showAxisGrid.switchLabel', {
                          defaultMessage: 'Show grid lines',
                        })}
                      />
                    </EuiFormRow>
                  )}

                  <EuiFormRow>
                    <EuiSwitch
                      compressed
                      label={i18n.translate('explore.vis.standardAxes.showLabels', {
                        defaultMessage: 'Show labels',
                      })}
                      checked={axis.labels.show}
                      onChange={(e) =>
                        updateAxisByRole(axis.axisRole, {
                          labels: { ...axis.labels, show: e.target.checked },
                        })
                      }
                    />
                  </EuiFormRow>

                  {axis.labels.show && (
                    <>
                      <EuiFormRow
                        label={i18n.translate('explore.vis.standardAxes.labelAlignment', {
                          defaultMessage: 'Alignment',
                        })}
                      >
                        <EuiSelect
                          compressed
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

                            updateAxisByRole(axis.axisRole, {
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

                      <DebouncedTruncateField
                        value={axis.labels.truncate ?? 100}
                        onChange={(truncateValue) => {
                          updateAxisByRole(axis.axisRole, {
                            labels: {
                              ...axis.labels,
                              truncate: truncateValue,
                            },
                          });
                        }}
                        label={i18n.translate('explore.vis.standardAxes.labelTruncate', {
                          defaultMessage: 'Truncate after',
                        })}
                      />
                    </>
                  )}
                </>
              )}
            </div>
          </EuiSplitPanel.Inner>
        );
      })}
    </StyleAccordion>
  );
};
