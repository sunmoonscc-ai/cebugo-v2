import { initializeApp } from 'firebase/admin/app';
import { getFirestore } from 'firebase/admin/firestore';
import admin from 'firebase-admin';

// Initialize firebase admin
const serviceAccount = require('../../service-account.json'); // path might vary
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = getFirestore();

async function getCategories() {
  const doc = await db.collection('cebugo_config').doc('categories').get();
  console.log(doc.data());
}

getCategories();
