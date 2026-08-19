const fs = require('fs');
let c = fs.readFileSync('src/pages/DailyInfoPage.jsx', 'utf8');

c = c.replace(
  /\{isNoticeModalOpen && \(\s*<div className="modal-overlay fade-in">/g,
  '{isNoticeModalOpen && (\n            <Portal>\n            <div className="modal-overlay fade-in">'
);
c = c.replace(
  /\{isTagModalOpen && \(\s*<div className="modal-overlay fade-in"[^>]*>/g,
  '{isTagModalOpen && (\n            <Portal>\n            <div className="modal-overlay fade-in" style={{ zIndex: 1100 }}>'
);
c = c.replace(
  /\{isNoticeReorderModalOpen && \(\s*<div className="modal-overlay fade-in">/g,
  '{isNoticeReorderModalOpen && (\n            <Portal>\n            <div className="modal-overlay fade-in">'
);
c = c.replace(
  /\{isContactModalOpen && \(\s*<div className="modal-overlay fade-in">/g,
  '{isContactModalOpen && (\n            <Portal>\n            <div className="modal-overlay fade-in">'
);
c = c.replace(
  /\{isContactReorderModalOpen && \(\s*<div className="modal-overlay fade-in">/g,
  '{isContactReorderModalOpen && (\n            <Portal>\n            <div className="modal-overlay fade-in">'
);
c = c.replace(
  /\{isTravelModalOpen && \(\s*<div className="modal-overlay fade-in">/g,
  '{isTravelModalOpen && (\n            <Portal>\n            <div className="modal-overlay fade-in">'
);
c = c.replace(
  /\{isTravelReorderModalOpen && \(\s*<div className="modal-overlay fade-in">/g,
  '{isTravelReorderModalOpen && (\n            <Portal>\n            <div className="modal-overlay fade-in">'
);
c = c.replace(
  /\{isPhNewsModalOpen && \(\s*<div className="modal-overlay fade-in">/g,
  '{isPhNewsModalOpen && (\n            <Portal>\n            <div className="modal-overlay fade-in">'
);

// Now the closings
// We know they are followed by `)}`
// We'll just replace `</div>\n            </div>\n          )}` with `</div>\n            </div>\n            </Portal>\n          )}`
c = c.replace(/<\/div>\n\s*<\/div>\n\s*\)}/g, '</div>\n              </div>\n            </Portal>\n          )}');

fs.writeFileSync('src/pages/DailyInfoPage.jsx', c, 'utf8');
