import { 
  collection, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  Timestamp
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { DashboardStats, InventoryAlert } from '../types';
import { InventoryService } from './inventory.service';

export class DashboardService {
  // Get dashboard statistics
  static async getDashboardStats(): Promise<DashboardStats> {
    // Get patient count
    const patientsSnapshot = await getDocs(collection(db, 'patients'));
    const totalPatients = patientsSnapshot.size;
    
    // Get today's patient count
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);
    
    const todayPatientsQuery = query(
      collection(db, 'patients'),
      where('createdAt', '>=', Timestamp.fromDate(startOfDay)),
      where('createdAt', '<=', Timestamp.fromDate(endOfDay))
    );
    const todayPatientsSnapshot = await getDocs(todayPatientsQuery);
    const todayPatients = todayPatientsSnapshot.size;
    
    // Get prescription count
    const prescriptionsSnapshot = await getDocs(collection(db, 'prescriptions'));
    const totalPrescriptions = prescriptionsSnapshot.size;
    
    // Get today's prescription count
    const todayPrescriptionsQuery = query(
      collection(db, 'prescriptions'),
      where('date', '>=', Timestamp.fromDate(startOfDay)),
      where('date', '<=', Timestamp.fromDate(endOfDay))
    );
    const todayPrescriptionsSnapshot = await getDocs(todayPrescriptionsQuery);
    const todayPrescriptions = todayPrescriptionsSnapshot.size;
    
    // Get low stock items count
    const lowStockItems = (await InventoryService.getLowStockAlerts()).length;
    
    // Calculate total inventory value
    const inventorySnapshot = await getDocs(collection(db, 'inventory'));
    let totalInventoryValue = 0;
    inventorySnapshot.forEach(doc => {
      const data = doc.data();
      totalInventoryValue += data.stock * data.price;
    });
    
    return {
      totalPatients,
      todayPatients,
      totalPrescriptions,
      todayPrescriptions,
      lowStockItems,
      totalInventoryValue,
    };
  }

  // Get weekly patient data for chart
  static async getWeeklyPatientData(): Promise<{ day: string; count: number }[]> {
    const weekData: { day: string; count: number }[] = [];
    
    // Get the start of the week (Sunday)
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay()); // Sunday of the current week
    startOfWeek.setHours(0, 0, 0, 0);
    
    // Get end of the week 
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 7);
    endOfWeek.setHours(23, 59, 59, 999);
    
    // Query for patients in the current week
    const weeklyPatientsQuery = query(
      collection(db, 'patients'),
      where('createdAt', '>=', Timestamp.fromDate(startOfWeek)),
      where('createdAt', '<=', Timestamp.fromDate(endOfWeek)),
      orderBy('createdAt', 'asc')
    );
    const weeklyPatientsSnapshot = await getDocs(weeklyPatientsQuery);
    
    // Initialize data for each day of the week
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    for (let i = 0; i < 7; i++) {
      const dayDate = new Date(startOfWeek);
      dayDate.setDate(startOfWeek.getDate() + i);
      
      // Count appointments for this day
      let count = 0;
      weeklyPatientsSnapshot.forEach(doc => {
        const data = doc.data();
        const docDate = data.createdAt.toDate();
        if (
          docDate.getDate() === dayDate.getDate() &&
          docDate.getMonth() === dayDate.getMonth() &&
          docDate.getFullYear() === dayDate.getFullYear()
        ) {
          count++;
        }
      });
      
      weekData.push({
        day: days[i],
        count,
      });
    }
    
    return weekData;
  }

  // Get today's appointments/prescriptions
  static async getTodayAppointments(): Promise<number> {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);
    
    const todayPrescriptionsQuery = query(
      collection(db, 'prescriptions'),
      where('date', '>=', Timestamp.fromDate(startOfDay)),
      where('date', '<=', Timestamp.fromDate(endOfDay))
    );
    const todayPrescriptionsSnapshot = await getDocs(todayPrescriptionsQuery);
    
    return todayPrescriptionsSnapshot.size;
  }
}