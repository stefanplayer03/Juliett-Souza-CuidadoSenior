import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  getDocs,
  query,
  where,
  onSnapshot,
  Unsubscribe,
} from 'firebase/firestore';
import { db, isRealFirebase } from './config';
import { handleFirestoreError, OperationType } from './error-handler';
import {
  UserProfile,
  Patient,
  Caregiver,
  Doctor,
  Medication,
  MedicalRecord,
  MedicalAppointment,
  ScheduleItem,
  HistoryLog,
} from '../types';

// USERS COLLECTION
export const firestoreUsers = {
  async save(user: UserProfile) {
    if (!db) return;
    try {
      await setDoc(doc(db, 'users', user.uid), user, { merge: true });
    } catch (err) {
      console.warn('Firestore user save notice:', err);
    }
  },

  async delete(uid: string) {
    if (!db) return;
    try {
      await deleteDoc(doc(db, 'users', uid));
    } catch (err) {
      console.warn('Firestore user delete notice:', err);
    }
  },

  async getAll(): Promise<UserProfile[]> {
    if (!db) return [];
    try {
      const snap = await getDocs(collection(db, 'users'));
      return snap.docs.map((d) => d.data() as UserProfile);
    } catch (err) {
      console.warn('Firestore load users notice:', err);
      return [];
    }
  },
};

// PATIENTS COLLECTION
export const firestorePatients = {
  async save(patient: Patient) {
    if (!db) return;
    try {
      await setDoc(doc(db, 'patients', patient.id), patient, { merge: true });
    } catch (err) {
      console.warn('Firestore patient save notice:', err);
    }
  },

  async delete(id: string) {
    if (!db) return;
    try {
      await deleteDoc(doc(db, 'patients', id));
    } catch (err) {
      console.warn('Firestore patient delete notice:', err);
    }
  },

  async getAll(): Promise<Patient[]> {
    if (!db) return [];
    try {
      const snap = await getDocs(collection(db, 'patients'));
      return snap.docs.map((d) => d.data() as Patient);
    } catch (err) {
      console.warn('Firestore load patients notice:', err);
      return [];
    }
  },
};

// CAREGIVERS COLLECTION
export const firestoreCaregivers = {
  async save(caregiver: Caregiver) {
    if (!db) return;
    try {
      await setDoc(doc(db, 'caregivers', caregiver.id), caregiver, { merge: true });
    } catch (err) {
      console.warn('Firestore caregiver save notice:', err);
    }
  },

  async delete(id: string) {
    if (!db) return;
    try {
      await deleteDoc(doc(db, 'caregivers', id));
    } catch (err) {
      console.warn('Firestore caregiver delete notice:', err);
    }
  },

  async getAll(): Promise<Caregiver[]> {
    if (!db) return [];
    try {
      const snap = await getDocs(collection(db, 'caregivers'));
      return snap.docs.map((d) => d.data() as Caregiver);
    } catch (err) {
      console.warn('Firestore load caregivers notice:', err);
      return [];
    }
  },
};

// DOCTORS COLLECTION
export const firestoreDoctors = {
  async save(doctor: Doctor) {
    if (!db) return;
    try {
      await setDoc(doc(db, 'doctors', doctor.id), doctor, { merge: true });
    } catch (err) {
      console.warn('Firestore doctor save notice:', err);
    }
  },

  async delete(id: string) {
    if (!db) return;
    try {
      await deleteDoc(doc(db, 'doctors', id));
    } catch (err) {
      console.warn('Firestore doctor delete notice:', err);
    }
  },

  async getAll(): Promise<Doctor[]> {
    if (!db) return [];
    try {
      const snap = await getDocs(collection(db, 'doctors'));
      return snap.docs.map((d) => d.data() as Doctor);
    } catch (err) {
      console.warn('Firestore load doctors notice:', err);
      return [];
    }
  },
};

