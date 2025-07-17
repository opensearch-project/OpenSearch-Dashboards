/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import {
  EuiSpacer,
  EuiFormRow,
  EuiSelect,
  EuiSwitch,
  EuiFlexGroup,
  EuiFlexItem,
  EuiFieldNumber,
  EuiFieldText,
  EuiText,
  EuiSplitPanel,
  EuiButtonGroup,
} from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { CategoryAxis, VisColumn, ValueAxis, Positions } from '../../types';
import { useDebouncedValue, useDebouncedNumericValue } from '../../utils/use_debounced_value';
import { StyleAccordion } from '../style_accordion';

interface AxesOptionsProps {
  categoryAxes: CategoryAxis[];
  valueAxes: ValueAxis[];
  onCategoryAxesChange: (categoryAxes: CategoryAxis[]) => void;
  onValueAxesChange: (valueAxes: ValueAxis[]) => void;
  numericalColumns: VisColumn[];
  categoricalColumns: VisColumn[];
  dateColumns: VisColumn[];
}

const getDefaultCategoryAxisTitle = (
  dateColumns?: VisColumn[],
  categoricalColumns?: VisColumn[]
) => {
  if (dateColumns?.length) {
    return dateColumns[0].name;
  }
  if (categoricalColumns?.length) {
    return categoricalColumns[0].name;
  }
  return 'Category';
};

const getDefaultValueAxisTitle = (numericalColumns?: VisColumn[], index: number = 0) => {
  if (numericalColumns && numericalColumns.length > index) {
    return numericalColumns[index].name;
  }
  return `Metric ${index + 1}`;
};

// Component for a single axis title input with debouncing
const DebouncedAxisTitle: React.FC<{
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
  label: string;
}> = ({ value, placeholder, onChange, label }) => {
  const [localValue, handleChange] = useDebouncedValue(value, onChange, 500);

  return (
    <EuiFormRow label={label}>
      <EuiFieldText
        compressed
        value={localValue}
        onChange={(e) => handleChange(e.target.value)}
        placeholder={placeholder}
      />
    </EuiFormRow>
  );
};

// Component for a truncate field with debouncing
const DebouncedTruncateField: React.FC<{
  value: number;
  onChange: (value: number) => void;
  label: string;
}> = ({ value, onChange, label }) => {
  const [localValue, handleChange] = useDebouncedNumericValue(value, onChange, {
    delay: 500,
    min: 1,
    defaultValue: 100,
  });

  return (
    <EuiFormRow label={label}>
      <EuiFieldNumber
        compressed
        value={localValue}
        onChange={(e) => handleChange(e.target.value)}
      />
    </EuiFormRow>
  );
};

