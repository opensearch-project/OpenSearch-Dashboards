/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { render, screen } from '@testing-library/react';
import { I18nProvider } from '@osd/i18n/react';
import { createMemoryHistory } from 'history';
import { Router } from 'react-router-dom';
import { OpenSearchDashboardsContextProvider } from '../../../../opensearch_dashboards_react/public';
import { getCreateBreadcrumbs, getListBreadcrumbs } from '../breadcrumbs';
import {
  CreateDataConnectionPanel,
  getCreateDataConnectionBreadcrumbs,
} from './create_data_connection_panel';

let mockFlowCards: Array<{ id: string; path: string }> = [];
let mockLoading = false;

jest.mock('./data_connection_type_cards', () => ({
  useDataConnectionTypeCards: () => ({ cards: mockFlowCards, loading: mockLoading }),
  DataConnectionTypeCards: ({ cards }: { cards: Array<{ id: string }> }) => (
    <div data-test-subj="typeCards">{cards.map((card) => card.id).join()}</div>
  ),
}));
jest.mock('../data_source_creation_panel/create_data_source_card_view', () => ({
  CreateDataSourceCardView: () => <div data-test-subj="builtInCards">built-in types</div>,
}));

afterEach(() => {
  mockFlowCards = [];
  mockLoading = false;
});

// The registered experience's note: OSD has no text of its own about where sources are added.
const NOTE = 'Other sources are added elsewhere.';

interface RenderOptions {
  canManage?: boolean;
  experience?: { createPageNote?: string; hideBuiltInTypes?: boolean };
}

const renderPanel = (
  useNewUX: boolean,
  { canManage = false, experience = { createPageNote: NOTE } }: RenderOptions = {}
) => {
  const setBreadcrumbs = jest.fn();
  const setAppDescriptionControls = jest.fn();
  const HeaderControl = jest.fn(({ controls }: { controls: Array<{ description: string }> }) => (
    <div data-test-subj="headerControl">{controls.map((c) => c.description).join()}</div>
  ));
  const history = createMemoryHistory({ initialEntries: ['/create'] });
  render(
    <OpenSearchDashboardsContextProvider
      services={{
        setBreadcrumbs,
        application: {
          setAppDescriptionControls,
          capabilities: { dataSource: { canManage } },
        },
        navigation: { ui: { HeaderControl } },
        dataConnectionsExperience: { isEnabled: () => true, ...experience },
      }}
    >
      <I18nProvider>
        <Router history={history}>
          <CreateDataConnectionPanel
            useNewUX={useNewUX}
            history={history}
            featureFlagStatus={true}
          />
        </Router>
      </I18nProvider>
    </OpenSearchDashboardsContextProvider>
  );
  return { setBreadcrumbs, setAppDescriptionControls, HeaderControl, history };
};

