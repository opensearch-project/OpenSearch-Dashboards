/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  EuiComboBox,
  EuiFlexGroup,
  EuiFlexItem,
  EuiFlyoutBody,
  EuiFlyoutFooter,
  EuiFlyoutHeader,
  EuiLink,
  EuiMarkdownFormat,
  EuiSmallButton,
  EuiSpacer,
  EuiText,
  EuiTitle,
} from '@elastic/eui';
import { FlyoutContainers } from './reference_flyout_container';
import { LanguageConfig } from './languageRegistry';

interface Props {
  language: LanguageConfig;
  onClose: () => void;
}

export const ReferenceFlyout: React.FC<Props> = ({ language, onClose }) => {
  const allOptionsStatic = [{ label: 'Overview', value: language.overview }, ...language.groups];
  const defaultOption = [allOptionsStatic[0]];
  const [selectedOptions, setSelected] = useState(defaultOption);
  const [flyoutContent, setFlyoutContent] = useState(
    <EuiMarkdownFormat>{defaultOption[0].value}</EuiMarkdownFormat>
  );

  const onChange = (selectedOptions: any) => {
    setSelected(selectedOptions);
    const newContent = selectedOptions.map((option: any) => (
      <EuiMarkdownFormat key={option.label}>{option.value}</EuiMarkdownFormat>
    ));
    setFlyoutContent(newContent);
  };

  const flyoutHeader = (
    <EuiFlyoutHeader hasBorder>
      <EuiTitle size="m">
        <h2 id="languageReferenceFlyout">OpenSearch {language.displayName} Reference Manual</h2>
      </EuiTitle>
    </EuiFlyoutHeader>
  );

  const flyoutBody = (
    <EuiFlyoutBody>
      <EuiFlexGroup component="span">
        <EuiFlexItem>
          <EuiComboBox
            placeholder={`Refer ${language.displayName} commands, functions and language structures`}
            options={allOptionsStatic}
            selectedOptions={selectedOptions}
            onChange={onChange}
            singleSelection
          />
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          <EuiText size="s" color="subdued">
            <EuiLink target="_blank" href={language.documentationUrl} external>
              Learn More
            </EuiLink>
          </EuiText>
        </EuiFlexItem>
      </EuiFlexGroup>
      <EuiSpacer size="l" />
      {flyoutContent}
    </EuiFlyoutBody>
  );

  const flyoutFooter = (
    <EuiFlyoutFooter>
      <EuiFlexGroup gutterSize="s" justifyContent="spaceBetween">
        <EuiFlexItem grow={false}>
          <EuiSmallButton onClick={onClose}>Close</EuiSmallButton>
        </EuiFlexItem>
      </EuiFlexGroup>
    </EuiFlyoutFooter>
  );

  return (
    <FlyoutContainers
      closeFlyout={onClose}
      flyoutHeader={flyoutHeader}
      flyoutBody={flyoutBody}
      flyoutFooter={flyoutFooter}
      ariaLabel="languageReferenceFlyout"
    />
  );
};
