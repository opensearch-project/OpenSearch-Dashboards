/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useEffect } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { StatusCodeFormatter } from './status_code_formatter';
import { useDatasetContext } from '../../application/context';

/**
 * Custom hook to apply status code formatting to the dataset
 * This hook modifies the dataset's formatField method to use a custom formatter
 * for the HTTP status code fields and trace status code fields
 */
export const useStatusCodeFormatter = () => {
  const { dataset } = useDatasetContext();

  useEffect(() => {
    if (!dataset) return;

    const originalFormatField = dataset.formatField;

    // Override the formatField method to apply our custom formatter for status code fields
    dataset.formatField = (hit, fieldName) => {
      if (fieldName === 'attributes.http.status_code' || fieldName === 'status.code') {
        const flattened = dataset.flattenHit(hit);
        const value = flattened[fieldName];

        if (value !== undefined) {
          return renderToStaticMarkup(<StatusCodeFormatter value={value} fieldName={fieldName} />);
        }
      }

      // Use the original formatField method for other fields
      return originalFormatField(hit, fieldName);
    };

    return () => {
      dataset.formatField = originalFormatField;
    };
  }, [dataset]);
};
