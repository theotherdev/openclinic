'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Timestamp } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Search, Plus, Eye, FileText, Calendar, User } from 'lucide-react';
import { PrescriptionService } from '@/lib/services/prescription.service';
import { PatientService } from '@/lib/services/patient.service';
import { DoctorService } from '@/lib/services/doctor.service';
import { InventoryService } from '@/lib/services/inventory.service';
import { PDFService } from '@/lib/services/pdf.service';
import { useAuth } from '@/lib/hooks/use-auth';
import type { Prescription, Patient, Medication, Medicine } from '@/lib/types';

interface Doctor {
  id: string;
  email: string;
  displayName: string;
  role: 'doctor' | 'admin' | 'staff';
  createdAt: any;
  updatedAt: any;
}

export default function PrescriptionsPage() {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddPrescriptionOpen, setIsAddPrescriptionOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const [formData, setFormData] = useState({
    diagnosis: '',
    instructions: '',
  });
  const [selectedMedications, setSelectedMedications] = useState<Medication[]>([]);
  const [newMedication, setNewMedication] = useState({
    medicineId: '',
    medicineName: '',
    dosage: '',
    frequency: '',
    duration: '',
    quantity: 0,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    // Load prescriptions, patients, doctors, and medicines
    const loadAllData = async () => {
      try {
        const [prescData, patientsData, doctorsData, medicinesData] = await Promise.all([
          new Promise<Prescription[]>((resolve) => {
            PrescriptionService.getAllPrescriptions((data) => resolve(data));
          }),
          new Promise<Patient[]>((resolve) => {
            PatientService.getAllPatients((data) => resolve(data));
          }),
          DoctorService.getAllDoctorsAsync(),
          new Promise<Medicine[]>((resolve) => {
            InventoryService.getAllMedicines((data) => resolve(data));
          })
        ]);

        setPrescriptions(prescData);
        setPatients(patientsData);
        setDoctors(doctorsData);
        setMedicines(medicinesData);
      } catch (error) {
        console.error('Error loading data:', error);
        toast.error('Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    loadAllData();
  }, []);

  const filteredPrescriptions = prescriptions.filter(prescription => {
    const matchesSearch =
      prescription.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      prescription.prescriptionId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      prescription.doctorName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = filterStatus === 'all' ||
      (filterStatus === 'active' && prescription.status === 'Active') ||
      (filterStatus === 'completed' && prescription.status === 'Completed');

    return matchesSearch && matchesStatus;
  });

  const handleAddMedication = () => {
    if (!newMedication.medicineId || !newMedication.medicineName) {
      toast.error('Please select a medicine first');
      return;
    }

    const medicine = medicines.find(m => m.medicineId === newMedication.medicineId);
    if (!medicine) {
      toast.error('Selected medicine not found');
      return;
    }

    // Check if stock is sufficient
    if (medicine.stock < newMedication.quantity) {
      toast.error(`Insufficient stock for ${medicine.name}. Available: ${medicine.stock}, Requested: ${newMedication.quantity}`);
      return;
    }

    const medication: Medication = {
      medicineId: newMedication.medicineId,
      medicineName: newMedication.medicineName,
      dosage: newMedication.dosage,
      frequency: newMedication.frequency,
      duration: newMedication.duration,
      quantity: newMedication.quantity,
    };

    setSelectedMedications([...selectedMedications, medication]);

    // Reset the new medication form
    setNewMedication({
      medicineId: '',
      medicineName: '',
      dosage: '',
      frequency: '',
      duration: '',
      quantity: 0,
    });
  };

  const handleRemoveMedication = (index: number) => {
    const updatedMedications = [...selectedMedications];
    updatedMedications.splice(index, 1);
    setSelectedMedications(updatedMedications);
  };

  const handleCreatePrescription = async () => {
    if (!selectedPatientId) {
      toast.error('Please select a patient');
      return;
    }

    if (!selectedDoctorId) {
      toast.error('Please select a doctor');
      return;
    }

    if (selectedMedications.length === 0) {
      toast.error('Please add at least one medication');
      return;
    }

    setIsSubmitting(true);
    try {
      const patient = patients.find(p => p.id === selectedPatientId);
      const doctor = doctors.find(d => d.id === selectedDoctorId);

      if (!patient) {
        throw new Error('Selected patient not found');
      }

      if (!doctor) {
        throw new Error('Selected doctor not found');
      }

      // Validate stock availability for each medication
      for (const med of selectedMedications) {
        const medicine = medicines.find(m => m.medicineId === med.medicineId);
        if (!medicine) {
          throw new Error(`Medicine ${med.medicineName} not found`);
        }
        if (medicine.stock < med.quantity) {
          throw new Error(`Insufficient stock for ${med.medicineName}. Available: ${medicine.stock}, Requested: ${med.quantity}`);
        }
      }

      // Create the prescription
      await PrescriptionService.createPrescription({
        patientId: patient.id,
        patientName: patient.fullName,
        patientAge: patient.age,
        patientGender: patient.gender,
        doctorId: doctor.id,
        doctorName: doctor.displayName,
        date: new Date(),
        diagnosis: formData.diagnosis,
        medications: selectedMedications,
        instructions: formData.instructions,
        status: 'Active',
      });

      // Reset form
      setIsAddPrescriptionOpen(false);
      setSelectedPatientId('');
      setSelectedDoctorId('');
      setFormData({
        diagnosis: '',
        instructions: '',
      });
      setSelectedMedications([]);

      toast.success('Prescription created successfully');
    } catch (error) {
      console.error('Error creating prescription:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create prescription');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleViewPDF = (prescription: Prescription) => {
    // Create a mock clinic settings object for PDF generation
    const clinicSettings = {
      name: "OpenClinic",
      address: "123 Clinic Street, City, State 12345",
      phone: "(123) 456-7890",
      email: "info@openclinic.com",
      licenseNo: "LIC-12345"
    };

    try {
      // Generate PDF blob and open in new tab
      const pdfBlob = PDFService.generatePrescriptionPDF(prescription, clinicSettings);
      const pdfUrl = URL.createObjectURL(pdfBlob);
      window.open(pdfUrl, '_blank');
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Failed to generate PDF');
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 p-4">
        <div>
          <h1 className="mb-2">Prescription Management</h1>
          <p className="text-muted-foreground">Loading prescriptions data...</p>
        </div>
        <div className="text-center py-10">Loading prescriptions...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="mb-2">Prescription Management</h1>
          <p className="text-muted-foreground">Manage patient prescriptions and medication records</p>
        </div>
        <Dialog open={isAddPrescriptionOpen} onOpenChange={setIsAddPrescriptionOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              New Prescription
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Prescription</DialogTitle>
              <DialogDescription>
                Fill in the prescription details for the patient
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="patient">Patient</Label>
                  <Select value={selectedPatientId} onValueChange={setSelectedPatientId}>
                    <SelectTrigger id="patient">
                      <SelectValue placeholder="Select patient" />
                    </SelectTrigger>
                    <SelectContent>
                      {patients.map(patient => (
                        <SelectItem key={patient.id} value={patient.id}>
                          {patient.fullName} ({patient.patientId})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="doctor">Prescribing Doctor</Label>
                  <Select value={selectedDoctorId} onValueChange={setSelectedDoctorId}>
                    <SelectTrigger id="doctor">
                      <SelectValue placeholder="Select doctor" />
                    </SelectTrigger>
                    <SelectContent>
                      {doctors.map(doctor => (
                        <SelectItem key={doctor.id} value={doctor.id}>
                          {doctor.displayName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="diagnosis">Diagnosis</Label>
                <Input
                  id="diagnosis"
                  placeholder="Patient diagnosis"
                  value={formData.diagnosis}
                  onChange={(e) => setFormData({...formData, diagnosis: e.target.value})}
                />
              </div>

              <div className="space-y-4">
                <Label>Medications</Label>

                {/* Add medication form */}
                <div className="grid grid-cols-12 gap-2">
                  <div className="col-span-4">
                    <Select
                      value={newMedication.medicineId}
                      onValueChange={(value) => {
                        const medicine = medicines.find(m => m.medicineId === value);
                        if (medicine) {
                          setNewMedication({
                            ...newMedication,
                            medicineId: value,
                            medicineName: medicine.name,
                          });
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select medicine" />
                      </SelectTrigger>
                      <SelectContent>
                        {medicines.map(medicine => (
                          <SelectItem key={medicine.id} value={medicine.medicineId}>
                            {medicine.name} (Stock: {medicine.stock})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="col-span-3">
                    <Input
                      placeholder="Dosage"
                      value={newMedication.dosage}
                      onChange={(e) => setNewMedication({...newMedication, dosage: e.target.value})}
                    />
                  </div>

                  <div className="col-span-2">
                    <Input
                      placeholder="Frequency"
                      value={newMedication.frequency}
                      onChange={(e) => setNewMedication({...newMedication, frequency: e.target.value})}
                    />
                  </div>

                  <div className="col-span-2">
                    <Input
                      placeholder="Duration"
                      value={newMedication.duration}
                      onChange={(e) => setNewMedication({...newMedication, duration: e.target.value})}
                    />
                  </div>

                  <div className="col-span-1">
                    <Input
                      type="number"
                      placeholder="Qty"
                      value={newMedication.quantity || ''}
                      onChange={(e) => setNewMedication({...newMedication, quantity: Number(e.target.value)})}
                    />
                  </div>

                  <Button
                    type="button"
                    size="sm"
                    onClick={handleAddMedication}
                    className="col-span-1"
                  >
                    Add
                  </Button>
                </div>

                {/* Selected medications list */}
                {selectedMedications.length > 0 && (
                  <div className="mt-2 border rounded-lg p-2 max-h-40 overflow-y-auto">
                    {selectedMedications.map((med, index) => (
                      <div key={index} className="flex justify-between items-center p-2 border-b">
                        <div className="flex-1">
                          <div className="font-medium">{med.medicineName}</div>
                          <div className="text-sm text-muted-foreground">
                            {med.dosage} | {med.frequency} | {med.duration} | Qty: {med.quantity}
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRemoveMedication(index)}
                          className="text-red-500"
                        >
                          Remove
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="instructions">Special Instructions</Label>
                <Textarea
                  id="instructions"
                  placeholder="Special instructions for patient"
                  rows={3}
                  value={formData.instructions}
                  onChange={(e) => setFormData({...formData, instructions: e.target.value})}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddPrescriptionOpen(false)}>Cancel</Button>
              <Button onClick={handleCreatePrescription} disabled={isSubmitting}>
                {isSubmitting ? 'Creating...' : 'Create Prescription'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Prescription Records</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by prescription ID, patient name, or doctor..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Prescriptions</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Rx ID</TableHead>
                  <TableHead>Patient</TableHead>
                  <TableHead>Doctor</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Diagnosis</TableHead>
                  <TableHead>Medications</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPrescriptions.map((prescription) => (
                  <TableRow key={prescription.id}>
                    <TableCell className="font-mono">{prescription.prescriptionId}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <div>{prescription.patientName}</div>
                          <div className="text-xs text-muted-foreground">{prescription.patientId}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{prescription.doctorName}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        {prescription.date.toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell>{prescription.diagnosis}</TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {prescription.medications.map((med, index) => (
                          <Badge key={index} variant="outline" className="block w-fit">
                            {med.medicineName} - {med.dosage}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={prescription.status === "Active" ? "default" : "secondary"}>
                        {prescription.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewPDF(prescription)}
                        >
                          <FileText className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">
              Showing {filteredPrescriptions.length} of {prescriptions.length} prescriptions
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">Previous</Button>
              <Button variant="outline" size="sm">Next</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
