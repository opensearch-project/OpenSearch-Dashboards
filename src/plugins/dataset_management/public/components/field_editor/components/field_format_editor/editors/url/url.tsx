/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { Fragment } from 'react';

import {
  EuiCompressedFieldText,
  EuiCompressedFormRow,
  EuiLink,
  EuiCompressedSelect,
  EuiCompressedSwitch,
  EuiCompressedFieldNumber,
} from '@elastic/eui';

import { FormattedMessage } from '@osd/i18n/react';
import { DefaultFormatEditor, FormatEditorProps } from '../default';

import { FormatEditorSamples } from '../../samples';

import { LabelTemplateFlyout } from './label_template_flyout';

import { UrlTemplateFlyout } from './url_template_flyout';

interface OnChangeParam {
  type: string;
  width?: string;
  height?: string;
  urlTemplate?: string;
}

interface UrlFormatEditorFormatParams {
  openLinkInCurrentTab: boolean;
  urlTemplate: string;
  labelTemplate: string;
  width: string;
  height: string;
}

interface UrlFormatEditorFormatState {
  showLabelTemplateHelp: boolean;
  showUrlTemplateHelp: boolean;
}

interface UrlType {
  kind: string;
  text: string;
}

export class UrlFormatEditor extends DefaultFormatEditor<
  UrlFormatEditorFormatParams,
  UrlFormatEditorFormatState
> {
  static formatId = 'url';
  iconPattern: string;

  constructor(props: FormatEditorProps<UrlFormatEditorFormatParams>) {
    super(props);

    this.iconPattern = `/plugins/datasetManagement/assets/icons/{{value}}.png`;

    this.state = {
      ...this.state,
      sampleInputsByType: {
        a: ['john', '/some/pathname/asset.png', 1234],
        img: ['go', 'stop', ['de', 'ne', 'us', 'ni'], 'cv'],
        audio: ['hello.mp3'],
      },
      sampleConverterType: 'html',
      showUrlTemplateHelp: false,
      showLabelTemplateHelp: false,
    };
  }

  sanitizeNumericValue = (val: string) => {
    const sanitizedValue = parseInt(val, 10);
    if (isNaN(sanitizedValue)) {
      return '';
    }
    return sanitizedValue;
  };

  onTypeChange = (newType: string) => {
    const { urlTemplate, width, height } = this.props.formatParams;
    const params: OnChangeParam = {
      type: newType,
    };
    if (newType === 'img') {
      params.width = width;
      params.height = height;
      if (!urlTemplate) {
        params.urlTemplate = this.iconPattern;
      }
    } else if (newType !== 'img' && urlTemplate === this.iconPattern) {
      params.urlTemplate = undefined;
    }
    this.onChange(params);
  };

  showUrlTemplateHelp = () => {
    this.setState({
      showLabelTemplateHelp: false,
      showUrlTemplateHelp: true,
    });
  };

  hideUrlTemplateHelp = () => {
    this.setState({
      showUrlTemplateHelp: false,
    });
  };

  showLabelTemplateHelp = () => {
    this.setState({
      showLabelTemplateHelp: true,
      showUrlTemplateHelp: false,
    });
  };

  hideLabelTemplateHelp = () => {
    this.setState({
      showLabelTemplateHelp: false,
    });
  };

  renderWidthHeightParameters = () => {
    const width = this.sanitizeNumericValue(this.props.formatParams.width);
    const height = this.sanitizeNumericValue(this.props.formatParams.height);
    return (
      <Fragment>
        <EuiCompressedFormRow
          label={<FormattedMessage id="datasetManagement.url.widthLabel" defaultMessage="Width" />}
        >
          <EuiCompressedFieldNumber
            data-test-subj="urlEditorWidth"
            value={width}
            onChange={(e) => {
              this.onChange({ width: e.target.value });
            }}
          />
        </EuiCompressedFormRow>
        <EuiCompressedFormRow
          label={
            <FormattedMessage id="datasetManagement.url.heightLabel" defaultMessage="Height" />
          }
        >
          <EuiCompressedFieldNumber
            data-test-subj="urlEditorHeight"
            value={height}
            onChange={(e) => {
              this.onChange({ height: e.target.value });
            }}
          />
        </EuiCompressedFormRow>
      </Fragment>
    );
  };

  render() {
    const { format, formatParams } = this.props;
    const { error, samples, sampleConverterType } = this.state;

    return (
      <Fragment>
        <LabelTemplateFlyout
          isVisible={this.state.showLabelTemplateHelp}
          onClose={this.hideLabelTemplateHelp}
        />
        <UrlTemplateFlyout
          isVisible={this.state.showUrlTemplateHelp}
          onClose={this.hideUrlTemplateHelp}
        />
        <EuiCompressedFormRow
          label={<FormattedMessage id="datasetManagement.url.typeLabel" defaultMessage="Type" />}
        >
          <EuiCompressedSelect
            data-test-subj="urlEditorType"
            value={formatParams.type}
            options={format.type.urlTypes.map((type: UrlType) => {
              return {
                value: type.kind,
                text: type.text,
              };
            })}
            onChange={(e) => {
              this.onTypeChange(e.target.value);
            }}
          />
        </EuiCompressedFormRow>

        {formatParams.type === 'a' ? (
          <EuiCompressedFormRow
            label={
              <FormattedMessage
                id="datasetManagement.url.openTabLabel"
                defaultMessage="Open in a new tab"
              />
            }
          >
            <EuiCompressedSwitch
              label={
                formatParams.openLinkInCurrentTab ? (
                  <FormattedMessage id="datasetManagement.url.offLabel" defaultMessage="Off" />
                ) : (
                  <FormattedMessage id="datasetManagement.url.onLabel" defaultMessage="On" />
                )
              }
              checked={!formatParams.openLinkInCurrentTab}
              onChange={(e) => {
                this.onChange({ openLinkInCurrentTab: !e.target.checked });
              }}
            />
          </EuiCompressedFormRow>
        ) : null}

        <EuiCompressedFormRow
          label={
            <FormattedMessage
              id="datasetManagement.url.urlTemplateLabel"
              defaultMessage="URL template"
            />
          }
          helpText={
            <EuiLink onClick={this.showUrlTemplateHelp}>
              <FormattedMessage
                id="datasetManagement.url.template.helpLinkText"
                defaultMessage="URL template help"
              />
            </EuiLink>
          }
          isInvalid={!!error}
          error={error}
        >
          <EuiCompressedFieldText
            data-test-subj="urlEditorUrlTemplate"
            value={formatParams.urlTemplate || ''}
            onChange={(e) => {
              this.onChange({ urlTemplate: e.target.value });
            }}
          />
        </EuiCompressedFormRow>

        <EuiCompressedFormRow
          label={
            <FormattedMessage
              id="datasetManagement.url.labelTemplateLabel"
              defaultMessage="Label template"
            />
          }
          helpText={
            <EuiLink onClick={this.showLabelTemplateHelp}>
              <FormattedMessage
                id="datasetManagement.url.labelTemplateHelpText"
                defaultMessage="Label template help"
              />
            </EuiLink>
          }
          isInvalid={!!error}
          error={error}
        >
          <EuiCompressedFieldText
            data-test-subj="urlEditorLabelTemplate"
            value={formatParams.labelTemplate || ''}
            onChange={(e) => {
              this.onChange({ labelTemplate: e.target.value });
            }}
          />
        </EuiCompressedFormRow>

        {formatParams.type === 'img' && this.renderWidthHeightParameters()}

        <FormatEditorSamples samples={samples} sampleType={sampleConverterType} />
      </Fragment>
    );
  }
}