export const AxesOptions: React.FC<AxesOptionsProps> = ({
  categoryAxes,
  valueAxes,
  onCategoryAxesChange,
  onValueAxesChange,
  numericalColumns,
  categoricalColumns,
  dateColumns,
}) => {
  const updateCategoryAxis = (index: number, updates: Partial<CategoryAxis>) => {
    const updatedAxes = [...categoryAxes];
    updatedAxes[index] = {
      ...updatedAxes[index],
      ...updates,
    };
    onCategoryAxesChange(updatedAxes);
  };

  const updateValueAxis = (index: number, updates: Partial<ValueAxis>) => {
    const updatedAxes = [...valueAxes];
    updatedAxes[index] = {
      ...updatedAxes[index],
      ...updates,
    };
    onValueAxesChange(updatedAxes);
  };

  const getCategoryAxisDisplayTitle = (axis: CategoryAxis) => {
    if (axis.title?.text && axis.title.text.trim() !== '') {
      return axis.title.text;
    }
    return getDefaultCategoryAxisTitle(dateColumns, categoricalColumns);
  };

  const getValueAxisDisplayTitle = (axis: ValueAxis, index: number) => {
    if (axis.title?.text && axis.title.text.trim() !== '') {
      return axis.title.text;
    }
    return getDefaultValueAxisTitle(numericalColumns, index);
  };

  // Determine if we're in Rule 2 scenario (2 metrics, 1 date, 0 categories)
  const isRule2 =
    numericalColumns.length === 2 && dateColumns.length === 1 && categoricalColumns.length === 0;

  // Ensure we have exactly 2 value axes for Rule 2 with correct positions
  useEffect(() => {
    if (isRule2) {
      const needsUpdate =
        valueAxes.length !== 2 ||
        valueAxes[0]?.position !== Positions.LEFT ||
        valueAxes[1]?.position !== Positions.RIGHT;

      if (needsUpdate) {
        const newValueAxes: ValueAxis[] = [
          {
            ...(valueAxes[0] || {}),
            id: valueAxes[0]?.id || 'ValueAxis-1',
            name: valueAxes[0]?.name || 'LeftAxis-1',
            type: 'value',
            position: Positions.LEFT, // Force left position for first axis
            show: valueAxes[0]?.show ?? true,
            title: valueAxes[0]?.title || { text: '' },
            labels: valueAxes[0]?.labels || { show: true, rotate: 0, truncate: 100, filter: false },
          },
          {
            ...(valueAxes[1] || {}),
            id: valueAxes[1]?.id || 'ValueAxis-2',
            name: valueAxes[1]?.name || 'RightAxis-1',
            type: 'value',
            position: Positions.RIGHT, // Force right position for second axis
            show: valueAxes[1]?.show ?? true,
            title: valueAxes[1]?.title || { text: '' },
            labels: valueAxes[1]?.labels || { show: true, rotate: 0, truncate: 100, filter: false },
          },
        ];
        onValueAxesChange(newValueAxes);
      }
    }
  }, [isRule2, valueAxes, onValueAxesChange]);

  if (!categoryAxes || !valueAxes || !onCategoryAxesChange || !onValueAxesChange) {
    return null;
  }

  return (
    <StyleAccordion
      id="axesSection"
      accordionLabel={i18n.translate('explore.stylePanel.tabs.axes', {
        defaultMessage: 'Axes',
      })}
      initialIsOpen={true}
    >
      {/* Category Axes */}
      {categoryAxes.map((axis, index) => (
        <EuiSplitPanel.Inner
          paddingSize="s"
          key={axis.id}
          color="subdued"
          data-test-subj="categoryAxesPanel"
        >
          <EuiText size="s" style={{ fontWeight: 600 }}>
            {i18n.translate('explore.vis.gridOptions.categoryAxis', {
              defaultMessage: 'X-Axis',
            })}
          </EuiText>
          <EuiSpacer size="m" />
          <EuiFormRow>
            <EuiSwitch
              compressed
              label={i18n.translate('explore.vis.gridOptions.showXAxis', {
                defaultMessage: 'Show Axis',
              })}
              data-test-subj="showXAxisSwitch"
              checked={axis.show}
              onChange={(e) => updateCategoryAxis(index, { show: e.target.checked })}
            />
          </EuiFormRow>
          {axis.show && (
            <>
              <DebouncedAxisTitle
                value={getCategoryAxisDisplayTitle(axis)}
                placeholder={getDefaultCategoryAxisTitle(dateColumns, categoricalColumns)}
                onChange={(text) =>
                  updateCategoryAxis(index, {
                    title: { ...axis.title, text },
                  })
                }
                label={i18n.translate('explore.vis.gridOptions.axisTitle', {
                  defaultMessage: 'Title',
                })}
              />
              <EuiFormRow
                label={i18n.translate('explore.vis.gridOptions.axisPosition', {
                  defaultMessage: 'Position',
                })}
              >
                <EuiButtonGroup
                  name={`categoryAxisPosition-${index}`}
                  legend="Select axis position"
                  options={[
                    { id: Positions.BOTTOM, label: 'Bottom' },
                    { id: Positions.TOP, label: 'Top' },
                  ]}
                  idSelected={axis.position}
                  onChange={(id) =>
                    updateCategoryAxis(index, {
                      position: id as Positions.BOTTOM | Positions.TOP,
                    })
                  }
                  buttonSize="compressed"
                  isFullWidth
                />
              </EuiFormRow>
              <EuiFormRow>
                <EuiSwitch
                  compressed
                  checked={axis.grid?.showLines ?? false}
                  onChange={(e) =>
                    updateCategoryAxis(index, {
                      grid: { ...axis.grid, showLines: e.target.checked },
                    })
                  }
                  label={i18n.translate('explore.vis.gridOptions.showAxisGrid.switchLabel', {
                    defaultMessage: 'Show grid lines',
                  })}
                />
              </EuiFormRow>
              <EuiFormRow>
                <EuiSwitch
                  compressed
                  label={i18n.translate('explore.vis.gridOptions.showLabels', {
                    defaultMessage: 'Show labels',
                  })}
                  checked={axis.labels.show}
                  onChange={(e) =>
                    updateCategoryAxis(index, {
                      labels: { ...axis.labels, show: e.target.checked },
                    })
                  }
                />
              </EuiFormRow>
              {axis.labels.show && (
                <>
                  <EuiSpacer size="m" />
                  <EuiFlexGroup>
                    <EuiFlexItem>
                      <EuiFormRow
                        label={i18n.translate('explore.vis.gridOptions.labelAlignment', {
                          defaultMessage: 'Alignment',
                        })}
                      >
                        <EuiSelect
                          compressed
                          data-test-subj="xLinesAlignment"
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

                            updateCategoryAxis(index, {
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
                          updateCategoryAxis(index, {
                            labels: {
                              ...axis.labels,
                              truncate: truncateValue,
                            },
                          });
                        }}
                        label={i18n.translate('explore.vis.gridOptions.labelTruncate', {
                          defaultMessage: 'Truncate after',
                        })}
                      />
                    </EuiFlexItem>
                  </EuiFlexGroup>
                </>
              )}
            </>
          )}
        </EuiSplitPanel.Inner>
      ))}

      {/* Value Axes Configuration */}
      {isRule2
        ? // Special rendering for Rule 2: Show both axes with clear labels
          valueAxes.slice(0, 2).map((axis, index) => (
            <>
              <EuiSplitPanel.Inner
                paddingSize="s"
                key={axis.id}
                color="subdued"
                data-test-subj="twoValueAxesPanel"
              >
                <EuiText size="s" style={{ fontWeight: 600 }}>
                  {index === 0
                    ? i18n.translate('explore.vis.gridOptions.leftYAxis', {
                        defaultMessage: 'Left Y-Axis (Bar Chart)',
                      })
                    : i18n.translate('explore.vis.gridOptions.rightYAxis', {
                        defaultMessage: 'Right Y-Axis (Line Chart)',
                      })}
                </EuiText>
                <EuiText size="xs" color="subdued">
                  {index === 0
                    ? `Controls the ${numericalColumns[0]?.name || 'first metric'} (bar chart)`
                    : `Controls the ${numericalColumns[1]?.name || 'second metric'} (line chart)`}
                </EuiText>

                <EuiSpacer size="m" />
                <EuiFormRow>
                  <EuiSwitch
                    data-test-subj="showYAxisSwitch"
                    compressed
                    label={i18n.translate('explore.vis.gridOptions.showYAxis', {
                      defaultMessage: 'Show Axis',
                    })}
                    checked={axis.show}
                    onChange={(e) => updateValueAxis(index, { show: e.target.checked })}
                  />
                </EuiFormRow>

                {axis.show && (
                  <>
                    <DebouncedAxisTitle
                      value={getValueAxisDisplayTitle(axis, index)}
                      placeholder={getDefaultValueAxisTitle(numericalColumns, index)}
                      onChange={(text) =>
                        updateValueAxis(index, {
                          title: { ...axis.title, text },
                        })
                      }
                      label={i18n.translate('explore.vis.gridOptions.axisTitle', {
                        defaultMessage: 'Title',
                      })}
                    />

                    <EuiFormRow
                      label={i18n.translate('explore.vis.gridOptions.axisPosition', {
                        defaultMessage: 'Position',
                      })}
                    >
                      <EuiButtonGroup
                        name={`valueAxisPosition-${index}`}
                        legend="Select axis position"
                        options={[
                          { id: Positions.LEFT, label: 'Left' },
                          { id: Positions.RIGHT, label: 'Right' },
                        ]}
                        idSelected={axis.position}
                        onChange={(id) =>
                          updateValueAxis(index, {
                            position: id as Positions.LEFT | Positions.RIGHT,
                          })
                        }
                        buttonSize="compressed"
                        isFullWidth
                        isDisabled={isRule2} // Position is fixed in Rule 2
                      />
                    </EuiFormRow>

                    <EuiFormRow>
                      <EuiSwitch
                        compressed
                        checked={axis.grid?.showLines ?? false}
                        onChange={(e) =>
                          updateValueAxis(index, {
                            grid: { ...axis.grid, showLines: e.target.checked },
                          })
                        }
                        label={i18n.translate('explore.vis.gridOptions.showAxisGrid.switchLabel', {
                          defaultMessage: 'Show grid lines',
                        })}
                      />
                    </EuiFormRow>

                    <EuiFormRow>
                      <EuiSwitch
                        compressed
                        label={i18n.translate('explore.vis.gridOptions.showLabels', {
                          defaultMessage: 'Show labels',
                        })}
                        checked={axis.labels.show}
                        onChange={(e) =>
                          updateValueAxis(index, {
                            labels: { ...axis.labels, show: e.target.checked },
                          })
                        }
                      />
                    </EuiFormRow>

                    {axis.labels.show && (
                      <>
                        <EuiSpacer size="m" />
                        <EuiFlexGroup>
                          <EuiFlexItem>
                            <EuiFormRow
                              label={i18n.translate('explore.vis.gridOptions.labelAlignment', {
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

                                  updateValueAxis(index, {
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
                                updateValueAxis(index, {
                                  labels: {
                                    ...axis.labels,
                                    truncate: truncateValue,
                                  },
                                });
                              }}
                              label={i18n.translate('explore.vis.gridOptions.labelTruncate', {
                                defaultMessage: 'Truncate after',
                              })}
                            />
                          </EuiFlexItem>
                        </EuiFlexGroup>
                      </>
                    )}
                  </>
                )}
              </EuiSplitPanel.Inner>
            </>
          ))
        : // Standard rendering for other rules
          valueAxes.map((axis, index) => (
            <>
              <EuiSplitPanel.Inner
                paddingSize="s"
                key={axis.id}
                color="subdued"
                data-test-subj="ValueAxisPanel"
              >
                <EuiText size="s" style={{ fontWeight: 600 }}>
                  {i18n.translate('explore.vis.gridOptions.valueAxis', {
                    defaultMessage: 'Y-Axis',
                  })}
                </EuiText>
                <EuiSpacer size="m" />
                <EuiFormRow>
                  <EuiSwitch
                    compressed
                    label={i18n.translate('explore.vis.gridOptions.showYAxis', {
                      defaultMessage: 'Show Axis',
                    })}
                    data-test-subj="showOnlyOneYAxisSwitch"
                    checked={axis.show}
                    onChange={(e) => updateValueAxis(index, { show: e.target.checked })}
                  />
                </EuiFormRow>
                {axis.show && (
                  <>
                    <DebouncedAxisTitle
                      value={getValueAxisDisplayTitle(axis, index)}
                      placeholder={getDefaultValueAxisTitle(numericalColumns, index)}
                      onChange={(text) =>
                        updateValueAxis(index, {
                          title: { ...axis.title, text },
                        })
                      }
                      label={i18n.translate('explore.vis.gridOptions.axisTitle', {
                        defaultMessage: 'Title',
                      })}
                    />

                    <EuiFormRow
                      label={i18n.translate('explore.vis.gridOptions.axisPosition', {
                        defaultMessage: 'Position',
                      })}
                    >
                      <EuiButtonGroup
                        name={`valueAxisPosition-${index}`}
                        legend="Select axis position"
                        options={[
                          { id: Positions.LEFT, label: 'Left' },
                          { id: Positions.RIGHT, label: 'Right' },
                        ]}
                        idSelected={axis.position}
                        onChange={(id) =>
                          updateValueAxis(index, {
                            position: id as Positions.LEFT | Positions.RIGHT,
                          })
                        }
                        buttonSize="compressed"
                        isFullWidth
                      />
                    </EuiFormRow>

                    <EuiFormRow>
                      <EuiSwitch
                        compressed
                        checked={axis.grid?.showLines ?? false}
                        onChange={(e) =>
                          updateValueAxis(index, {
                            grid: { ...axis.grid, showLines: e.target.checked },
                          })
                        }
                        label={i18n.translate('explore.vis.gridOptions.showAxisGrid.switchLabel', {
                          defaultMessage: 'Show grid lines',
                        })}
                      />
                    </EuiFormRow>

                    <EuiFormRow>
                      <EuiSwitch
                        compressed
                        label={i18n.translate('explore.vis.gridOptions.showLabels', {
                          defaultMessage: 'Show labels',
                        })}
                        checked={axis.labels.show}
                        onChange={(e) =>
                          updateValueAxis(index, {
                            labels: { ...axis.labels, show: e.target.checked },
                          })
                        }
                      />
                    </EuiFormRow>

                    {axis.labels.show && (
                      <>
                        <EuiSpacer size="m" />
                        <EuiFlexGroup>
                          <EuiFlexItem>
                            <EuiFormRow
                              label={i18n.translate('explore.vis.gridOptions.labelAlignment', {
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

                                  updateValueAxis(index, {
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
                                updateValueAxis(index, {
                                  labels: {
                                    ...axis.labels,
                                    truncate: truncateValue,
                                  },
                                });
                              }}
                              label={i18n.translate('explore.vis.gridOptions.labelTruncate', {
                                defaultMessage: 'Truncate after',
                              })}
                            />
                          </EuiFlexItem>
                        </EuiFlexGroup>
                      </>
                    )}
                  </>
                )}
              </EuiSplitPanel.Inner>
            </>
          ))}
    </StyleAccordion>
  );
};
