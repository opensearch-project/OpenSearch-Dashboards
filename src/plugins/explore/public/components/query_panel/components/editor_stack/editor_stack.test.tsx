import React from 'react';
import { render, screen } from '@testing-library/react';
import { EditorStack } from './index';

describe('EditorStack', () => {
  it('renders PromptEditor always', () => {
    render(
      <EditorStack
        onPromptChange={jest.fn()}
        onQueryChange={jest.fn()}
        languageType="nl"
        isDualEditor={false}
        isPromptReadOnly={false}
        isEditorReadOnly={false}
        handleQueryEdit={jest.fn()}
        handlePromptEdit={jest.fn()}
        handleQueryRun={jest.fn()}
        handlePromptRun={jest.fn()}
        handleClearEditor={jest.fn()}
        queryString=""
        prompt=""
      />
    );
    expect(screen.getByTestId('osdPromptEditor__multiLine')).toBeInTheDocument();
  });

  it('renders QueryEditor when isDualEditor is true', () => {
    render(
      <EditorStack
        onPromptChange={jest.fn()}
        onQueryChange={jest.fn()}
        languageType="nl"
        isDualEditor={true}
        isPromptReadOnly={false}
        isEditorReadOnly={false}
        handleQueryEdit={jest.fn()}
        handlePromptEdit={jest.fn()}
        handleQueryRun={jest.fn()}
        handlePromptRun={jest.fn()}
        handleClearEditor={jest.fn()}
        queryString="test"
        prompt=""
      />
    );
    expect(screen.getByTestId('osdQueryEditor__multiLine')).toBeInTheDocument();
  });
});
