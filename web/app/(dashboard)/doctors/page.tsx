'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Plus, Trash2 } from 'lucide-react';
import { DoctorService } from '@/lib/services/doctor.service';

export default function DoctorsPage() {
  const [doctors, setDoctors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddDoctorOpen, setIsAddDoctorOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    displayName: '',
    email: '',
  });

  // Load doctors on mount
  useEffect(() => {
    const unsubscribe = DoctorService.getAllDoctors((doctorsData) => {
      setDoctors(doctorsData);
      setLoading(false);
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const handleAddDoctor = async () => {
    if (!formData.displayName || !formData.email) {
      toast.error('Please fill in all fields');
      return;
    }

    setIsSubmitting(true);
    try {
      // Save doctor to Firestore
      const { db } = await import('@/lib/firebase/config');
      const { collection, addDoc } = await import('firebase/firestore');

      await addDoc(collection(db, 'users'), {
        displayName: formData.displayName,
        email: formData.email,
        role: 'doctor',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      toast.success('Doctor added successfully');
      setFormData({ displayName: '', email: '' });
      setIsAddDoctorOpen(false);
    } catch (error) {
      console.error('Error adding doctor:', error);
      toast.error('Failed to add doctor');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return <div className="text-center py-10">Loading doctors...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">Doctors Management</h1>
          <p className="text-muted-foreground">Manage doctors and healthcare providers</p>
        </div>
        <Dialog open={isAddDoctorOpen} onOpenChange={setIsAddDoctorOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add Doctor
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add New Doctor</DialogTitle>
              <DialogDescription>
                Add a new doctor to the system. They can then schedule appointments.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Doctor Name</Label>
                <Input
                  id="name"
                  placeholder="e.g., Dr. Sarah Johnson"
                  value={formData.displayName}
                  onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="e.g., dr.sarah@clinic.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDoctorOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddDoctor} disabled={isSubmitting}>
                {isSubmitting ? 'Adding...' : 'Add Doctor'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Doctors List</CardTitle>
        </CardHeader>
        <CardContent>
          {doctors.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No doctors added yet. Click "Add Doctor" to get started.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {doctors.map((doctor) => (
                <div key={doctor.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition">
                  <div>
                    <p className="font-medium">{doctor.displayName}</p>
                    <p className="text-sm text-muted-foreground">{doctor.email}</p>
                  </div>
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Doctor</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
