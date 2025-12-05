import { Timestamp } from 'firebase/firestore';

// User interface
export interface User {
  id: string;
  email: string;
  displayName: string;
  role: 'doctor' | 'admin' | 'staff';
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Patient interface
export interface Patient {
  id: string;
  patientId: string; // Unique patient ID (e.g., P001)
  firstName: string;
  lastName: string;
  fullName: string;
  age: number;
  gender: string;
  phone: string;
  email: string;
  address: string;
  medicalHistory: string;
  allergies: string[];
  status: 'Active' | 'Inactive';
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Medication interface (for prescriptions)
export interface Medication {
  medicineId: string;
  medicineName: string;
  dosage: string;
  frequency: string;
  duration: string;
  quantity: number; // Quantity to be dispensed
}

// Prescription interface
export interface Prescription {
  id: string;
  prescriptionId: string; // Unique prescription ID (e.g., RX001)
  patientId: string;
  patientName: string;
  patientAge: number;
  patientGender: string;
  doctorId: string;
  doctorName: string;
  date: Timestamp;
  diagnosis: string;
  medications: Medication[];
  instructions: string;
  status: 'Active' | 'Completed';
  pdfUrl?: string; // URL to the generated PDF
  createdAt: Timestamp;
}

// Medicine interface (for inventory)
export interface Medicine {
  id: string;
  medicineId: string; // Unique medicine ID (e.g., MED001)
  name: string;
  category: string;
  manufacturer: string;
  batchNo: string;
  stock: number;
  threshold: number; // Minimum stock threshold
  unit: string; // e.g., 'tablet', 'capsule', 'ml', etc.
  expiryDate: Timestamp;
  price: number;
  createdAt: Timestamp;
}

// Inventory alert interface
export interface InventoryAlert {
  medicineId: string;
  medicineName: string;
  currentStock: number;
  threshold: number;
}

// Inventory transaction interface
export interface InventoryTransaction {
  id: string;
  medicineId: string;
  type: 'RESTOCK' | 'PRESCRIPTION'; // Stock added or deducted
  quantity: number;
  previousStock: number;
  newStock: number;
  prescriptionId?: string; // If transaction is due to prescription
  performedBy: string; // User ID who performed the action
  createdAt: Timestamp;
}

// Dashboard statistics interface
export interface DashboardStats {
  totalPatients: number;
  todayPatients: number;
  totalPrescriptions: number;
  todayPrescriptions: number;
  lowStockItems: number;
  totalInventoryValue: number;
}

// Clinic settings interface (for PDF generation)
export interface ClinicSettings {
  name: string;
  address: string;
  phone: string;
  email: string;
  licenseNo: string;
}