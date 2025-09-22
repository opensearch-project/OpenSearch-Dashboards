/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { Fragment } from 'react';

import { EuiCompressedFieldNumber, EuiCompressedFormRow } from '@elastic/eui';

import { FormattedMessage } from '@osd/i18n/react';
import { DefaultFormatEditor, defaultState } from '../default';

import { FormatEditorSamples } from '../../samples';

import { sample } from './sample';

interface TruncateFormatEditorFormatParams {
  fieldLength: number;
}

export class TruncateFormatEditor extends DefaultFormatEditor<TruncateFormatEditorFormatParams> {
  static formatId = 'truncate';
  state = {
    ...defaultState,
    sampleInputs: [sample],
  };

  render() {
    const { formatParams, onError } = this.props;
    const { error, samples } = this.state;

    return (
      <Fragment>
        <EuiCompressedFormRow
          label={
            <FormattedMessage
              id="datasetManagement.truncate.lengthLabel"
              defaultMessage="Field length"
            />
          }
          isInvalid={!!error}
          error={error}
        >
          <EuiCompressedFieldNumber
            defaultValue={formatParams.fieldLength}
            min={1}
            onChange={(e) => {
              if (e.target.checkValidity()) {
                this.onChange({
                  fieldLength: e.target.value ? Number(e.target.value) : null,
                });
              } else {
                onError(e.target.validationMessage);
              }
            }}
            isInvalid={!!error}
          />
        </EuiCompressedFormRow>
        <FormatEditorSamples samples={samples} />
      </Fragment>
    );
  }
}
