/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { Fragment } from 'react';
import moment from 'moment';

import {
  EuiCode,
  EuiCompressedFieldText,
  EuiCompressedFormRow,
  EuiIcon,
  EuiLink,
} from '@elastic/eui';

import { FormattedMessage } from '@osd/i18n/react';
import { DefaultFormatEditor, defaultState } from '../default';

import { FormatEditorSamples } from '../../samples';

interface DateFormatEditorFormatParams {
  pattern: string;
}

export class DateFormatEditor extends DefaultFormatEditor<DateFormatEditorFormatParams> {
  static formatId = 'date';
  state = {
    ...defaultState,
    sampleInputs: [
      Date.now(),
      moment().startOf('year').valueOf(),
      moment().endOf('year').valueOf(),
    ],
  };

  render() {
    const { format, formatParams } = this.props;
    const { error, samples } = this.state;
    const defaultPattern = format.getParamDefaults().pattern;

    return (
      <Fragment>
        <EuiCompressedFormRow
          label={
            <FormattedMessage
              id="datasetManagement.date.momentLabel"
              defaultMessage="Moment.js format pattern (Default: {defaultPattern})"
              values={{
                defaultPattern: <EuiCode>{defaultPattern}</EuiCode>,
              }}
            />
          }
          isInvalid={!!error}
          error={error}
          helpText={
            <span>
              <EuiLink target="_blank" href="https://momentjs.com/">
                <FormattedMessage
                  id="datasetManagement.date.documentationLabel"
                  defaultMessage="Documentation"
                />
                &nbsp;
                <EuiIcon type="link" />
              </EuiLink>
            </span>
          }
        >
          <EuiCompressedFieldText
            data-test-subj="dateEditorPattern"
            value={formatParams.pattern}
            placeholder={defaultPattern}
            onChange={(e) => {
              this.onChange({ pattern: e.target.value });
            }}
            isInvalid={!!error}
          />
        </EuiCompressedFormRow>
        <FormatEditorSamples samples={samples} />
      </Fragment>
    );
  }
}
