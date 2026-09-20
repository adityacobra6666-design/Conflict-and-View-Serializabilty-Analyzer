export interface TeamMember {
  id: string;
  name: string;
  registerNumber: string;
  role?: string;
  email?: string;
  photoUrl?: string;
}

export interface Advisor {
  name: string;
  designation: string;
  department?: string;
  photoUrl?: string;
}

export interface TeamConfig {
  projectTitle: string;
  academicYear: string;
  members: TeamMember[];
  advisor: Advisor;
}

export const teamData: TeamConfig = {
  projectTitle: "Conflict & View Serializability Analyzer",
  academicYear: "2025 - 2026",
  members: [
    {
      id: "mem_1",
      name: "Aditya Kumar",
      registerNumber: "25BCE1368",
      role: "Student Developer",
      photoUrl: "/assets/member1.jpg"
    },
    {
      id: "mem_2",
      name: "Divyansh Bhatia",
      registerNumber: "25BCE1414",
      role: "Student Developer",
      photoUrl: "/assets/member2.jpg"
    }
  ],
  advisor: {
    name: "Dr. Swaminathan A",
    designation: "Assistant Professor",
    photoUrl: "/assets/advisor.jpg"
  }
};
