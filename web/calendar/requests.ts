import { AppointmentService } from '@/lib/services/appointment.service';
import { PatientService } from '@/lib/services/patient.service';
import type { IEvent, IUser } from './interfaces';

const eventColorMap: Record<number, any> = {
  0: 'blue',
  1: 'green',
  2: 'red',
  3: 'yellow',
  4: 'purple',
  5: 'orange',
  6: 'gray',
};

export const getEvents = async (): Promise<IEvent[]> => {
  try {
    const appointments = await new Promise<any[]>((resolve) => {
      AppointmentService.getAllAppointments((appointments) => {
        resolve(appointments);
      });
      // Set a timeout to resolve empty if no data within 5 seconds
      setTimeout(() => resolve([]), 5000);
    });

    const events: IEvent[] = appointments.map((appointment, index) => ({
      id: parseInt(appointment.id.slice(0, 8), 16) || index,
      startDate: appointment.startDate.toISOString(),
      endDate: appointment.endDate.toISOString(),
      title: appointment.title,
      color: eventColorMap[index % 7],
      description: appointment.description,
      user: {
        id: appointment.doctorId,
        name: appointment.doctorName,
        picturePath: null,
      },
    }));

    return events;
  } catch (error) {
    console.error('Error fetching events:', error);
    return [];
  }
};

export const getUsers = async (): Promise<IUser[]> => {
  try {
    const patients = await new Promise<any[]>((resolve) => {
      PatientService.getAllPatients((patients) => {
        resolve(patients);
      });
      // Set a timeout to resolve empty if no data within 5 seconds
      setTimeout(() => resolve([]), 5000);
    });

    const users: IUser[] = patients.map((patient) => ({
      id: patient.id,
      name: patient.fullName,
      picturePath: null,
    }));

    return users;
  } catch (error) {
    console.error('Error fetching users:', error);
    return [];
  }
};
