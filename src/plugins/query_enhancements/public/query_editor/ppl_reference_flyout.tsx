/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  EuiComboBoxOptionOption,
  EuiCompressedComboBox,
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
import React, { useState } from 'react';
import { FlyoutContainers } from './flyout_containers';
import { Group1, Group2, Group3 } from './ppl_docs/groups';
import { overview } from './ppl_docs/overview';

interface Props {
  module: string;
  onClose: () => void;
}

export const PPLReferenceFlyout = ({ module, onClose }: Props) => {
  const allOptionsStatic = [{ label: 'Overview', value: overview }, Group1, Group2, Group3];
  const defaultOption = [allOptionsStatic[0]];
  const [selectedOptions, setSelected] = useState(defaultOption);
  const [flyoutContent, setFlyoutContent] = useState(
    <EuiMarkdownFormat>{defaultOption[0].value}</EuiMarkdownFormat>
  );

  const onChange = (SelectedOptions: any) => {
    setSelected(SelectedOptions);

    const newContent = SelectedOptions.map((option: EuiComboBoxOptionOption<string>) => (
      <EuiMarkdownFormat>{option.value}</EuiMarkdownFormat>
    ));
    setFlyoutContent(newContent);
  };

  const flyoutHeader = (
    <EuiFlyoutHeader hasBorder>
      <EuiTitle size="m">
        <h2 id="pplReferenceFlyout">OpenSearch PPL Reference Manual</h2>
      </EuiTitle>
    </EuiFlyoutHeader>
  );

  const PPL_DOCUMENTATION_URL = 'https://opensearch.org/docs/latest/search-plugins/sql/ppl/index';

  const flyoutBody = (
    <EuiFlyoutBody>
      <EuiFlexGroup component="span">
        <EuiFlexItem>
          <EuiCompressedComboBox
            placeholder="Refer commands, functions and language structures"
            options={allOptionsStatic}
            selectedOptions={selectedOptions}
            onChange={onChange}
          />
        </EuiFlexItem>
        <EuiFlexItem style={{ justifyContent: 'center' }}>
          <EuiText size="s" color="subdued">
            <EuiLink target="_blank" href={PPL_DOCUMENTATION_URL} external>
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
      ariaLabel="pplReferenceFlyout"
    />
  );
};
