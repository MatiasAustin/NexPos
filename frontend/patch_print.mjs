import fs from 'fs';

const filePath = 'd:\\WORK\\BUILD_APP\\NexPos\\frontend\\src\\app\\pos\\page.tsx';
let content = fs.readFileSync(filePath, 'utf-8');
content = content.replace(/\r\n/g, '\n');

const oldCode = `            {/* MOBILE FLOATING BUTTONS */}
            <div className="sm:hidden fixed bottom-6 left-0 right-0 px-4 flex justify-between items-end z-40 pointer-events-none">`;

const newCode = `            {/* MOBILE FLOATING BUTTONS */}
            <div className="sm:hidden fixed bottom-6 left-0 right-0 px-4 flex justify-between items-end z-40 pointer-events-none print:hidden">`;

if (content.includes(oldCode)) {
    content = content.replace(oldCode, newCode);
    fs.writeFileSync(filePath, content);
    console.log("Patched print:hidden");
} else {
    console.log("Target code not found!");
}
