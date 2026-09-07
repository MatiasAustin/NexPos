import os
import re

files = [
    r'd:\WORK\BUILD_APP\NexPos\frontend\src\app\admin\page.tsx',
    r'd:\WORK\BUILD_APP\NexPos\frontend\src\app\pos\page.tsx'
]

def process_file(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Find all modals starting with <div className="fixed inset-0
    # Then find the immediate inner child div.
    
    # Actually, simpler: replace my-auto flex-shrink-0 with mt-10 mb-20 
    # This solves the issue without changing HTML structure.
    # The reason the modal "ga muncul" (only shows blur) is because my-auto flex-shrink-0 combined with lex items-start and overflow-y-auto causes the modal to be pushed OFF SCREEN on mobile Safari/Chrome if it's too tall!
    # If we just change my-auto flex-shrink-0 to mt-12 mb-24, it will have a top margin, and can be scrolled!
    # OR we use the standard: items-center on the parent, but if we do that, we get top clipping.
    # So items-start + mt-16 mb-16 is perfect!
    
    content = content.replace('my-auto flex-shrink-0', 'mt-16 mb-16')
    content = content.replace('flex items-start justify-center', 'flex items-start justify-center')
    
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)

for file in files:
    process_file(file)

print('Done')
