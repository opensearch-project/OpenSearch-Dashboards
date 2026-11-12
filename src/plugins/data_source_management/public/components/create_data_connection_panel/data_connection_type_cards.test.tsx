/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { Router } from 'react-router-dom';
import { createMemoryHistory } from 'history';
import { OpenSearchDashboardsContextProvider } from '../../../../opensearch_dashboards_react/public';
import {
  DirectQueryConnectionFlow,
  DirectQueryConnectionFlowRegistry,
} from '../../direct_query_connection_flow_registry';
import { DataConnectionTypeCards, useDataConnectionTypeCards } from './data_connection_type_cards';

/** The cards as the Create page uses them: the shared card list, then the cards. */
const CardsWithList = () => {
  const { cards, loading } = useDataConnectionTypeCards();
  return (
    <>
      <span data-test-subj="cardsLoading">{String(loading)}</span>
      <DataConnectionTypeCards cards={cards} />
    </>
  );
};

const createRegistry = (
  ...flows: Array<Partial<DirectQueryConnectionFlow> & Pick<DirectQueryConnectionFlow, 'id'>>
) => {
  const registry = new DirectQueryConnectionFlowRegistry();
  flows.forEach((flow) =>
    registry.registerDirectQueryConnectionFlow({
      title: `${flow.id} title`,
      buttonLabel: `Connect ${flow.id}`,
      mount: jest.fn(() => () => {}),
      ...flow,
    })
  );
  return registry;
};

const renderCards = async ({
  registry,
  canManage = true,
  settle = true,
}: {
  registry?: DirectQueryConnectionFlowRegistry;
  canManage?: boolean;
  /** Whether to wait for the flows' visibility checks to settle. */
  settle?: boolean;
} = {}) => {
  const history = createMemoryHistory({ initialEntries: ['/create'] });
  render(
    <OpenSearchDashboardsContextProvider
      services={{
        application: { capabilities: { dataSource: { canManage } } },
        directQueryConnectionFlowRegistry: registry,
      }}
    >
      <Router history={history}>
        <CardsWithList />
      </Router>
    </OpenSearchDashboardsContextProvider>
  );
  // Let the flows' visibility checks settle.
  if (settle) await act(async () => {});
  return { history };
};

const isLoading = () => screen.getByTestId('cardsLoading').textContent === 'true';

/** A visibility check that answers only when told to. */
const pendingVisibility = () => {
  let answer!: (visible: boolean) => void;
  const isVisible = jest.fn(() => new Promise<boolean>((resolve) => (answer = resolve)));
  return { isVisible, answer: (visible: boolean) => act(async () => answer(visible)) };
};

/** The cards' test subjects, in page order (each card's Connect button is `<card>_connect`). */
const cardOrder = () =>
  Array.from(
    screen.getByTestId('dataConnectionTypeCards').querySelectorAll('[data-test-subj$="_connect"]')
  ).map((button) => button.getAttribute('data-test-subj')!.replace(/_connect$/, ''));

const exampleFlow = {
  id: 'example',
  title: 'Example data connection',
  createPageCard: { description: 'Connects example data kept elsewhere.', isNew: true },
};

