const fs = require('fs');
let file = 'src/app/admin/page.tsx';
let content = fs.readFileSync(file, 'utf8');

// replace hover:bg-gray-800 text-white hover:text-white
content = content.replace(/hover:bg-gray-800 text-white hover:text-white/g, "hover:bg-surface-hover text-text-muted hover:text-text-primary");

// replace bg-gray-700 text-white
content = content.replace(/bg-gray-700 text-white/g, "bg-surface-hover text-text-primary");
// replace text-white hover:text-text-primary in the sort toggle
content = content.replace(/'text-white hover:text-text-primary'/g, "'text-text-muted hover:text-text-primary hover:bg-surface-hover'");

fs.writeFileSync(file, content, 'utf8');
console.log("Cleaned up hover text-white in admin");
