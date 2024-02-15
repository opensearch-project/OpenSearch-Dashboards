/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 *
 * Any modifications Copyright OpenSearch Contributors. See
 * GitHub history for details.
 */

import React, { useState } from 'react';
import { EuiText, EuiSelect } from '@elastic/eui';
import { FieldDetails } from './types';
import { IndexPatternField, IndexPattern, OSD_FIELD_TYPES } from '../../../../../data/public';

interface DiscoverFieldEditProps {
  columns: string[];
  details: FieldDetails;
  field: IndexPatternField;
  indexPattern: IndexPattern;
}

export function DiscoverFieldEdit({
  columns,
  details,
  field,
  indexPattern,
}: DiscoverFieldEditProps) {
  const options = Object.keys(OSD_FIELD_TYPES).map((fieldType) => ({
    value: fieldType.toLowerCase(),
    text: fieldType,
  }));
  options.unshift({ value: 'unknown', text: 'UNKNOWN' });
  const [value, setValue] = useState(field.type.toLowerCase());

  return (
    <>
      <div className="dscFieldDetails" data-test-subj={`fieldVisualizeContainer`}>
        {details.error && (
          <EuiText size="xs" data-test-subj={`fieldVisualizeError`}>
            {details.error}
          </EuiText>
        )}

        {!details.error && (
          <div style={{ marginTop: '4px' }} data-test-subj={`fieldVisualizeEditContainer`}>
            <EuiSelect
              key={`field${field.name}`}
              options={options}
              value={value}
              onChange={(e) => {
                setValue(e.target.value);
                // TODO: Handle the selected type
              }}
            />
          </div>
        )}
      </div>
    </>
  );
}