describe('DataConnectionTypeCards', () => {
  it('shows no card without a flow: no built-in type, released or not, has one', async () => {
    await renderCards({ settle: false });
    expect(isLoading()).toBe(false);
    expect(cardOrder()).toEqual([]);
    expect(screen.queryByText('Example source')).not.toBeInTheDocument();
    expect(screen.queryByText('Coming soon')).not.toBeInTheDocument();
  });

  it('lists the visible flows that have a card, with their copy and New badge', async () => {
    const registry = createRegistry(
      exampleFlow,
      { id: 'no-card' },
      { id: 'hidden', createPageCard: { description: 'Hidden' }, isVisible: () => false },
      { id: 'plain', createPageCard: { description: 'Plain' } }
    );
    await renderCards({ registry });
    expect(cardOrder()).toEqual(['datasource_card_flow_example', 'datasource_card_flow_plain']);
    const example = within(screen.getByTestId('datasource_card_flow_example'));
    expect(example.getByText('Example data connection')).toBeInTheDocument();
    expect(example.getByText('Connects example data kept elsewhere.')).toBeInTheDocument();
    expect(example.getByText('New')).toBeInTheDocument();
    expect(
      within(screen.getByTestId('datasource_card_flow_plain')).queryByText('New')
    ).not.toBeInTheDocument();
  });

  it('shows a compact card: fixed width, no icon, a sentence-case New badge', async () => {
    await renderCards({ registry: createRegistry(exampleFlow) });
    const card = screen.getByTestId('datasource_card_flow_example');
    // A fixed width, not a share of the row: one card stays compact on a wide page.
    expect(card.style.width).toBe('300px');
    expect(card.querySelector('svg, .euiIcon, .ouiIcon')).toBeNull();
    const badge = screen.getByTestId('datasource_card_flow_example_new');
    expect(badge).toHaveTextContent(/^New$/);
    expect(badge.className).not.toMatch(/BetaBadge/);
  });

  it('shows no flow cards to users who cannot manage data sources', async () => {
    await renderCards({ registry: createRegistry(exampleFlow), canManage: false });
    expect(screen.queryByTestId('datasource_card_flow_example')).not.toBeInTheDocument();
    expect(isLoading()).toBe(false);
  });

  it('shows the card of a flow that does not require data source management to users who cannot manage data sources', async () => {
    const needsManagement = jest.fn(() => true);
    await renderCards({
      registry: createRegistry(
        { ...exampleFlow, isVisible: needsManagement },
        {
          id: 'open',
          createPageCard: { description: 'Open to every user the flow allows.' },
          requiresDataSourceManagement: false,
        }
      ),
      canManage: false,
    });
    expect(cardOrder()).toEqual(['datasource_card_flow_open']);
    expect(isLoading()).toBe(false);
    // A flow the user may not have is not asked whether it is visible.
    expect(needsManagement).not.toHaveBeenCalled();
  });

  it('still lets isVisible hide the card of a flow that does not require data source management', async () => {
    const open = pendingVisibility();
    await renderCards({
      registry: createRegistry({
        id: 'open',
        createPageCard: { description: 'Open' },
        requiresDataSourceManagement: false,
        isVisible: open.isVisible,
      }),
      canManage: false,
      settle: false,
    });
    expect(isLoading()).toBe(true);
    await open.answer(false);
    expect(cardOrder()).toEqual([]);
    expect(isLoading()).toBe(false);
  });

  it('is loading until every flow with a card is known, showing each card once known', async () => {
    const slow = pendingVisibility();
    const example = pendingVisibility();
    await renderCards({
      registry: createRegistry(
        { ...exampleFlow, isVisible: example.isVisible },
        { id: 'slow', createPageCard: { description: 'Slow' }, isVisible: slow.isVisible }
      ),
      settle: false,
    });
    expect(isLoading()).toBe(true);
    expect(cardOrder()).toEqual([]);
    // One flow is known: its card shows, while the other may still add one.
    await example.answer(true);
    expect(cardOrder()).toEqual(['datasource_card_flow_example']);
    expect(isLoading()).toBe(true);
    await slow.answer(false);
    expect(cardOrder()).toEqual(['datasource_card_flow_example']);
    expect(isLoading()).toBe(false);
  });

  it('is not loading for flows without a card, nor once a check fails', async () => {
    const noCard = pendingVisibility();
    await renderCards({
      registry: createRegistry(
        { id: 'no-card', isVisible: noCard.isVisible },
        {
          id: 'broken',
          createPageCard: { description: 'Broken' },
          isVisible: () => Promise.reject(new Error('down')),
        }
      ),
    });
    expect(cardOrder()).toEqual([]);
    expect(isLoading()).toBe(false);
  });

  it('opens the setup page of a card with its Connect button, adding one history entry', async () => {
    const { history } = await renderCards({ registry: createRegistry(exampleFlow) });
    const connect = screen.getByTestId('datasource_card_flow_example_connect');
    expect(connect).toHaveTextContent('Connect');
    fireEvent.click(connect);
    expect(history.location.pathname).toBe('/flows/example');
    expect(history.length).toBe(2);
    // A repeated click on the way out adds no entry, so Back takes one press.
    fireEvent.click(connect);
    expect(history.length).toBe(2);
  });

  it('names the type in each Connect button for screen readers', async () => {
    await renderCards({ registry: createRegistry(exampleFlow) });
    expect(screen.getByRole('button', { name: 'Connect Example data connection' })).toBe(
      screen.getByTestId('datasource_card_flow_example_connect')
    );
  });

  it('does not open the setup page when the card text is clicked', async () => {
    const { history } = await renderCards({ registry: createRegistry(exampleFlow) });
    fireEvent.click(
      within(screen.getByTestId('datasource_card_flow_example')).getByText(
        'Connects example data kept elsewhere.'
      )
    );
    expect(history.location.pathname).toBe('/create');
  });
});
