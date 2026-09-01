const fs = require('fs');
let c = fs.readFileSync('frontend/src/app/admin/page.tsx', 'utf8');
const oldBlock = \            if (period === 'daily') {
                start.setHours(0, 0, 0, 0);
            } else if (period === 'weekly') {
                const day = start.getDay();
                const diff = start.getDate() - day + (day === 0 ? -6 : 1);
                start = new Date(start.setDate(diff));
                start.setHours(0, 0, 0, 0);
            } else if (period === 'monthly') {
                start.setDate(1);
                start.setHours(0, 0, 0, 0);
            } else if (period === 'yearly') {
                start.setMonth(0, 1);
                start.setHours(0, 0, 0, 0);\;
const newBlock = \            if (period === 'daily') {
                start.setHours(0, 0, 0, 0);
                end = new Date(start);
                end.setHours(23, 59, 59, 999);
            } else if (period === 'weekly') {
                const day = start.getDay();
                const diff = start.getDate() - day + (day === 0 ? -6 : 1);
                start = new Date(start.setDate(diff));
                start.setHours(0, 0, 0, 0);
                end = new Date(start);
                end.setDate(start.getDate() + 6);
                end.setHours(23, 59, 59, 999);
            } else if (period === 'monthly') {
                start.setDate(1);
                start.setHours(0, 0, 0, 0);
                end = new Date(start.getFullYear(), start.getMonth() + 1, 0);
                end.setHours(23, 59, 59, 999);
            } else if (period === 'yearly') {
                start.setMonth(0, 1);
                start.setHours(0, 0, 0, 0);
                end = new Date(start.getFullYear(), 11, 31);
                end.setHours(23, 59, 59, 999);\;
c = c.replaceAll(oldBlock, newBlock);
fs.writeFileSync('frontend/src/app/admin/page.tsx', c);
