/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useCallback } from 'react';
import {
  EuiTitle,
  EuiFormRow,
  EuiFieldText,
  EuiFlexGroup,
  EuiFlexItem,
  EuiSpacer,
  EuiCallOut,
  EuiSwitch,
  EuiButtonIcon,
  EuiPanel,
  EuiHorizontalRule,
  EuiSuperSelect,
  EuiSmallButton,
  EuiSmallButtonEmpty,
  EuiComboBox,
  EuiText,
} from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { VariableType, Variable, VariableSortOrder } from '../../../variables/types';
import { VariableQueryPanel } from './query_panel/variable_query_panel';
import { IVariableInterpolationService } from '../../../variables/variable_interpolation_service';

export interface VariableEditorFlyoutProps {
  onClose: () => void;
  onSave: (variable: Omit<Variable, 'id' | 'current'>) => Promise<void>;
  existingVariable?: Variable;
  existingVariableNames?: string[];
  interpolationService?: IVariableInterpolationService;
}

const variableTypeOptions = [
  {
    value: VariableType.Query,
    inputDisplay: i18n.translate('dashboard.variableEditor.typeQuery', { defaultMessage: 'Query' }),
    dropdownDisplay: (
      <>
        <strong>
          {i18n.translate('dashboard.variableEditor.typeQuery', { defaultMessage: 'Query' })}
        </strong>
        <EuiText size="s" color="subdued">
          <p className="ouiTextColor--subdued">
            {i18n.translate('dashboard.variableEditor.typeQuery.description', {
              defaultMessage: 'Options are fetched from a query',
            })}
          </p>
        </EuiText>
      </>
    ),
  },
  {
    value: VariableType.Custom,
    inputDisplay: i18n.translate('dashboard.variableEditor.typeCustom', {
      defaultMessage: 'Custom',
    }),
    dropdownDisplay: (
      <>
        <strong>
          {i18n.translate('dashboard.variableEditor.typeCustom', {
            defaultMessage: 'Custom',
          })}
        </strong>
        <EuiText size="s" color="subdued">
          <p className="ouiTextColor--subdued">
            {i18n.translate('dashboard.variableEditor.typeCustom.description', {
              defaultMessage: 'Options are static and defined manually',
            })}
          </p>
        </EuiText>
      </>
    ),
  },
];

