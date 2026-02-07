export enum Role {
  STUDENT = 'STUDENT',
  TEACHER = 'TEACHER',
  ADMIN = 'ADMIN'
}

export interface Student {
  lrn: string;
  name: string;
  gradeLevel: string;
  section: string;
  gender: 'MALE' | 'FEMALE';
  age: number;
  photoUrl?: string;
}

export interface GradeEntry {
  subject: string;
  q1?: number;
  q2?: number;
  q3?: number;
  q4?: number;
  final?: number;
  remarks?: string;
}

export interface AttendanceRecord {
  month: string;
  schoolDays: number;
  daysPresent: number;
  daysAbsent: number;
}

export interface CoreValue {
  value: string;
  behaviorStatements: string[];
  q1?: string;
  q2?: string;
  q3?: string;
  q4?: string;
}

export interface SF9Data {
  student: Student;
  schoolYear: string;
  grades: GradeEntry[];
  attendance: AttendanceRecord[];
  values: CoreValue[];
  generalAverage?: number;
}

export interface SubjectGrades {
  q1?: number;
  q2?: number;
  q3?: number;
  q4?: number;
  final?: number;
}

export interface StudentFullYearGrades {
  studentId: string;
  studentName: string;
  sex: 'M' | 'F';
  lrn?: string;
  age?: number;
  subjects: {
    [key: string]: SubjectGrades;
  };
  mapeh?: { // Component subjects
    music: SubjectGrades;
    arts: SubjectGrades;
    pe: SubjectGrades;
    health: SubjectGrades;
  };
  generalAverage?: SubjectGrades;
  rank?: number;
}

export interface ClassRecord {
  section: string;
  gradeLevel: string;
  schoolYear: string;
  students: StudentFullYearGrades[];
}