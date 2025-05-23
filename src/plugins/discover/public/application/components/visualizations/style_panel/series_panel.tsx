/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  EuiPanel,
  EuiTitle,
  EuiSpacer,
  EuiFormRow,
  EuiFieldNumber,
  EuiSelect,
  EuiSwitch,
  EuiFieldText,
  EuiAccordion,
  EuiFlexGroup,
  EuiFlexItem,
  EuiButton,
  EuiButtonIcon,
  EuiHorizontalRule,
} from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { SeriesParam, ValueAxis } from '../line/line_vis_config';

interface SeriesPanelProps {
  seriesParams: SeriesParam[];
  valueAxes: ValueAxis[];
  onSeriesParamsChange: (seriesParams: SeriesParam[]) => void;
  onValueAxesChange: (valueAxes: ValueAxis[]) => void;
}

export const SeriesPanel: React.FC<SeriesPanelProps> = ({
  seriesParams,
  valueAxes,
  onSeriesParamsChange,
  onValueAxesChange,
}) => {
  const updateSeriesParam = (index: number, updates: Partial<SeriesParam>) => {
    const updatedSeries = [...seriesParams];
    updatedSeries[index] = {
      ...updatedSeries[index],
      ...updates,
    };
    onSeriesParamsChange(updatedSeries);
  };

  const addSeries = () => {
    const newSeries: SeriesParam = {
      show: true,
      type: 'line',
      mode: 'normal',
      data: {
        id: `${seriesParams.length + 1}`,
        label: `Series ${seriesParams.length + 1}`,
      },
      valueAxis: valueAxes[0]?.id || 'ValueAxis-1',
      drawLinesBetweenPoints: true,
      lineWidth: 2,
      interpolate: 'linear',
      showCircles: true,
    };

    onSeriesParamsChange([...seriesParams, newSeries]);
  };

  const removeSeries = (index: number) => {
    if (seriesParams.length > 1) {
      const updatedSeries = seriesParams.filter((_, i) => i !== index);
      onSeriesParamsChange(updatedSeries);
    }
  };

  const addValueAxis = () => {
    const nextAxisNumber = valueAxes.length + 1;
    const newAxis: ValueAxis = {
      id: `ValueAxis-${nextAxisNumber}`,
      name: `RightAxis-${nextAxisNumber}`,
      type: 'value',
      position: 'right',
      show: true,
      style: {},
      scale: {
        type: 'linear',
        mode: 'normal',
        defaultYExtents: false,
        setYExtents: false,
      },
      labels: {
        show: true,
        rotate: 0,
        filter: false,
        truncate: 100,
      },
      title: {
        text: `Axis ${nextAxisNumber}`,
      },
    };

    onValueAxesChange([...valueAxes, newAxis]);
  };

  const removeValueAxis = (axisId: string) => {
    if (valueAxes.length > 1) {
      const updatedAxes = valueAxes.filter((axis) => axis.id !== axisId);
      onValueAxesChange(updatedAxes);

      // Update series that were using the removed axis
      const updatedSeries = seriesParams.map((series) => {
        if (series.valueAxis === axisId) {
          return {
            ...series,
            valueAxis: updatedAxes[0]?.id || 'ValueAxis-1',
          };
        }
        return series;
      });
      onSeriesParamsChange(updatedSeries);
    }
  };

  const renderSeriesConfiguration = (series: SeriesParam, index: number) => {
    return (
      <EuiAccordion
        key={`series-${index}`}
        id={`series-config-${index}`}
        buttonContent={
          <EuiFlexGroup alignItems="center" gutterSize="s">
            <EuiFlexItem grow={false}>
              <EuiTitle size="xs">
                <h4>{series.data.label}</h4>
              </EuiTitle>
            </EuiFlexItem>
            <EuiFlexItem grow={false}>
              {seriesParams.length > 1 && (
                <EuiButtonIcon
                  iconType="trash"
                  color="danger"
                  size="s"
                  onClick={(e: React.MouseEvent) => {
                    e.stopPropagation();
                    removeSeries(index);
                  }}
                  aria-label={i18n.translate('discover.vis.seriesPanel.removeSeries', {
                    defaultMessage: 'Remove series',
                  })}
                />
              )}
            </EuiFlexItem>
          </EuiFlexGroup>
        }
        paddingSize="m"
        initialIsOpen={index === 0}
      >
        <EuiSpacer size="s" />

        {/* Series Label */}
        <EuiFormRow
          label={i18n.translate('discover.vis.seriesPanel.label', {
            defaultMessage: 'Label',
          })}
        >
          <EuiFieldText
            value={series.data.label}
            onChange={(e) =>
              updateSeriesParam(index, {
                data: { ...series.data, label: e.target.value },
              })
            }
          />
        </EuiFormRow>

        <EuiSpacer size="s" />

        {/* Chart Type and Mode */}
        <EuiFlexGroup>
          <EuiFlexItem>
            <EuiFormRow
              label={i18n.translate('discover.vis.seriesPanel.chartType', {
                defaultMessage: 'Chart type',
              })}
            >
              <EuiSelect
                value={series.type}
                onChange={(e) =>
                  updateSeriesParam(index, {
                    type: e.target.value as 'line' | 'area' | 'histogram',
                  })
                }
                options={[
                  {
                    value: 'line',
                    text: i18n.translate('discover.vis.seriesPanel.line', {
                      defaultMessage: 'Line',
                    }),
                  },
                  {
                    value: 'area',
                    text: i18n.translate('discover.vis.seriesPanel.area', {
                      defaultMessage: 'Area',
                    }),
                  },
                  {
                    value: 'histogram',
                    text: i18n.translate('discover.vis.seriesPanel.bars', {
                      defaultMessage: 'Bars',
                    }),
                  },
                ]}
              />
            </EuiFormRow>
          </EuiFlexItem>
          <EuiFlexItem>
            <EuiFormRow
              label={i18n.translate('discover.vis.seriesPanel.mode', {
                defaultMessage: 'Mode',
              })}
            >
              <EuiSelect
                value={series.mode}
                onChange={(e) =>
                  updateSeriesParam(index, {
                    mode: e.target.value as
                      | 'normal'
                      | 'stacked'
                      | 'percentage'
                      | 'wiggle'
                      | 'silhouette',
                  })
                }
                options={[
                  {
                    value: 'normal',
                    text: i18n.translate('discover.vis.seriesPanel.normal', {
                      defaultMessage: 'Normal',
                    }),
                  },
                  {
                    value: 'stacked',
                    text: i18n.translate('discover.vis.seriesPanel.stacked', {
                      defaultMessage: 'Stacked',
                    }),
                  },
                  {
                    value: 'percentage',
                    text: i18n.translate('discover.vis.seriesPanel.percentage', {
                      defaultMessage: 'Percentage',
                    }),
                  },
                  {
                    value: 'wiggle',
                    text: i18n.translate('discover.vis.seriesPanel.wiggle', {
                      defaultMessage: 'Wiggle',
                    }),
                  },
                  {
                    value: 'silhouette',
                    text: i18n.translate('discover.vis.seriesPanel.silhouette', {
                      defaultMessage: 'Silhouette',
                    }),
                  },
                ]}
              />
            </EuiFormRow>
          </EuiFlexItem>
        </EuiFlexGroup>

        <EuiSpacer size="s" />

        {/* Value Axis Assignment */}
        <EuiFormRow
          label={i18n.translate('discover.vis.seriesPanel.valueAxis', {
            defaultMessage: 'Value axis',
          })}
        >
          <EuiSelect
            value={series.valueAxis}
            onChange={(e) => updateSeriesParam(index, { valueAxis: e.target.value })}
            options={[
              ...valueAxes.map((axis) => ({
                value: axis.id,
                text: axis.name || axis.id,
              })),
              {
                value: 'new',
                text: i18n.translate('discover.vis.seriesPanel.newAxis', {
                  defaultMessage: 'New axis...',
                }),
              },
            ]}
          />
        </EuiFormRow>

        <EuiSpacer size="s" />

        {/* Line Styling */}
        {(series.type === 'line' || series.type === 'area') && (
          <>
            <EuiFlexGroup>
              <EuiFlexItem>
                <EuiFormRow
                  label={i18n.translate('discover.vis.seriesPanel.lineWidth', {
                    defaultMessage: 'Line width',
                  })}
                >
                  <EuiFieldNumber
                    value={series.lineWidth}
                    onChange={(e) =>
                      updateSeriesParam(index, {
                        lineWidth: parseInt(e.target.value, 10) || 2,
                      })
                    }
                    min={1}
                    max={10}
                  />
                </EuiFormRow>
              </EuiFlexItem>
              <EuiFlexItem>
                <EuiFormRow
                  label={i18n.translate('discover.vis.seriesPanel.interpolation', {
                    defaultMessage: 'Interpolation',
                  })}
                >
                  <EuiSelect
                    value={series.interpolate}
                    onChange={(e) =>
                      updateSeriesParam(index, {
                        interpolate: e.target.value as
                          | 'linear'
                          | 'cardinal'
                          | 'step-after'
                          | 'step-before'
                          | 'basis'
                          | 'bundle'
                          | 'monotone',
                      })
                    }
                    options={[
                      { value: 'linear', text: 'Linear' },
                      { value: 'cardinal', text: 'Cardinal' },
                      { value: 'step-after', text: 'Step after' },
                      { value: 'step-before', text: 'Step before' },
                      { value: 'basis', text: 'Basis' },
                      { value: 'bundle', text: 'Bundle' },
                      { value: 'monotone', text: 'Monotone' },
                    ]}
                  />
                </EuiFormRow>
              </EuiFlexItem>
            </EuiFlexGroup>

            <EuiSpacer size="s" />

            <EuiFlexGroup>
              <EuiFlexItem>
                <EuiFormRow>
                  <EuiSwitch
                    label={i18n.translate('discover.vis.seriesPanel.showPoints', {
                      defaultMessage: 'Show points',
                    })}
                    checked={series.showCircles}
                    onChange={(e) => updateSeriesParam(index, { showCircles: e.target.checked })}
                  />
                </EuiFormRow>
              </EuiFlexItem>
              <EuiFlexItem>
                <EuiFormRow>
                  <EuiSwitch
                    label={i18n.translate('discover.vis.seriesPanel.connectNulls', {
                      defaultMessage: 'Connect null values',
                    })}
                    checked={series.drawLinesBetweenPoints}
                    onChange={(e) =>
                      updateSeriesParam(index, { drawLinesBetweenPoints: e.target.checked })
                    }
                  />
                </EuiFormRow>
              </EuiFlexItem>
            </EuiFlexGroup>
          </>
        )}

        <EuiSpacer size="s" />

        {/* Show/Hide Series */}
        <EuiFormRow>
          <EuiSwitch
            label={i18n.translate('discover.vis.seriesPanel.showSeries', {
              defaultMessage: 'Show series',
            })}
            checked={series.show}
            onChange={(e) => updateSeriesParam(index, { show: e.target.checked })}
          />
        </EuiFormRow>
      </EuiAccordion>
    );
  };

  return (
    <EuiPanel paddingSize="s">
      <EuiFlexGroup alignItems="center" justifyContent="spaceBetween">
        <EuiFlexItem grow={false}>
          <EuiTitle size="xs">
            <h3>
              {i18n.translate('discover.vis.seriesPanel.title', {
                defaultMessage: 'Series',
              })}
            </h3>
          </EuiTitle>
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          <EuiButton size="s" iconType="plus" onClick={addSeries} data-test-subj="addSeriesButton">
            {i18n.translate('discover.vis.seriesPanel.addSeries', {
              defaultMessage: 'Add series',
            })}
          </EuiButton>
        </EuiFlexItem>
      </EuiFlexGroup>

      <EuiSpacer size="m" />

      {/* Series Configurations */}
      {seriesParams.map((series, index) => renderSeriesConfiguration(series, index))}

      <EuiHorizontalRule />

      {/* Value Axes Management */}
      <EuiFlexGroup alignItems="center" justifyContent="spaceBetween">
        <EuiFlexItem grow={false}>
          <EuiTitle size="xs">
            <h4>
              {i18n.translate('discover.vis.seriesPanel.valueAxes', {
                defaultMessage: 'Value Axes',
              })}
            </h4>
          </EuiTitle>
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          <EuiButton
            size="s"
            iconType="plus"
            onClick={addValueAxis}
            data-test-subj="addValueAxisButton"
          >
            {i18n.translate('discover.vis.seriesPanel.addValueAxis', {
              defaultMessage: 'Add Y-axis',
            })}
          </EuiButton>
        </EuiFlexItem>
      </EuiFlexGroup>

      <EuiSpacer size="s" />

      {/* Value Axes List */}
      {valueAxes.map((axis, index) => (
        <EuiFlexGroup key={axis.id} alignItems="center" gutterSize="s">
          <EuiFlexItem>
            <EuiFormRow>
              <EuiFieldText
                value={axis.name}
                onChange={(e) => {
                  const updatedAxes = [...valueAxes];
                  updatedAxes[index] = { ...axis, name: e.target.value };
                  onValueAxesChange(updatedAxes);
                }}
                placeholder={axis.id}
              />
            </EuiFormRow>
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <EuiSelect
              value={axis.position}
              onChange={(e) => {
                const updatedAxes = [...valueAxes];
                updatedAxes[index] = {
                  ...axis,
                  position: e.target.value as 'left' | 'right',
                };
                onValueAxesChange(updatedAxes);
              }}
              options={[
                { value: 'left', text: 'Left' },
                { value: 'right', text: 'Right' },
              ]}
            />
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            {valueAxes.length > 1 && (
              <EuiButtonIcon
                iconType="trash"
                color="danger"
                size="s"
                onClick={() => removeValueAxis(axis.id)}
                aria-label={i18n.translate('discover.vis.seriesPanel.removeValueAxis', {
                  defaultMessage: 'Remove value axis',
                })}
              />
            )}
          </EuiFlexItem>
        </EuiFlexGroup>
      ))}
    </EuiPanel>
  );
};