export const VariableEditorFlyout: React.FC<VariableEditorFlyoutProps> = ({
  onClose,
  onSave,
  existingVariable,
  existingVariableNames = [],
  interpolationService,
}) => {
  const [name, setName] = useState(existingVariable?.name || '');
  const [label, setLabel] = useState(existingVariable?.label || '');
  const [description, setDescription] = useState(existingVariable?.description || '');
  const [type, setType] = useState<VariableType>(existingVariable?.type || VariableType.Query);
  const [query, setQuery] = useState(
    existingVariable?.type === VariableType.Query ? existingVariable.query : ''
  );
  const [language, setLanguage] = useState(
    existingVariable?.type === VariableType.Query ? existingVariable.language : 'PPL'
  );
  const [dataset, setDataset] = useState<any>(
    existingVariable?.type === VariableType.Query ? existingVariable.dataset ?? null : null
  );
  const [customValues, setCustomValues] = useState<Array<{ label: string }>>(
    existingVariable?.type === VariableType.Custom
      ? (existingVariable.customOptions ?? []).map((v: string) => ({ label: v }))
      : []
  );
  const [multi, setMulti] = useState(existingVariable?.multi || false);
  const [includeAll, setIncludeAll] = useState(existingVariable?.includeAll || false);
  const [sort, setSort] = useState<VariableSortOrder>(
    existingVariable?.sort || VariableSortOrder.Disabled
  );
  const [regex, setRegex] = useState(
    existingVariable?.type === VariableType.Query ? existingVariable.regex ?? '' : ''
  );

  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEditing = Boolean(existingVariable);

  // When language changes between PPL and PROMQL, clear the dataset since
  // dataset types are incompatible (INDEX/INDEX_PATTERN vs PROMETHEUS)
  const handleLanguageChange = useCallback(
    (newLanguage: string) => {
      const wasPromQL = language.toUpperCase() === 'PROMQL';
      const isPromQL = newLanguage.toUpperCase() === 'PROMQL';
      if (wasPromQL !== isPromQL) {
        setDataset(null);
        setQuery('');
      }
      setLanguage(newLanguage);
    },
    [language]
  );

  const validateForm = useCallback(() => {
    if (!name.trim()) {
      setError(
        i18n.translate('dashboard.variableEditor.nameRequired', {
          defaultMessage: 'Variable name is required',
        })
      );
      return false;
    }

    if (name.trim().length > 30) {
      setError(
        i18n.translate('dashboard.variableEditor.nameTooLong', {
          defaultMessage: 'Variable name must not exceed 30 characters',
        })
      );
      return false;
    }

    if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(name)) {
      setError(
        i18n.translate('dashboard.variableEditor.nameInvalid', {
          defaultMessage:
            'Variable name must start with a letter or underscore and contain only letters, numbers, and underscores',
        })
      );
      return false;
    }

    // Check for duplicate variable names (skip the current variable when editing)
    const trimmedName = name.trim();
    const isDuplicate = existingVariableNames.some(
      (existingName) =>
        existingName === trimmedName && (!existingVariable || existingVariable.name !== trimmedName)
    );
    if (isDuplicate) {
      setError(
        i18n.translate('dashboard.variableEditor.nameDuplicate', {
          defaultMessage: 'A variable with the name "{name}" already exists',
          values: { name: trimmedName },
        })
      );
      return false;
    }

    if (label.trim().length > 40) {
      setError(
        i18n.translate('dashboard.variableEditor.labelTooLong', {
          defaultMessage: 'Variable label must not exceed 40 characters',
        })
      );
      return false;
    }

    if (type === VariableType.Query && !query.trim()) {
      setError(
        i18n.translate('dashboard.variableEditor.queryRequired', {
          defaultMessage: 'Query is required for Query type variables',
        })
      );
      return false;
    }

    if (type === VariableType.Custom && customValues.length === 0) {
      setError(
        i18n.translate('dashboard.variableEditor.customValuesRequired', {
          defaultMessage: 'Custom values are required for Custom type variables',
        })
      );
      return false;
    }

    setError(null);
    return true;
  }, [name, label, type, query, customValues, existingVariableNames, existingVariable]);

  const handleSave = useCallback(async () => {
    if (!validateForm()) return;

    setIsSaving(true);
    const variableConfig: Omit<Variable, 'id' | 'current'> = {
      name: name.trim(),
      label: label.trim() || undefined,
      description: description.trim() || undefined,
      type,
      multi,
      includeAll,
      sort,
    };

    if (type === VariableType.Query) {
      Object.assign(variableConfig, {
        query: query.trim(),
        language,
        dataset: dataset || undefined,
        regex: regex.trim() || undefined,
      });
    } else if (type === VariableType.Custom) {
      Object.assign(variableConfig, {
        customOptions: customValues.map((v) => v.label),
      });
    }

    await onSave(variableConfig);
    setIsSaving(false);
  }, [
    name,
    label,
    type,
    query,
    description,
    language,
    dataset,
    customValues,
    multi,
    includeAll,
    sort,
    regex,
    onSave,
    validateForm,
  ]);

  return (
    <EuiPanel
      data-test-subj="variableEditorPanel"
      paddingSize="m"
      style={{ width: '500px', marginTop: '8px' }}
    >
      <EuiFlexGroup direction="column">
        <EuiFlexItem>
          <EuiFlexGroup alignItems="center" justifyContent="spaceBetween" responsive={false}>
            <EuiFlexItem>
              <EuiTitle size="s">
                <h2>
                  {isEditing
                    ? i18n.translate('dashboard.variableEditor.editTitle', {
                        defaultMessage: 'Edit variable',
                      })
                    : i18n.translate('dashboard.variableEditor.addTitle', {
                        defaultMessage: 'Add variable',
                      })}
                </h2>
              </EuiTitle>
            </EuiFlexItem>
            <EuiFlexItem grow={false}>
              <EuiButtonIcon
                iconType="cross"
                aria-label={i18n.translate('dashboard.variableEditor.close', {
                  defaultMessage: 'Close',
                })}
                onClick={onClose}
                display="empty"
                size="s"
              />
            </EuiFlexItem>
          </EuiFlexGroup>
        </EuiFlexItem>
        <EuiHorizontalRule margin="none" />
        <EuiFlexItem>
          {error && (
            <>
              <EuiCallOut
                title={i18n.translate('dashboard.variableEditor.errorTitle', {
                  defaultMessage: 'Error',
                })}
                color="danger"
                iconType="alert"
              >
                {error}
              </EuiCallOut>
              <EuiSpacer size="s" />
            </>
          )}

          <EuiFormRow
            label={i18n.translate('dashboard.variableEditor.nameLabel', {
              defaultMessage: 'Name',
            })}
            helpText={i18n.translate('dashboard.variableEditor.nameHelp', {
              defaultMessage: 'Use this name to reference the variable: $var or $\\{var\\}',
            })}
          >
            <EuiFieldText
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="service"
              maxLength={30}
              data-test-subj="variableEditorName"
              compressed
            />
          </EuiFormRow>

          <EuiFormRow
            label={i18n.translate('dashboard.variableEditor.labelLabel', {
              defaultMessage: 'Label',
            })}
            helpText={i18n.translate('dashboard.variableEditor.labelHelp', {
              defaultMessage: 'Optional display name',
            })}
          >
            <EuiFieldText
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Service"
              maxLength={40}
              data-test-subj="variableEditorLabel"
              compressed
            />
          </EuiFormRow>

          <EuiFormRow
            label={i18n.translate('dashboard.variableEditor.descriptionLabel', {
              defaultMessage: 'Description',
            })}
            helpText={i18n.translate('dashboard.variableEditor.descriptionHelp', {
              defaultMessage: 'Optional description for this variable',
            })}
          >
            <EuiFieldText
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Filter by service name"
              maxLength={100}
              data-test-subj="variableEditorDescription"
              compressed
            />
          </EuiFormRow>

          <EuiFormRow
            label={i18n.translate('dashboard.variableEditor.typeLabel', {
              defaultMessage: 'Type',
            })}
            helpText={i18n.translate('dashboard.variableEditor.typeHelp', {
              defaultMessage: 'Select a variable type',
            })}
          >
            <EuiSuperSelect
              options={variableTypeOptions}
              valueOfSelected={type}
              onChange={(t) => setType(t)}
              data-test-subj="variableEditorType"
              compressed
            />
          </EuiFormRow>
        </EuiFlexItem>

        <EuiHorizontalRule margin="none" />
        <EuiFlexItem>
          {type === VariableType.Query && (
            <VariableQueryPanel
              query={query}
              language={language}
              dataset={dataset}
              onQueryChange={setQuery}
              onLanguageChange={handleLanguageChange}
              onDatasetChange={setDataset}
              existingVariableNames={existingVariableNames}
              interpolationService={interpolationService}
              regex={regex}
              onRegexChange={setRegex}
            />
          )}

          {type === VariableType.Custom && (
            <EuiFormRow
              label={i18n.translate('dashboard.variableEditor.customOptionsLabel', {
                defaultMessage: 'Custom options',
              })}
              helpText={i18n.translate('dashboard.variableEditor.customOptionsHelp', {
                defaultMessage: 'Type a option and press Enter to add it',
              })}
            >
              <EuiComboBox
                selectedOptions={customValues}
                onChange={setCustomValues}
                onCreateOption={(value) => {
                  const trimmed = value.trim();
                  if (trimmed && !customValues.some((v) => v.label === trimmed)) {
                    setCustomValues([...customValues, { label: trimmed }]);
                  }
                }}
                placeholder="Type and press Enter..."
                data-test-subj="variableEditorCustomValues"
                compressed
              />
            </EuiFormRow>
          )}
        </EuiFlexItem>

        <EuiHorizontalRule margin="none" />

        <EuiFlexItem>
          <EuiFormRow
            label={i18n.translate('dashboard.variableEditor.sortLabel', {
              defaultMessage: 'Sort',
            })}
            helpText={i18n.translate('dashboard.variableEditor.sortLabelHelp', {
              defaultMessage: 'How options are sorted in the dropdown',
            })}
          >
            <EuiSuperSelect
              options={[
                {
                  value: VariableSortOrder.Disabled,
                  inputDisplay: i18n.translate('dashboard.variableEditor.sortDisabled', {
                    defaultMessage: 'Disabled',
                  }),
                },
                {
                  value: VariableSortOrder.AlphabeticalAsc,
                  inputDisplay: i18n.translate('dashboard.variableEditor.sortAlphaAsc', {
                    defaultMessage: 'Alphabetical (asc)',
                  }),
                },
                {
                  value: VariableSortOrder.AlphabeticalDesc,
                  inputDisplay: i18n.translate('dashboard.variableEditor.sortAlphaDesc', {
                    defaultMessage: 'Alphabetical (desc)',
                  }),
                },
                {
                  value: VariableSortOrder.NumericalAsc,
                  inputDisplay: i18n.translate('dashboard.variableEditor.sortNumAsc', {
                    defaultMessage: 'Numerical (asc)',
                  }),
                },
                {
                  value: VariableSortOrder.NumericalDesc,
                  inputDisplay: i18n.translate('dashboard.variableEditor.sortNumDesc', {
                    defaultMessage: 'Numerical (desc)',
                  }),
                },
              ]}
              valueOfSelected={sort}
              onChange={(v) => setSort(v)}
              data-test-subj="variableEditorSort"
              compressed
            />
          </EuiFormRow>
          <EuiFormRow>
            <EuiSwitch
              label={i18n.translate('dashboard.variableEditor.multiLabel', {
                defaultMessage: 'Allow multiple selections',
              })}
              checked={multi}
              onChange={(e) => {
                const checked = e.target.checked;
                setMulti(checked);
                if (!checked) {
                  setIncludeAll(false);
                }
              }}
              data-test-subj="variableEditorMulti"
              compressed
            />
          </EuiFormRow>

          {multi && (
            <EuiFormRow>
              <EuiSwitch
                label={i18n.translate('dashboard.variableEditor.includeAllLabel', {
                  defaultMessage: 'Include All option',
                })}
                checked={includeAll}
                onChange={(e) => setIncludeAll(e.target.checked)}
                data-test-subj="variableEditorIncludeAll"
                compressed
              />
            </EuiFormRow>
          )}
        </EuiFlexItem>
        <EuiHorizontalRule margin="none" />
        <EuiFlexItem grow={false}>
          <EuiFlexGroup justifyContent="spaceBetween">
            <EuiFlexItem grow={false}>
              <EuiSmallButtonEmpty onClick={onClose} data-test-subj="variableEditorCancel">
                {i18n.translate('dashboard.variableEditor.cancel', { defaultMessage: 'Cancel' })}
              </EuiSmallButtonEmpty>
            </EuiFlexItem>
            <EuiFlexItem grow={false}>
              <EuiSmallButton
                onClick={handleSave}
                isLoading={isSaving}
                data-test-subj="variableEditorSave"
              >
                {isEditing
                  ? i18n.translate('dashboard.variableEditor.update', {
                      defaultMessage: 'Update variable',
                    })
                  : i18n.translate('dashboard.variableEditor.add', {
                      defaultMessage: 'Add variable',
                    })}
              </EuiSmallButton>
            </EuiFlexItem>
          </EuiFlexGroup>
        </EuiFlexItem>
      </EuiFlexGroup>
    </EuiPanel>
  );
};
