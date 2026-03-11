/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from 'react';
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
import { DebouncedFieldText, DebouncedFieldNumber } from '.././utils';
import { StyleAccordion } from '../../style_panel/style_accordion';
import { AXIS_LABEL_MAX_LENGTH } from '../../constants';
import { getSchemaByAxis } from '../../utils/utils';

interface AllAxesOptionsProps {
  standardAxes: StandardAxes[];
  onStandardAxesChange: (categoryAxes: StandardAxes[]) => void;
  axisColumnMappings: Partial<Record<AxisRole, VisColumn>>;
  disableGrid?: boolean;
  switchAxes?: boolean;
  showFullTimeRange?: boolean;
  onShowFullTimeRangeChange?: (showFullTimeRange: boolean) => void;
  initialIsOpen?: boolean;
}

const xAxisLabel = i18n.translate('explore.vis.standardAxes.xAxis', {
  defaultMessage: 'X-Axis',
});

const yAxisLabel = i18n.translate('explore.vis.standardAxes.yAxis', {
  defaultMessage: 'Y-Axis',
});

const y2AxisLabel = i18n.translate('explore.vis.standardAxes.y2Axis', {
  defaultMessage: 'Y-Axis(2nd)',
});

export const AllAxesOptions: React.FC<AllAxesOptionsProps> = ({
  standardAxes = [],
  onStandardAxesChange,
  axisColumnMappings,
  disableGrid = false,
  switchAxes = false,
  showFullTimeRange,
  onShowFullTimeRangeChange,
  initialIsOpen = false,
}) => {
  const updateAxis = (index: number, updates: Partial<StandardAxes>) => {
    const updatedAxes = [...standardAxes];
    updatedAxes[index] = {
      ...updatedAxes[index],
      ...updates,
    };

    onStandardAxesChange(updatedAxes);
  };

  const getAxisLabel = (role: AxisRole) => {
    switch (role) {
      case AxisRole.X:
        return switchAxes ? yAxisLabel : xAxisLabel;
      case AxisRole.Y:
        return switchAxes ? xAxisLabel : yAxisLabel;
      case AxisRole.Y_SECOND:
        return y2AxisLabel;
    }
  };

  const getPositionsForAxis = (axis: StandardAxes) => {
    const isY = axis.axisRole === AxisRole.Y || axis.axisRole === AxisRole.Y_SECOND;
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

  return (
    <StyleAccordion
      id="allAxesSection"
      accordionLabel={i18n.translate('explore.stylePanel.tabs.allAxes', {
        defaultMessage: 'Axes',
      })}
      initialIsOpen={initialIsOpen}
      data-test-subj="standardAxesPanel"
    >
      {standardAxes.map((axis, index) => {
        return (
          <EuiSplitPanel.Inner paddingSize="s" key={axis.axisRole}>
            {index !== 0 && <EuiSpacer size="m" />}
            <div>
              <EuiFormRow>
                <EuiSwitch
                  compressed
                  label={i18n.translate('explore.vis.standardAxes.showAxis', {
                    defaultMessage: 'Show {name}',
                    values: {
                      name: getAxisLabel(axis.axisRole),
                    },
                  })}
                  data-test-subj="showAxisSwitch"
                  checked={axis.show}
                  onChange={(e) => updateAxis(index, { show: e.target.checked })}
                />
              </EuiFormRow>
              {axis.show && (
                <>
                  <EuiFormRow
                    label={i18n.translate('explore.vis.standardAxes.axisTitle', {
                      defaultMessage: 'Title',
                    })}
                  >
                    <DebouncedFieldText
                      value={axis.title.text ?? ''}
                      placeholder="Axis name"
                      onChange={(text) =>
                        updateAxis(index, {
                          title: { ...axis.title, text },
                        })
                      }
                    />
                  </EuiFormRow>

                  <EuiFormRow
                    label={i18n.translate('explore.vis.standardAxes.axisPosition', {
                      defaultMessage: 'Position',
                    })}
                  >
                    <EuiButtonGroup
                      name={`AxisPosition-${index}`}
                      legend="Select axis position"
                      options={getPositionsForAxis(axis)}
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

                  {getSchemaByAxis(axisColumnMappings?.[axis.axisRole]) === 'temporal' &&
                    onShowFullTimeRangeChange && (
                      <EuiFormRow>
                        <EuiSwitch
                          compressed
                          label={i18n.translate('explore.vis.standardAxes.showFullTimeRange', {
                            defaultMessage: 'Show full time range',
                          })}
                          checked={showFullTimeRange ?? false}
                          onChange={(e) => onShowFullTimeRangeChange(e.target.checked)}
                          data-test-subj="showFullTimeRangeSwitch"
                        />
                      </EuiFormRow>
                    )}

                  {!disableGrid && (
                    <EuiFormRow>
                      <EuiSwitch
                        compressed
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
                        updateAxis(index, {
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

                            updateAxis(index, {
                              labels: {
                                ...axis.labels,
                                rotate: rotationValue,
                              },
                            });
                          }}
                          onMouseUp={(e) => e.stopPropagation()}
                          options={[
                            { value: 'horizontal', text: 'Horizontal' },
                            { value: 'vertical', text: 'Vertical' },
                            { value: 'angled', text: 'Angled' },
                          ]}
                        />
                      </EuiFormRow>

                      <EuiFormRow
                        label={i18n.translate('explore.vis.axis.label.truncate.label', {
                          defaultMessage: 'Truncate after',
                        })}
                      >
                        <DebouncedFieldNumber
                          value={axis.labels.truncate}
                          defaultValue={AXIS_LABEL_MAX_LENGTH}
                          onChange={(truncateValue) => {
                            updateAxis(index, {
                              labels: {
                                ...axis.labels,
                                truncate: truncateValue ?? AXIS_LABEL_MAX_LENGTH,
                              },
                            });
                          }}
                        />
                      </EuiFormRow>
                    </>
                  )}
                </>
              )}
            </div>
            {index < standardAxes.length - 1 && <EuiSpacer size="m" />}
          </EuiSplitPanel.Inner>
        );
      })}
    </StyleAccordion>
  );
};
