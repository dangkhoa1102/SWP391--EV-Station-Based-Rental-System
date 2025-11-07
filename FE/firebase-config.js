// Firebase Configuration
// Replace with your Firebase project credentials
const firebaseConfig = {
  apiKey: "AIzaSyB95eFeBv5s25DMrVrmAkHfvHkW3tYDuME",
  authDomain: "evstationrentaldb-ed90b.firebaseapp.com",
  projectId: "evstationrentaldb-ed90b",
  storageBucket: "evstationrentaldb-ed90b.firebasestorage.app",
  messagingSenderId: "942738918985",
  appId: "1:942738918985:web:d56aa961e5904829233998",
  measurementId: "G-GGH49GXSD0"
};

// Initialize Firebase (will be done in the HTML file after loading Firebase SDK)
let storage = null;

function initializeFirebase() {
  if (typeof firebase === 'undefined') {
    console.error('Firebase SDK not loaded!');
    return false;
  }
  
  try {
    if (!firebase.apps.length) {
      firebase.initializeApp(firebaseConfig);
    }
    storage = firebase.storage();
    console.log('✅ Firebase initialized successfully');
    return true;
  } catch (error) {
    console.error('❌ Firebase initialization error:', error);
    return false;
  }
}

// Upload file to Firebase Storage
async function uploadToFirebase(file, userId, fileType = 'avatar') {
  if (!storage) {
    if (!initializeFirebase()) {
      throw new Error('Firebase not initialized');
    }
  }

  const timestamp = Date.now();
  const fileName = `${userId}_${timestamp}_${file.name}`;
  const storageRef = storage.ref(`users/${userId}/${fileType}/${fileName}`);

  try {
    // Upload file
    const uploadTask = await storageRef.put(file);
    console.log('✅ File uploaded successfully:', uploadTask);

    // Get download URL
    const downloadURL = await storageRef.getDownloadURL();
    console.log('✅ Download URL:', downloadURL);

    return downloadURL;
  } catch (error) {
    console.error('❌ Firebase upload error:', error);
    throw error;
  }
}

// Delete file from Firebase Storage
async function deleteFromFirebase(fileURL) {
  if (!storage) {
    if (!initializeFirebase()) {
      throw new Error('Firebase not initialized');
    }
  }

  try {
    const fileRef = storage.refFromURL(fileURL);
    await fileRef.delete();
    console.log('✅ File deleted successfully');
    return true;
  } catch (error) {
    console.error('❌ Firebase delete error:', error);
    throw error;
  }
}
