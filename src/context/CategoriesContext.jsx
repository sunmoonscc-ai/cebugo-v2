import React, { createContext, useContext, useState, useEffect } from 'react';
import { db } from '../firebase/config';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { CATEGORIES as INITIAL_CATEGORIES } from '../constants/categories';

const CategoriesContext = createContext();

export const useCategories = () => useContext(CategoriesContext);

export const CategoriesProvider = ({ children }) => {
  const [categories, setCategories] = useState(INITIAL_CATEGORIES);
  
  // Create a category map for O(1) lookups
  const categoryMap = categories.reduce((acc, cat) => {
    if (cat.id !== 'all') {
      acc[cat.id] = cat.name;
    }
    return acc;
  }, {});

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'cebugo_config', 'categories'), async (docSnap) => {
      if (docSnap.exists() && Array.isArray(docSnap.data().list) && docSnap.data().list.length > 0) {
        setCategories(docSnap.data().list);
      } else {
        // Fallback to initial and save to Firestore if it doesn't exist
        setCategories(INITIAL_CATEGORIES);
        try {
          await setDoc(doc(db, 'cebugo_config', 'categories'), {
            list: INITIAL_CATEGORIES,
            updatedAt: new Date().toISOString()
          }, { merge: true });
        } catch (e) {
          console.error("Failed to seed initial categories to Firestore", e);
        }
      }
    });

    return () => unsub();
  }, []);

  const saveCategories = async (newList) => {
    // Ensure 'all' is always at the top and present
    let finalCategories = [...newList];
    const allIndex = finalCategories.findIndex(c => c.id === 'all');
    if (allIndex > -1) {
      const allItem = finalCategories.splice(allIndex, 1)[0];
      finalCategories.unshift(allItem);
    } else {
      finalCategories.unshift({ id: 'all', name: '전체' });
    }

    setCategories(finalCategories);
    try {
      await setDoc(doc(db, 'cebugo_config', 'categories'), {
        list: finalCategories,
        updatedAt: new Date().toISOString()
      }, { merge: true });
    } catch (e) {
      console.error("Failed to save categories to Firestore", e);
      alert("카테고리 저장 중 오류가 발생했습니다.");
    }
  };

  const addCategory = (id, name) => {
    if (categories.some(c => c.id === id)) {
      alert("이미 존재하는 ID입니다.");
      return;
    }
    const newList = [...categories, { id, name }];
    saveCategories(newList);
  };

  const updateCategory = (id, newName) => {
    if (id === 'all') return; // Cannot edit 'all'
    const newList = categories.map(c => c.id === id ? { ...c, name: newName } : c);
    saveCategories(newList);
  };

  const deleteCategory = (id) => {
    if (id === 'all') return; // Cannot delete 'all'
    const newList = categories.filter(c => c.id !== id);
    saveCategories(newList);
  };

  const reorderCategories = (newList) => {
    saveCategories(newList);
  };

  return (
    <CategoriesContext.Provider value={{ categories, categoryMap, addCategory, updateCategory, deleteCategory, reorderCategories }}>
      {children}
    </CategoriesContext.Provider>
  );
};
