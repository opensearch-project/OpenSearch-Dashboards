/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import { Suggestion } from './suggestion';
import { AIContext } from '../../../context';

const meta: Meta<typeof Suggestion> = {
  title: 'src/plugins/chat/public/components/suggestions/suggestion',
  component: Suggestion,
  decorators: [
    (Story) => {
      const [isLoading, setIsLoading] = React.useState(false);
      return (
        <AIContext.Provider value={{ isLoading, setIsLoading }}>
          <div style={{ padding: '16px', backgroundColor: '#f5f5f5', maxWidth: '300px' }}>
            <Story />
          </div>
        </AIContext.Provider>
      );
    },
  ],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Suggestion component displays clickable suggestion buttons for users to quickly send predefined queries or prompts.',
      },
    },
  },
  argTypes: {
    title: { control: 'text' },
    partial: { control: 'boolean' },
    className: { control: 'text' },
    onClick: { action: 'clicked' },
  },
};

export default meta;
type Story = StoryObj<typeof Suggestion>;

export const Default: Story = {
  args: {
    title: 'What is OpenSearch Dashboards?',
    onClick: () => console.log('Suggestion clicked'),
  },
};

export const ShortSuggestion: Story = {
  args: {
    title: 'Help',
    onClick: () => console.log('Help clicked'),
  },
  parameters: {
    docs: {
      description: {
        story: 'Short suggestion text to test button sizing.',
      },
    },
  },
};

export const LongSuggestion: Story = {
  args: {
    title:
      'How do I create a comprehensive dashboard with multiple visualizations for monitoring application logs and performance metrics?',
    onClick: () => console.log('Long suggestion clicked'),
  },
  parameters: {
    docs: {
      description: {
        story: 'Long suggestion text to test text wrapping and button sizing.',
      },
    },
  },
};

export const PartialSuggestion: Story = {
  args: {
    title: 'Loading suggestion...',
    partial: true,
    onClick: () => console.log('Partial suggestion clicked'),
  },
  parameters: {
    docs: {
      description: {
        story: 'Suggestion in partial/loading state with spinner.',
      },
    },
  },
};

export const CustomClassName: Story = {
  args: {
    title: 'Suggestion with custom styling',
    className: 'custom-suggestion-class',
    onClick: () => console.log('Custom suggestion clicked'),
  },
  parameters: {
    docs: {
      description: {
        story: 'Suggestion with custom CSS class applied.',
      },
    },
  },
};

export const EmptyTitle: Story = {
  args: {
    title: '',
    onClick: () => console.log('Empty suggestion clicked'),
  },
  parameters: {
    docs: {
      description: {
        story: 'Suggestion with empty title (should not render).',
      },
    },
  },
};

export const MultipleSuggestions: Story = {
  render: function MultipleSuggestionsRender() {
    const suggestions = [
      'What is OpenSearch Dashboards?',
      'How do I create a visualization?',
      'Show me dashboard examples',
      'Help with index patterns',
      'Explain query syntax',
    ];

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {suggestions.map((suggestion, index) => (
          <Suggestion
            key={index}
            title={suggestion}
            onClick={() => console.log(`Clicked: ${suggestion}`)}
          />
        ))}
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Multiple suggestions displayed in a vertical list.',
      },
    },
  },
};

export const SuggestionsGrid: Story = {
  render: function SuggestionsGridRender() {
    const suggestions = [
      'Create visualization',
      'Setup dashboard',
      'Query help',
      'Index patterns',
      'Data sources',
      'Alerting setup',
    ];

    return (
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '8px',
          maxWidth: '400px',
        }}
      >
        {suggestions.map((suggestion, index) => (
          <Suggestion
            key={index}
            title={suggestion}
            onClick={() => console.log(`Clicked: ${suggestion}`)}
          />
        ))}
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Multiple suggestions displayed in a grid layout.',
      },
    },
  },
};

export const InteractiveStates: Story = {
  render: function InteractiveStatesRender() {
    const [clickedSuggestion, setClickedSuggestion] = React.useState<string | null>(null);
    const [isPartial, setIsPartial] = React.useState(false);

    const suggestions = [
      'Getting started guide',
      'Create first dashboard',
      'Data visualization tips',
      'Query optimization',
    ];

    const handleSuggestionClick = (suggestion: string) => {
      setClickedSuggestion(suggestion);
      setIsPartial(true);

      // Simulate processing
      setTimeout(() => {
        setIsPartial(false);
        setClickedSuggestion(null);
      }, 2000);
    };

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div>
          <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: 'bold' }}>
            Available Suggestions
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {suggestions.map((suggestion, index) => (
              <Suggestion
                key={index}
                title={suggestion}
                partial={clickedSuggestion === suggestion && isPartial}
                onClick={() => handleSuggestionClick(suggestion)}
              />
            ))}
          </div>
        </div>
        {clickedSuggestion && (
          <div
            style={{
              padding: '8px',
              backgroundColor: '#d4edda',
              border: '1px solid #c3e6cb',
              borderRadius: '4px',
              fontSize: '14px',
              color: '#155724',
            }}
          >
            {isPartial
              ? `Processing: "${clickedSuggestion}"...`
              : `Completed: "${clickedSuggestion}"`}
          </div>
        )}
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Interactive suggestions with click handling and state management.',
      },
    },
  },
};

