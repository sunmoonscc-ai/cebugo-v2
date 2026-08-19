import re

with open('src/pages/DailyInfoPage.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace new Date().toISOString().split('T')[0]
content = content.replace("new Date().toISOString().split('T')[0]", "getLocalTodayString()")

# Add import for getLocalTodayString
if 'getLocalTodayString' not in content:
    content = content.replace("import { renderTextWithLinks } from '../utils/textHelper';", "import { renderTextWithLinks } from '../utils/textHelper';\nimport { getLocalTodayString } from '../utils/dateHelper';")

with open('src/pages/DailyInfoPage.jsx', 'w', encoding='utf-8') as f:
    f.write(content)
