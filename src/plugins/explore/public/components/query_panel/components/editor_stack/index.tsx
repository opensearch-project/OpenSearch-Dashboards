/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { PromptEditor } from './prompt_editor';
import { QueryEditor } from './query_editor';
import { LanguageType } from './shared';

const EditorStack = () => {
  const [languageType, setLanguageType] = useState<LanguageType>('ppl'); // Default to PPL

  return (
    <div className="editor-stack">
      <PromptEditor languageType={languageType} />
      <QueryEditor />
    </div>
  );
};

export { EditorStack };
