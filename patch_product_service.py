import re

with open(r"d:\WORK\BUILD_APP\NexPos\backend\src\services\ProductService.ts", "r", encoding="utf-8") as f:
    content = f.read()

# Update createProduct
content = content.replace("options_config: payload.options_config\n        };", "options_config: payload.options_config,\n            operational_cost: payload.operational_cost\n        };")

# Update updateProduct
content = content.replace("options_config: payload.options_config,\n            updated_at: new Date().toISOString()", "options_config: payload.options_config,\n            operational_cost: payload.operational_cost,\n            updated_at: new Date().toISOString()")

with open(r"d:\WORK\BUILD_APP\NexPos\backend\src\services\ProductService.ts", "w", encoding="utf-8") as f:
    f.write(content)
