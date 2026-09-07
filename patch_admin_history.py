import re

with open(r"d:\WORK\BUILD_APP\NexPos\frontend\src\app\admin\page.tsx", "r", encoding="utf-8") as f:
    content = f.read()

old_block = """                    transaction:transactions (order_reference, staff_name)"""
new_block = """                    transaction:transactions (order_reference)"""
content = content.replace(old_block, new_block)

with open(r"d:\WORK\BUILD_APP\NexPos\frontend\src\app\admin\page.tsx", "w", encoding="utf-8") as f:
    f.write(content)
