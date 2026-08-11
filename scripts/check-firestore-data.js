const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs } = require('firebase/firestore');
const fs = require('fs');

let envContent = '';
if (fs.existsSync('.env.local')) {
  envContent = fs.readFileSync('.env.local', 'utf8');
}

function getEnv(key) {
  const match = envContent.match(new RegExp(`${key}=["']?([^"'\r\n]+)["']?`));
  return match ? match[1] : process.env[key];
}

const firebaseConfig = {
  apiKey: getEnv("NEXT_PUBLIC_FIREBASE_API_KEY"),
  authDomain: getEnv("NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN"),
  projectId: getEnv("NEXT_PUBLIC_FIREBASE_PROJECT_ID"),
  storageBucket: getEnv("NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET"),
  messagingSenderId: getEnv("NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID"),
  appId: getEnv("NEXT_PUBLIC_FIREBASE_APP_ID"),
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function checkFirestore() {
  console.log("Firebase Project ID:", firebaseConfig.projectId);
  try {
    const mdSnap = await getDocs(collection(db, "mdDocuments"));
    console.log(`\n--- mdDocuments (${mdSnap.size} items) ---`);
    mdSnap.forEach((d) => console.log(`ID: ${d.id} | Title: ${d.data().userTitle}`));

    const flashSnap = await getDocs(collection(db, "flashcardSets"));
    console.log(`\n--- flashcardSets (${flashSnap.size} items) ---`);
    flashSnap.forEach((d) => console.log(`ID: ${d.id} | Model: ${d.data().model} | Cards Count: ${d.data().cards?.length || 0}`));
  } catch (err) {
    console.error("Firestore fetch error:", err.message);
  }
}

checkFirestore();
