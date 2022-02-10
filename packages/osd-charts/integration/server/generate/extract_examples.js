/*
 * Licensed to Elasticsearch B.V. under one or more contributor
 * license agreements. See the NOTICE file distributed with
 * this work for additional information regarding copyright
 * ownership. Elasticsearch B.V. licenses this file to you under
 * the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

const fs = require('fs');
const path = require('path');

const lodash = require('lodash');
const slugify = require('slugify');
const ts = require('typescript');

/**
 * Simple utility function to recursively read a dir
 */
function readdirSync(dir, fileList = []) {
  if (fs.statSync(dir).isDirectory()) {
    fs.readdirSync(dir).map((fileName) => readdirSync(fileList[fileList.push(path.join(dir, fileName)) - 1], fileList));
  }
  return fileList;
}

/**
 * For each `*.stories.ts` file, compile their AST with Typescript and extract:
 * - the default exports object (in particular the title used on the story)
 * - for each named exports, extract their names + file paths
 */
function extractExamples(exampleRelativePath = 'stories') {
  // eslint-disable-next-line no-console
  console.log('Extract examples from', path.join(process.cwd(), exampleRelativePath));

  const fileNames = readdirSync(exampleRelativePath).filter((item) => lodash.includes(item, '.stories.ts'));

  // eslint-disable-next-line no-console
  console.log('Total example files:', fileNames.length);

  return fileNames
    .map((groupFile) => {
      const examples = [];
      let groupTitle = '';
      // https://github.com/Microsoft/TypeScript/wiki/Using-the-Compiler-API#using-the-type-checker
      // Build a program using the set of root file names in fileNames
      const program = ts.createProgram([groupFile], {
        module: ts.ModuleKind.ES2015,
        moduleResolution: ts.ModuleResolutionKind.NodeJs,
        target: ts.ScriptTarget.ES5,
      });
      // Visit every sourceFile in the program
      program
        .getSourceFiles()
        .filter((sourceFile) => lodash.includes(sourceFile.fileName, groupFile))
        .forEach((sourceFile) => {
          ts.forEachChild(sourceFile, (node) => {
            // get the default export
            if (node.kind === ts.SyntaxKind.ExportAssignment) {
              groupTitle = node.expression.properties.find((p) => p.name.escapedText === 'title').initializer.text;
            }
            // get the named export
            if (node.kind === ts.SyntaxKind.ExportDeclaration) {
              examples.push({
                filename: node.moduleSpecifier.text,
                name: node.exportClause.elements[0].name.escapedText,
              });
            }
          });
        });
      return {
        groupFile,
        groupTitle,
        examples,
      };
    })
    .map(({ groupFile, groupTitle, examples }) => {
      // slugify the group title
      const slugifiedGroupTitle = slugify(groupTitle.toLowerCase().split('/').join('-'), {
        lower: true,
        strict: true,
      });
      const exampleFiles = examples.map(({ name, filename }) => {
        const urlPath = name
          .replace(/([A-Z])/g, '-$1')
          .trim()
          .toLocaleLowerCase();
        // slugify the story name
        const slugifiedURLPath = slugify(urlPath, { lower: true, strict: true });
        const url = `/story/${slugifiedGroupTitle}--${slugifiedURLPath}`;
        return {
          slugifiedName: slugifiedURLPath,
          name,
          filename,
          url,
          filePath: path.join(path.relative(process.cwd(), path.dirname(groupFile)), filename),
        };
      });
      return {
        groupFile,
        slugifiedGroupTitle,
        groupTitle,
        exampleFiles,
      };
    });
}

function extractAndSaveExamples() {
  const examples = JSON.stringify(extractExamples(), null, 2);
  const examplesFileDir = path.join('integration', 'tmp');
  fs.mkdirSync(examplesFileDir, { recursive: true });
  fs.writeFileSync(path.join(examplesFileDir, 'examples.json'), examples);
}

module.exports = extractAndSaveExamples;

extractAndSaveExamples();
