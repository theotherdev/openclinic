'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Users, FileText, Package, AlertTriangle, TrendingUp, Calendar } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { DashboardService } from '@/lib/services/dashboard.service';
import { InventoryService } from '@/lib/services/inventory.service';
import { AppointmentService } from '@/lib/services/appointment.service';
import { useAuth } from '@/lib/hooks/use-auth';
import { Appointment } from '@/lib/types';

export default function DashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [weekData, setWeekData] = useState<any[]>([]);
  const [todayAppointments, setTodayAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [dashStats, invAlerts, weekly, appointments] = await Promise.all([
          DashboardService.getDashboardStats(),
          InventoryService.getLowStockAlerts(),
          DashboardService.getWeeklyPatientData(),
          AppointmentService.getTodayAppointments(),
        ]);
        setStats(dashStats);
        setAlerts(invAlerts);
        setWeekData(weekly);
        setTodayAppointments(appointments);
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();

    // Set up real-time listeners if needed
    // const unsubscribe = DashboardService.onDashboardUpdate((updatedStats) => {
    //   setStats(updatedStats);
    // });

    // return () => {
    //   unsubscribe();
    // };
  }, []);

  if (loading) {
    return (
      <div className="space-y-6 p-4">
        <div>
          <h1 className="mb-2">Dashboard</h1>
          <p className="text-muted-foreground">Loading dashboard data...</p>
        </div>
        <div className="text-center py-10">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="mb-2">Dashboard</h1>
        <p className="text-muted-foreground">Overview of clinic operations and key metrics</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle>Today's Patients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl">{stats?.todayPatients}</div>
            <p className="text-xs text-muted-foreground mt-1">
              <span className="text-green-600 flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                +12% from yesterday
              </span>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle>Total Patients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl">{stats?.totalPatients}</div>
            <p className="text-xs text-muted-foreground mt-1">Active registered patients</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle>Prescriptions</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl">{stats?.todayPrescriptions}</div>
            <p className="text-xs text-muted-foreground mt-1">Issued today</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle>Low Stock Items</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl text-red-600">{stats?.lowStockItems}</div>
            <p className="text-xs text-muted-foreground mt-1">Require immediate attention</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Inventory Alerts</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {alerts.length > 0 ? (
            alerts.map((alert, index) => (
              <Alert key={index} className="border-red-500 bg-red-50">
                <AlertTriangle className={`h-4 w-4 text-red-600`} />
                <AlertTitle>Low Stock Alert</AlertTitle>
                <AlertDescription className="flex items-center justify-between">
                  <span>
                    {alert.medicineName} - Only {alert.currentStock} units remaining (Threshold: {alert.threshold})
                  </span>
                  <Badge variant="destructive">
                    CRITICAL
                  </Badge>
                </AlertDescription>
              </Alert>
            ))
          ) : (
            <p className="text-muted-foreground">No inventory alerts at this time</p>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Patient Visits This Week</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={weekData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Patient Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={weekData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Today's Appointments
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {todayAppointments.length > 0 ? (
              todayAppointments.map((appointment) => (
                <div key={appointment.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <div className="text-sm text-muted-foreground">
                        {appointment.startDate.toLocaleTimeString('en-US', {
                          hour: '2-digit',
                          minute: '2-digit',
                          hour12: true
                        })}
                      </div>
                    </div>
                    <div>
                      <div>{appointment.patientName}</div>
                      <div className="text-sm text-muted-foreground">{appointment.title}</div>
                    </div>
                  </div>
                  <Badge variant={
                    appointment.status === "Completed" ? "secondary" :
                    appointment.status === "Scheduled" ? "outline" :
                    "destructive"
                  }>
                    {appointment.status === "Completed" ? "Completed" :
                     appointment.status === "Scheduled" ? "Scheduled" : "Cancelled"}
                  </Badge>
                </div>
              ))
            ) : (
              <p className="text-muted-foreground text-center py-4">No appointments scheduled for today</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
