/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { CodeEditor } from '../../../../../../opensearch_dashboards_react/public';

const PromptEditor = () => {
  return (
    <div className="promptEditor" data-test-subj="osdQueryEditor__multiLine">
      <CodeEditor
        height={32}
        languageId={'query'}
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
          suggest: {
            showWords: false,
          },
          wordWrap: 'on',
          wrappingIndent: 'indent',
        }}
      />
    </div>
  );
};

export { PromptEditor };
