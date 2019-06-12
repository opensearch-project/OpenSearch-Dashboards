const fs = require('fs');
const sassGraph = require('sass-graph');

const graph = sassGraph.parseFile('./src/components/_index.scss');

const root = Object.keys(graph.index)[0];

const content = recursiveReadSCSS(root, graph.index[root]);

fs.writeFileSync('./dist/theme.scss', content);

function recursiveReadSCSS(branchId, branch) {
  if (branch.imports.length === 0) {
    return fs.readFileSync(branchId, 'utf8');
  }
  const file = fs.readFileSync(branchId, 'utf8');
  const sassFileContent = []
  branch.imports.forEach((branchId) => {
    const content = recursiveReadSCSS(branchId, graph.index[branchId]);
    sassFileContent.push(content);
  });
  // remove imports
  const contentWithoutImports = removeImportsFromFile(file)
  sassFileContent.push(contentWithoutImports);
  return sassFileContent.join('\n');
}


function removeImportsFromFile(fileContent) {
  const lines = fileContent.split(/\r\n|\r|\n/g);

  return lines.filter((line) => {
    return !line.match(/@import\s/i)
  }).join('\n');
}
