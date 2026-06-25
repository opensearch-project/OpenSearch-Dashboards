/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { initCommand } from '../../commands/init';

describe('init command', () => {
  let tmpDir: string;
  let consoleSpy: jest.SpyInstance;
  let warnSpy: jest.SpyInstance;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'osdctl-init-test-'));
    consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    warnSpy = jest.spyOn(console, 'warn').mockImplementation();
  });

  afterEach(() => {
    consoleSpy.mockRestore();
    warnSpy.mockRestore();
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('should create the correct directory structure', async () => {
    const projectDir = path.join(tmpDir, 'my-project');
    await initCommand({ directory: projectDir, language: 'typescript' });

    expect(fs.existsSync(projectDir)).toBe(true);
    expect(fs.existsSync(path.join(projectDir, 'src'))).toBe(true);
    expect(fs.existsSync(path.join(projectDir, 'src', 'dashboards'))).toBe(true);
    expect(fs.existsSync(path.join(projectDir, 'built'))).toBe(true);
  });

  it('should generate a valid package.json', async () => {
    const projectDir = path.join(tmpDir, 'my-project');
    await initCommand({ directory: projectDir, language: 'typescript' });

    const pkgJsonPath = path.join(projectDir, 'package.json');
    expect(fs.existsSync(pkgJsonPath)).toBe(true);

    const pkgJson = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf-8'));
    expect(pkgJson.name).toBe('my-project');
    expect(pkgJson.version).toBe('0.1.0');
    expect(pkgJson.scripts).toBeDefined();
    expect(pkgJson.scripts.build).toContain('osdctl');
  });

  it('should generate a valid example dashboard JSON file', async () => {
    const projectDir = path.join(tmpDir, 'my-project');
    await initCommand({ directory: projectDir, language: 'typescript' });

    const examplePath = path.join(projectDir, 'src', 'dashboards', 'example.json');
    expect(fs.existsSync(examplePath)).toBe(true);

    const example = JSON.parse(fs.readFileSync(examplePath, 'utf-8'));
    expect(example.type).toBe('dashboard');
    expect(example.id).toBe('example-dashboard');
    expect(example.attributes).toBeDefined();
    expect(example.attributes.title).toBe('Example Dashboard');
    expect(example.labels).toBeDefined();
    expect(example.labels['managed-by']).toBe('osdctl');
  });

  it('should generate a .osdctl.yaml file', async () => {
    const projectDir = path.join(tmpDir, 'my-project');
    await initCommand({ directory: projectDir, language: 'typescript' });

    const configPath = path.join(projectDir, '.osdctl.yaml');
    expect(fs.existsSync(configPath)).toBe(true);

    const content = fs.readFileSync(configPath, 'utf-8');
    expect(content).toContain('defaultProfile');
    expect(content).toContain('dev');
  });

  it('should generate a .gitignore file', async () => {
    const projectDir = path.join(tmpDir, 'my-project');
    await initCommand({ directory: projectDir, language: 'typescript' });

    const gitignorePath = path.join(projectDir, '.gitignore');
    expect(fs.existsSync(gitignorePath)).toBe(true);

    const content = fs.readFileSync(gitignorePath, 'utf-8');
    expect(content).toContain('node_modules');
    expect(content).toContain('built/');
  });

  it('should generate a tsconfig.json', async () => {
    const projectDir = path.join(tmpDir, 'my-project');
    await initCommand({ directory: projectDir, language: 'typescript' });

    const tsconfigPath = path.join(projectDir, 'tsconfig.json');
    expect(fs.existsSync(tsconfigPath)).toBe(true);

    const tsconfig = JSON.parse(fs.readFileSync(tsconfigPath, 'utf-8'));
    expect(tsconfig.compilerOptions).toBeDefined();
    expect(tsconfig.compilerOptions.strict).toBe(true);
  });

  it('should generate an example TypeScript file', async () => {
    const projectDir = path.join(tmpDir, 'my-project');
    await initCommand({ directory: projectDir, language: 'typescript' });

    const tsPath = path.join(projectDir, 'src', 'dashboards', 'example.ts');
    expect(fs.existsSync(tsPath)).toBe(true);

    const content = fs.readFileSync(tsPath, 'utf-8');
    expect(content).toContain('dashboard');
    expect(content).toContain('console.log');
  });

  it('should warn about coming soon languages', async () => {
    const projectDir = path.join(tmpDir, 'python-project');
    await initCommand({ directory: projectDir, language: 'python' });

    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('coming soon')
    );

    // Should still create the project (with TypeScript defaults)
    expect(fs.existsSync(path.join(projectDir, 'package.json'))).toBe(true);
  });

  it('should warn about unknown languages', async () => {
    const projectDir = path.join(tmpDir, 'unknown-project');
    await initCommand({ directory: projectDir, language: 'rust' });

    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('Unknown language')
    );
  });
});
