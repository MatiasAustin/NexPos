import os

path = 'frontend/src/app/admin/page.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# I appended the modal code just before `        </div>\n        </>\n    );\n}`
# Which puts it inside `<div id="print-invoice" className="hidden print:block ...">`
# I need to move it out of there!

# Let's find the start of the modal:
modal_start = "                                      {/* Adjust Material Stock Modal */}"
modal_end = "                                                  </form>\n                                              </div>\n                                          </div>\n                                      )}"

idx1 = content.find(modal_start)
idx2 = content.find(modal_end) + len(modal_end)

if idx1 != -1 and idx2 != -1:
    modal_block = content[idx1:idx2]
    
    # Remove from current location
    content = content[:idx1] + content[idx2:]
    
    # Now put it BEFORE the print-invoice div!
    print_div_start = content.rfind('<div id="print-invoice"')
    if print_div_start != -1:
        content = content[:print_div_start] + modal_block + "\n\n          " + content[print_div_start:]
        with open(path, 'w', encoding='utf-8') as f:
            f.write(content)
        print("Fixed admin hidden modal!")
    else:
        print("print-invoice not found")
else:
    print("modal not found")
