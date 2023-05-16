/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Upgrades the chromedriver dev-dependency to the one supported by the version of Google Chrome
 * installed on the machine.
 *
 * Usage: node scripts/upgrade_chromedriver.js [--install]
 */

/* eslint no-restricted-syntax: 0 */
const { execSync, spawnSync } = require('child_process');
const { createReadStream, createWriteStream, unlinkSync, renameSync, existsSync } = require('fs');
const { createInterface } = require('readline');

if (!process.argv.includes(__filename)) {
  console.error('Usage: node scripts/upgrade_chromedriver.js [--install]');
  process.exit(1);
}

const versionCheckCommands = [];

switch (process.platform) {
  case 'win32':
    versionCheckCommands.push(
      'powershell "(Get-Item \\"$Env:Programfiles/Google/Chrome/Application/chrome.exe\\").VersionInfo.FileVersion"'
    );
    break;

  case 'darwin':
    versionCheckCommands.push(
      '/Applications/Google\\ Chrome.app/Contents/MacOS/Google\\ Chrome --version'
    );
    break;

  default:
    versionCheckCommands.push(
      ...[
        '/usr/bin',
        '/usr/local/bin',
        '/usr/sbin',
        '/usr/local/sbin',
        '/opt/bin',
        '/usr/bin/X11',
        '/usr/X11R6/bin',
      ].flatMap((loc) =>
        [
          'google-chrome --version',
          'google-chrome-stable --version',
          'chromium --version',
          'chromium-browser --version',
        ].map((cmd) => `${loc}/${cmd}`)
      )
    );
}

let versionCheckOutput;
versionCheckCommands.some((cmd) => {
  try {
    console.log(cmd);
    versionCheckOutput = (execSync(cmd, { encoding: 'utf8' }) || '').trim();
    return true;
  } catch (e) {
    console.log('Failed to get version using', cmd);
  }
});

// Versions 90+
const versionCheckOutputTokens = (versionCheckOutput || '').match(/(?:^|\s)(9\d|\d{3})\./);
const majorVersion = Array.isArray(versionCheckOutputTokens) && versionCheckOutputTokens[1];

if (majorVersion) {
  let targetVersion = `^${majorVersion}`;

  // TODO: Temporary fix to install chromedriver 112.0.0 if major version is 112.
  //       Exit if major version is greater than 112.
  //       Revert this once node is bumped to 16+.
  // https://github.com/opensearch-project/OpenSearch-Dashboards/issues/3975
  if (parseInt(majorVersion) === 112) {
    targetVersion = '112.0.0';
  } else if (parseInt(majorVersion) > 112) {
    console.error(
      `::error::Chrome version (${majorVersion}) is not supported by this script. The largest chrome version we support is 112.`
    );
    process.exit(1);
  }

  if (process.argv.includes('--install')) {
    console.log(`Installing chromedriver@${targetVersion}`);

    spawnSync(`yarn add --dev chromedriver@${targetVersion}`, {
      stdio: 'inherit',
      cwd: process.cwd(),
      shell: true,
    });
  } else {
    console.log(`Upgrading to chromedriver@${targetVersion}`);

    let upgraded = false;
    const writeStream = createWriteStream('package.json.upgrading-chromedriver', { flags: 'w' });
    const rl = createInterface({
      input: createReadStream('package.json'),
      crlfDelay: Infinity,
    });
    rl.on('line', (line) => {
      if (line.includes('"chromedriver": "')) {
        line = line.replace(
          /"chromedriver":\s*"[~^]?\d[\d.]*\d"/,
          `"chromedriver": "${targetVersion}"`
        );
        upgraded = true;
      }
      writeStream.write(line + '\n', 'utf8');
    });
    rl.on('close', () => {
      writeStream.end();
      if (upgraded) {
        // Remove any previous backups
        if (existsSync('package.json.bak')) unlinkSync('package.json.bak');

        renameSync('package.json', 'package.json.bak');
        renameSync('package.json.upgrading-chromedriver', 'package.json');

        console.log(`Backed up package.json and updated chromedriver to ${targetVersion}`);
      } else {
        unlinkSync('package.json.upgrading-chromedriver');
        console.error(
          `Failed to update chromedriver to ${targetVersion}. Try adding the \`--install\` switch.`
        );
      }
    });
  }
} else {
  console.debug(versionCheckOutput);
  console.error(`Failed to extract the version of the installed Google Chrome.`);
}
