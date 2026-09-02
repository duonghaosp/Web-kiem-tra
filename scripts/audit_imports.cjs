const fs = require('fs');
const path = require('path');

function getAllFiles(dir, exts = ['.ts', '.tsx']) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      results = results.concat(getAllFiles(fullPath, exts));
    } else if (exts.includes(path.extname(file))) {
      results.push(fullPath);
    }
  });
  return results;
}

const srcFiles = getAllFiles(path.resolve('src'));
let caseErrors = 0;

for (const filePath of srcFiles) {
  const content = fs.readFileSync(filePath, 'utf8');
  const importRegex = /from\s+['"](\.[^'"]+)['"]/g;
  let match;
  while ((match = importRegex.exec(content)) !== null) {
    const importRelPath = match[1];
    const dir = path.dirname(filePath);
    const resolvedBase = path.resolve(dir, importRelPath);
    
    // Check possible extensions
    const candidates = [
      resolvedBase + '.ts',
      resolvedBase + '.tsx',
      resolvedBase + '.js',
      resolvedBase + '/index.ts',
      resolvedBase + '/index.tsx',
      resolvedBase
    ];
    
    let found = false;
    for (const c of candidates) {
      if (fs.existsSync(c)) {
        // Verify casing on filesystem
        const cDir = path.dirname(c);
        const cBase = path.basename(c);
        const actualFiles = fs.readdirSync(cDir);
        if (actualFiles.includes(cBase)) {
          found = true;
          break;
        } else {
          console.error('CASE MISMATCH in file:', filePath, 'Imported:', importRelPath, 'Actual on disk:', actualFiles.find(f => f.toLowerCase() === cBase.toLowerCase()));
          caseErrors++;
          found = true;
          break;
        }
      }
    }
    if (!found) {
      console.error('FILE NOT FOUND:', filePath, 'Imported:', importRelPath);
      caseErrors++;
    }
  }
}

if (caseErrors === 0) {
  console.log('AUDIT PASSED! All ' + srcFiles.length + ' files have 100% exact case matching and valid paths.');
  process.exit(0);
} else {
  console.log('AUDIT FAILED with ' + caseErrors + ' errors!');
  process.exit(1);
}
