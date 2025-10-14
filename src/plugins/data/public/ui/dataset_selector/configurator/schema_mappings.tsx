/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { EuiAccordion, EuiFormRow, EuiSelect, EuiSpacer, EuiText } from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { FormattedMessage } from '@osd/i18n/react';
import React, { useState } from 'react';
import { DatasetField } from '../../../../common';
import { SchemaConfig } from './schema_config';

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
  const [isOpen, setIsOpen] = useState(false);

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
                defaultMessage="Schema Mappings"
              />
            </strong>
          </EuiText>
        }
        forceState={isOpen ? 'open' : 'closed'}
        onToggle={() => setIsOpen(!isOpen)}
        data-test-subj="schemaMappingsAccordion"
      >
        <EuiSpacer size="xs" />
        <EuiText size="xs" color="subdued">
          <p>
            <FormattedMessage
              id="data.explorer.datasetSelector.advancedSelector.configurator.schemaMappingsDescription"
              defaultMessage="Map predefined schema attributes to actual fields in your dataset."
            />
          </p>
        </EuiText>
        <EuiSpacer size="m" />

        {schemas.map(([schemaKey, schemaConfig]) => {
          return (
            <div key={schemaKey}>
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

              {Object.entries(schemaConfig.attributes).map(([attributeKey, attributeConfig]) => {
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
                      onChange={(e) => handleFieldChange(schemaKey, attributeKey, e.target.value)}
                      data-test-subj={`schemaMappingSelect-${schemaKey}-${attributeKey}`}
                    />
                  </EuiFormRow>
                );
              })}

              <EuiSpacer size="m" />
            </div>
          );
        })}
      </EuiAccordion>
    </>
  );
};
