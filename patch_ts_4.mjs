import fs from 'fs';

let content = fs.readFileSync('frontend/src/app/admin/page.tsx', 'utf-8');

// Fix ReportChart
content = content.replace(
    /<ReportChart \/>/g,
    `<ReportChart period="daily" />`
);

fs.writeFileSync('frontend/src/app/admin/page.tsx', content, 'utf-8');
console.log("Fixed ReportChart in admin/page.tsx");
