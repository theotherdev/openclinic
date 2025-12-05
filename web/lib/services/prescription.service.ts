import {
  collection,
  addDoc,
  doc,
  getDoc,
  getDocs,
  updateDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  Timestamp,
  writeBatch
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { Prescription, Medication } from '../types';
import { InventoryService } from './inventory.service';

export class PrescriptionService {
  private static collectionName = 'prescriptions';

  // Get all prescriptions with real-time updates
  static getAllPrescriptions(onUpdate: (prescriptions: Prescription[]) => void) {
    const q = query(collection(db, this.collectionName), orderBy('date', 'desc'));
    
    return onSnapshot(q, (snapshot) => {
      const prescriptions: Prescription[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        prescriptions.push({
          id: doc.id,
          prescriptionId: data.prescriptionId,
          patientId: data.patientId,
          patientName: data.patientName,
          patientAge: data.patientAge,
          patientGender: data.patientGender,
          doctorId: data.doctorId,
          doctorName: data.doctorName,
          date: data.date.toDate(),
          diagnosis: data.diagnosis,
          medications: data.medications,
          instructions: data.instructions,
          status: data.status,
          pdfUrl: data.pdfUrl,
          createdAt: data.createdAt.toDate(),
        });
      });
      onUpdate(prescriptions);
    });
  }

  // Get prescription by ID
  static async getPrescriptionById(id: string): Promise<Prescription | null> {
    const prescriptionDoc = await getDoc(doc(db, this.collectionName, id));
    
    if (prescriptionDoc.exists()) {
      const data = prescriptionDoc.data();
      return {
        id: prescriptionDoc.id,
        prescriptionId: data.prescriptionId,
        patientId: data.patientId,
        patientName: data.patientName,
        patientAge: data.patientAge,
        patientGender: data.patientGender,
        doctorId: data.doctorId,
        doctorName: data.doctorName,
        date: data.date.toDate(),
        diagnosis: data.diagnosis,
        medications: data.medications,
        instructions: data.instructions,
        status: data.status,
        pdfUrl: data.pdfUrl,
        createdAt: data.createdAt.toDate(),
      };
    }
    
    return null;
  }

  // Create new prescription (includes stock validation and deduction)
  static async createPrescription(prescriptionData: Omit<Prescription, 'id' | 'createdAt' | 'prescriptionId'>): Promise<string> {
    // First, validate that all medications have sufficient stock
    for (const medication of prescriptionData.medications) {
      // Find the medicine in inventory to check stock
      const medicinesQuery = query(
        collection(db, 'inventory'),
        where('medicineId', '==', medication.medicineId)
      );
      const snapshot = await getDocs(medicinesQuery);
      
      if (snapshot.empty) {
        throw new Error(`Medicine ${medication.medicineName} not found in inventory`);
      }
      
      const medicineDoc = snapshot.docs[0];
      const medicineData = medicineDoc.data();
      
      if (medicineData.stock < medication.quantity) {
        throw new Error(`Insufficient stock for ${medication.medicineName}. Available: ${medicineData.stock}, Required: ${medication.quantity}`);
      }
    }
    
    // Generate prescription ID
    const prescriptionId = await this.generatePrescriptionId();
    
    // Create the prescription document
    const prescriptionRef = await addDoc(collection(db, this.collectionName), {
      ...prescriptionData,
      prescriptionId,
      date: Timestamp.fromDate(prescriptionData.date),
      createdAt: Timestamp.now(),
    });
    
    // Deduct stock for each medication
    for (const medication of prescriptionData.medications) {
      await InventoryService.deductStock(
        medication.medicineId, 
        medication.quantity, 
        prescriptionRef.id, 
        prescriptionData.doctorId
      );
    }
    
    return prescriptionRef.id;
  }

  // Update prescription
  static async updatePrescription(id: string, prescriptionData: Partial<Prescription>): Promise<void> {
    const prescriptionRef = doc(db, this.collectionName, id);
    await updateDoc(prescriptionRef, {
      ...prescriptionData,
      updatedAt: Timestamp.now(),
    });
  }

  // Generate unique prescription ID (RX001, RX002, etc.)
  static async generatePrescriptionId(): Promise<string> {
    // Get the highest prescription ID currently in the system
    const q = query(collection(db, this.collectionName), orderBy('prescriptionId', 'desc'));
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      return 'RX001';
    }
    
    // Get the first document (highest prescriptionId)
    const lastPrescription = snapshot.docs[0].data();
    const lastId = lastPrescription.prescriptionId as string;
    
    // Extract the numeric part from the ID (e.g., from RX005 get 5)
    const lastNumber = parseInt(lastId.replace('RX', ''), 10);
    const nextId = lastNumber + 1;
    
    // Format the next ID with leading zeros (RX001, RX002, etc.)
    return `RX${nextId.toString().padStart(3, '0')}`;
  }
}