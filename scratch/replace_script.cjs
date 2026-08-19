const fs = require('fs');

let c = fs.readFileSync('src/pages/DailyInfoPage.jsx', 'utf8');

if (!c.includes('renderTextWithLinks')) {
  c = c.replace(
    "import Portal from '../components/common/Portal';",
    "import Portal from '../components/common/Portal';\nimport { renderTextWithLinks } from '../utils/textHelper';"
  );

  c = c.replace(
    /<p className="notice-content-text">\{item\.content\}<\/p>/g,
    `<p className="notice-content-text" style={{ whiteSpace: 'pre-wrap' }}>{renderTextWithLinks(item.content)}</p>`
  );

  c = c.replace(
    /<p className="contact-desc">\{item\.desc\}<\/p>/g,
    `<p className="contact-desc" style={{ whiteSpace: 'pre-wrap' }}>{renderTextWithLinks(item.desc)}</p>`
  );

  c = c.replace(
    /<p className="notice-content-text">\{item\.desc\}<\/p>/g,
    `<p className="notice-content-text" style={{ whiteSpace: 'pre-wrap' }}>{renderTextWithLinks(item.desc)}</p>`
  );

  fs.writeFileSync('src/pages/DailyInfoPage.jsx', c, 'utf8');
  console.log('Replaced content successfully');
}
