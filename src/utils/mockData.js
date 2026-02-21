/**
 * mockData.js — Central mock data store for Vikasana Foundation Admin.
 * Replace each exported array/function with real API calls in your services layer.
 */

export const FACULTY = [
  {
    id: 1,
    name: 'Dr. Priya Sharma',
    college: 'RVCE Bengaluru',
    email: 'priya.sharma@rvce.edu.in',
    role: 'HOD',
    status: 'Active',
    students: 34,
    activitiesApproved: 12,
    joinedOn: '2024-08-10',
  },
  {
    id: 2,
    name: 'Prof. Arjun Nair',
    college: 'NIT Trichy',
    email: 'arjun.nair@nit.ac.in',
    role: 'Coordinator',
    status: 'Active',
    students: 28,
    activitiesApproved: 9,
    joinedOn: '2024-09-03',
  },
  {
    id: 3,
    name: 'Dr. Meena Patel',
    college: 'VIT Vellore',
    email: 'meena.patel@vit.ac.in',
    role: 'Faculty',
    status: 'Pending',
    students: 0,
    activitiesApproved: 0,
    joinedOn: '2025-01-15',
  },
  {
    id: 4,
    name: 'Prof. Ravi Krishnan',
    college: 'BITS Pilani',
    email: 'ravi.k@bits-pilani.ac.in',
    role: 'Coordinator',
    status: 'Active',
    students: 21,
    activitiesApproved: 7,
    joinedOn: '2024-10-20',
  },
]

export const STUDENTS = [
  { id: 1, name: 'Rohit Kumar',  college: 'RVCE Bengaluru',  email: 'rohit.k@student.rvce.edu', faculty: 'Dr. Priya Sharma',  activities: 5, certificates: 3, status: 'Active' },
  { id: 2, name: 'Anjali Menon', college: 'NIT Trichy',       email: 'anjali.m@student.nit.ac',  faculty: 'Prof. Arjun Nair', activities: 8, certificates: 6, status: 'Active' },
  { id: 3, name: 'Vikram Singh', college: 'RVCE Bengaluru',  email: 'vikram.s@student.rvce.edu', faculty: 'Dr. Priya Sharma', activities: 2, certificates: 1, status: 'Active' },
  { id: 4, name: 'Sneha Iyer',   college: 'VIT Vellore',     email: 'sneha.i@student.vit.ac',    faculty: 'Dr. Meena Patel',  activities: 0, certificates: 0, status: 'Inactive' },
  { id: 5, name: 'Aakash Rathi', college: 'BITS Pilani',     email: 'aakash.r@student.bits.ac',  faculty: 'Prof. Ravi Krishnan', activities: 4, certificates: 4, status: 'Active' },
  { id: 6, name: 'Pooja Desai',  college: 'NIT Trichy',      email: 'pooja.d@student.nit.ac',    faculty: 'Prof. Arjun Nair', activities: 6, certificates: 4, status: 'Active' },
]

export const ACTIVITIES = [
  { id: 1, student: 'Rohit Kumar',  title: 'NSS Camp Participation',   category: 'Community Service', submittedOn: '2025-11-12', status: 'Approved',     certificate: true },
  { id: 2, student: 'Anjali Menon', title: 'State Level Debate',        category: 'Cultural',          submittedOn: '2025-11-18', status: 'Approved',     certificate: true },
  { id: 3, student: 'Anjali Menon', title: 'Blood Donation Drive',      category: 'Community Service', submittedOn: '2025-12-01', status: 'Pending',      certificate: false },
  { id: 4, student: 'Vikram Singh', title: 'Tech Fest Volunteer',       category: 'Technical',         submittedOn: '2025-12-05', status: 'Under Review', certificate: false },
  { id: 5, student: 'Rohit Kumar',  title: 'Marathon 5K Run',           category: 'Sports',            submittedOn: '2025-12-10', status: 'Approved',     certificate: true },
  { id: 6, student: 'Aakash Rathi', title: 'Hackathon Finalist',        category: 'Technical',         submittedOn: '2025-12-14', status: 'Approved',     certificate: true },
  { id: 7, student: 'Pooja Desai',  title: 'Folk Dance Competition',    category: 'Cultural',          submittedOn: '2025-12-18', status: 'Approved',     certificate: true },
  { id: 8, student: 'Pooja Desai',  title: 'Tree Plantation Drive',     category: 'Community Service', submittedOn: '2026-01-05', status: 'Pending',      certificate: false },
]

export const CERTIFICATES = ACTIVITIES.filter(a => a.certificate)

// Derived stats
export const STATS = {
  totalStudents: STUDENTS.length,
  activeStudents: STUDENTS.filter(s => s.status === 'Active').length,
  totalFaculty: FACULTY.length,
  pendingFaculty: FACULTY.filter(f => f.status === 'Pending').length,
  totalActivities: ACTIVITIES.length,
  approvedActivities: ACTIVITIES.filter(a => a.status === 'Approved').length,
  pendingActivities: ACTIVITIES.filter(a => a.status === 'Pending').length,
  totalCertificates: CERTIFICATES.length,
}

export const ACTIVITY_CATEGORIES = [
  { label: 'Community Service', color: 'emerald' },
  { label: 'Cultural',          color: 'pink' },
  { label: 'Technical',         color: 'blue' },
  { label: 'Sports',            color: 'amber' },
]

export const FACULTY_ROLES = ['Faculty', 'Coordinator', 'HOD', 'Principal', 'Dean']
