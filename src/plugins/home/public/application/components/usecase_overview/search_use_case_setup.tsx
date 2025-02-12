/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { CoreStart } from 'opensearch-dashboards/public';
import { EuiI18n, EuiIcon, EuiLink, EuiTextColor } from '@elastic/eui';
import { i18n } from '@osd/i18n';
import {
  ContentManagementPluginSetup,
  ContentManagementPluginStart,
  SEARCH_OVERVIEW_PAGE_ID,
  SECTIONS,
  SEARCH_OVERVIEW_CONTENT_AREAS,
  Section,
} from '../../../../../content_management/public';

const DISCOVER_APP_ID = 'discover';

export const getStartedSection: Section = {
  id: SECTIONS.GET_STARTED,
  order: 1000,
  title: i18n.translate('home.searchOverview.setupSection.title', {
    defaultMessage: 'Set up search',
  }),
  kind: 'card',
};

export const setupSearchUseCase = (contentManagement: ContentManagementPluginSetup) => {
  contentManagement.registerPage({
    id: SEARCH_OVERVIEW_PAGE_ID,
    title: 'Overview',
    sections: [
      getStartedSection,
      {
        id: SECTIONS.DIFFERENT_SEARCH_TYPES,
        order: 2000,
        title: i18n.translate('home.searchOverview.differentSearchTypes.title', {
          defaultMessage: 'Try out different search techniques',
        }),
        kind: 'card',
        grid: true,
        columns: 2,
      },
      {
        id: SECTIONS.CONFIG_EVALUATE_SEARCH,
        order: 3000,
        title: i18n.translate('home.searchOverview.configEvaluate.title', {
          defaultMessage: 'Configure and evaluate search',
        }),
        kind: 'card',
        grid: true,
        columns: 2,
      },
    ],
  });
};

