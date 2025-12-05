import { 
  signInWithEmailAndPassword, 
  signOut as firebaseSignOut, 
  User as FirebaseUser,
  onAuthStateChanged as onFirebaseAuthStateChanged 
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase/config';
import { User } from '../types';

export class AuthService {
  static async signIn(email: string, password: string): Promise<User> {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;
      
      // Fetch user document from Firestore
      const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
      
      if (!userDoc.exists()) {
        throw new Error('User document not found in database');
      }
      
      const userData = userDoc.data();
      return {
        id: firebaseUser.uid,
        email: firebaseUser.email || '',
        displayName: userData.displayName || '',
        role: userData.role || 'staff',
        createdAt: userData.createdAt.toDate(),
        updatedAt: userData.updatedAt.toDate(),
      };
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    }
  }

  static async signOut(): Promise<void> {
    try {
      await firebaseSignOut(auth);
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  }

  static getCurrentUser(): FirebaseUser | null {
    return auth.currentUser;
  }

  static onAuthStateChanged(callback: (user: FirebaseUser | null) => void) {
    return onFirebaseAuthStateChanged(auth, callback);
  }

  // Method to create a user document after authentication if it doesn't exist
  static async createUserDocument(user: FirebaseUser, additionalData?: Partial<User>): Promise<void> {
    const userRef = doc(db, 'users', user.uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      await setDoc(userRef, {
        email: user.email,
        displayName: user.displayName || additionalData?.displayName || '',
        role: additionalData?.role || 'staff',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
  }
}