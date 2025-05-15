/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { CodeEditor } from '../../../../../../opensearch_dashboards_react/public';
import { getEditorConfig, LanguageType } from './shared';

interface PromptEditorProps {
  languageType: LanguageType;
}

const PromptEditor: React.FC<PromptEditorProps> = ({ languageType }) => {
  const editorConfig = getEditorConfig(languageType);

  return (
    <div className="promptEditor" data-test-subj="osdQueryEditor__multiLine">
      <CodeEditor
        height={32}
        languageId={editorConfig.languageId}
        value={''}
        onChange={() => {}}
        options={{
          fixedOverflowWidgets: true,
          fontSize: 14,
          lineHeight: 32,
          folding: false,
          lineNumbers: 'off',
          scrollBeyondLastLine: false,
          minimap: {
            enabled: false,
          },
          wordWrap: 'on',
          wrappingIndent: 'indent',
          ...editorConfig, // Spread the dynamic configuration
        }}
      />
    </div>
  );
};

export { PromptEditor };