export const registerContentToSearchUseCasePage = (
  contentManagement: ContentManagementPluginStart,
  core: CoreStart
) => {
  // Replicate external EuiLink icon as doc links can't use EuiLink for visual consistency
  const externalLinkIcon = (
    <>
      {' '}
      <EuiIcon size="s" type="popout" />
    </>
  );
  const getStartedCards = [
    {
      id: 'access_search_functionality',
      order: 10,
      icon: <EuiIcon type="bookOpen" size="l" color="primary" />,
      title: '',
      description: i18n.translate('home.searchOverview.setup.accessSearch.description', {
        defaultMessage: 'Explore search capabilities and functionality of OpenSearch.',
      }),
      footer: (
        <EuiTextColor color="subdued">
          <EuiI18n token="home.searchOverview.setup.accessSearch.footer" default="Documentation" />
          {externalLinkIcon}
        </EuiTextColor>
      ),
      documentURL: 'https://opensearch.org/docs/latest/search-plugins/',
    },
    {
      id: 'create_document_index',
      order: 20,
      icon: <EuiIcon type="bookOpen" size="l" color="primary" />,
      title: '',
      description: i18n.translate('home.searchOverview.setup.createDocumentIndex.description', {
        defaultMessage: 'Create a document collection (an index) to query your data.',
      }),
      footer: (
        <EuiTextColor color="subdued">
          <EuiI18n
            token="home.search_overview.createDocumentIndex.card.footer"
            default="Documentation"
          />
          {externalLinkIcon}
        </EuiTextColor>
      ),
      documentURL: 'https://opensearch.org/docs/latest/getting-started/intro/',
    },
    {
      id: 'get_start_discover',
      order: 30,
      icon: <EuiIcon type="compass" size="l" color="primary" />,
      title: '',
      description: i18n.translate('home.searchOverview.setup.discover.description', {
        defaultMessage: 'Explore data to uncover and discover insights.',
      }),
      footer: (
        <EuiTextColor color="subdued">
          <EuiI18n token="workspace.essential_overview.discover.card.footer" default="Discover" />
        </EuiTextColor>
      ),
      documentURL: 'https://opensearch.org/docs/latest/getting-started/intro/',
      navigateAppId: DISCOVER_APP_ID,
    },
  ];

  getStartedCards.forEach((card) => {
    contentManagement.registerContentProvider({
      id: card.id,
      getContent: () => ({
        id: card.id,
        kind: 'card',
        order: card.order,
        title: card.title,
        description: card.description,
        onClick: () => {
          if (card.navigateAppId) {
            core.application.navigateToApp(card.navigateAppId);
          } else {
            window.open(card.documentURL, '_blank');
          }
        },
        getFooter: () => card.footer,
        getIcon: () => card.icon,
        cardProps: {
          className: 'usecaseOverviewGettingStartedCard',
        },
      }),
      getTargetArea: () => SEARCH_OVERVIEW_CONTENT_AREAS.GET_STARTED,
    });
  });

  const searchIcon = <EuiIcon className="searchIcon" size="l" type="search" />;

  const searchTypeCards = [
    {
      id: 'text_search',
      order: 10,
      title: i18n.translate('home.searchOverview.searchTypes.textSearch.title', {
        defaultMessage: 'Text search',
      }),
      description: i18n.translate('home.searchOverview.searchTypes.textSearch.description', {
        defaultMessage:
          'Lexical or keyword search matches documents based on exact words or phrases. Search the text using human-friendly query string query syntax or create complex, customizable queries using Query DSL—the OpenSearch query language.',
      }),
      icon: searchIcon,
      footer: (
        <EuiLink
          external
          target="_blank"
          href="https://opensearch.org/docs/latest/query-dsl/full-text/"
        >
          View Documentation
        </EuiLink>
      ),
    },
    {
      id: 'analyzer',
      order: 10,
      title: i18n.translate('home.searchOverview.searchTypes.analyzer.title', {
        defaultMessage: 'Analyzers',
      }),
      description: i18n.translate('home.searchOverview.searchTypes.analyzer.description', {
        defaultMessage:
          'Analyzers prepare text for indexing. For example, HTML text typically has its tags removed. English text typically treats paint, painted, and painting as equivalent by mapping them all to the token paint. You can use OpenSearch’s extensive library of standard analyzers or create your own.',
      }),
      icon: searchIcon,
      footer: (
        <EuiLink
          external
          target="_blank"
          href="https://opensearch.org/docs/latest/analyzers/search-analyzers/"
        >
          View Documentation
        </EuiLink>
      ),
    },
    {
      id: 'semantic_vector_search',
      order: 10,
      title: i18n.translate('home.searchOverview.searchTypes.semanticVectorSearch.title', {
        defaultMessage: 'Semantic vector search',
      }),
      description: i18n.translate(
        'home.searchOverview.searchTypes.semanticVectorSearch.description',
        {
          defaultMessage:
            'Using semantic vector search, you can search for documents similar to your query in a vector space. With OpenSearch’s neural search capability, you specify an embedding model, and OpenSearch manages the operational complexity for you.',
        }
      ),
      icon: searchIcon,
      footer: (
        <EuiLink
          external
          target="_blank"
          href="https://opensearch.org/docs/latest/search-plugins/neural-search/"
        >
          View Documentation
        </EuiLink>
      ),
    },
    {
      id: 'neural_sparse_search',
      order: 10,
      title: i18n.translate('home.searchOverview.searchTypes.neuralSparseSearch.title', {
        defaultMessage: 'Neural sparse search',
      }),
      description: i18n.translate(
        'home.searchOverview.searchTypes.neuralSparseSearch.description',
        {
          defaultMessage:
            'Neural sparse search combines many of the advantages of lexical and semantic search.',
        }
      ),
      icon: searchIcon,
      footer: (
        <EuiLink
          external
          target="_blank"
          href="https://opensearch.org/docs/latest/search-plugins/neural-sparse-search/"
        >
          View Documentation
        </EuiLink>
      ),
    },
    {
      id: 'hybrid_search',
      order: 10,
      title: i18n.translate('home.searchOverview.searchTypes.hybridSearch.title', {
        defaultMessage: 'Hybrid search',
      }),
      description: i18n.translate('home.searchOverview.searchTypes.hybridSearch.description', {
        defaultMessage:
          'For many uses, lexical and semantic search are complementary: lexical search performs better on highly specific queries, while semantic search performs better on broader queries. Hybrid search runs both search types and combines the results, generally producing better results than either one separately.',
      }),
      icon: searchIcon,
      footer: (
        <EuiLink
          external
          target="_blank"
          href="https://opensearch.org/docs/latest/search-plugins/hybrid-search/"
        >
          View Documentation
        </EuiLink>
      ),
    },
  ];

  searchTypeCards.forEach((card) => {
    contentManagement.registerContentProvider({
      id: card.id,
      getContent: () => ({
        id: card.id,
        kind: 'card',
        order: card.order,
        title: card.title,
        description: card.description,
        getIcon: () => card.icon,
        cardProps: {
          children: <div className="euiCard__footer">{card.footer}</div>,
          layout: 'horizontal',
          titleElement: 'h3',
          titleSize: 's',
        },
      }),
      getTargetArea: () => SEARCH_OVERVIEW_CONTENT_AREAS.DIFFERENT_SEARCH_TYPES,
    });
  });
};