// MEDICATIONS COLLECTION
export const firestoreMedications = {
  async save(med: Medication) {
    if (!db) return;
    try {
      await setDoc(doc(db, 'medications', med.id), med, { merge: true });
    } catch (err) {
      console.warn('Firestore medication save notice:', err);
    }
  },

  async delete(id: string) {
    if (!db) return;
    try {
      await deleteDoc(doc(db, 'medications', id));
    } catch (err) {
      console.warn('Firestore medication delete notice:', err);
    }
  },

  async getAll(): Promise<Medication[]> {
    if (!db) return [];
    try {
      const snap = await getDocs(collection(db, 'medications'));
      return snap.docs.map((d) => d.data() as Medication);
    } catch (err) {
      console.warn('Firestore load medications notice:', err);
      return [];
    }
  },
};

// MEDICAL RECORDS COLLECTION
export const firestoreMedicalRecords = {
  async save(rec: MedicalRecord) {
    if (!db) return;
    try {
      await setDoc(doc(db, 'medical_records', rec.id), rec, { merge: true });
    } catch (err) {
      console.warn('Firestore medical record save notice:', err);
    }
  },

  async delete(id: string) {
    if (!db) return;
    try {
      await deleteDoc(doc(db, 'medical_records', id));
    } catch (err) {
      console.warn('Firestore medical record delete notice:', err);
    }
  },

  async getAll(): Promise<MedicalRecord[]> {
    if (!db) return [];
    try {
      const snap = await getDocs(collection(db, 'medical_records'));
      return snap.docs.map((d) => d.data() as MedicalRecord);
    } catch (err) {
      console.warn('Firestore load medical records notice:', err);
      return [];
    }
  },
};

// MEDICAL APPOINTMENTS COLLECTION
export const firestoreMedicalAppointments = {
  async save(app: MedicalAppointment) {
    if (!db) return;
    try {
      await setDoc(doc(db, 'medical_appointments', app.id), app, { merge: true });
    } catch (err) {
      console.warn('Firestore medical appointment save notice:', err);
    }
  },

  async delete(id: string) {
    if (!db) return;
    try {
      await deleteDoc(doc(db, 'medical_appointments', id));
    } catch (err) {
      console.warn('Firestore medical appointment delete notice:', err);
    }
  },

  async getAll(): Promise<MedicalAppointment[]> {
    if (!db) return [];
    try {
      const snap = await getDocs(collection(db, 'medical_appointments'));
      return snap.docs.map((d) => d.data() as MedicalAppointment);
    } catch (err) {
      console.warn('Firestore load appointments notice:', err);
      return [];
    }
  },
};

// SCHEDULES COLLECTION
export const firestoreSchedules = {
  async save(schedule: ScheduleItem) {
    if (!db) return;
    try {
      await setDoc(doc(db, 'schedules', schedule.id), schedule, { merge: true });
    } catch (err) {
      console.warn('Firestore schedule save notice:', err);
    }
  },

  async delete(id: string) {
    if (!db) return;
    try {
      await deleteDoc(doc(db, 'schedules', id));
    } catch (err) {
      console.warn('Firestore schedule delete notice:', err);
    }
  },

  async getAll(): Promise<ScheduleItem[]> {
    if (!db) return [];
    try {
      const snap = await getDocs(collection(db, 'schedules'));
      return snap.docs.map((d) => d.data() as ScheduleItem);
    } catch (err) {
      console.warn('Firestore load schedules notice:', err);
      return [];
    }
  },
};

// HISTORY LOGS COLLECTION
export const firestoreHistory = {
  async save(log: HistoryLog) {
    if (!db) return;
    try {
      await setDoc(doc(db, 'history', log.id), log, { merge: true });
    } catch (err) {
      console.warn('Firestore history save notice:', err);
    }
  },

  async getAll(): Promise<HistoryLog[]> {
    if (!db) return [];
    try {
      const snap = await getDocs(collection(db, 'history'));
      return snap.docs.map((d) => d.data() as HistoryLog);
    } catch (err) {
      console.warn('Firestore load history notice:', err);
      return [];
    }
  },
};
