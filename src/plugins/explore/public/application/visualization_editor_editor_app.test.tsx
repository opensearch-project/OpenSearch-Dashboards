/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { act, render } from '@testing-library/react';
import { Router } from 'react-router-dom';
import { createMemoryHistory } from 'history';
import { EditorSession } from './visualization_editor_editor_app';
import { MultiQueryBuilder } from './in_context_vis_editor/multi_query_builder/multi_query_builder';

const mockSeenBuilders: MultiQueryBuilder[] = [];

jest.mock('./in_context_vis_editor/visualization_editor_page', () => ({
  VisualizationEditorPage: () => {
    const { useMultiQueryBuilder } = jest.requireActual(
      './in_context_vis_editor/multi_query_builder/multi_query_builder_context'
    );
    const builder = useMultiQueryBuilder();
    if (!mockSeenBuilders.includes(builder)) mockSeenBuilders.push(builder);
    return <div data-test-subj="editorPage" />;
  },
}));

describe('EditorSession', () => {
  beforeEach(() => {
    mockSeenBuilders.length = 0;
  });

  const renderSession = () => {
    const history = createMemoryHistory({ initialEntries: ['/#/edit/a'] });
    const utils = render(
      <Router history={history}>
        <EditorSession setHeaderActionMenu={jest.fn()} />
      </Router>
    );
    return { history, ...utils };
  };

  it('keeps the container when the editor replaces its own URL state', () => {
    const { history } = renderSession();
    expect(mockSeenBuilders).toHaveLength(1);

    act(() => history.replace('/#/edit/a?_eq=(x)'));

    expect(mockSeenBuilders).toHaveLength(1);
  });

  it('builds a new container and disposes the old one on PUSH and on back (POP)', () => {
    const { history } = renderSession();
    const first = mockSeenBuilders[0];
    const disposeSpy = jest.spyOn(first, 'dispose');

    act(() => history.push('/#/edit/b'));
    expect(mockSeenBuilders).toHaveLength(2);
    expect(disposeSpy).toHaveBeenCalledTimes(1);

    act(() => history.goBack());
    expect(mockSeenBuilders).toHaveLength(3);
    expect(new Set(mockSeenBuilders).size).toBe(3);
  });
});
