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
  Timestamp,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { Appointment } from '../types';

export class AppointmentService {
  private static appointmentCollection = 'appointments';

  // Get all appointments with real-time updates
  static getAllAppointments(onUpdate: (appointments: Appointment[]) => void) {
    const q = query(
      collection(db, this.appointmentCollection),
      orderBy('startDate', 'asc')
    );

    return onSnapshot(q, (snapshot) => {
      const appointments: Appointment[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        appointments.push({
          id: doc.id,
          appointmentId: data.appointmentId,
          patientId: data.patientId,
          patientName: data.patientName,
          doctorId: data.doctorId,
          doctorName: data.doctorName,
          startDate: data.startDate.toDate(),
          endDate: data.endDate.toDate(),
          title: data.title,
          description: data.description,
          status: data.status,
          notes: data.notes,
          createdAt: data.createdAt.toDate(),
          updatedAt: data.updatedAt.toDate(),
        });
      });
      onUpdate(appointments);
    });
  }

  // Get appointments by date range
  static async getAppointmentsByDateRange(
    startDate: Date,
    endDate: Date
  ): Promise<Appointment[]> {
    const q = query(
      collection(db, this.appointmentCollection),
      where('startDate', '>=', Timestamp.fromDate(startDate)),
      where('startDate', '<=', Timestamp.fromDate(endDate)),
      orderBy('startDate', 'asc')
    );

    const snapshot = await getDocs(q);
    const appointments: Appointment[] = [];

    snapshot.forEach((doc) => {
      const data = doc.data();
      appointments.push({
        id: doc.id,
        appointmentId: data.appointmentId,
        patientId: data.patientId,
        patientName: data.patientName,
        doctorId: data.doctorId,
        doctorName: data.doctorName,
        startDate: data.startDate.toDate(),
        endDate: data.endDate.toDate(),
        title: data.title,
        description: data.description,
        status: data.status,
        notes: data.notes,
        createdAt: data.createdAt.toDate(),
        updatedAt: data.updatedAt.toDate(),
      });
    });

    return appointments;
  }

  // Get appointments by doctor
  static async getAppointmentsByDoctor(
    doctorId: string
  ): Promise<Appointment[]> {
    const q = query(
      collection(db, this.appointmentCollection),
      where('doctorId', '==', doctorId),
      orderBy('startDate', 'asc')
    );

    const snapshot = await getDocs(q);
    const appointments: Appointment[] = [];

    snapshot.forEach((doc) => {
      const data = doc.data();
      appointments.push({
        id: doc.id,
        appointmentId: data.appointmentId,
        patientId: data.patientId,
        patientName: data.patientName,
        doctorId: data.doctorId,
        doctorName: data.doctorName,
        startDate: data.startDate.toDate(),
        endDate: data.endDate.toDate(),
        title: data.title,
        description: data.description,
        status: data.status,
        notes: data.notes,
        createdAt: data.createdAt.toDate(),
        updatedAt: data.updatedAt.toDate(),
      });
    });

    return appointments;
  }

  // Get appointments by patient
  static async getAppointmentsByPatient(
    patientId: string
  ): Promise<Appointment[]> {
    const q = query(
      collection(db, this.appointmentCollection),
      where('patientId', '==', patientId),
      orderBy('startDate', 'asc')
    );

    const snapshot = await getDocs(q);
    const appointments: Appointment[] = [];

    snapshot.forEach((doc) => {
      const data = doc.data();
      appointments.push({
        id: doc.id,
        appointmentId: data.appointmentId,
        patientId: data.patientId,
        patientName: data.patientName,
        doctorId: data.doctorId,
        doctorName: data.doctorName,
        startDate: data.startDate.toDate(),
        endDate: data.endDate.toDate(),
        title: data.title,
        description: data.description,
        status: data.status,
        notes: data.notes,
        createdAt: data.createdAt.toDate(),
        updatedAt: data.updatedAt.toDate(),
      });
    });

    return appointments;
  }

  // Get appointment by ID
  static async getAppointmentById(id: string): Promise<Appointment | null> {
    const appointmentDoc = await getDoc(
      doc(db, this.appointmentCollection, id)
    );

    if (appointmentDoc.exists()) {
      const data = appointmentDoc.data();
      return {
        id: appointmentDoc.id,
        appointmentId: data.appointmentId,
        patientId: data.patientId,
        patientName: data.patientName,
        doctorId: data.doctorId,
        doctorName: data.doctorName,
        startDate: data.startDate.toDate(),
        endDate: data.endDate.toDate(),
        title: data.title,
        description: data.description,
        status: data.status,
        notes: data.notes,
        createdAt: data.createdAt.toDate(),
        updatedAt: data.updatedAt.toDate(),
      };
    }

    return null;
  }

  // Create new appointment
  static async createAppointment(
    appointmentData: Omit<Appointment, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<string> {
    const appointmentRef = await addDoc(
      collection(db, this.appointmentCollection),
      {
        ...appointmentData,
        startDate: Timestamp.fromDate(appointmentData.startDate),
        endDate: Timestamp.fromDate(appointmentData.endDate),
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      }
    );

    return appointmentRef.id;
  }

  // Update appointment
  static async updateAppointment(
    id: string,
    appointmentData: Partial<Appointment>
  ): Promise<void> {
    const appointmentRef = doc(db, this.appointmentCollection, id);
    const updateData: any = { ...appointmentData };

    if (appointmentData.startDate) {
      updateData.startDate = Timestamp.fromDate(appointmentData.startDate);
    }
    if (appointmentData.endDate) {
      updateData.endDate = Timestamp.fromDate(appointmentData.endDate);
    }

    updateData.updatedAt = Timestamp.now();

    await updateDoc(appointmentRef, updateData);
  }

  // Delete appointment
  static async deleteAppointment(id: string): Promise<void> {
    await deleteDoc(doc(db, this.appointmentCollection, id));
  }

  // Get today's appointments
  static async getTodayAppointments(): Promise<Appointment[]> {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0);
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);

    return this.getAppointmentsByDateRange(startOfDay, endOfDay);
  }

  // Generate unique appointment ID (APT001, APT002, etc.)
  static async generateAppointmentId(): Promise<string> {
    const q = query(
      collection(db, this.appointmentCollection),
      orderBy('appointmentId', 'desc')
    );
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return 'APT001';
    }

    const lastAppointment = snapshot.docs[0].data();
    const lastId = lastAppointment.appointmentId as string;
    const lastNumber = parseInt(lastId.replace('APT', ''), 10);
    const nextId = lastNumber + 1;

    return `APT${nextId.toString().padStart(3, '0')}`;
  }
}
