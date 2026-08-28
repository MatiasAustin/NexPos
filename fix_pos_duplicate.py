import os

path = 'frontend/src/app/pos/page.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

modal_start = "            {/* Adjust Material Stock Modal */}"

first_idx = content.find(modal_start)
last_idx = content.rfind(modal_start)

if first_idx != -1 and last_idx != -1 and first_idx != last_idx:
    # there is a duplicate. Let's remove the LAST one.
    # Actually, we can just slice it off up to the last </div>
    # The modal starts at `last_idx`. It ends where?
    end_of_modal = content.find("            )}", last_idx)
    if end_of_modal != -1:
        end_of_modal += len("            )}")
        content = content[:last_idx] + content[end_of_modal:]
        with open(path, 'w', encoding='utf-8') as f:
            f.write(content)
        print("Removed duplicate modal in POS.")
else:
    print("No duplicate found.")
