import re

with open('src/pages/DailyInfoPage.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Restore useLocation
content = content.replace("import { useNavigate } from 'react-router-dom';", "import { useNavigate, useLocation } from 'react-router-dom';")
content = content.replace("const navigate = useNavigate();", "const navigate = useNavigate();\n  const location = useLocation();")

use_effect_code = """  const setActiveTab = (tab) => {
    setActiveTabState(tab);
    try {
      sessionStorage.setItem('cebugo_daily_tab', tab);
    } catch (e) {}
  };

  const processedLocationKey = useRef(null);

  useEffect(() => {
    if (location.state?.tab) {
      setActiveTab(location.state.tab);
    }
    
    if (location.state?.targetId) {
      if (processedLocationKey.current !== location.key) {
        processedLocationKey.current = location.key;
        setTimeout(() => {
          const el = document.getElementById(daily-item-);
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            el.classList.add('highlight-flash');
            setTimeout(() => el.classList.remove('highlight-flash'), 2500);
          } else {
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }
        }, 500);
      }
    } else {
      if (processedLocationKey.current !== location.key) {
        processedLocationKey.current = location.key;
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  }, [location.state, location.key]);"""

content = content.replace("  const setActiveTab = (tab) => {\n    setActiveTabState(tab);\n    try {\n      sessionStorage.setItem('cebugo_daily_tab', tab);\n    } catch (e) {}\n  };", use_effect_code)

# Fix min order for notice
notice_replace_from = """    const docId = editingNotice ? editingNotice.id : 
_;
    const noticeToSave = {
      id: docId,
      title: noticeFormData.title.trim(),
      badge: noticeFormData.badge || '중요공지',
      date: noticeFormData.date || getLocalTodayString(),
      startDate: noticeFormData.startDate || '',
      endDate: noticeFormData.endDate || '',
      content: noticeFormData.content.trim(),
      images: noticeFormData.images || [],
      isTicker: noticeFormData.isTicker !== undefined ? noticeFormData.isTicker : true,
      updatedAt: new Date().toISOString()
    };"""
notice_replace_to = """    const minOrder = notices.length > 0 ? Math.min(...notices.map((n) => n.order !== undefined ? n.order : 0)) : 0;
    const docId = editingNotice ? editingNotice.id : 
_;
    const noticeToSave = {
      id: docId,
      title: noticeFormData.title.trim(),
      badge: noticeFormData.badge || '중요공지',
      date: noticeFormData.date || getLocalTodayString(),
      startDate: noticeFormData.startDate || '',
      endDate: noticeFormData.endDate || '',
      content: noticeFormData.content.trim(),
      images: noticeFormData.images || [],
      isTicker: noticeFormData.isTicker !== undefined ? noticeFormData.isTicker : true,
      order: editingNotice && editingNotice.order !== undefined ? editingNotice.order : minOrder - 1,
      updatedAt: new Date().toISOString()
    };"""
content = content.replace(notice_replace_from, notice_replace_to)

# Fix min order for contacts
contact_replace_from = """    const docId = editingContact ? editingContact.id : c_;

    const contactToSave = {
      id: docId,
      ...contactFormData,
      category: finalCategory,
      phones: cleanPhones.length > 0 ? cleanPhones : ['미등록'],
      snsList: cleanSns,
      updatedAt: new Date().toISOString()
    };"""
contact_replace_to = """    const minOrder = contacts.length > 0 ? Math.min(...contacts.map((c) => c.order !== undefined ? c.order : 0)) : 0;
    const docId = editingContact ? editingContact.id : c_;

    const contactToSave = {
      id: docId,
      ...contactFormData,
      category: finalCategory,
      phones: cleanPhones.length > 0 ? cleanPhones : ['미등록'],
      snsList: cleanSns,
      order: editingContact && editingContact.order !== undefined ? editingContact.order : minOrder - 1,
      updatedAt: new Date().toISOString()
    };"""
content = content.replace(contact_replace_from, contact_replace_to)

# Fix min order for travel info
info_replace_from = """    const docId = editingInfo ? editingInfo.id : i_;
    const infoToSave = {
      id: docId,
      ...infoFormData,
      updatedAt: new Date().toISOString()
    };"""
info_replace_to = """    const minOrder = travelInfos.length > 0 ? Math.min(...travelInfos.map((t) => t.order !== undefined ? t.order : 0)) : 0;
    const docId = editingInfo ? editingInfo.id : i_;
    const infoToSave = {
      id: docId,
      ...infoFormData,
      order: editingInfo && editingInfo.order !== undefined ? editingInfo.order : minOrder - 1,
      updatedAt: new Date().toISOString()
    };"""
content = content.replace(info_replace_from, info_replace_to)

with open('src/pages/DailyInfoPage.jsx', 'w', encoding='utf-8') as f:
    f.write(content)
