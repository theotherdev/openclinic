import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { storage } from '../firebase/config';
import { Prescription } from '../types';

export class PDFService {
  // Generate prescription PDF
  static generatePrescriptionPDF(prescription: Prescription, clinicSettings: {name: string, address: string, phone: string, email: string, licenseNo: string}): Blob {
    const doc = new jsPDF();
    
    // Add clinic information at the top
    doc.setFontSize(18);
    doc.text(clinicSettings.name, 105, 20, { align: 'center' });
    
    doc.setFontSize(12);
    doc.text(clinicSettings.address, 105, 30, { align: 'center' });
    doc.text(`Phone: ${clinicSettings.phone}`, 105, 35, { align: 'center' });
    doc.text(`Email: ${clinicSettings.email}`, 105, 40, { align: 'center' });
    doc.text(`License No: ${clinicSettings.licenseNo}`, 105, 45, { align: 'center' });
    
    // Add a line separator
    doc.line(20, 50, 190, 50);
    
    // Add prescription title
    doc.setFontSize(16);
    doc.text('PRESCRIPTION', 105, 60, { align: 'center' });
    
    // Add patient information
    doc.setFontSize(12);
    doc.text(`Patient Name: ${prescription.patientName}`, 20, 75);
    doc.text(`Age: ${prescription.patientAge}`, 20, 80);
    doc.text(`Gender: ${prescription.patientGender}`, 20, 85);
    doc.text(`Date: ${prescription.date.toLocaleDateString()}`, 140, 75);
    doc.text(`Prescription ID: ${prescription.prescriptionId}`, 140, 80);
    
    // Add doctor information
    doc.text(`Doctor: ${prescription.doctorName}`, 20, 95);
    
    // Add diagnosis section
    doc.text('DIAGNOSIS:', 20, 110);
    doc.text(prescription.diagnosis, 20, 115);
    
    // Add medications table
    const medicationHeaders = [['Medicine', 'Dosage', 'Frequency', 'Duration', 'Quantity']];
    const medicationData = prescription.medications.map(med => [
      med.medicineName,
      med.dosage,
      med.frequency,
      med.duration,
      med.quantity.toString()
    ]);
    
    // @ts-ignore - jspdf-autotable types may not match perfectly
    doc.autoTable({
      head: medicationHeaders,
      body: medicationData,
      startY: 125,
      theme: 'grid',
      headStyles: { fillColor: [220, 220, 220], textColor: [0, 0, 0] }
    });
    
    // Add instructions section
    if (prescription.instructions) {
      const finalY = (doc as any).lastAutoTable?.finalY || 125;
      doc.text('INSTRUCTIONS:', 20, finalY + 10);
      doc.text(prescription.instructions, 20, finalY + 15);
    }
    
    // Add signature area
    const pageHeight = doc.internal.pageSize.height;
    doc.text('Doctor\'s Signature:', 20, pageHeight - 40);
    doc.line(45, pageHeight - 35, 95, pageHeight - 35); // Signature line
    
    // Return as blob
    return doc.output('blob') as Blob;
  }

  // Upload prescription PDF to Firebase Storage
  static async uploadPrescriptionPDF(prescriptionId: string, pdfBlob: Blob): Promise<string> {
    const storageRef = ref(storage, `prescriptions/${prescriptionId}.pdf`);
    await uploadBytes(storageRef, pdfBlob);
    return await getDownloadURL(storageRef);
  }

  // Generate and upload prescription PDF
  static async generateAndUploadPrescription(
    prescription: Prescription, 
    clinicSettings: {name: string, address: string, phone: string, email: string, licenseNo: string}
  ): Promise<string> {
    const pdfBlob = this.generatePrescriptionPDF(prescription, clinicSettings);
    return await this.uploadPrescriptionPDF(prescription.id, pdfBlob);
  }
}