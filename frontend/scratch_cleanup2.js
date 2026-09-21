const fs = require('fs');
let file = 'src/app/pos/page.tsx';
let content = fs.readFileSync(file, 'utf8');

// replace text-white hover:bg-gray-800 for unselected tabs
content = content.replace(/'text-white hover:bg-gray-800'/g, "'text-text-muted hover:text-text-primary hover:bg-surface-hover'");
// replace text-white where it's with bg-surface or surface-hover (bg-surface-hover text-center text-white)
content = content.replace(/bg-surface-hover border border-border rounded-xl text-center text-white/g, "bg-surface-hover border border-border rounded-xl text-center text-text-primary");

// For bg-gray-800 text-white -> let's make it bg-surface-hover text-text-primary for buttons
content = content.replace(/bg-gray-800 text-white hover:bg-gray-700/g, "bg-surface-hover text-text-primary hover:bg-border");
content = content.replace(/bg-gray-800 text-white hover:text-white hover:bg-gray-700/g, "bg-surface-hover text-text-primary hover:bg-border");
content = content.replace(/bg-gray-800 hover:bg-gray-600 text-white/g, "bg-surface-hover hover:bg-border text-text-primary");

// bg-gray-800 border border-border text-white -> bg-surface-hover text-text-primary
content = content.replace(/bg-gray-800 border border-border text-white/g, "bg-surface text-text-primary border border-border");

// 'bg-gray-800/60 border-border/60 text-white hover:border-gray-600 hover:bg-gray-800'
content = content.replace(/'bg-gray-800\/60 border-border\/60 text-white hover:border-gray-600 hover:bg-gray-800'/g, "'bg-surface-hover border-border text-text-secondary hover:text-text-primary hover:border-text-muted'");

fs.writeFileSync(file, content, 'utf8');
console.log("Cleaned up hover text-white in pos");
