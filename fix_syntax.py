import os
import re

path = 'frontend/src/app/admin/page.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

broken_syntax = """                                                  </form>
                                                  </div>
                                              )}"""

fixed_syntax = """                                                  </form>"""

content = content.replace(broken_syntax, fixed_syntax)

# Wait, the `</div>` was for `div className="p-2 md:p-4 md:p-8 bg-[#131B2C]...`?
# No, let's look at the original code structure.
# <div className="p-2 md:p-4 md:p-8 ...">
#   <div className="flex items-center ..."> ... </div>
#   <form> ... </form>
# </div>
# So we need to keep the </div> for the parent div! But we must remove the `)}`.

with open(path, 'r', encoding='utf-8') as f:
    content2 = f.read()
    
broken2 = """                                                  </form>
                                                  </div>
                                              )}
                                          </div>"""
fixed2 = """                                                  </form>
                                          </div>"""

if broken2 in content2:
    content2 = content2.replace(broken2, fixed2)
else:
    # Just remove `)}` and `</div>` which was orphaned from the `space-y-4` inner div
    content2 = content2.replace("""                                                  </form>\n                                                  </div>\n                                              )}""", """                                                  </form>""")

with open(path, 'w', encoding='utf-8') as f:
    f.write(content2)
print("Syntax fixed")
