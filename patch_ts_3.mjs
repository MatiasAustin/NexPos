import fs from 'fs';

let content = fs.readFileSync('frontend/src/app/admin/page.tsx', 'utf-8');

// Fix the initialization of newProduct to include the required fields
content = content.replace(
    /image_url: '', ingredients: \[\] \}\);/g,
    `image_url: '', discount_percentage: 0, options_config: [], ingredients: [] });`
);

fs.writeFileSync('frontend/src/app/admin/page.tsx', content, 'utf-8');
console.log("Fixed newProduct init in admin/page.tsx");
