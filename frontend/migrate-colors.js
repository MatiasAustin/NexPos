const fs = require('fs');
const path = require('path');

const replacements = [
  // Backgrounds
  { regex: /bg-\[#0[Bb]0[Ff]19\]/g, to: 'bg-background' },
  { regex: /bg-\[#121214\]/g, to: 'bg-background' },
  { regex: /bg-\[#131[Bb]2[Cc]\]/g, to: 'bg-surface' },
  { regex: /bg-\[#1[Aa]1[Aa]1[Cc]\]/g, to: 'bg-surface' },
  { regex: /bg-\[#1[Aa]233[Aa]\]/g, to: 'bg-surface-hover' },
  { regex: /bg-\[#232[Ff]4[Dd]\]/g, to: 'bg-surface-hover' },
  { regex: /bg-gray-900\/90/g, to: 'bg-surface-glass' },
  { regex: /bg-gray-900/g, to: 'bg-surface-hover' },
  
  // Borders
  { regex: /border-gray-800\/60/g, to: 'border-border' },
  { regex: /border-gray-800/g, to: 'border-border' },
  { regex: /border-gray-700/g, to: 'border-border' },
  { regex: /divide-gray-800/g, to: 'divide-border' },

  // Text colors
  { regex: /text-white/g, to: 'text-text-primary' },
  { regex: /text-gray-100/g, to: 'text-text-primary' },
  { regex: /text-gray-200/g, to: 'text-text-secondary' },
  { regex: /text-gray-300/g, to: 'text-text-secondary' },
  { regex: /text-gray-400/g, to: 'text-text-muted' },
  { regex: /text-gray-500/g, to: 'text-text-muted' },
  
  // Accents (Blue to Lime/Accent)
  { regex: /bg-blue-600/g, to: 'bg-accent' },
  { regex: /hover:bg-blue-500/g, to: 'hover:bg-accent-hover' },
  { regex: /bg-blue-500\/10/g, to: 'bg-accent\/10' },
  { regex: /bg-blue-500\/20/g, to: 'bg-accent\/20' },
  { regex: /bg-blue-500/g, to: 'bg-accent' },
  { regex: /text-blue-500/g, to: 'text-accent' },
  { regex: /text-blue-400/g, to: 'text-accent' },
  { regex: /border-blue-500/g, to: 'border-accent' },
  { regex: /ring-blue-500/g, to: 'ring-accent' },
  
  // Shadows
  { regex: /shadow-blue-900\/20/g, to: 'shadow-soft' },
  { regex: /shadow-lg/g, to: 'shadow-soft' },
  
  // Typography Adjustments
  { regex: /font-black/g, to: 'font-bold' }
];

function processDirectory(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDirectory(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let original = content;
      
      replacements.forEach(rep => {
        content = content.replace(rep.regex, rep.to);
      });
      
      if (content !== original) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`Updated: ${fullPath}`);
      }
    }
  }
}

processDirectory('d:/WORK/BUILD_APP/NexPos/frontend/src');
console.log('Migration complete.');
