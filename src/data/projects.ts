export type Status = 'ACTIVE RESEARCH' | 'IN DEVELOPMENT' | 'BUILT'

export interface Project {
  number: string
  title: string
  slug: string
  domain: string
  year: string
  status: Status
  /** One sentence, the problem, for someone who is not an engineer. */
  problem: string
  description: string
  /** A plain-language path through the system, used by the project drawing. */
  stages: [string, string, string]
  stack: string
  /** What exists today — unfinished work is stated, not hidden. */
  state: string
  repo: string | null
}

export const projects: Project[] = [
  {
    number: '01',
    title: 'CHANDRA',
    slug: 'chandra',
    domain: 'AI / COMPUTER VISION / SPACE',
    year: '2026',
    status: 'ACTIVE RESEARCH',
    problem:
      'Two photographs of the same patch of the Moon, taken from different orbits under different sunlight, do not look like the same place.',
    description:
      'A lunar image correspondence system that matches Chandrayaan-2 optical imagery despite substantial changes in illumination, viewpoint and scale, so that the same feature can be identified across passes.',
    stages: ['Orbit imagery', 'Image matches', 'Evaluation'],
    stack: 'PYTHON / PYTORCH / OPENCV / ROMA',
    state: 'Matching and evaluation pipeline running against paired imagery; benchmarks and failure cases are still being written up.',
    repo: 'https://github.com/safarhashim007/Chandra',
  },
  {
    number: '02',
    title: 'AASHAN',
    slug: 'aashan',
    domain: 'FINTECH / ANDROID / AI',
    year: '2026',
    status: 'IN DEVELOPMENT',
    problem:
      'Students and people in their first job can see what they spent, but not what it means or what it costs them later.',
    description:
      'A personal finance platform for students and young professionals covering spending, budgets, goals, forecasting and the reasoning behind a financial decision rather than only its record.',
    stages: ['Spending', 'Forecast', 'Decision'],
    stack: 'ANDROID / KOTLIN / AI',
    state: 'Unreleased and incomplete. Core flows are being built; nothing here is shipped, and no figures shown are from a live product.',
    repo: null,
  },
  {
    number: '03',
    title: 'LUMIRA SOLAR AI',
    slug: 'lumira',
    domain: 'AI / ENERGY / ANALYTICS',
    year: '2026',
    status: 'BUILT',
    problem:
      'Solar output data is plentiful and almost never turned into a decision anyone acts on.',
    description:
      'An analysis project over solar energy data, looking at how panel performance can be modelled and explained in terms an owner or operator would actually use.',
    stages: ['Solar data', 'Performance model', 'Operator insight'],
    stack: 'PYTHON / DATA / ML',
    state: 'Working analysis and models over collected datasets.',
    repo: 'https://github.com/safarhashim007/lumira-solar-ai',
  },
  {
    number: '04',
    title: 'DRUG-TARGET VISUALIZER',
    slug: 'drug-target',
    domain: 'BIOINFORMATICS / VISUALIZATION',
    year: '2026',
    status: 'BUILT',
    problem:
      'The relationship between a compound and the thing it acts on is a table of identifiers long before it is a picture.',
    description:
      'An interactive system for exploring drug-target relationships, bringing molecular structure and biological data into one visual interface with property prediction alongside it.',
    stages: ['Compound', 'Relationship map', 'Property estimate'],
    stack: 'PYTHON / FLASK / RDKIT / PUBCHEM',
    state: 'Working interface over molecular data with property prediction.',
    repo: null,
  },
]

export interface ArchiveProject {
  number: string
  title: string
  domain: string
  year: string
  repo: string | null
}

export const archive: ArchiveProject[] = [
  {
    number: '05',
    title: 'PARKING SYSTEM',
    domain: 'SOFTWARE / AUTOMATION',
    year: '2026',
    repo: 'https://github.com/safarhashim007/Parking-System',
  },
  {
    number: '06',
    title: 'EXPENSE TRACKER',
    domain: 'FINANCE / SOFTWARE',
    year: '2026',
    repo: 'https://github.com/safarhashim007/Expense-tracker',
  },
  {
    number: '07',
    title: 'PLACEMENT ELIGIBILITY CHECKER',
    domain: 'EDTECH / SOFTWARE',
    year: '2026',
    repo: 'https://github.com/safarhashim007/Placement-eligibility-checker-system',
  },
  {
    number: '08',
    title: 'STUDENT GRADE MANAGER',
    domain: 'EDUCATION / SOFTWARE',
    year: '2026',
    repo: 'https://github.com/safarhashim007/student-grade-manager',
  },
]