export const WithLoadingContext: Story = {
  render: function WithLoadingContextRender() {
    const [isLoading, setIsLoading] = React.useState(false);

    const handleClick = () => {
      setIsLoading(true);
      setTimeout(() => setIsLoading(false), 3000);
    };

    return (
      <AIContext.Provider value={{ isLoading, setIsLoading }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div>
            <button
              onClick={handleClick}
              style={{
                padding: '8px 16px',
                backgroundColor: '#0073e6',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                marginBottom: '16px',
              }}
            >
              {isLoading ? 'Loading...' : 'Trigger Loading State'}
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <Suggestion
              title="This suggestion is disabled when loading"
              onClick={() => console.log('Should not click when loading')}
            />
            <Suggestion
              title="Another disabled suggestion"
              onClick={() => console.log('Also disabled when loading')}
            />
            <Suggestion
              title="All suggestions are disabled during loading"
              onClick={() => console.log('Disabled during loading')}
            />
          </div>
          {isLoading && (
            <div
              style={{
                padding: '8px',
                backgroundColor: '#fff3cd',
                border: '1px solid #ffeaa7',
                borderRadius: '4px',
                fontSize: '14px',
                color: '#856404',
              }}
            >
              ⚠️ All suggestions are disabled while the AI is processing
            </div>
          )}
        </div>
      </AIContext.Provider>
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          'Suggestions with AI loading context - shows how suggestions are disabled during AI processing.',
      },
    },
  },
};

export const CommonSuggestions: Story = {
  render: function CommonSuggestionsRender() {
    const categories = {
      'Getting Started': [
        'What is OpenSearch Dashboards?',
        'How do I get started?',
        'Show me the main features',
      ],
      Visualizations: [
        'How do I create a bar chart?',
        'Create a line chart visualization',
        'Build a pie chart for my data',
        'Make a data table',
      ],
      Dashboards: [
        'How do I create a dashboard?',
        'Add visualizations to dashboard',
        'Share my dashboard with others',
        'Set up dashboard filters',
      ],
      'Data Management': [
        'What are index patterns?',
        'How do I add a data source?',
        'Import sample data',
        'Manage my indices',
      ],
    };

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '500px' }}>
        {Object.entries(categories).map(([category, suggestions]) => (
          <div key={category}>
            <h4
              style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: 'bold', color: '#333' }}
            >
              {category}
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {suggestions.map((suggestion, index) => (
                <Suggestion
                  key={index}
                  title={suggestion}
                  onClick={() => console.log(`Selected: ${suggestion}`)}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Common suggestions organized by categories for a realistic chat interface.',
      },
    },
  },
};

export const AllStates: Story = {
  render: function AllStatesRender() {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div>
          <h4 style={{ margin: '0 0 8px 0', fontSize: '16px' }}>Normal State</h4>
          <Suggestion
            title="Normal clickable suggestion"
            onClick={() => console.log('Normal clicked')}
          />
        </div>
        <div>
          <h4 style={{ margin: '0 0 8px 0', fontSize: '16px' }}>Partial/Loading State</h4>
          <Suggestion
            title="Loading suggestion"
            partial={true}
            onClick={() => console.log('Loading clicked')}
          />
        </div>
        <div>
          <h4 style={{ margin: '0 0 8px 0', fontSize: '16px' }}>Custom Styled</h4>
          <Suggestion
            title="Custom styled suggestion"
            className="custom-style"
            onClick={() => console.log('Custom clicked')}
          />
        </div>
        <div>
          <h4 style={{ margin: '0 0 8px 0', fontSize: '16px' }}>Long Text</h4>
          <Suggestion
            title="This is a very long suggestion text that tests how the component handles wrapping and sizing with extensive content"
            onClick={() => console.log('Long text clicked')}
          />
        </div>
        <div>
          <h4 style={{ margin: '0 0 8px 0', fontSize: '16px' }}>Empty Title (Not Rendered)</h4>
          <Suggestion title="" onClick={() => console.log('Empty clicked')} />
          <p style={{ fontSize: '12px', color: '#666', margin: '4px 0 0 0' }}>
            (Component returns null for empty titles)
          </p>
        </div>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Comparison of all suggestion component states and variations.',
      },
    },
  },
};
