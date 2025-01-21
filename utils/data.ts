import { v4 as uuidv4 } from "uuid"

// Enums
export type TagType = "math" | "software" | "ai"
export type RequestStatusType = "not_accepted" | "not_started" | "in_progress" | "finished"
export type RequestType = "tutorial" | "explanation" | "how_to_guide" | "reference"

// Helper functions
const randomDate = (start: Date, end: Date) => {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()))
}

const randomEnum = <T extends { [key: string]: string }>(anEnum: T): T[keyof T] => {
  const enumValues = Object.values(anEnum) as T[keyof T][];
  const randomIndex = Math.floor(Math.random() * enumValues.length);
  return enumValues[randomIndex];
};

// Generate mock data
const generateProfiles = () => {
  return [
    ...Array.from({ length: 4 }, (_, i) => ({
      id: uuidv4(),
      email: `student${i + 1}@example.com`,
      created_at: randomDate(new Date(2020, 0, 1), new Date()),
      updated_at: randomDate(new Date(2020, 0, 1), new Date()),
      role: 'student' as const,
    })),
    ...Array.from({ length: 3 }, (_, i) => ({
      id: uuidv4(),
      email: `expert${i + 1}@example.com`,
      created_at: randomDate(new Date(2020, 0, 1), new Date()),
      updated_at: randomDate(new Date(2020, 0, 1), new Date()),
      role: 'expert' as const,
    })),
    {
      id: uuidv4(),
      email: `admin@example.com`,
      created_at: randomDate(new Date(2020, 0, 1), new Date()),
      updated_at: randomDate(new Date(2020, 0, 1), new Date()),
      role: 'admin' as const,
    },
  ];
};

const generateUserRoles = (profiles: any[]) => {
  return profiles.filter(profile => profile.role !== 'admin').map(profile => ({
    id: uuidv4(),
    user_id: profile.id,
    specialty: randomEnum({ math: 'math', software: 'software', ai: 'ai' } as const),
    created_at: randomDate(new Date(2020, 0, 1), new Date()),
  }));
};

const generateSources = (count: number, profiles: any[]) => {
  return Array.from({ length: count }, (_, i) => ({
    id: uuidv4(),
    url: `https://example.com/source${i + 1}`,
    title: `Source ${i + 1}`,
    created_at: randomDate(new Date(2020, 0, 1), new Date()),
    created_by: profiles[Math.floor(Math.random() * profiles.length)].id,
  }));
};

const generateRequests = (count: number, students: any[], experts: any[], sources: any[]) => {
  return Array.from({ length: count }, () => {
    const startTime = Math.floor(Math.random() * 1000);
    const endTime = startTime + Math.floor(Math.random() * 1000) + 1;
    return {
      id: uuidv4(),
      student_id: students[Math.floor(Math.random() * students.length)].id,
      expert_id: experts[Math.floor(Math.random() * experts.length)].id,
      source_id: sources[Math.floor(Math.random() * sources.length)].id,
      start_time: startTime,
      end_time: endTime,
      status: randomEnum({ not_accepted: 'not_accepted', not_started: 'not_started', in_progress: 'in_progress', finished: 'finished' } as const),
      type: randomEnum({ tutorial: 'tutorial', explanation: 'explanation', how_to_guide: 'how_to_guide', reference: 'reference' } as const),
      tag: randomEnum({ math: 'math', software: 'software', ai: 'ai' } as const),
      created_at: randomDate(new Date(2020, 0, 1), new Date()),
      accepted_at: randomDate(new Date(2020, 0, 1), new Date()),
      started_at: randomDate(new Date(2020, 0, 1), new Date()),
      finished_at: randomDate(new Date(2020, 0, 1), new Date()),
    };
  });
};

const generateCurriculums = (requests: any[]) => {
  return requests.map(request => ({
    id: uuidv4(),
    request_id: request.id,
    created_at: randomDate(new Date(2020, 0, 1), new Date()),
    updated_at: randomDate(new Date(2020, 0, 1), new Date()),
  }));
};

const generateCurriculumNodes = (count: number, curriculums: any[], sources: any[]) => {
  return Array.from({ length: count }, () => {
    const startTime = Math.floor(Math.random() * 1000);
    const endTime = startTime + Math.floor(Math.random() * 1000) + 1;
    return {
      id: uuidv4(),
      curriculum_id: curriculums[Math.floor(Math.random() * curriculums.length)].id,
      source_id: sources[Math.floor(Math.random() * sources.length)].id,
      start_time: startTime,
      end_time: endTime,
      level: Math.floor(Math.random() * 5),
      index_in_curriculum: Math.floor(Math.random() * 10),
      created_at: randomDate(new Date(2020, 0, 1), new Date()),
    };
  });
};

const generateMessages = (count: number, requests: any[], profiles: any[]) => {
  return Array.from({ length: count }, () => ({
    id: uuidv4(),
    request_id: requests[Math.floor(Math.random() * requests.length)].id,
    sender_id: profiles[Math.floor(Math.random() * profiles.length)].id,
    content: `This is a sample message content ${Math.random().toString(36).substring(7)}`,
    created_at: randomDate(new Date(2020, 0, 1), new Date()),
  }));
};

// Generate mock data
const profiles = generateProfiles();
const students = profiles.filter(p => p.role === 'student');
const experts = profiles.filter(p => p.role === 'expert');
const admin = profiles.find(p => p.role === 'admin')!;

const sources = generateSources(10, profiles);
const requests = generateRequests(15, students, experts, sources);
const curriculums = generateCurriculums(requests);

export const mockData = {
  profiles,
  user_roles: generateUserRoles(profiles),
  sources,
  requests,
  curriculums,
  curriculum_nodes: generateCurriculumNodes(30, curriculums, sources),
  messages: generateMessages(50, requests, profiles),
};

// Helper function to get user by role
export const getUsersByRole = (role: 'student' | 'expert' | 'admin') => {
  if (role === 'admin') return [admin];
  return role === 'student' ? students : experts;
};

// Export mock data
export default mockData;

