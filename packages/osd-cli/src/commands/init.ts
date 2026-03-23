/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import * as fs from 'fs';
import * as path from 'path';
import { printStatus, printHeader, printSuccess, printWarning } from '../utils/output';
import { toYaml } from '../utils/yaml';

export interface InitOptions {
  directory: string;
  language: string;
}

const SUPPORTED_LANGUAGES = ['typescript'];
const COMING_SOON_LANGUAGES = ['python', 'go', 'java'];

const EXAMPLE_DASHBOARD = {
  type: 'dashboard',
  id: 'example-dashboard',
  attributes: {
    title: 'Example Dashboard',
    description: 'An example dashboard created with osdctl',
    panels: [
      {
        panelIndex: '1',
        gridData: { x: 0, y: 0, w: 24, h: 15, i: '1' },
        type: 'visualization',
        id: 'example-viz',
      },
    ],
    options: '{"hidePanelTitles":false,"useMargins":true}',
  },
  labels: {
    'managed-by': 'osdctl',
    team: 'my-team',
  },
  annotations: {
    'osdctl.opensearch.org/source': 'dashboards-as-code',
  },
  references: [],
};

const PROJECT_OSDCTL_YAML = {
  defaultProfile: 'dev',
  outputDir: './built',
  profiles: {
    dev: {
      url: 'http://localhost:5601',
    },
    staging: {
      url: 'https://staging.example.com',
    },
    prod: {
      url: 'https://prod.example.com',
    },
  },
  lint: {
    'require-labels': true,
    'require-description': true,
    'max-panels': 50,
  },
};

const GITIGNORE_CONTENT = `# Built output
built/
target/
dist/

# Dependencies
node_modules/

# OS files
.DS_Store
Thumbs.db

# IDE
.idea/
.vscode/
*.swp
*.swo
`;

function createPackageJson(projectName: string): object {
  return {
    name: projectName,
    version: '0.1.0',
    description: 'OpenSearch Dashboards as Code project',
    license: 'Apache-2.0',
    scripts: {
      build: 'osdctl build -d src/',
      validate: 'osdctl validate',
      diff: 'osdctl diff',
      apply: 'osdctl apply',
      lint: 'osdctl lint',
    },
  };
}

function createTsConfig(): object {
  return {
    compilerOptions: {
      target: 'ES2020',
      module: 'commonjs',
      lib: ['ES2020'],
      outDir: './built',
      rootDir: './src',
      strict: true,
      esModuleInterop: true,
    },
    include: ['src/**/*.ts'],
  };
}

function createExampleTsFile(): string {
  return `/*
 * Example dashboard definition using TypeScript.
 * Run: osdctl build -f src/dashboards/example.ts
 */

const dashboard = {
  type: 'dashboard',
  id: 'example-dashboard',
  attributes: {
    title: 'Example Dashboard',
    description: 'An example dashboard created with osdctl',
    panels: [
      {
        panelIndex: '1',
        gridData: { x: 0, y: 0, w: 24, h: 15, i: '1' },
        type: 'visualization',
        id: 'example-viz',
      },
    ],
    options: JSON.stringify({ hidePanelTitles: false, useMargins: true }),
  },
  labels: {
    'managed-by': 'osdctl',
    team: 'my-team',
  },
  annotations: {
    'osdctl.opensearch.org/source': 'dashboards-as-code',
  },
  references: [],
};

// Output the dashboard definition
console.log(JSON.stringify(dashboard, null, 2));
`;
}

/**
 * Execute the init command to scaffold a new DaC project.
 */
export async function initCommand(options: InitOptions): Promise<void> {
  const { directory, language } = options;
  const projectName = path.basename(path.resolve(directory));

  // Check language support
  if (COMING_SOON_LANGUAGES.includes(language)) {
    printWarning(`Language "${language}" support is coming soon. Using TypeScript for now.`);
  } else if (!SUPPORTED_LANGUAGES.includes(language) && !COMING_SOON_LANGUAGES.includes(language)) {
    printWarning(
      `Unknown language "${language}". Supported: ${[...SUPPORTED_LANGUAGES, ...COMING_SOON_LANGUAGES].join(', ')}. Using TypeScript.`
    );
  }

  printHeader(`Initializing DaC project: ${projectName}`);

  const baseDir = path.resolve(directory);

  // Create directories
  const dirs = [
    baseDir,
    path.join(baseDir, 'src'),
    path.join(baseDir, 'src', 'dashboards'),
    path.join(baseDir, 'built'),
  ];

  for (const dir of dirs) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      printStatus('CREATE', dir, 'green');
    }
  }

  // Create package.json
  const pkgJsonPath = path.join(baseDir, 'package.json');
  fs.writeFileSync(pkgJsonPath, JSON.stringify(createPackageJson(projectName), null, 2) + '\n');
  printStatus('CREATE', 'package.json', 'green');

  // Create tsconfig.json
  const tsconfigPath = path.join(baseDir, 'tsconfig.json');
  fs.writeFileSync(tsconfigPath, JSON.stringify(createTsConfig(), null, 2) + '\n');
  printStatus('CREATE', 'tsconfig.json', 'green');

  // Create .osdctl.yaml
  const osdctlYamlPath = path.join(baseDir, '.osdctl.yaml');
  fs.writeFileSync(osdctlYamlPath, toYaml(PROJECT_OSDCTL_YAML));
  printStatus('CREATE', '.osdctl.yaml', 'green');

  // Create .gitignore
  const gitignorePath = path.join(baseDir, '.gitignore');
  fs.writeFileSync(gitignorePath, GITIGNORE_CONTENT);
  printStatus('CREATE', '.gitignore', 'green');

  // Create example dashboard TypeScript file
  const exampleTsPath = path.join(baseDir, 'src', 'dashboards', 'example.ts');
  fs.writeFileSync(exampleTsPath, createExampleTsFile());
  printStatus('CREATE', 'src/dashboards/example.ts', 'green');

  // Create example dashboard JSON
  const exampleJsonPath = path.join(baseDir, 'src', 'dashboards', 'example.json');
  fs.writeFileSync(exampleJsonPath, JSON.stringify(EXAMPLE_DASHBOARD, null, 2) + '\n');
  printStatus('CREATE', 'src/dashboards/example.json', 'green');

  printSuccess(`Project "${projectName}" initialized successfully!`);
  console.log(`\nNext steps:`);
  console.log(`  cd ${directory}`);
  console.log(`  osdctl build -d src/`);
  console.log(`  osdctl validate`);
  console.log(`  osdctl apply --dry-run`);
}
