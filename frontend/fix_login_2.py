import re

with open("d:/WORK/BUILD_APP/NexPos/frontend/src/app/login/page.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# Remove the invalid inline import
content = content.replace("    import { useEffect } from 'react';\n", "")

# Add useEffect to top import
content = content.replace('import { useState } from "react";', 'import { useState, useEffect } from "react";')

with open("d:/WORK/BUILD_APP/NexPos/frontend/src/app/login/page.tsx", "w", encoding="utf-8") as f:
    f.write(content)

