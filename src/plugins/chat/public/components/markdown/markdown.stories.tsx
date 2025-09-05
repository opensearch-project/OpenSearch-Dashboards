/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import { Markdown } from './markdown';

const meta: Meta<typeof Markdown> = {
  title: 'src/plugins/chat/public/components/markdown',
  component: Markdown,
  decorators: [
    (Story) => (
      <div style={{ padding: '16px', backgroundColor: '#f5f5f5', maxWidth: '800px' }}>
        <Story />
      </div>
    ),
  ],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Markdown is a wrapper component around ReactMarkdown that renders markdown content with consistent styling for chat messages.',
      },
    },
  },
  argTypes: {
    content: { control: 'text' },
  },
};

export default meta;
type Story = StoryObj<typeof Markdown>;

export const Default: Story = {
  args: {
    content: 'This is a simple markdown text.',
  },
};

export const WithHeadings: Story = {
  args: {
    content: `# Heading 1
## Heading 2
### Heading 3
#### Heading 4
##### Heading 5
###### Heading 6

This is a paragraph with some **bold text** and *italic text*.`,
  },
  parameters: {
    docs: {
      description: {
        story: 'Markdown content with different heading levels and text formatting.',
      },
    },
  },
};

export const WithLists: Story = {
  args: {
    content: `## Unordered List
- First item
- Second item
  - Nested item
  - Another nested item
- Third item

## Ordered List
1. First step
2. Second step
   1. Sub-step A
   2. Sub-step B
3. Third step

## Task List
- [x] Completed task
- [ ] Incomplete task
- [x] Another completed task`,
  },
  parameters: {
    docs: {
      description: {
        story: 'Various types of lists including nested and task lists.',
      },
    },
  },
};

export const WithCodeBlocks: Story = {
  args: {
    content: `## Inline Code
Here is some \`inline code\` within a sentence.

## Code Block
\`\`\`javascript
function fibonacci(n) {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}

console.log(fibonacci(10));
\`\`\`

## Another Code Block
\`\`\`python
def hello_world():
    print("Hello, World!")
    return "Success"

hello_world()
\`\`\``,
  },
  parameters: {
    docs: {
      description: {
        story: 'Markdown with inline code and code blocks in different languages.',
      },
    },
  },
};

export const WithLinks: Story = {
  args: {
    content: `## Links
Here are some links:
- [OpenSearch Project](https://opensearch.org)
- [OpenSearch Dashboards](https://github.com/opensearch-project/opensearch-dashboards)
- [Documentation](https://opensearch.org/docs/)

## Automatic Links
Visit https://opensearch.org or email team@opensearch.org

## Reference Links
This is a [reference link][ref1] and this is another [reference link][ref2].

[ref1]: https://opensearch.org "OpenSearch Homepage"
[ref2]: https://github.com/opensearch-project "OpenSearch GitHub"`,
  },
  parameters: {
    docs: {
      description: {
        story: 'Different types of links including inline, automatic, and reference links.',
      },
    },
  },
};

export const WithBlockquotes: Story = {
  args: {
    content: `## Single Blockquote
> This is a blockquote. It can span multiple lines and is used to highlight important information or quotes from other sources.

## Nested Blockquotes
> This is the first level of quoting.
>
> > This is nested blockquote.
> >
> > > And this is a third level.
>
> Back to first level.

## Blockquote with Other Elements
> ## This is a header
>
> 1. This is the first list item.
> 2. This is the second list item.
>
> Here's some example code:
>
>     console.log("Hello from blockquote");`,
  },
  parameters: {
    docs: {
      description: {
        story: 'Blockquotes with various levels of nesting and mixed content.',
      },
    },
  },
};

export const WithTables: Story = {
  args: {
    content: `## Simple Table
| Feature | Status | Priority |
|---------|--------|----------|
| Search | ✅ Complete | High |
| Filters | 🚧 In Progress | Medium |
| Export | ❌ Not Started | Low |

## Aligned Table
| Left Aligned | Center Aligned | Right Aligned |
|:-------------|:--------------:|--------------:|
| Left | Center | Right |
| Data | More Data | Even More |
| Test | Test | Test |`,
  },
  parameters: {
    docs: {
      description: {
        story: 'Tables with different alignment options and emojis.',
      },
    },
  },
};

