import os
import re

path = 'frontend/src/app/admin/page.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# The modal starts with {/* Adjust Material Stock Modal */}
# And ends with {adjustingProductStock && (
# Wait, let's extract the exact modal block.
start_str = "                                      {/* Adjust Material Stock Modal */}"
end_str = "                                      {/* Adjust Product Stock Modal */}"

start_idx = content.find(start_str)
end_idx = content.find(end_str)

if start_idx != -1 and end_idx != -1:
    modal_block = content[start_idx:end_idx]
    
    # Remove it from its current position
    content = content[:start_idx] + content[end_idx:]
    
    # Place it at the very end of the file, right before </main>
    # Search for </main>
    main_end_idx = content.rfind("</main>")
    if main_end_idx != -1:
        content = content[:main_end_idx] + modal_block + "\n                " + content[main_end_idx:]
        
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)
    print("Moved modal successfully")
else:
    print("Could not find modal block")
