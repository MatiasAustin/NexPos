const fs = require('fs');
let file = 'src/app/globals.css';
let content = fs.readFileSync(file, 'utf8');

// replace the accent colors
content = content.replace(/--accent: #84CC16;/g, "--accent: #97e100;");
content = content.replace(/--accent-hover: #65A30D;/g, "--accent-hover: #7dbd00;");

fs.writeFileSync(file, content, 'utf8');
console.log("Updated accent color to #97e100");
