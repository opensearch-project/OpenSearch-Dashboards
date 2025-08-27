/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';
import { EuiFlyout, EuiFlyoutBody, EuiTabbedContent } from '@elastic/eui';

import { ScriptingSyntax } from './scripting_syntax';
import { TestScript } from './test_script';

import { ExecuteScript } from '../../types';
import { DataView } from '../../../../../../data/public';

interface ScriptingHelpFlyoutProps {
  dataset: DataView;
  lang: string;
  name?: string;
  script?: string;
  executeScript: ExecuteScript;
  isVisible: boolean;
  onClose: () => void;
}

export const ScriptingHelpFlyout: React.FC<ScriptingHelpFlyoutProps> = ({
  isVisible = false,
  onClose = () => {},
  dataset,
  lang,
  name,
  script,
  executeScript,
}) => {
  const tabs = [
    {
      id: 'syntax',
      name: 'Syntax',
      ['data-test-subj']: 'syntaxTab',
      content: <ScriptingSyntax />,
    },
    {
      id: 'test',
      name: 'Preview results',
      ['data-test-subj']: 'testTab',
      content: (
        <TestScript
          dataset={dataset}
          lang={lang}
          name={name}
          script={script}
          executeScript={executeScript}
        />
      ),
    },
  ];

  return isVisible ? (
    <EuiFlyout onClose={onClose} data-test-subj="scriptedFieldsHelpFlyout">
      <EuiFlyoutBody>
        <EuiTabbedContent tabs={tabs} initialSelectedTab={tabs[0]} size="s" />
      </EuiFlyoutBody>
    </EuiFlyout>
  ) : null;
};

ScriptingHelpFlyout.displayName = 'ScriptingHelpFlyout';
