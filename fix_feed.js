const fs = require('fs');
let content = fs.readFileSync('src/pages/PlaceFeedPage.jsx', 'utf8');

const brokenStr =         {filterMonth !== 'all' && availableDatesInMonth.length > 0 && (
          <select 
            className="form-select" 
            style={{ width: 'auto', minWidth: '120px', padding: '6px 12px', fontSize: '0.9rem' }}
        <button
          className={\eed-tab-btn \\}
          onClick={() => setActiveTab('event')}
        >
          <RiCalendarEventLine className="tab-icon" />
          <span>이벤트 ({posts.filter((p) => p.category === 'event').length})</span>
        </button>
      </div>;

const fixedStr =         {filterMonth !== 'all' && availableDatesInMonth.length > 0 && (
          <select 
            className="form-select" 
            style={{ width: 'auto', minWidth: '120px', padding: '6px 12px', fontSize: '0.9rem' }}
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
          >
            <option value="all">전체 일</option>
            {availableDatesInMonth.map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        )}

        <button 
          className="btn-secondary" 
          style={{ padding: '6px 12px', fontSize: '0.85rem', marginLeft: 'auto' }}
          onClick={() => {
            const today = getLocalTodayString();
            setFilterMonth(today.substring(0, 7));
            setTimeout(() => setFilterDate(today), 0);
          }}
        >
          오늘 유효한 게시글
        </button>
      </div>

      {/* 2 Sub-Tabs Bar: 광고 vs 이벤트 */}
      <div className="feed-nav-tabs glass-card">
        <button
          className={\eed-tab-btn \\}
          onClick={() => setActiveTab('ad')}
        >
          <RiMegaphoneLine className="tab-icon" />
          <span>광고 ({posts.filter((p) => p.category === 'ad' && getPostStatus(p).status !== 'expired').length})</span>
        </button>

        <button
          className={\eed-tab-btn \\}
          onClick={() => setActiveTab('event')}
        >
          <RiCalendarEventLine className="tab-icon" />
          <span>이벤트 ({posts.filter((p) => {
            if (p.category !== 'event') return false;
            if (getPostStatus(p).status === 'expired') return false;
            const postTime = p.createdAt || p.updatedAt || (p.date ? \\\\T00:00:00Z\\\ : null);
            if (!postTime) return true;
            const postDate = new Date(postTime);
            if (isNaN(postDate.getTime())) return true;
            const diffHours = (new Date() - postDate) / (1000 * 60 * 60);
            return diffHours < 24;
          }).length})</span>
        </button>
      </div>;

if (content.includes(brokenStr)) {
  content = content.replace(brokenStr, fixedStr);
  fs.writeFileSync('src/pages/PlaceFeedPage.jsx', content, 'utf8');
  console.log('Fixed successfully');
} else if (content.includes('오늘 유효한 게시글')) {
  console.log('Already fixed');
} else {
  console.log('Could not find target string');
}
