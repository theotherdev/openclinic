import {
  collection,
  query,
  where,
  getDocs,
  onSnapshot,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { User } from '../types';

export class DoctorService {
  private static usersCollection = 'users';

  // Get all doctors with real-time updates
  static getAllDoctors(onUpdate: (doctors: User[]) => void) {
    const q = query(
      collection(db, this.usersCollection),
      where('role', '==', 'doctor')
    );

    return onSnapshot(q, (snapshot) => {
      const doctors: User[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        doctors.push({
          id: doc.id,
          email: data.email,
          displayName: data.displayName,
          role: data.role,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
        });
      });
      onUpdate(doctors);
    });
  }

  // Get all doctors as a promise
  static async getAllDoctorsAsync(): Promise<User[]> {
    const q = query(
      collection(db, this.usersCollection),
      where('role', '==', 'doctor')
    );

    const snapshot = await getDocs(q);
    const doctors: User[] = [];

    snapshot.forEach((doc) => {
      const data = doc.data();
      doctors.push({
        id: doc.id,
        email: data.email,
        displayName: data.displayName,
        role: data.role,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      });
    });

    return doctors;
  }
}
