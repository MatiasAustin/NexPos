import os

path = 'frontend/src/app/admin/page.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

modal_start = "                                      {/* Adjust Material Stock Modal */}"
modal_end = "                                      )}"

# Find the LAST instance of the modal
idx1 = content.rfind(modal_start)
idx2 = content.rfind(modal_end)

if idx1 != -1 and idx2 != -1:
    idx2 += len(modal_end)
    modal_block = content[idx1:idx2]
    
    # Remove from current location
    content = content[:idx1] + content[idx2:]
    
    # Find `<div className="hidden print:block print-receipt`
    print_div_start = content.rfind('<div className="hidden print:block print-receipt')
    if print_div_start != -1:
        # We put the modal OUTSIDE the print block, so just BEFORE it.
        content = content[:print_div_start] + modal_block + "\n\n          " + content[print_div_start:]
        with open(path, 'w', encoding='utf-8') as f:
            f.write(content)
        print("Fixed admin hidden modal! Moved above print-receipt.")
    else:
        print("print-receipt not found")
else:
    print("modal not found")