export const WithTextFormatting: Story = {
  args: {
    content: `## Text Formatting Examples

**Bold text** and __also bold__

*Italic text* and _also italic_

***Bold and italic*** and ___also bold and italic___

~~Strikethrough text~~

## Line Breaks
This is line one.  
This is line two (with two spaces at end of previous line).

This is a new paragraph.

---

## Horizontal Rule
Above this line is a horizontal rule.`,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Various text formatting options including bold, italic, strikethrough, and line breaks.',
      },
    },
  },
};

export const ChatResponse: Story = {
  args: {
    content: `I can help you with OpenSearch Dashboards! Here's what you need to know:

## Key Features
- **Discover**: Explore and search your data
- **Visualize**: Create charts and graphs
- **Dashboard**: Combine visualizations
- **Dev Tools**: Query and manage indices

## Getting Started
1. Connect to your OpenSearch cluster
2. Create an index pattern
3. Start exploring your data in Discover
4. Build visualizations
5. Create dashboards

### Sample Query
\`\`\`json
{
  "query": {
    "match": {
      "message": "error"
    }
  }
}
\`\`\`

Need help with anything specific? Just ask! 🚀`,
  },
  parameters: {
    docs: {
      description: {
        story: 'Example of how markdown content might appear in a chat response.',
      },
    },
  },
};

export const LongContent: Story = {
  args: {
    content: `# Complete Markdown Guide

## Introduction
This is a comprehensive example of markdown content that might appear in a chat interface. It demonstrates various markdown features and how they render.

## Code Examples

### JavaScript
\`\`\`javascript
class SearchService {
  constructor(client) {
    this.client = client;
  }

  async search(query) {
    try {
      const response = await this.client.search({
        index: 'logs-*',
        body: {
          query: {
            multi_match: {
              query: query,
              fields: ['message', 'error.message']
            }
          }
        }
      });
      return response.body.hits;
    } catch (error) {
      console.error('Search failed:', error);
      throw error;
    }
  }
}
\`\`\`

### Python
\`\`\`python
from opensearchpy import OpenSearch

def create_client():
    return OpenSearch([
        {'host': 'localhost', 'port': 9200}
    ])

def search_logs(query):
    client = create_client()
    response = client.search(
        index="logs-*",
        body={
            "query": {
                "match": {
                    "message": query
                }
            }
        }
    )
    return response['hits']['hits']
\`\`\`

## Configuration

| Setting | Default | Description |
|---------|---------|-------------|
| \`cluster.name\` | opensearch | Cluster identifier |
| \`node.name\` | auto-generated | Node identifier |
| \`network.host\` | 127.0.0.1 | Network binding |
| \`http.port\` | 9200 | HTTP port |

## Important Notes

> **Warning**: Always secure your cluster in production environments.
>
> - Enable security features
> - Use strong authentication
> - Configure proper network access
> - Monitor cluster health

## Troubleshooting

### Common Issues
1. **Connection refused**
   - Check if OpenSearch is running
   - Verify network configuration
   - Check firewall settings

2. **Index not found**
   - Verify index name spelling
   - Check index patterns
   - Ensure data has been indexed

3. **Performance issues**
   - Monitor cluster resources
   - Optimize queries
   - Consider data lifecycle management

For more help, visit the [documentation](https://opensearch.org/docs/).`,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Long-form markdown content to test scrolling and layout with complex nested elements.',
      },
    },
  },
};

export const EmptyContent: Story = {
  args: {
    content: '',
  },
  parameters: {
    docs: {
      description: {
        story: 'Empty markdown content to test edge cases.',
      },
    },
  },
};

export const WithHTML: Story = {
  args: {
    content: `## HTML in Markdown

This is regular markdown text.

<div style="border: 1px solid #ccc; padding: 10px; margin: 10px 0;">
  <strong>HTML Block:</strong> This is HTML content within markdown.
</div>

Regular markdown continues here with **bold** and *italic* text.

<span style="color: red;">Inline HTML span</span> within markdown.`,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Markdown content mixed with HTML elements (behavior depends on ReactMarkdown configuration).',
      },
    },
  },
};
