import { 
  collection, 
  addDoc, 
  doc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy,
  onSnapshot,
  QueryDocumentSnapshot,
  Timestamp
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { Patient } from '../types';

export class PatientService {
  private static collectionName = 'patients';

  // Get all patients with real-time updates
  static getAllPatients(onUpdate: (patients: Patient[]) => void) {
    const q = query(collection(db, this.collectionName), orderBy('createdAt', 'desc'));
    
    return onSnapshot(q, (snapshot) => {
      const patients: Patient[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        patients.push({
          id: doc.id,
          patientId: data.patientId,
          firstName: data.firstName,
          lastName: data.lastName,
          fullName: data.fullName,
          age: data.age,
          gender: data.gender,
          phone: data.phone,
          email: data.email,
          address: data.address,
          medicalHistory: data.medicalHistory,
          allergies: data.allergies || [],
          status: data.status,
          createdAt: data.createdAt.toDate(),
          updatedAt: data.updatedAt.toDate(),
        });
      });
      onUpdate(patients);
    });
  }

  // Get patient by ID
  static async getPatientById(id: string): Promise<Patient | null> {
    const patientDoc = await getDoc(doc(db, this.collectionName, id));
    
    if (patientDoc.exists()) {
      const data = patientDoc.data();
      return {
        id: patientDoc.id,
        patientId: data.patientId,
        firstName: data.firstName,
        lastName: data.lastName,
        fullName: data.fullName,
        age: data.age,
        gender: data.gender,
        phone: data.phone,
        email: data.email,
        address: data.address,
        medicalHistory: data.medicalHistory,
        allergies: data.allergies || [],
        status: data.status,
        createdAt: data.createdAt.toDate(),
        updatedAt: data.updatedAt.toDate(),
      };
    }
    
    return null;
  }

  // Create new patient
  static async createPatient(patientData: Omit<Patient, 'id' | 'createdAt' | 'updatedAt'>, userId: string): Promise<string> {
    const patientRef = await addDoc(collection(db, this.collectionName), {
      ...patientData,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
    
    return patientRef.id;
  }

  // Update patient
  static async updatePatient(id: string, patientData: Partial<Patient>): Promise<void> {
    const patientRef = doc(db, this.collectionName, id);
    await updateDoc(patientRef, {
      ...patientData,
      updatedAt: Timestamp.now(),
    });
  }

  // Delete patient
  static async deletePatient(id: string): Promise<void> {
    const patientRef = doc(db, this.collectionName, id);
    await deleteDoc(patientRef);
  }

  // Generate unique patient ID (P001, P002, etc.)
  static async generatePatientId(): Promise<string> {
    // Get the highest patient ID currently in the system
    const q = query(collection(db, this.collectionName), orderBy('patientId', 'desc'), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      return 'P001';
    }
    
    // Get the first document (highest patientId)
    const lastPatient = snapshot.docs[0].data();
    const lastId = lastPatient.patientId as string;
    
    // Extract the numeric part from the ID (e.g., from P005 get 5)
    const lastNumber = parseInt(lastId.replace('P', ''), 10);
    const nextId = lastNumber + 1;
    
    // Format the next ID with leading zeros (P001, P002, etc.)
    return `P${nextId.toString().padStart(3, '0')}`;
  }

  // Search patients by name, ID, or phone
  static async searchPatients(searchTerm: string): Promise<Patient[]> {
    // Search by patientId, fullName, or phone
    const lowerSearchTerm = searchTerm.toLowerCase();
    
    // First get all patients and filter client-side
    // For better performance in a real application, you might want to implement
    // server-side queries using composite indexes
    const q = query(collection(db, this.collectionName), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    
    const patients: Patient[] = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      const patient: Patient = {
        id: doc.id,
        patientId: data.patientId,
        firstName: data.firstName,
        lastName: data.lastName,
        fullName: data.fullName,
        age: data.age,
        gender: data.gender,
        phone: data.phone,
        email: data.email,
        address: data.address,
        medicalHistory: data.medicalHistory,
        allergies: data.allergies || [],
        status: data.status,
        createdAt: data.createdAt.toDate(),
        updatedAt: data.updatedAt.toDate(),
      };
      
      // Check if any relevant field matches the search term
      if (
        patient.patientId.toLowerCase().includes(lowerSearchTerm) ||
        patient.fullName.toLowerCase().includes(lowerSearchTerm) ||
        patient.phone.includes(searchTerm)
      ) {
        patients.push(patient);
      }
    });
    
    return patients;
  }
}