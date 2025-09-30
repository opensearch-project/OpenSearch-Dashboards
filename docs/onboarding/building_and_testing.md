# Building and Testing OpenSearch Dashboards

This comprehensive guide covers the complete development workflow for OpenSearch Dashboards, including building, testing, and maintaining high-quality code. Whether you're developing core features, plugins, or contributing to the project, this guide provides the essential knowledge and best practices.

## Table of Contents

- [Development Workflow](#development-workflow)
  - [Local Development Setup](#local-development-setup)
  - [Hot Reloading and Watch Mode](#hot-reloading-and-watch-mode)
  - [Debugging Techniques](#debugging-techniques)
  - [Version Control Workflow](#version-control-workflow)
- [Testing Strategies](#testing-strategies)
  - [Unit Testing with Jest](#unit-testing-with-jest)
  - [Integration Testing](#integration-testing)
  - [End-to-End Testing with Cypress](#end-to-end-testing-with-cypress)
  - [Testing Plugins and Components](#testing-plugins-and-components)
  - [Test Coverage and Reporting](#test-coverage-and-reporting)
- [Code Quality and Standards](#code-quality-and-standards)
  - [TypeScript Usage](#typescript-usage)
  - [Linting with ESLint](#linting-with-eslint)
  - [Code Formatting with Prettier](#code-formatting-with-prettier)
  - [Code Review Guidelines](#code-review-guidelines)
  - [Performance Optimization](#performance-optimization)
  - [Security Best Practices](#security-best-practices)
- [Build Process](#build-process)
  - [Understanding the Build Pipeline](#understanding-the-build-pipeline)
  - [Development vs Production Builds](#development-vs-production-builds)
  - [Webpack Configuration](#webpack-configuration)
  - [Bundle Optimization](#bundle-optimization)

## Development Workflow

### Local Development Setup

#### Initial Setup

1. **Clone and Bootstrap**
   ```bash
   # Clone the repository
   git clone https://github.com/opensearch-project/OpenSearch-Dashboards.git
   cd OpenSearch-Dashboards

   # Install the correct Node version (using nvm)
   nvm install
   nvm use

   # Install yarn via corepack
   npm i -g corepack
   corepack install

   # Bootstrap the project
   yarn osd bootstrap
   ```

2. **Start Development Server**
   ```bash
   # Start OpenSearch (required for Dashboards to run)
   yarn opensearch snapshot

   # In another terminal, start OpenSearch Dashboards
   yarn start

   # With specific features enabled
   yarn start:enhancements  # Query enhancements
   yarn start:security      # Security features
   yarn start:explore       # Explore feature
   ```

3. **Development URLs**
   - OpenSearch Dashboards: `http://localhost:5601`
   - OpenSearch: `http://localhost:9200`
   - Dev tools: `http://localhost:5601/app/dev_tools`

### Hot Reloading and Watch Mode

OpenSearch Dashboards supports hot reloading for efficient development:

```bash
# Start with watch mode (auto-rebuilds on file changes)
yarn osd:watch

# For plugin development, run in parallel terminals:
yarn start --no-base-path
yarn plugin-helpers build --watch
```

**Key Features:**
- **Automatic rebuilds**: Changes to source files trigger rebuilds
- **Browser refresh**: Most changes require a browser refresh
- **Optimizer cache**: Speeds up rebuilds by caching unchanged bundles
- **Source maps**: Enabled by default for debugging

**Performance Tips:**
```bash
# Disable optimizer cache if experiencing issues
yarn start --no-cache

# Limit watched plugins for faster rebuilds
yarn start --plugin-path=src/plugins/my_plugin

# Skip type checking for faster iteration
yarn start --no-type-check
```

### Debugging Techniques

#### Browser DevTools

1. **Source Maps**: Enabled by default in development
2. **React DevTools**: Install the browser extension for React component debugging
3. **Redux DevTools**: For state management debugging

#### Node.js Debugging

```bash
# Start with Node.js inspector
yarn debug

# With breakpoint at start
yarn debug-break

# Attach debugger to specific port
node --inspect=9229 scripts/opensearch_dashboards --dev
```

**VS Code Configuration** (`.vscode/launch.json`):
```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "attach",
      "name": "Attach to OpenSearch Dashboards",
      "port": 9229,
      "skipFiles": ["<node_internals>/**"],
      "sourceMaps": true
    }
  ]
}
```

#### Debugging Tests

```bash
# Debug Jest tests
node --inspect-brk ./node_modules/.bin/jest --runInBand path/to/test.js

# Debug Cypress tests
yarn cypress open  # Use the Cypress GUI for interactive debugging

# Debug functional tests
node --inspect-brk scripts/functional_tests.js --debug
```

### Version Control Workflow

#### Branch Strategy

```bash
# Create feature branch from main
git checkout main
git pull upstream main
git checkout -b feature/my-feature

# Keep branch updated
git fetch upstream
git rebase upstream/main
```

#### Commit Best Practices

```bash
# Use conventional commits
git commit -m "feat: add new visualization type"
git commit -m "fix: resolve data table sorting issue"
git commit -m "test: add unit tests for query service"
git commit -m "docs: update API documentation"

# Squash commits before PR
git rebase -i HEAD~3
```

## Testing Strategies

### Unit Testing with Jest

#### Setup and Configuration

**Basic Jest configuration** (`jest.config.js`):
```javascript
module.exports = {
  rootDir: '.',
  roots: ['<rootDir>/src'],
  testMatch: ['**/*.test.{js,jsx,ts,tsx}'],
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': '<rootDir>/node_modules/@osd/dev-utils/target/babel_jest_transpiler.js',
  },
  setupFilesAfterEnv: ['<rootDir>/src/test_utils/setup_tests.ts'],
  coverageDirectory: '<rootDir>/target/coverage',
  coverageReporters: ['text', 'html', 'lcov'],
  moduleNameMapper: {
    '\\.(css|less|scss)$': '<rootDir>/src/test_utils/style_mock.js',
    '^ui/(.*)': '<rootDir>/src/legacy/ui/public/$1',
  },
};
```

#### Writing Unit Tests

**Component Testing Example**:
```typescript
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { DataTable } from './data_table';

describe('DataTable', () => {
  const mockData = [
    { id: 1, name: 'Item 1', value: 100 },
    { id: 2, name: 'Item 2', value: 200 },
  ];

  it('renders data correctly', () => {
    render(<DataTable data={mockData} />);

    expect(screen.getByText('Item 1')).toBeInTheDocument();
    expect(screen.getByText('Item 2')).toBeInTheDocument();
  });

  it('handles sorting', () => {
    const onSort = jest.fn();
    render(<DataTable data={mockData} onSort={onSort} />);

    fireEvent.click(screen.getByText('Name'));
    expect(onSort).toHaveBeenCalledWith('name', 'asc');
  });

  it('handles row selection', () => {
    const onSelect = jest.fn();
    render(<DataTable data={mockData} onSelect={onSelect} />);

    fireEvent.click(screen.getByTestId('row-1'));
    expect(onSelect).toHaveBeenCalledWith(mockData[0]);
  });
});
```

**Service Testing Example**:
```typescript
import { SearchService } from './search_service';
import { coreMock } from '../../../core/public/mocks';

describe('SearchService', () => {
  let service: SearchService;
  let mockCore: ReturnType<typeof coreMock.createStart>;

  beforeEach(() => {
    mockCore = coreMock.createStart();
    service = new SearchService(mockCore);
  });

  describe('search', () => {
    it('executes search with correct parameters', async () => {
      const mockResponse = { hits: { total: 1, hits: [{ _id: '1' }] } };
      mockCore.http.post.mockResolvedValue(mockResponse);

      const result = await service.search({
        index: 'test-index',
        query: { match_all: {} },
      });

      expect(mockCore.http.post).toHaveBeenCalledWith('/api/search', {
        body: JSON.stringify({
          index: 'test-index',
          query: { match_all: {} },
        }),
      });
      expect(result).toEqual(mockResponse);
    });

    it('handles search errors', async () => {
      const error = new Error('Search failed');
      mockCore.http.post.mockRejectedValue(error);

      await expect(
        service.search({ index: 'test-index' })
      ).rejects.toThrow('Search failed');
    });
  });
});
```

#### Mocking Strategies

**Creating Mocks**:
```typescript
// src/plugins/my_plugin/public/mocks.ts
export const myPluginMock = {
  createSetupContract: () => ({
    registerFeature: jest.fn(),
    getFeatures: jest.fn().mockReturnValue([]),
  }),

  createStartContract: () => ({
    executeAction: jest.fn(),
    getState: jest.fn().mockReturnValue({}),
  }),
};

// Using mocks in tests
import { myPluginMock } from './mocks';

const mockSetup = myPluginMock.createSetupContract();
mockSetup.registerFeature.mockImplementation((feature) => {
  console.log('Registered:', feature);
});
```

### Integration Testing

#### API Integration Tests

```typescript
import { setupServer } from 'src/core/test_helpers/osd_server';

describe('API Integration', () => {
  let root: ReturnType<typeof setupServer>;

  beforeAll(async () => {
    root = setupServer({
      plugins: { initialize: true },
      opensearch: {
        hosts: ['http://localhost:9200'],
      },
    });
    await root.setup();
    await root.start();
  });

  afterAll(async () => {
    await root.shutdown();
  });

  it('creates and retrieves saved objects', async () => {
    const { body: created } = await root.request
      .post('/api/saved_objects/dashboard')
      .send({
        attributes: {
          title: 'Test Dashboard',
          panels: [],
        },
      })
      .expect(200);

    const { body: retrieved } = await root.request
      .get(`/api/saved_objects/dashboard/${created.id}`)
      .expect(200);

    expect(retrieved.attributes.title).toBe('Test Dashboard');
  });
});
```

### End-to-End Testing with Cypress

#### Cypress Configuration

**cypress.config.ts**:
```typescript
import { defineConfig } from 'cypress';

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:5601',
    viewportWidth: 1920,
    viewportHeight: 1080,
    video: true,
    screenshotsFolder: 'cypress/screenshots',
    videosFolder: 'cypress/videos',
    retries: {
      runMode: 2,
      openMode: 0,
    },
    env: {
      OPENSEARCH_URL: 'http://localhost:9200',
      USERNAME: 'admin',
      PASSWORD: 'admin',
    },
  },
});
```

#### Writing Cypress Tests

**Feature Test Example**:
```javascript
describe('Dashboard Creation', () => {
  beforeEach(() => {
    cy.visit('/app/dashboards');
    cy.loginAsUser('admin', 'admin');
  });

  it('creates a new dashboard with visualizations', () => {
    // Create new dashboard
    cy.get('[data-test-subj="newItemButton"]').click();

    // Add visualization
    cy.get('[data-test-subj="dashboardAddPanel"]').click();
    cy.get('[data-test-subj="savedObjectTitle"]')
      .contains('Sales by Region')
      .click();

    // Configure layout
    cy.get('[data-test-subj="dashboardPanel"]')
      .should('be.visible')
      .trigger('mousedown', { button: 0 })
      .trigger('mousemove', { clientX: 100, clientY: 100 })
      .trigger('mouseup');

    // Save dashboard
    cy.get('[data-test-subj="dashboardSaveMenuItem"]').click();
    cy.get('[data-test-subj="savedObjectTitle"]')
      .type('E2E Test Dashboard');
    cy.get('[data-test-subj="confirmSaveSavedObjectButton"]').click();

    // Verify save
    cy.get('[data-test-subj="dashboardTitle"]')
      .should('contain', 'E2E Test Dashboard');
  });
});
```

**API Testing with Cypress**:
```javascript
describe('Search API', () => {
  it('performs search query', () => {
    cy.request({
      method: 'POST',
      url: '/api/search',
      headers: {
        'osd-xsrf': 'true',
      },
      body: {
        index: 'opensearch_dashboards_sample_data_logs',
        query: {
          match: { message: 'error' },
        },
      },
    }).then((response) => {
      expect(response.status).to.equal(200);
      expect(response.body.hits.total.value).to.be.greaterThan(0);
    });
  });
});
```

### Testing Plugins and Components

#### Plugin Testing Structure

```
src/plugins/my_plugin/
├── public/
│   ├── components/
│   │   ├── my_component.tsx
│   │   └── my_component.test.tsx
│   ├── services/
│   │   ├── data_service.ts
│   │   └── data_service.test.ts
│   └── plugin.test.ts
├── server/
│   ├── routes/
│   │   └── routes.test.ts
│   └── plugin.test.ts
└── test/
    ├── fixtures/
    ├── functional/
    └── jest.config.js
```

#### Testing React Components

```typescript
import React from 'react';
import { EuiButton } from '@elastic/eui';
import { mountWithIntl } from 'test_utils/enzyme_helpers';
import { MyComponent } from './my_component';

describe('MyComponent', () => {
  it('renders with internationalization', () => {
    const wrapper = mountWithIntl(
      <MyComponent title="Test" onClick={jest.fn()} />
    );

    expect(wrapper.find(EuiButton)).toHaveLength(1);
    expect(wrapper.text()).toContain('Test');
  });
});
```

### Test Coverage and Reporting

#### Running Coverage Reports

```bash
# Generate coverage report
yarn test:jest --coverage

# Generate coverage for specific path
yarn test:jest --coverage --collectCoverageFrom='src/plugins/my_plugin/**/*.{ts,tsx}'

# View HTML report
open target/coverage/lcov-report/index.html
```

#### Coverage Requirements

- **Target**: Minimum 80% coverage for new code
- **Enforcement**: Codecov integration in CI/CD
- **Exclusions**: Configuration files, type definitions, mocks

**Coverage Configuration**:
```javascript
// jest.config.js
module.exports = {
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/test/',
    '\\.mock\\.',
    '\\.test\\.',
  ],
};
```

## Code Quality and Standards

### TypeScript Usage

#### Type Safety Best Practices

```typescript
// ✅ Good: Explicit types
interface SearchRequest {
  index: string;
  query: Query;
  size?: number;
  from?: number;
}

async function search(request: SearchRequest): Promise<SearchResponse> {
  // Implementation
}

// ❌ Bad: Using 'any'
async function search(request: any): Promise<any> {
  // Loses type safety
}
```

#### Advanced TypeScript Patterns

```typescript
// Generic constraints
interface Plugin<TSetup = {}, TStart = {}> {
  setup(): TSetup;
  start(): TStart;
}

// Conditional types
type AsyncReturnType<T extends (...args: any) => Promise<any>> =
  T extends (...args: any) => Promise<infer R> ? R : never;

// Utility types
type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

// Discriminated unions
type Action =
  | { type: 'SET_QUERY'; payload: Query }
  | { type: 'SET_RESULTS'; payload: SearchResults }
  | { type: 'SET_ERROR'; payload: Error };
```

### Linting with ESLint

#### ESLint Configuration

**.eslintrc.js**:
```javascript
module.exports = {
  extends: [
    '@elastic/eslint-config-kibana',
    'plugin:@typescript-eslint/recommended',
  ],
  rules: {
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/explicit-function-return-type': 'error',
    'no-console': 'error',
    'no-debugger': 'error',
    'import/order': ['error', {
      groups: ['builtin', 'external', 'internal', 'parent', 'sibling'],
    }],
  },
  overrides: [
    {
      files: ['*.test.ts', '*.test.tsx'],
      rules: {
        '@typescript-eslint/no-explicit-any': 'off',
      },
    },
  ],
};
```

#### Running Linters

```bash
# Run ESLint
yarn lint:es

# Fix auto-fixable issues
yarn lint:es --fix

# Lint specific files
yarn lint:es src/plugins/my_plugin/**/*.ts

# Run style linter
yarn lint:style
```

### Code Formatting with Prettier

#### Prettier Configuration

**.prettierrc**:
```json
{
  "singleQuote": true,
  "trailingComma": "es5",
  "printWidth": 100,
  "tabWidth": 2,
  "semi": true,
  "bracketSpacing": true,
  "arrowParens": "always",
  "endOfLine": "lf"
}
```

#### Pre-commit Hooks

```bash
# Run pre-commit checks
node scripts/precommit_hook.js --fix

# Manual formatting
yarn prettier --write "src/**/*.{js,jsx,ts,tsx}"
```

### Code Review Guidelines

#### Review Checklist

1. **Functionality**
   - Code works as intended
   - Edge cases handled
   - No regressions introduced

2. **Code Quality**
   - Follows coding standards
   - Well-structured and maintainable
   - Appropriate abstractions

3. **Testing**
   - Adequate test coverage (>80%)
   - Tests are meaningful
   - Edge cases tested

4. **Documentation**
   - Code is self-documenting
   - Complex logic explained
   - API changes documented

5. **Performance**
   - No obvious performance issues
   - Efficient algorithms used
   - Async operations handled properly

### Performance Optimization

#### Performance Best Practices

```typescript
// Memoization for expensive computations
import { useMemo } from 'react';

function DataTable({ data, filters }) {
  const filteredData = useMemo(
    () => data.filter(item => matchesFilters(item, filters)),
    [data, filters]
  );

  return <Table data={filteredData} />;
}

// Debouncing user input
import { debounce } from 'lodash';

const debouncedSearch = useMemo(
  () => debounce((query: string) => {
    performSearch(query);
  }, 300),
  []
);

// Virtual scrolling for large lists
import { FixedSizeList } from 'react-window';

function LargeList({ items }) {
  return (
    <FixedSizeList
      height={600}
      itemCount={items.length}
      itemSize={50}
      width="100%"
    >
      {({ index, style }) => (
        <div style={style}>
          {items[index].name}
        </div>
      )}
    </FixedSizeList>
  );
}
```

#### Bundle Size Optimization

```javascript
// Dynamic imports for code splitting
const HeavyComponent = lazy(() => import('./HeavyComponent'));

// Tree shaking with specific imports
import { debounce } from 'lodash/debounce'; // ✅ Good
import _ from 'lodash'; // ❌ Bad - imports entire library
```

### Security Best Practices

#### Input Validation

```typescript
import { schema } from '@osd/config-schema';

const searchSchema = schema.object({
  index: schema.string({ minLength: 1, maxLength: 255 }),
  query: schema.object({
    match: schema.maybe(schema.recordOf(schema.string(), schema.any())),
  }),
  size: schema.number({ min: 0, max: 10000, defaultValue: 10 }),
});

router.post({
  path: '/api/search',
  validate: {
    body: searchSchema,
  },
  handler: async (context, request, response) => {
    // Validated input available in request.body
  },
});
```

#### XSS Prevention

```typescript
// Sanitize user input
import { escape } from 'lodash';

const sanitizedHtml = escape(userInput);

// Use React's built-in XSS protection
<div>{userContent}</div> // Safe - React escapes by default

// Avoid dangerouslySetInnerHTML unless necessary
<div dangerouslySetInnerHTML={{ __html: trustedContent }} />
```

## Build Process

### Understanding the Build Pipeline

The OpenSearch Dashboards build process consists of several stages:

1. **TypeScript Compilation**: Compiles TypeScript to JavaScript
2. **Optimization**: Bundles and optimizes code with Webpack
3. **Asset Processing**: Handles CSS, images, and other assets
4. **Platform Builds**: Creates distribution packages

```bash
# Full build
yarn build

# Platform-specific build
yarn build --linux --darwin --windows

# Skip type checking (faster builds)
yarn build --skip-type-check

# Build specific plugins
yarn build --plugin-path=src/plugins/my_plugin
```

### Development vs Production Builds

#### Development Build

```bash
# Start development server
yarn start

# Features:
# - Source maps enabled
# - Hot module replacement
# - Unminified code
# - Verbose logging
# - Development React build
```

#### Production Build

```bash
# Create production build
yarn build --release

# Features:
# - Code minification
# - Tree shaking
# - Asset optimization
# - Production React build
# - Compressed bundles
```

### Webpack Configuration

#### Custom Webpack Configuration

```javascript
// packages/osd-optimizer/src/worker/webpack.config.js
module.exports = {
  mode: 'production',
  entry: {
    plugin: './public/index.ts',
  },
  output: {
    path: path.resolve(__dirname, 'target/public'),
    filename: '[name].bundle.js',
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
      {
        test: /\.scss$/,
        use: ['style-loader', 'css-loader', 'sass-loader'],
      },
    ],
  },
  optimization: {
    splitChunks: {
      chunks: 'all',
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          priority: 10,
        },
      },
    },
  },
};
```

### Bundle Optimization

#### Analyzing Bundle Size

```bash
# Generate bundle analysis
yarn analyze:bundles

# Update bundle size limits
yarn update-bundle-size-limits
```

#### Optimization Strategies

1. **Code Splitting**
   ```typescript
   // Route-based splitting
   const Dashboard = lazy(() => import('./Dashboard'));

   // Component-based splitting
   const HeavyChart = lazy(() => import('./HeavyChart'));
   ```

2. **Tree Shaking**
   ```typescript
   // Mark unused exports
   export { usedFunction } from './utils';
   // Unused exports will be eliminated
   ```

3. **Compression**
   ```javascript
   // Webpack configuration
   const CompressionPlugin = require('compression-webpack-plugin');

   plugins: [
     new CompressionPlugin({
       algorithm: 'gzip',
       test: /\.(js|css|html)$/,
       threshold: 10240,
       minRatio: 0.8,
     }),
   ];
   ```

## Troubleshooting Common Issues

### Test Failures

```bash
# Clear Jest cache
yarn test:jest --clearCache

# Run tests with verbose output
yarn test:jest --verbose

# Debug specific test
node --inspect-brk ./node_modules/.bin/jest --runInBand path/to/test.js
```

### Build Issues

```bash
# Clear all caches and rebuild
yarn osd clean
yarn cache clean
rm -rf node_modules
yarn osd bootstrap

# Check for TypeScript errors
yarn typecheck

# Verify dependencies
yarn check --integrity
```

### Performance Issues

```bash
# Profile bundle size
yarn analyze:bundles

# Run performance tests
yarn test:performance

# Check for memory leaks
node --expose-gc --inspect scripts/opensearch_dashboards --dev
```

## Best Practices Summary

1. **Testing**
   - Write tests alongside code
   - Aim for >80% coverage
   - Use appropriate testing level (unit/integration/e2e)
   - Mock external dependencies

2. **Code Quality**
   - Use TypeScript for type safety
   - Follow linting rules
   - Regular code reviews
   - Document complex logic

3. **Performance**
   - Optimize bundle size
   - Use code splitting
   - Implement proper caching
   - Profile and measure

4. **Security**
   - Validate all inputs
   - Sanitize user content
   - Follow OWASP guidelines
   - Regular security audits

## Additional Resources

- [OpenSearch Dashboards Contributing Guide](../../CONTRIBUTING.md)
- [TypeScript Documentation](../../TYPESCRIPT.md)
- [Testing Documentation](../../TESTING.md)
- [Jest Documentation](https://jestjs.io/)
- [Cypress Documentation](https://docs.cypress.io/)
- [Webpack Documentation](https://webpack.js.org/)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)

---

For questions or issues, please refer to the [OpenSearch Dashboards GitHub repository](https://github.com/opensearch-project/OpenSearch-Dashboards) or join the [OpenSearch community](https://opensearch.org/community/).