describe('CreateDataConnectionPanel', () => {
  it.each([false, true])('sets the Create data connection breadcrumbs (new UX: %s)', (useNewUX) => {
    const { setBreadcrumbs } = renderPanel(useNewUX);
    expect(setBreadcrumbs).toHaveBeenCalledWith(getCreateDataConnectionBreadcrumbs());
    // The data sources list, then this page: the new header shows the last crumb as the title.
    expect(getCreateDataConnectionBreadcrumbs()).toEqual([
      ...getListBreadcrumbs(),
      { text: 'Create data connection', href: '/create' },
    ]);
  });

  it('leaves the Create data source breadcrumbs of the page it replaces as they are', () => {
    // Only this page, shown with the data connections experience, is named for data connections.
    expect(getCreateBreadcrumbs()[getCreateBreadcrumbs().length - 1].text).toBe(
      'Create data source'
    );
  });

  it('shows the title and description above the type cards', () => {
    mockFlowCards = [{ id: 'flow:example-flow', path: '/flows/example-flow' }];
    const { HeaderControl } = renderPanel(false);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Create data connection');
    expect(screen.getByText('Pick what you want to connect.')).toBeInTheDocument();
    expect(screen.getByTestId('typeCards')).toHaveTextContent('flow:example-flow');
    expect(HeaderControl).not.toHaveBeenCalled();
  });

  it('puts the description in the app header in the new UX', () => {
    mockFlowCards = [{ id: 'flow:example-flow', path: '/flows/example-flow' }];
    const { HeaderControl, setAppDescriptionControls } = renderPanel(true);
    expect(HeaderControl.mock.calls[0][0]).toEqual(
      expect.objectContaining({ setMountPoint: setAppDescriptionControls })
    );
    expect(screen.getByTestId('headerControl')).toHaveTextContent('Pick what you want to connect.');
    expect(screen.queryByRole('heading', { level: 1 })).not.toBeInTheDocument();
    expect(screen.getByTestId('typeCards')).toBeInTheDocument();
  });

  it.each([false, true])(
    'stays on the Create page when a type can be connected (new UX: %s)',
    (useNewUX) => {
      mockFlowCards = [{ id: 'flow:example-flow', path: '/flows/example-flow' }];
      const { history } = renderPanel(useNewUX);
      // The type page is a page of its own: nothing opens a setup page in its place.
      expect(history.location.pathname).toBe('/create');
      expect(history.action).toBe('POP');
      expect(screen.getByTestId('typeCards')).toHaveTextContent('flow:example-flow');
    }
  );

  it.each([false, true])(
    "shows the registered experience's note under the cards (new UX: %s)",
    (useNewUX) => {
      mockFlowCards = [{ id: 'flow:example-flow', path: '/flows/example-flow' }];
      renderPanel(useNewUX);
      expect(screen.getByTestId('dataConnectionTypesNote')).toHaveTextContent(NOTE);
      const text = document.body.textContent ?? '';
      expect(text.indexOf('flow:example-flow')).toBeLessThan(text.indexOf(NOTE));
    }
  );

  it('shows no note when the registered experience has none', () => {
    mockFlowCards = [{ id: 'flow:example-flow', path: '/flows/example-flow' }];
    renderPanel(false, { experience: {} });
    expect(screen.getByTestId('typeCards')).toBeInTheDocument();
    expect(screen.queryByTestId('dataConnectionTypesNote')).not.toBeInTheDocument();
  });

  it('shows the built-in types above the flow cards to a user who can manage data sources', () => {
    mockFlowCards = [{ id: 'flow:example-flow', path: '/flows/example-flow' }];
    renderPanel(false, { canManage: true });
    expect(screen.getByTestId('builtInCards')).toBeInTheDocument();
    const text = document.body.textContent ?? '';
    expect(text.indexOf('built-in types')).toBeLessThan(text.indexOf('flow:example-flow'));
  });

  it('shows the built-in types without any flow card, instead of the empty state', () => {
    renderPanel(false, { canManage: true });
    expect(screen.getByTestId('builtInCards')).toBeInTheDocument();
    expect(screen.queryByTestId('dataConnectionTypesEmpty')).not.toBeInTheDocument();
    expect(screen.queryByTestId('dataConnectionTypeCardsLoading')).not.toBeInTheDocument();
  });

  it.each([
    ['the experience hides them', { canManage: true, experience: { hideBuiltInTypes: true } }],
    ['the user cannot manage data sources', { canManage: false }],
  ])('leaves the built-in types off when %s', (_, options) => {
    mockFlowCards = [{ id: 'flow:example-flow', path: '/flows/example-flow' }];
    renderPanel(false, options);
    expect(screen.queryByTestId('builtInCards')).not.toBeInTheDocument();
    expect(screen.getByTestId('typeCards')).toHaveTextContent('flow:example-flow');
  });

  it.each([false, true])(
    'shows a spinner while the types are being resolved (new UX: %s)',
    (useNewUX) => {
      mockLoading = true;
      renderPanel(useNewUX);
      expect(screen.getByTestId('dataConnectionTypeCardsLoading')).toBeInTheDocument();
      expect(screen.queryByTestId('typeCards')).not.toBeInTheDocument();
      expect(screen.queryByTestId('dataConnectionTypesEmpty')).not.toBeInTheDocument();
    }
  );

  it('shows the cards found so far, with no spinner, while another type still resolves', () => {
    mockFlowCards = [{ id: 'flow:example-flow', path: '/flows/example-flow' }];
    mockLoading = true;
    renderPanel(false);
    expect(screen.getByTestId('typeCards')).toHaveTextContent('flow:example-flow');
    expect(screen.queryByTestId('dataConnectionTypeCardsLoading')).not.toBeInTheDocument();
  });

  it.each([false, true])(
    "says that no type can be connected, with the experience's note (new UX: %s)",
    (useNewUX) => {
      renderPanel(useNewUX);
      expect(screen.getByTestId('dataConnectionTypesEmpty')).toHaveTextContent(
        'No data source types can be connected here'
      );
      expect(screen.getByTestId('dataConnectionTypesNote')).toHaveTextContent(NOTE);
      expect(screen.queryByTestId('typeCards')).not.toBeInTheDocument();
      expect(screen.queryByTestId('dataConnectionTypeCardsLoading')).not.toBeInTheDocument();
    }
  );

  it('says that no type can be connected, without a note when the experience has none', () => {
    renderPanel(false, { experience: {} });
    expect(screen.getByTestId('dataConnectionTypesEmpty')).toBeInTheDocument();
    expect(screen.queryByTestId('dataConnectionTypesNote')).not.toBeInTheDocument();
  });
});
