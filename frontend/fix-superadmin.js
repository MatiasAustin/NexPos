const fs = require('fs');

let content = fs.readFileSync('src/app/superadmin/page.tsx', 'utf8');

if (!content.includes('ThemeToggle')) {
  content = content.replace('import Link from "next/link";', 'import Link from "next/link";\nimport ThemeToggle from "@/components/ThemeToggle";');
}

content = content.replace(/bg-\[#08[Bb]0[Bb]12\]/g, 'bg-background');
content = content.replace(/bg-\[#080[Bb]12\]/g, 'bg-background');

content = content.replace(
  /<Link href="\/dashboard" className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-xl text-sm font-bold text-text-primary transition-colors">/g,
  '<ThemeToggle />\n                        <Link href="/dashboard" className="px-4 py-2 bg-surface-hover hover:bg-border rounded-xl text-sm font-bold text-text-primary transition-colors">'
);

content = content.replace(/bg-gray-800/g, 'bg-surface-hover');
content = content.replace(/bg-gray-700/g, 'bg-border');

// Replace previous migrations if they were lost via git checkout
content = content.replace(/bg-\[#0[Bb]0[Ff]19\]/g, 'bg-background');
content = content.replace(/bg-\[#121214\]/g, 'bg-background');
content = content.replace(/bg-\[#131[Bb]2[Cc]\]/g, 'bg-surface');
content = content.replace(/bg-\[#1[Aa]1[Aa]1[Cc]\]/g, 'bg-surface');
content = content.replace(/bg-\[#1[Aa]233[Aa]\]/g, 'bg-surface-hover');
content = content.replace(/bg-\[#232[Ff]4[Dd]\]/g, 'bg-surface-hover');
content = content.replace(/border-gray-800\/60/g, 'border-border');
content = content.replace(/border-gray-800/g, 'border-border');
content = content.replace(/text-white/g, 'text-text-primary');
content = content.replace(/text-gray-400/g, 'text-text-muted');
content = content.replace(/text-gray-500/g, 'text-text-muted');
content = content.replace(/bg-blue-600/g, 'bg-accent');
content = content.replace(/text-blue-400/g, 'text-accent');
content = content.replace(/font-black/g, 'font-bold');

fs.writeFileSync('src/app/superadmin/page.tsx', content, 'utf8');
