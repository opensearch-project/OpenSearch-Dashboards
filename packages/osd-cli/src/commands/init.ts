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

const EXAMPLE_DASHBOARD_SDK = `import { Dashboard, Panel, Query } from '@osd/dashboards-sdk';

const dashboard = Dashboard.create('example-dashboard')
  .title('Example Dashboard')
  .description('Created with osdctl init')
  .labels({ team: 'my-team', env: 'development' })
  .addPanel(
    Panel.create('panel-1')
      .title('Sample Visualization')
      .visualization('line')
      .gridPosition({ x: 0, y: 0, w: 24, h: 12 })
      .query(Query.ppl('source = logs | stats count() by host'))
  )
  .addPanel(
    Panel.create('panel-2')
      .title('Error Rate')
      .visualization('metric')
      .gridPosition({ x: 0, y: 12, w: 12, h: 8 })
      .query(Query.dql('level: error'))
  );

console.log(JSON.stringify(dashboard.build(), null, 2));
`;

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

function createOsdctlConfigTs(): string {
  return `/*
 * osdctl.config.ts - Entry point for Dashboards-as-Code project.
 * This file is loaded by osdctl to discover and build all dashboard definitions.
 */

import './dashboards/example';
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

  // Create example dashboard TypeScript file using SDK builder pattern
  const exampleTsPath = path.join(baseDir, 'src', 'dashboards', 'example.ts');
  fs.writeFileSync(exampleTsPath, EXAMPLE_DASHBOARD_SDK);
  printStatus('CREATE', 'src/dashboards/example.ts', 'green');

  // Create osdctl.config.ts entry point
  const configTsPath = path.join(baseDir, 'osdctl.config.ts');
  fs.writeFileSync(configTsPath, createOsdctlConfigTs());
  printStatus('CREATE', 'osdctl.config.ts', 'green');

  printSuccess(`Project "${projectName}" initialized successfully!`);
  console.log(`\nNext steps:`);
  console.log(`  cd ${directory}`);
  console.log(`  osdctl build -d src/`);
  console.log(`  osdctl validate`);
  console.log(`  osdctl apply --dry-run`);
}
