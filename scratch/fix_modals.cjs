const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../src/pages/DailyInfoPage.jsx');
let content = fs.readFileSync(filePath, 'utf8');

if (!content.includes("import Portal")) {
  content = content.replace("import ZoomableImage from '../components/common/ZoomableImage';", "import ZoomableImage from '../components/common/ZoomableImage';\nimport Portal from '../components/common/Portal';");
}

// Find all occurrences of `<div className="modal-overlay`
const overlayRegex = /<div className="modal-overlay[^>]*>/g;
let match;
const matches = [];
while ((match = overlayRegex.exec(content)) !== null) {
  matches.push({ index: match.index, text: match[0] });
}

// Replace backwards to avoid index shifting
for (let i = matches.length - 1; i >= 0; i--) {
  const m = matches[i];
  
  // Find the closing </div> of this modal-overlay.
  // We can do this by counting <div and </div
  let j = m.index;
  let depth = 0;
  let inTag = false;
  let tagName = '';
  let closing = false;
  
  // Simplified matching: we know it's formatted well. We can just parse the string until depth is 0
  let endIdx = -1;
  const substring = content.substring(m.index);
  
  // Actually, string matching: 
  let divCount = 0;
  let pos = 0;
  while (pos < substring.length) {
    if (substring.substr(pos, 4) === '<div') {
      divCount++;
      pos += 4;
    } else if (substring.substr(pos, 6) === '</div') {
      divCount--;
      if (divCount === 0) {
        // found the end of the modal-overlay div
        endIdx = m.index + pos + 6; // +6 for </div>
        // need to find the closing '>'
        let closingBracketPos = substring.indexOf('>', pos);
        endIdx = m.index + closingBracketPos + 1;
        break;
      }
      pos += 6;
    } else {
      pos++;
    }
  }
  
  if (endIdx !== -1) {
    // Insert </Portal> after endIdx
    content = content.slice(0, endIdx) + '\n            </Portal>' + content.slice(endIdx);
    // Insert <Portal> before m.index
    content = content.slice(0, m.index) + '<Portal>\n              ' + content.slice(m.index);
  }
}

fs.writeFileSync(filePath, content, 'utf8');
console.log('Fixed modals in DailyInfoPage.jsx');
