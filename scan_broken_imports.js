const fs = require('fs');
const path = require('path');

const dirs = [
  'Service Admin/src',
  'Service Formateur/src',
  'Service Apprenant/src'
];

const brokenFiles = [];

function scan(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      scan(fullPath);
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      const content = fs.readFileSync(fullPath, 'utf8');
      if (content.includes('import {\nimport {')) {
        brokenFiles.push(fullPath);
      }
    }
  }
}

dirs.forEach(d => {
    if (fs.existsSync(d)) scan(d);
});

console.log('BROKEN_FILES:');
brokenFiles.forEach(f => console.log(f));
