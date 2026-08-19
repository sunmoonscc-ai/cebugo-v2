const fs = require('fs');

let content = fs.readFileSync('src/pages/PlaceFeedPage.jsx', 'utf8');

// 1. Remove sorting from fetch callback
content = content.replace(
  /const list = snapshot\.docs\.map\(\(docSnap\) => \(\{ id: docSnap\.id, \.\.\.docSnap\.data\(\) \}\)\);\s*list\.sort\(\(a, b\) => \(a\.order !== undefined \? a\.order : 0\) - \(b\.order !== undefined \? b\.order : 0\)\);\s*setPosts\(list\);/g,
  `const list = snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));\n          setPosts(list);`
);

// 2. Update sorting for rawTabPosts
const oldSort = /\.sort\(\(a, b\) => \{\s*const orderA = a\.order !== undefined \? a\.order : 0;\s*const orderB = b\.order !== undefined \? b\.order : 0;\s*if \(orderA !== orderB\) return orderA - orderB;\s*const dateA = a\.date \|\| '0000-00-00';\s*const dateB = b\.date \|\| '0000-00-00';\s*return dateA > dateB \? -1 : \(dateA < dateB \? 1 : 0\);\s*\}\)/g;
const newSort = `.sort((a, b) => {
      const getTime = (p) => {
        if (p.createdAt) return p.createdAt;
        if (p.updatedAt) return p.updatedAt;
        if (p.date) return p.date;
        if (p.startDate) return p.startDate;
        return '0000-00-00';
      };
      const timeA = getTime(a);
      const timeB = getTime(b);
      return timeA > timeB ? -1 : (timeA < timeB ? 1 : 0);
    })`;
content = content.replace(oldSort, newSort);

// 3. Remove "순서 변경" button
const reorderBtn = /<button\s*type="button"\s*className="btn btn-secondary add-notice-btn"\s*onClick=\{\(\) => setIsReorderModalOpen\(true\)\}\s*>\s*<RiDragMove2Line \/> 순서 변경\s*<\/button>/g;
content = content.replace(reorderBtn, '');

// 4. Remove up and down arrows from admin-card-actions
const upDownBtns = /<button\s*type="button"\s*className="btn-icon-action move"\s*onClick=\{\(\) => handleMovePost\(index, 'up'\)\}\s*disabled=\{index === 0\}\s*title="위로 이동"\s*>\s*<RiArrowUpLine \/>\s*<\/button>\s*<button\s*type="button"\s*className="btn-icon-action move"\s*onClick=\{\(\) => handleMovePost\(index, 'down'\)\}\s*disabled=\{index === tabPosts\.length - 1\}\s*title="아래로 이동"\s*>\s*<RiArrowDownLine \/>\s*<\/button>/g;
content = content.replace(upDownBtns, '');

fs.writeFileSync('src/pages/PlaceFeedPage.jsx', content, 'utf8');
console.log('Update successful');
