import fs from 'fs';

const filePath = 'd:\\WORK\\BUILD_APP\\NexPos\\frontend\\src\\components\\Toast.tsx';
let content = fs.readFileSync(filePath, 'utf-8');
content = content.replace(/\r\n/g, '\n');

const oldCode = `<div className="fixed top-5 right-5 z-[9999] flex flex-col gap-3 max-w-sm w-full">`;
const newCode = `<div className="fixed top-5 right-5 z-[9999] flex flex-col gap-3 max-w-sm w-full print:hidden">`;

if (content.includes(oldCode)) {
    content = content.replace(oldCode, newCode);
    fs.writeFileSync(filePath, content);
    console.log("Patched Toast.tsx");
} else {
    console.log("Toast target not found");
}
