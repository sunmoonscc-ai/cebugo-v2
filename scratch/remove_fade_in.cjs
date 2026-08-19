const fs = require('fs');
let c = fs.readFileSync('src/pages/DailyInfoPage.jsx', 'utf8');

c = c.replace(/className="page-content fade-in"/g, 'className="page-content"');
c = c.replace(/className="tab-content-section fade-in"/g, 'className="tab-content-section"');

fs.writeFileSync('src/pages/DailyInfoPage.jsx', c, 'utf8');
console.log('Removed fade-in classes from DailyInfoPage.jsx wrappers');
