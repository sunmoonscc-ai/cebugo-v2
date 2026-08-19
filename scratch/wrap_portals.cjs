const fs = require('fs');

let c = fs.readFileSync('src/pages/DailyInfoPage.jsx', 'utf8');

// Find all occurrences of `<div className="modal-overlay`
// We need to wrap each of them with <Portal>...</Portal>
let replaced = 0;
while (true) {
  const match = c.match(/<div className="modal-overlay[^>]*>/);
  if (!match) break;
  
  // To avoid re-matching the same thing, we'll replace the matched `<div className="modal-overlay...>` 
  // with a temporary placeholder `<TEMP_MODAL_START className="...">`, and at the end we revert it 
  // to `<Portal><div className="modal-overlay...">`
  
  // We need to find the matching closing `</div>`
  let pos = match.index;
  let depth = 0;
  let endPos = -1;
  let i = pos;
  while (i < c.length) {
    if (c.substr(i, 4) === '<div') {
      depth++;
      i += 4;
    } else if (c.substr(i, 6) === '</div') {
      depth--;
      if (depth === 0) {
        // We found the closing div!
        endPos = i + 6;
        break;
      }
      i += 6;
    } else {
      i++;
    }
  }
  
  if (endPos !== -1) {
    // Extract the modal string
    const modalStr = c.substring(pos, endPos);
    
    // We replace `<div className="modal-overlay` with `<div className="Xmodal-overlay` temporarily
    const tempModalStr = modalStr.replace('modal-overlay', 'Xmodal-overlay');
    
    // Wrap it in <Portal>
    const wrapped = `<Portal>\n${tempModalStr}\n</Portal>`;
    
    c = c.substring(0, pos) + wrapped + c.substring(endPos);
    replaced++;
  } else {
    // Something is wrong, break
    console.log("Failed to find closing div for match at", pos);
    break;
  }
}

// Revert Xmodal-overlay to modal-overlay
c = c.replace(/Xmodal-overlay/g, 'modal-overlay');

fs.writeFileSync('src/pages/DailyInfoPage.jsx', c, 'utf8');
console.log('Successfully wrapped', replaced, 'modals with Portal');
