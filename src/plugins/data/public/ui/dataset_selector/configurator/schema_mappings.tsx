/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { EuiAccordion, EuiFormRow, EuiSelect, EuiSpacer, EuiText, EuiPanel } from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { FormattedMessage } from '@osd/i18n/react';
import React, { useState } from 'react';
import { DatasetField } from '../../../../common';
import { SchemaConfig } from './schema_config';

import './configurator_v2.scss';

export interface SchemaMappingsProps {
  /** Available fields from the dataset */
  availableFields: DatasetField[];
  /** Current schema mappings */
  schemaMappings: Record<string, Record<string, string>>;
  /** Callback when schema mappings change */
  onChange: (newMappings: Record<string, Record<string, string>>) => void;
  /** Filtered schemas to render */
  schemas: Array<[string, SchemaConfig]>;
}

/**
 * Component for configuring schema to field mappings.
 * Renders the provided schemas and their attributes.
 */
export const SchemaMappings: React.FC<SchemaMappingsProps> = ({
  availableFields,
  schemaMappings,
  onChange,
  schemas,
}) => {
  // Auto-open accordion if there are existing schema mappings
  const hasExistingMappings = Object.keys(schemaMappings).length > 0;
  const [isOpen, setIsOpen] = useState(hasExistingMappings);
  const handleFieldChange = (schemaKey: string, attributeKey: string, fieldName: string) => {
    const newMappings = { ...schemaMappings };

    // Initialize schema object if it doesn't exist
    if (!newMappings[schemaKey]) {
      newMappings[schemaKey] = {};
    }

    // Update the attribute mapping
    if (fieldName === '') {
      // Remove the attribute if empty value selected
      delete newMappings[schemaKey][attributeKey];
      // Clean up empty schema objects
      if (Object.keys(newMappings[schemaKey]).length === 0) {
        delete newMappings[schemaKey];
      }
    } else {
      newMappings[schemaKey][attributeKey] = fieldName;
    }

    onChange(newMappings);
  };

  return (
    <>
      <EuiAccordion
        id="schemaMappingsAccordion"
        buttonContent={
          <EuiText size="s">
            <strong>
              <FormattedMessage
                id="data.explorer.datasetSelector.advancedSelector.configurator.schemaMappingsTitle"
                defaultMessage="Schema Mappings {optionalSuffix}"
                values={{
                  optionalSuffix: (
                    <span className="datasetConfigurator-optionalSuffix">– optional</span>
                  ),
                }}
              />
            </strong>
          </EuiText>
        }
        forceState={isOpen ? 'open' : 'closed'}
        onToggle={() => setIsOpen(!isOpen)}
        data-test-subj="schemaMappingsAccordion"
      >
        <EuiPanel paddingSize="s" hasShadow={false} hasBorder={false}>
          <EuiText size="xs" color="subdued">
            <p>
              <FormattedMessage
                id="data.explorer.datasetSelector.advancedSelector.configurator.schemaMappingsDescription"
                defaultMessage="Map predefined schema attributes to actual fields in your dataset."
              />
            </p>
          </EuiText>
          <EuiSpacer size="s" />

          {schemas.map(([schemaKey, schemaConfig], index) => {
            return (
              <div key={schemaKey}>
                {index > 0 && <EuiSpacer size="s" />}
                <EuiPanel paddingSize="s" hasShadow={false} color="subdued">
                  <EuiText size="s">
                    <strong>{schemaConfig.displayName}</strong>
                  </EuiText>
                  {schemaConfig.description && (
                    <>
                      <EuiSpacer size="xs" />
                      <EuiText size="xs" color="subdued">
                        <p>{schemaConfig.description}</p>
                      </EuiText>
                    </>
                  )}
                  <EuiSpacer size="s" />

                  {Object.entries(schemaConfig.attributes).map(
                    ([attributeKey, attributeConfig]) => {
                      const currentValue = schemaMappings[schemaKey]?.[attributeKey] || '';

                      // Filter available fields by attribute type if specified
                      const filteredFields = attributeConfig.type
                        ? availableFields.filter((field) => field.type === attributeConfig.type)
                        : availableFields;

                      return (
                        <EuiFormRow
                          key={`${schemaKey}.${attributeKey}`}
                          label={attributeConfig.displayName}
                          helpText={attributeConfig.description}
                          display="columnCompressed"
                          fullWidth
                        >
                          <EuiSelect
                            options={[
                              {
                                text: i18n.translate(
                                  'data.explorer.datasetSelector.advancedSelector.configurator.selectFieldPlaceholder',
                                  { defaultMessage: '-- Select a field --' }
                                ),
                                value: '',
                              },
                              ...filteredFields.map((field) => ({
                                text: field.displayName || field.name,
                                value: field.name,
                              })),
                            ]}
                            value={currentValue}
                            onChange={(e) =>
                              handleFieldChange(schemaKey, attributeKey, e.target.value)
                            }
                            data-test-subj={`schemaMappingSelect-${schemaKey}-${attributeKey}`}
                            compressed
                          />
                        </EuiFormRow>
                      );
                    }
                  )}

                  <EuiSpacer size="s" />
                </EuiPanel>
              </div>
            );
          })}
        </EuiPanel>
      </EuiAccordion>
    </>
  );
};
