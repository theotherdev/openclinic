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
import { Medicine, InventoryTransaction } from '../types';

export class InventoryService {
  private static medicineCollection = 'inventory';
  private static transactionCollection = 'inventory_transactions';

  // Get all medicines with real-time updates
  static getAllMedicines(onUpdate: (medicines: Medicine[]) => void) {
    const q = query(collection(db, this.medicineCollection), orderBy('name'));
    
    return onSnapshot(q, (snapshot) => {
      const medicines: Medicine[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        medicines.push({
          id: doc.id,
          medicineId: data.medicineId,
          name: data.name,
          category: data.category,
          manufacturer: data.manufacturer,
          batchNo: data.batchNo,
          stock: data.stock,
          threshold: data.threshold,
          unit: data.unit,
          expiryDate: data.expiryDate.toDate(),
          price: data.price,
          createdAt: data.createdAt.toDate(),
        });
      });
      onUpdate(medicines);
    });
  }

  // Get medicine by ID
  static async getMedicineById(id: string): Promise<Medicine | null> {
    const medicineDoc = await getDoc(doc(db, this.medicineCollection, id));
    
    if (medicineDoc.exists()) {
      const data = medicineDoc.data();
      return {
        id: medicineDoc.id,
        medicineId: data.medicineId,
        name: data.name,
        category: data.category,
        manufacturer: data.manufacturer,
        batchNo: data.batchNo,
        stock: data.stock,
        threshold: data.threshold,
        unit: data.unit,
        expiryDate: data.expiryDate.toDate(),
        price: data.price,
        createdAt: data.createdAt.toDate(),
      };
    }
    
    return null;
  }

  // Create new medicine
  static async createMedicine(medicineData: Omit<Medicine, 'id' | 'createdAt'>): Promise<string> {
    const medicineRef = await addDoc(collection(db, this.medicineCollection), {
      ...medicineData,
      createdAt: Timestamp.now(),
    });
    
    return medicineRef.id;
  }

  // Update medicine
  static async updateMedicine(id: string, medicineData: Partial<Medicine>): Promise<void> {
    const medicineRef = doc(db, this.medicineCollection, id);
    await updateDoc(medicineRef, {
      ...medicineData,
      updatedAt: Timestamp.now(),
    });
  }

  // Restock medicine
  static async restockMedicine(id: string, medicineId: string, medicineName: string, quantity: number, userId: string, userName: string): Promise<void> {
    const medicineRef = doc(db, this.medicineCollection, id);
    const medicineDoc = await getDoc(medicineRef);
    
    if (!medicineDoc.exists()) {
      throw new Error('Medicine not found');
    }
    
    const currentData = medicineDoc.data();
    const currentStock = currentData.stock;
    const newStock = currentStock + quantity;
    
    // Create transaction record
    await addDoc(collection(db, this.transactionCollection), {
      medicineId,
      type: 'RESTOCK',
      quantity,
      previousStock: currentStock,
      newStock,
      performedBy: userId,
      createdAt: Timestamp.now(),
    });
    
    // Update medicine stock
    await updateDoc(medicineRef, {
      stock: newStock,
      updatedAt: Timestamp.now(),
    });
  }

  // Deduct stock for prescription
  static async deductStock(medicineId: string, quantity: number, prescriptionId: string, userId: string): Promise<void> {
    const medicinesQuery = query(
      collection(db, this.medicineCollection),
      where('medicineId', '==', medicineId)
    );
    const snapshot = await getDocs(medicinesQuery);
    
    if (snapshot.empty) {
      throw new Error(`Medicine with ID ${medicineId} not found`);
    }
    
    const medicineDoc = snapshot.docs[0];
    const medicineRef = doc(db, this.medicineCollection, medicineDoc.id);
    const currentData = medicineDoc.data();
    const currentStock = currentData.stock;
    
    if (currentStock < quantity) {
      throw new Error(`Insufficient stock for ${currentData.name}. Available: ${currentStock}, Required: ${quantity}`);
    }
    
    const newStock = currentStock - quantity;
    
    // Use a batch write to ensure both operations happen atomically
    const batch = writeBatch(db);
    
    // Create transaction record
    const transactionRef = doc(collection(db, this.transactionCollection));
    batch.set(transactionRef, {
      medicineId,
      type: 'PRESCRIPTION',
      quantity,
      previousStock: currentStock,
      newStock,
      prescriptionId,
      performedBy: userId,
      createdAt: Timestamp.now(),
    });
    
    // Update medicine stock
    batch.update(medicineRef, {
      stock: newStock,
      updatedAt: Timestamp.now(),
    });
    
    await batch.commit();
  }

  // Get low stock alerts
  static async getLowStockAlerts(): Promise<{medicineId: string, medicineName: string, currentStock: number, threshold: number}[]> {
    const q = query(collection(db, this.medicineCollection));
    const snapshot = await getDocs(q);

    const alerts: {medicineId: string, medicineName: string, currentStock: number, threshold: number}[] = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      if (data.stock < data.threshold) {
        alerts.push({
          medicineId: data.medicineId,
          medicineName: data.name,
          currentStock: data.stock,
          threshold: data.threshold,
        });
      }
    });

    return alerts;
  }

  // Generate unique medicine ID (MED001, MED002, etc.)
  static async generateMedicineId(): Promise<string> {
    // Get the highest medicine ID currently in the system
    const q = query(collection(db, this.medicineCollection), orderBy('medicineId', 'desc'));
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      return 'MED001';
    }
    
    // Get the first document (highest medicineId)
    const lastMedicine = snapshot.docs[0].data();
    const lastId = lastMedicine.medicineId as string;
    
    // Extract the numeric part from the ID (e.g., from MED005 get 5)
    const lastNumber = parseInt(lastId.replace('MED', ''), 10);
    const nextId = lastNumber + 1;
    
    // Format the next ID with leading zeros (MED001, MED002, etc.)
    return `MED${nextId.toString().padStart(3, '0')}`;
  }
}