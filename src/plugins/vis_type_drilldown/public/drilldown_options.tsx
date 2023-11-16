/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback } from 'react';
import {
  EuiPanel,
  EuiTitle,
  EuiLink,
  EuiIcon,
  EuiTextArea,
  EuiFlexGroup,
  EuiFlexItem,
  EuiText,
} from '@elastic/eui';
import { FormattedMessage } from '@osd/i18n/react';

import { VisOptionsProps } from 'src/plugins/vis_default_editor/public';
import { DrilldownVisParams } from './types';

function DrilldownOptions({ stateParams, setValue }: VisOptionsProps<DrilldownVisParams>) {
  const onMarkdownUpdate = useCallback(
    (value: DrilldownVisParams['markdown']) => setValue('markdown', value),
    [setValue]
  );

  return (
    <EuiPanel paddingSize="s">
      <EuiFlexGroup direction="column" gutterSize="m" className="eui-fullHeight">
        <EuiFlexItem grow={false}>
          <EuiFlexGroup gutterSize="none" justifyContent="spaceBetween" alignItems="baseline">
            <EuiFlexItem grow={false}>
              <EuiTitle size="xs">
                <h2>
                  <label htmlFor="markdownVisInput">Markdown</label>
                </h2>
              </EuiTitle>
            </EuiFlexItem>

            <EuiFlexItem grow={false}>
              <EuiText size="xs">
                <EuiLink
                  href="https://help.github.com/articles/github-flavored-markdown/"
                  target="_blank"
                >
                  <FormattedMessage
                    id="visTypeMarkdown.params.helpLinkLabel"
                    defaultMessage="Help"
                  />{' '}
                  <EuiIcon type="popout" size="s" />
                </EuiLink>
              </EuiText>
            </EuiFlexItem>
          </EuiFlexGroup>
        </EuiFlexItem>

        <EuiFlexItem>
          <EuiTextArea
            id="markdownVisInput"
            className="eui-fullHeight"
            value={stateParams.markdown}
            onChange={({ target: { value } }) => onMarkdownUpdate(value)}
            fullWidth={true}
            data-test-subj="markdownTextarea"
            resize="none"
          />
        </EuiFlexItem>
      </EuiFlexGroup>
    </EuiPanel>
  );
}

export { DrilldownOptions };
