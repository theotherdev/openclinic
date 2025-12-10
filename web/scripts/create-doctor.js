const admin = require('firebase-admin');
const path = require('path');

// Initialize Firebase Admin
const serviceAccountPath = path.join(__dirname, '../firebase-service-account.json');
admin.initializeApp({
  credential: admin.credential.cert(require(serviceAccountPath))
});

const db = admin.firestore();

async function createDoctor() {
  try {
    // Create a sample doctor document
    const doctorData = {
      displayName: 'Dr. Sarah Johnson',
      email: 'dr.sarah@openclinic.com',
      role: 'doctor',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Add document to users collection
    const docRef = await db.collection('users').add(doctorData);
    console.log('✅ Doctor created successfully!');
    console.log('Doctor ID:', docRef.id);
    console.log('Doctor Data:', doctorData);

    // You can now use this ID to create a Firebase Auth account
    console.log('\nNote: You still need to create a Firebase Authentication account for this doctor.');
    console.log('Email: dr.sarah@openclinic.com');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating doctor:', error);
    process.exit(1);
  }
}

createDoctor();
