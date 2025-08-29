/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { Fragment } from 'react';

import { EuiCompressedFormRow, EuiCompressedSelect } from '@elastic/eui';

import { FormattedMessage } from '@osd/i18n/react';
import { DefaultFormatEditor, defaultState } from '../default';

import { FormatEditorSamples } from '../../samples';

interface StringFormatEditorFormatParams {
  transform: string;
}

interface TransformOptions {
  kind: string;
  text: string;
}

export class StringFormatEditor extends DefaultFormatEditor<StringFormatEditorFormatParams> {
  static formatId = 'string';
  state = {
    ...defaultState,
    sampleInputs: [
      'A Quick Brown Fox.',
      'STAY CALM!',
      'com.organizations.project.ClassName',
      'hostname.net',
      'SGVsbG8gd29ybGQ=',
      '%EC%95%88%EB%85%95%20%ED%82%A4%EB%B0%94%EB%82%98',
    ],
  };

  render() {
    const { format, formatParams } = this.props;
    const { error, samples } = this.state;

    return (
      <Fragment>
        <EuiCompressedFormRow
          label={
            <FormattedMessage
              id="datasetManagement.string.transformLabel"
              defaultMessage="Transform"
            />
          }
          isInvalid={!!error}
          error={error}
        >
          <EuiCompressedSelect
            data-test-subj="stringEditorTransform"
            defaultValue={formatParams.transform}
            options={(format.type.transformOptions || []).map((option: TransformOptions) => {
              return {
                value: option.kind,
                text: option.text,
              };
            })}
            onChange={(e) => {
              this.onChange({ transform: e.target.value });
            }}
            isInvalid={!!error}
          />
        </EuiCompressedFormRow>
        <FormatEditorSamples samples={samples} />
      </Fragment>
    );
  }
}
