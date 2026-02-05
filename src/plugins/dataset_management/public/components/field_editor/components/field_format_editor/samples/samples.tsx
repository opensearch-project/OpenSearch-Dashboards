/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import './samples.scss';

import React, { PureComponent } from 'react';

import { EuiBasicTable, EuiCompressedFormRow } from '@elastic/eui';

import { i18n } from '@osd/i18n';
import { FormattedMessage } from '@osd/i18n/react';
import { Sample } from '../../../types';

interface FormatEditorSamplesProps {
  samples: Sample[];
  sampleType: string;
}

export class FormatEditorSamples extends PureComponent<FormatEditorSamplesProps> {
  static defaultProps = {
    sampleType: 'text',
  };

  render() {
    const { samples, sampleType } = this.props;

    const columns = [
      {
        field: 'input',
        name: i18n.translate('datasetManagement.samples.inputHeader', {
          defaultMessage: 'Input',
        }),
        render: (input: {} | string) => {
          return typeof input === 'object' ? JSON.stringify(input) : input;
        },
      },
      {
        field: 'output',
        name: i18n.translate('datasetManagement.samples.outputHeader', {
          defaultMessage: 'Output',
        }),
        render: (output: string) => {
          return sampleType === 'html' ? (
            <div
              /*
               * Justification for dangerouslySetInnerHTML:
               * Sample output may contain HTML tags, like URL image/audio format.
               */
              dangerouslySetInnerHTML={{ __html: output }} // eslint-disable-line react/no-danger
            />
          ) : (
            <div>{output}</div>
          );
        },
      },
    ];

    return samples.length ? (
      <EuiCompressedFormRow
        label={<FormattedMessage id="datasetManagement.samplesHeader" defaultMessage="Samples" />}
      >
        <EuiBasicTable<Sample>
          className="osdFieldFormatEditor__samples"
          compressed={true}
          items={samples}
          // @ts-expect-error TS2322 TODO(ts-error): fixme
          columns={columns}
        />
      </EuiCompressedFormRow>
    ) : null;
  }
}
