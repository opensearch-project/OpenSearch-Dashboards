# Getting Started with OpenSearch Dashboards Development

Welcome to OpenSearch Dashboards! This guide will walk you through setting up your development environment and making your first contribution. Whether you're new to the project or just need a refresher, this guide provides practical, step-by-step instructions to get you productive quickly.

## Table of Contents

1. [Prerequisites and Environment Setup](#prerequisites-and-environment-setup)
2. [Development Environment Configuration](#development-environment-configuration)
3. [First Time Setup and Bootstrap Process](#first-time-setup-and-bootstrap-process)
4. [Running OpenSearch Dashboards in Development Mode](#running-opensearch-dashboards-in-development-mode)
5. [Your First Contribution](#your-first-contribution)
6. [Troubleshooting Common Issues](#troubleshooting-common-issues)
7. [Next Steps](#next-steps)

## Prerequisites and Environment Setup

Before you begin developing for OpenSearch Dashboards, you'll need to set up your development environment with the required tools and dependencies.

### System Requirements

OpenSearch Dashboards development is supported on:
- **macOS**: 10.15 (Catalina) or later
- **Linux**: Ubuntu 18.04+, CentOS 7+, or equivalent distributions
- **Windows**: Windows 10 with WSL2 (Windows Subsystem for Linux)

**Minimum Hardware Requirements:**
- **RAM**: 8 GB minimum, 16 GB recommended
- **Storage**: 10 GB free space for code and dependencies
- **CPU**: 4 cores recommended for faster builds

### Required Tools

#### 1. Git (Version Control)

Git is essential for cloning the repository and managing your contributions.

```bash
# Check if Git is installed
git --version

# If not installed:
# macOS (using Homebrew)
brew install git

# Ubuntu/Debian
sudo apt-get update && sudo apt-get install git

# CentOS/RHEL
sudo yum install git
```

#### 2. Node.js and npm

OpenSearch Dashboards requires a specific Node.js version defined in the `.nvmrc` file.

**Recommended: Use Node Version Manager (nvm)**

```bash
# Install nvm (macOS/Linux)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.3/install.sh | bash

# Reload your shell configuration
source ~/.bashrc  # or ~/.zshrc for zsh users

# Verify nvm installation
nvm --version
```

For Windows users, use [nvm-windows](https://github.com/coreybutler/nvm-windows):
1. Download the installer from the [releases page](https://github.com/coreybutler/nvm-windows/releases)
2. Run the installer
3. Open a new PowerShell or Command Prompt as Administrator

#### 3. Yarn Package Manager

OpenSearch Dashboards uses Yarn for dependency management. We'll install it using Corepack (included with Node.js 16.10+).

```bash
# Enable Corepack
npm install -g corepack

# Install the correct Yarn version
corepack enable
corepack prepare yarn@1.22.19 --activate

# Verify Yarn installation
yarn --version
```

### IDE Setup and Recommendations

While you can use any text editor, we recommend using an IDE with good TypeScript/JavaScript support.

#### Visual Studio Code (Recommended)

1. Download and install [VS Code](https://code.visualstudio.com/)
2. Install recommended extensions:

```bash
# Create a workspace settings file with recommended extensions
cat > .vscode/extensions.json << EOF
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "ms-vscode.vscode-typescript-tslint-plugin",
    "streetsidesoftware.code-spell-checker",
    "eamodio.gitlens"
  ]
}
EOF
```

3. Configure VS Code settings for the project:

```bash
# Create workspace settings
cat > .vscode/settings.json << EOF
{
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.tsdk": "node_modules/typescript/lib",
  "files.exclude": {
    "**/node_modules": true,
    "**/target": true,
    "**/.git": true
  }
}
EOF
```

#### Alternative IDEs

- **WebStorm/IntelliJ IDEA**: Excellent TypeScript support out of the box
- **Sublime Text**: Install TypeScript and ESLint packages
- **Atom**: Install `atom-typescript` and `linter-eslint` packages

## Development Environment Configuration

### Forking and Cloning the Repository

1. **Fork the repository on GitHub:**
   - Navigate to https://github.com/opensearch-project/OpenSearch-Dashboards
   - Click the "Fork" button in the top-right corner
   - Select your GitHub account as the destination

2. **Clone your fork locally:**

```bash
# Replace YOUR_USERNAME with your GitHub username
git clone git@github.com:YOUR_USERNAME/OpenSearch-Dashboards.git
cd OpenSearch-Dashboards

# Add the upstream repository as a remote
git remote add upstream git@github.com:opensearch-project/OpenSearch-Dashboards.git

# Verify your remotes
git remote -v
# You should see:
# origin    git@github.com:YOUR_USERNAME/OpenSearch-Dashboards.git (fetch)
# origin    git@github.com:YOUR_USERNAME/OpenSearch-Dashboards.git (push)
# upstream  git@github.com:opensearch-project/OpenSearch-Dashboards.git (fetch)
# upstream  git@github.com:opensearch-project/OpenSearch-Dashboards.git (push)
```

### Installing Dependencies with Yarn

After cloning the repository, install the correct Node.js version and project dependencies:

```bash
# Navigate to the project directory
cd OpenSearch-Dashboards

# Install the Node.js version specified in .nvmrc
nvm install
nvm use

# Verify you're using the correct Node version
node --version  # Should match the version in .nvmrc

# Install Yarn dependencies (this may take several minutes)
yarn install
```

### Environment Variables and Configuration

OpenSearch Dashboards uses several environment variables for configuration. Here are the most important ones for development:

```bash
# Create a .env file for local development (optional)
cat > .env << EOF
# Development server configuration
SERVER_HOST=localhost
SERVER_PORT=5601

# OpenSearch connection
OPENSEARCH_HOSTS=http://localhost:9200

# Enable development features
NODE_ENV=development

# Increase memory for Node.js (if needed)
NODE_OPTIONS="--max-old-space-size=4096"
EOF
```

**Important Configuration Files:**

- `opensearch_dashboards.yml`: Main configuration file (created during setup)
- `.env`: Environment variables (optional, for local overrides)
- `config/`: Directory containing default configurations

## First Time Setup and Bootstrap Process

The bootstrap process sets up all internal packages and plugins. This is a crucial step that must be completed before you can run OpenSearch Dashboards.

### Running Bootstrap Commands

```bash
# Bootstrap the project (install dependencies and build packages)
yarn osd bootstrap

# This command:
# 1. Installs all npm dependencies
# 2. Builds internal packages
# 3. Generates necessary files
# 4. Sets up plugin dependencies
```

**Note:** The bootstrap process can take 5-15 minutes depending on your system. You'll see output like:
```
info [osd] running yarn in non-root workspace project
info Bootstrapping packages [1/3]
info Installing dependencies [2/3]
info Building packages [3/3]
success Bootstrap complete!
```

### Understanding the Project Structure

After bootstrapping, familiarize yourself with the project structure:

```
OpenSearch-Dashboards/
├── src/
│   ├── core/           # Core framework code
│   ├── plugins/        # Built-in plugins
│   └── dev/           # Development utilities
├── packages/          # Shared packages
├── config/           # Configuration files
├── scripts/          # Build and utility scripts
├── test/            # Test utilities and fixtures
├── docs/            # Documentation
└── examples/        # Example plugins
```

**Key Directories:**

- **`src/core/`**: Core services (HTTP, saved objects, UI settings)
- **`src/plugins/`**: Official plugins (visualizations, dashboard, discover)
- **`packages/`**: Reusable packages used across the project
- **`examples/`**: Example plugins demonstrating APIs

### Initial Configuration

Create a basic configuration file for development:

```bash
# Create a development configuration
cat > config/opensearch_dashboards.dev.yml << EOF
# Development configuration
server.host: "localhost"
server.port: 5601

# OpenSearch connection
opensearch.hosts: ["http://localhost:9200"]
opensearch.username: "admin"
opensearch.password: "admin"

# Development settings
logging.verbose: true
ops.interval: 5000

# Disable SSL verification for development
opensearch.ssl.verificationMode: none
EOF
```

## Running OpenSearch Dashboards in Development Mode

### Starting OpenSearch Backend

OpenSearch Dashboards requires a running OpenSearch instance. You have several options:

#### Option 1: Run OpenSearch Snapshot (Recommended for Development)

```bash
# Download and run the latest OpenSearch snapshot
yarn opensearch snapshot

# This command:
# 1. Downloads the latest OpenSearch build
# 2. Extracts it to .opensearch/
# 3. Starts OpenSearch on port 9200

# Wait for the output:
# [o.e.n.Node] [snapshot] started
```

#### Option 2: Run OpenSearch from Docker

```bash
# Run OpenSearch in Docker
docker run -d \
  --name opensearch-dev \
  -p 9200:9200 \
  -p 9300:9300 \
  -e "discovery.type=single-node" \
  -e "plugins.security.disabled=true" \
  opensearchproject/opensearch:latest

# Verify OpenSearch is running
curl -X GET "localhost:9200"
```

#### Option 3: Connect to Existing Cluster

If you have an existing OpenSearch cluster, update your configuration:

```bash
# Edit config/opensearch_dashboards.dev.yml
opensearch.hosts: ["https://your-cluster-url:9200"]
opensearch.username: "your-username"
opensearch.password: "your-password"
```

### Starting OpenSearch Dashboards

With OpenSearch running, start the OpenSearch Dashboards development server:

```bash
# Start the development server
yarn start

# With custom configuration
# Note: config/opensearch_dashboards.dev.yml is automatically loaded and git ignored. This just shows how to pass a custom config
yarn start --config config/opensearch_dashboards.dev.yml

# With additional options
yarn start --verbose --no-base-path
```

**Development Server Options:**

- `--verbose`: Enable verbose logging
- `--no-base-path`: Disable base path (useful for development)
- `--no-watch`: Disable file watching (faster startup)
- `--run-examples`: Include example plugins

### Accessing the Development Environment

Once the server starts (look for `Server running at http://localhost:5601`):

1. Open your browser and navigate to http://localhost:5601
2. Default login (if security is enabled):
   - Username: `admin`
   - Password: `admin` (TODO: This isnt accurate. Right now it matches the uname and pwd of the Backing opensearch server)

**First Time Setup:**
1. You'll see the OpenSearch Dashboards home page
2. Click "Add sample data" to load test data
3. Explore the interface: Discover, Visualize, Dashboard

### Basic Troubleshooting

**Common Startup Issues:**

1. **Port Already in Use:**
```bash
# Find and kill the process using port 5601
lsof -i :5601  # macOS/Linux
netstat -ano | findstr :5601  # Windows

# Or use a different port
yarn start --port 5602
```

2. **OpenSearch Connection Failed:**
```bash
# Verify OpenSearch is running
curl -X GET "localhost:9200"

# Check logs for connection errors
tail -f ./data/opensearch-dashboards.log
```

3. **Out of Memory Errors:**
```bash
# Increase Node.js memory limit
export NODE_OPTIONS="--max-old-space-size=4096"
yarn start
```

## Your First Contribution

Let's walk through making a simple contribution to understand the development workflow.

### Making a Simple Change

We'll add a custom message to the home page as an example:

1. **Create a new branch:**
```bash
git checkout -b feature/my-first-contribution
```

2. **Locate the home plugin:**
```bash
# The home page is in the home plugin
cd src/plugins/home/public
```

3. **Make a simple change:**

Edit `src/plugins/home/public/application/components/home.tsx`:

```typescript
// Add after the existing imports
import { EuiCallOut } from '@elastic/eui';

// In the Home component, add after the <EuiPageContent> opening tag:
<EuiCallOut
  title="Welcome to OpenSearch Dashboards Development!"
  color="success"
  iconType="check"
>
  <p>You've successfully set up your development environment!</p>
</EuiCallOut>
```

4. **See your changes:**
- The development server hot-reloads most changes
- Refresh your browser to see the new message on the home page

### Understanding the Development Workflow

The typical development workflow follows these steps:

1. **Plan Your Change:**
   - Open an issue to discuss your proposed change
   - Get feedback from maintainers
   - Understand the requirements

2. **Develop:**
   - Create a feature branch
   - Make your changes
   - Write/update tests
   - Test manually

3. **Test:**
   - Run unit tests
   - Run integration tests
   - Test in different browsers
   - Check for accessibility

4. **Submit:**
   - Commit with a descriptive message
   - Push to your fork
   - Open a pull request
   - Address review feedback

### Testing Changes Locally

OpenSearch Dashboards has several types of tests:

#### Unit Tests

```bash
# Run all unit tests
yarn test:jest

# Run tests for a specific plugin
yarn test:jest src/plugins/home

# Run tests in watch mode
yarn test:jest --watch

# Run tests with coverage
yarn test:jest --coverage
```

#### Integration Tests

```bash
# Run functional tests
yarn test:ftr

# Run specific test suites
yarn test:ftr --include-tag=smoke
```

#### Linting and Formatting

```bash
# Run ESLint
yarn lint

# Auto-fix linting issues
yarn lint --fix

# Check TypeScript types
yarn typecheck

# Format code with Prettier
yarn prettier
```

### Example: Adding a Custom Visualization

Let's create a simple custom visualization as a more complex example:

1. **Generate a new plugin:**
```bash
# Use the plugin generator
node scripts/generate_plugin.js custom_viz

# Answer the prompts:
# Plugin name: custom_viz
# Description: A custom visualization example
```

2. **Implement the visualization:**

Create `plugins/custom_viz/public/custom_vis.tsx`:

```typescript
import React from 'react';
import { EuiPanel, EuiText } from '@elastic/eui';

interface CustomVisProps {
  data: any;
  title: string;
}

export const CustomVis: React.FC<CustomVisProps> = ({ data, title }) => {
  return (
    <EuiPanel>
      <EuiText>
        <h2>{title}</h2>
        <p>Data points: {data.length}</p>
      </EuiText>
    </EuiPanel>
  );
};
```

3. **Register the visualization:**

Update `plugins/custom_viz/public/plugin.ts`:

```typescript
import { Plugin } from '../../../src/core/public';
import { visualizations } from '../../../src/plugins/visualizations/public';

export class CustomVizPlugin implements Plugin {
  setup(core, { visualizations }) {
    visualizations.createVizType({
      name: 'custom_viz',
      title: 'Custom Visualization',
      icon: 'visArea',
      description: 'A custom visualization example',
      visConfig: {
        component: CustomVis,
        defaults: {
          title: 'My Custom Viz'
        }
      }
    });
  }

  start() {}
  stop() {}
}
```

4. **Test your visualization:**
   - Restart the development server
   - Go to Visualize → Create visualization
   - Select "Custom Visualization"
   - Configure and save

## Troubleshooting Common Issues

### Build and Bootstrap Issues

**Problem: Bootstrap fails with network timeout**
```bash
# Solution: Increase network timeout
yarn osd bootstrap --network-timeout 1000000

# Or configure in .yarnrc
echo "network-timeout 1000000" >> .yarnrc
```

**Problem: Bootstrap fails with permission errors**
```bash
# Solution: Clear caches and retry
yarn cache clean
rm -rf node_modules
yarn osd bootstrap
```

**Problem: Out of memory during build**
```bash
# Solution: Increase Node.js memory
export NODE_OPTIONS="--max-old-space-size=8192"
yarn osd bootstrap
```

### Development Server Issues

**Problem: Server won't start - port in use**
```bash
# Find process using port
lsof -i :5601

# Kill the process
kill -9 <PID>

# Or use different port
yarn start --port 5602
```

**Problem: Cannot connect to OpenSearch**
```bash
# Check OpenSearch is running
curl localhost:9200

# Check configuration
cat config/opensearch_dashboards.yml | grep opensearch.hosts

# Test connection with credentials
curl -u admin:admin localhost:9200
```

**Problem: Changes not reflecting**
```bash
# Clear optimizer cache
rm -rf data/optimize
rm -rf .cache

# Restart with clean build
yarn osd clean
yarn osd bootstrap
yarn start
```

### Common Development Errors

**TypeScript Errors:**
```bash
# Check TypeScript compilation
yarn typecheck

# Fix common issues:
# - Missing types: yarn add @types/package-name
# - Type conflicts: Check tsconfig.json
```

**ESLint Errors:**
```bash
# Auto-fix most issues
yarn lint --fix

# Check specific file
yarn eslint path/to/file.ts
```

**Test Failures:**
```bash
# Run failed test in isolation
yarn test:jest path/to/test --no-cache

# Debug test
node --inspect-brk scripts/jest.js path/to/test
```

### Performance Issues

**Slow Development Server:**
```bash
# Disable unnecessary plugins
yarn start --plugin-path.data=false --plugin-path.telemetry=false

# Use production builds of dependencies
NODE_ENV=production yarn start

# Disable file watching for large projects
yarn start --no-watch
```

**Slow Test Execution:**
```bash
# Run tests in parallel
yarn test:jest --maxWorkers=4

# Run only changed tests
yarn test:jest -o

# Skip coverage collection
yarn test:jest --coverage=false
```

## Next Steps

Congratulations! You've successfully set up your OpenSearch Dashboards development environment and made your first changes. Here's what to explore next:

### Learn the Architecture

1. **Read the Core Documentation:**
   - [Plugin System](onboarding/plugin_system.md) - Understand how plugins work
   - [Core Framework Architecture](onboarding/core_framework_architecture.md) - Learn about core services
   - [UI Framework](onboarding/ui_framework_and_components.md) - Master the UI components

2. **Explore Example Plugins:**
   ```bash
   # Run with examples enabled
   yarn start --run-examples

   # Browse example code
   ls examples/
   ```

3. **Study Existing Plugins:**
   - `src/plugins/data/` - Data access and search
   - `src/plugins/dashboard/` - Dashboard functionality
   - `src/plugins/visualizations/` - Visualization framework

### Join the Community

1. **Communication Channels:**
   - [Slack](https://opensearch.org/slack.html) - Real-time discussions
   - [Forum](https://forum.opensearch.org/) - Q&A and discussions
   - [GitHub Discussions](https://github.com/opensearch-project/OpenSearch-Dashboards/discussions) - Feature discussions

2. **Contributing:**
   - Review [CONTRIBUTING.md](../../CONTRIBUTING.md)
   - Check [good first issues](https://github.com/opensearch-project/OpenSearch-Dashboards/labels/good%20first%20issue)
   - Attend developer office hours

3. **Stay Updated:**
   - Watch the repository for updates
   - Subscribe to the [newsletter](https://opensearch.org/newsletter.html)
   - Follow [@OpenSearchProj](https://twitter.com/OpenSearchProj) on Twitter

### Advanced Topics

Once comfortable with the basics, explore:

1. **Plugin Development:**
   - Create custom visualizations
   - Build data sources
   - Develop saved object types

2. **Performance Optimization:**
   - Bundle optimization
   - Lazy loading strategies
   - Caching mechanisms

3. **Testing Strategies:**
   - Unit testing with Jest
   - Integration testing with FTR
   - E2E testing with Cypress

4. **Security Features:**
   - Authentication plugins
   - Authorization patterns
   - Security best practices

### Useful Commands Reference

```bash
# Development
yarn start                    # Start dev server
yarn start --help            # See all options
yarn opensearch snapshot     # Run OpenSearch

# Testing
yarn test:jest              # Run unit tests
yarn test:ftr              # Run functional tests
yarn lint                  # Run linter

# Building
yarn build                 # Build for production
yarn osd bootstrap        # Setup development
yarn osd clean           # Clean build artifacts

# Utilities
yarn typecheck          # Check TypeScript
yarn prettier          # Format code
node scripts/generate_plugin.js  # Generate plugin
```

### Getting Help

If you encounter issues not covered in this guide:

1. **Search existing issues:** [GitHub Issues](https://github.com/opensearch-project/OpenSearch-Dashboards/issues)
2. **Ask on Slack:** [#opensearch-dashboards](https://opensearch.slack.com/archives/C01QF59JPCH)
3. **Post on the forum:** [OpenSearch Forum](https://forum.opensearch.org/c/opensearch-dashboards/6)
4. **Check the FAQ:** [Frequently Asked Questions](https://opensearch.org/faq/)

Remember, the OpenSearch community is here to help. Don't hesitate to ask questions as you learn!

---

*This guide is part of the OpenSearch Dashboards onboarding documentation. For more detailed information, see the [Developer Guide](../DEVELOPER_GUIDE.md) and other [onboarding docs](onboarding/README.md).*