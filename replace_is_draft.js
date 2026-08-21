const fs = require('fs');
let c = fs.readFileSync('frontend/src/app/pos/page.tsx', 'utf8');

c = c.replace(/!o\.is_draft/g, 'o.status === pending');
c = c.replace(/!order\.is_draft/g, 'order.status === pending');
c = c.replace(/o\.is_draft/g, 'o.status === draft');
c = c.replace(/order\.is_draft/g, 'order.status === draft');

fs.writeFileSync('frontend/src/app/pos/page.tsx', c);
