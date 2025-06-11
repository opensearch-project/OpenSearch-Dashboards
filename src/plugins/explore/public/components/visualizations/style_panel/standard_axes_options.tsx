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
  EuiSelect,
  EuiSwitch,
  EuiFlexGroup,
  EuiFlexItem,
  EuiFieldNumber,
  EuiFieldText,
  EuiButton,
} from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { StandardAxes } from '../types';
import { useDebouncedValue, useDebouncedNumericValue } from '../utils/use_debounced_value';

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
      <EuiFieldNumber value={localValue} onChange={(e) => handleChange(e.target.value)} />
    </EuiFormRow>
  );
};

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
        const isYAxis = axis.axisRole === 'y';
        return (
          <div key={axis.id}>
            <EuiTitle size="xs">
              <h4>
                {i18n.translate('explore.vis.standardAxes.axisRoleLabel', {
                  defaultMessage: isYAxis ? 'Y-Axis' : 'X-Axis',
                })}
              </h4>
            </EuiTitle>

            <EuiSpacer size="s" />

            {axis.field?.options && (
              <EuiFormRow
                label={i18n.translate('explore.vis.standardAxes.axisField', {
                  defaultMessage: 'Field',
                })}
              >
                <EuiSelect
                  value={axis.field.default.column}
                  onChange={(e) =>
                    // updateAxis(index, {
                    //   field: {
                    //     ...axis.field,
                    //     default: e.target.value as any,
                    //   },
                    // })
                    {
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
                    }
                  }
                  options={axis.field.options.map((option) => ({
                    value: option.column,
                    text: option.name,
                  }))}
                />
              </EuiFormRow>
            )}
            <EuiFlexGroup>
              <EuiFlexItem>
                <DebouncedAxisTitle
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
                        position: e.target.value as any, // safely cast based on role
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

            <EuiSpacer size="s" />

            <EuiFlexGroup>
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
            </EuiFlexGroup>
            {!disableGrid && (
              <EuiFlexGroup>
                <EuiFlexItem>
                  <EuiFormRow
                    label={i18n.translate('explore.vis.standardAxes.showAxisGrid', {
                      defaultMessage: 'Show grid',
                    })}
                  >
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
                  </EuiFormRow>
                </EuiFlexItem>
              </EuiFlexGroup>
            )}

            {axis.show && (
              <>
                <EuiSpacer size="s" />
                <EuiFlexGroup>
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
                </EuiFlexGroup>

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
                  </>
                )}
              </>
            )}
            <EuiSpacer size="s" />
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
    <EuiPanel
      paddingSize="s"
      style={{
        maxHeight: '400px',
        overflowY: 'auto',
      }}
    >
      <EuiFlexGroup direction="column" gutterSize="xs">
        <EuiFlexItem grow={false}>
          <EuiTitle size="xs">
            <h3>
              {i18n.translate('explore.vis.standardAxes.title', {
                defaultMessage: 'Axes',
              })}
            </h3>
          </EuiTitle>
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          <EuiButton onClick={() => onChangeSwitchAxes(standardAxes)}>Switch X and Y</EuiButton>
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
