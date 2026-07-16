import type { CatalogData, College } from '../types/catalog'

export const CATALOG_STORAGE_KEY = 'educonnect.catalog.v4'

const CAMPUS_1 =
  'https://images.unsplash.com/photo-1562774053-701939374585?auto=format&fit=crop&w=1400&q=80'
const CAMPUS_2 =
  'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=1400&q=80'
const CAMPUS_3 =
  'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=1400&q=80'
const CAMPUS_4 =
  'https://images.unsplash.com/photo-1498243697581-a1e401dbec9b?auto=format&fit=crop&w=1400&q=80'
const LAB =
  'https://images.unsplash.com/photo-1581094794329-cddeadbddf51?auto=format&fit=crop&w=1400&q=80'

function college(
  partial: Omit<
    College,
    'shareUrl' | 'approvalStatus' | 'submittedBy' | 'admissionStatus' | 'customPrograms' | 'feeRows'
  > & {
    approvalStatus?: College['approvalStatus']
    submittedBy?: College['submittedBy']
    admissionStatus?: College['admissionStatus']
    customPrograms?: College['customPrograms']
    feeRows?: College['feeRows']
    feesPdf?: College['feesPdf']
  },
): College {
  const feeRows =
    partial.feeRows ??
    (partial.feesStructure
      ? partial.feesStructure
          .split('·')
          .map((part) => part.trim())
          .filter(Boolean)
          .map((part) => {
            const at = part.indexOf('₹')
            if (at > 0) {
              return {
                programLabel: part.slice(0, at).trim() || 'Fees',
                amount: part.slice(at).trim(),
              }
            }
            return { programLabel: 'Fees', amount: part }
          })
      : [])

  return {
    approvalStatus: 'approved',
    submittedBy: 'admin',
    admissionStatus: 'open',
    shareUrl: `https://educonnect.demo/colleges/${partial.slug}`,
    ...partial,
    feeRows: partial.feeRows ?? feeRows,
    customPrograms: partial.customPrograms ?? [],
  }
}

export const seedCatalog: CatalogData = {
  streams: [
    {
      id: 'stream-engineering',
      name: 'Engineering',
      slug: 'engineering',
      hint: 'B.Tech · Diploma · M.Tech',
    },
    {
      id: 'stream-medical',
      name: 'Medical',
      slug: 'medical',
      hint: 'MBBS · Nursing · Pharmacy',
    },
    {
      id: 'stream-management',
      name: 'Management',
      slug: 'management',
      hint: 'BBA · MBA · Commerce',
    },
    {
      id: 'stream-arts',
      name: 'Arts & Design',
      slug: 'arts-design',
      hint: 'BA · Fine Arts · Media',
    },
  ],
  programs: [
    {
      id: 'prog-btech',
      streamId: 'stream-engineering',
      name: 'B.Tech',
      slug: 'btech',
    },
    {
      id: 'prog-diploma',
      streamId: 'stream-engineering',
      name: 'Diploma',
      slug: 'diploma',
    },
    {
      id: 'prog-mtech',
      streamId: 'stream-engineering',
      name: 'M.Tech',
      slug: 'mtech',
    },
  ],
  colleges: [
    college({
      id: 'col-govt-poly-delhi',
      slug: 'govt-poly-delhi',
      name: 'Government Polytechnic Delhi',
      type: 'government',
      programIds: ['prog-diploma'],
      city: 'New Delhi',
      location: 'Okhla Industrial Area, New Delhi, Delhi 110020',
      principalName: 'Dr. Meera Sharma',
      feesStructure: 'Tuition ₹18,000 / year · Hostel ₹22,000 / year · Lab fee ₹3,500',
      courses: [
        'Diploma in Civil Engineering',
        'Diploma in Mechanical Engineering',
        'Diploma in Electrical Engineering',
        'Diploma in Computer Science',
      ],
      branches: ['Civil', 'Mechanical', 'Electrical', 'Computer Science'],
      images: [CAMPUS_1, CAMPUS_2, LAB],
      about:
        'A state polytechnic offering industry-aligned diploma programs with workshops and placement support.',
    }),
    college({
      id: 'col-semi-industrial-pune',
      slug: 'pune-iti',
      name: 'Pune Industrial Training Institute',
      type: 'semi-government',
      programIds: ['prog-diploma'],
      city: 'Pune',
      location: 'Shivajinagar, Pune, Maharashtra 411005',
      principalName: 'Prof. Anil Deshmukh',
      feesStructure: 'Tuition ₹24,000 / year · Workshop fee ₹5,000 · Form fee ₹500',
      courses: [
        'Diploma in Automobile Engineering',
        'Diploma in Electronics',
        'Diploma in Information Technology',
      ],
      branches: ['Automobile', 'Electronics', 'IT'],
      images: [CAMPUS_3, CAMPUS_4],
      about: 'Semi-government campus focused on hands-on diploma training for local industry.',
    }),
    college({
      id: 'col-private-tech-jaipur',
      slug: 'jaipur-tech-diploma',
      name: 'Jaipur Tech Diploma College',
      type: 'private',
      programIds: ['prog-diploma'],
      city: 'Jaipur',
      location: 'Tonk Road, Jaipur, Rajasthan 302018',
      principalName: 'Dr. Kavita Rathore',
      feesStructure: 'Tuition ₹45,000 / year · Development fee ₹8,000 · Transport optional',
      courses: [
        'Diploma in Computer Science & Engineering',
        'Diploma in Electronics & Communication',
        'Diploma in Mechanical Engineering',
      ],
      branches: ['CSE', 'ECE', 'Mechanical'],
      images: [CAMPUS_2, LAB, CAMPUS_1],
      about: 'Private diploma college with modern labs and scholarship seats for meritorious students.',
    }),
    college({
      id: 'col-govt-eng-mumbai',
      slug: 'gcoe-mumbai',
      name: 'Government College of Engineering Mumbai',
      type: 'government',
      programIds: ['prog-btech', 'prog-mtech'],
      city: 'Mumbai',
      location: 'Bandra East, Mumbai, Maharashtra 400051',
      principalName: 'Dr. R. K. Banerjee',
      feesStructure: 'B.Tech ₹12,000 / year · M.Tech ₹18,000 / year · Exam fee ₹2,000',
      courses: [
        'B.Tech Computer Science',
        'B.Tech Information Technology',
        'B.Tech Mechanical',
        'B.Tech Civil',
        'B.Tech Electrical',
        'M.Tech Computer Science',
        'M.Tech Structural Engineering',
      ],
      branches: ['CSE', 'IT', 'Mechanical', 'Civil', 'Electrical'],
      images: [CAMPUS_4, CAMPUS_3, CAMPUS_2, LAB],
      about: 'Flagship government engineering college for undergraduate and postgraduate programs.',
    }),
    college({
      id: 'col-semi-nit-extension',
      slug: 'state-eng-academy',
      name: 'State Engineering Academy',
      type: 'semi-government',
      programIds: ['prog-btech'],
      city: 'Lucknow',
      location: 'Gomti Nagar, Lucknow, Uttar Pradesh 226010',
      principalName: 'Prof. Suresh Yadav',
      feesStructure: 'Tuition ₹55,000 / year · Caution deposit ₹5,000 (refundable)',
      courses: [
        'B.Tech Computer Science',
        'B.Tech Artificial Intelligence & ML',
        'B.Tech Electronics',
      ],
      branches: ['CSE', 'AI & ML', 'Electronics'],
      images: [CAMPUS_1, CAMPUS_4],
      about: 'State-backed engineering academy with industry mentoring cells.',
    }),
    college({
      id: 'col-private-innovate',
      slug: 'innovate-iot',
      name: 'Innovate Institute of Technology',
      type: 'private',
      programIds: ['prog-btech', 'prog-mtech'],
      city: 'Bengaluru',
      location: 'Electronic City, Bengaluru, Karnataka 560100',
      principalName: 'Dr. Priya Nair',
      feesStructure: 'B.Tech ₹1,20,000 / year · M.Tech ₹95,000 / year · Hostel ₹60,000',
      courses: [
        'B.Tech CSE',
        'B.Tech Information Science',
        'B.Tech Electronics',
        'B.Tech Data Science',
        'M.Tech CSE',
        'M.Tech Data Science',
      ],
      branches: ['CSE', 'Information Science', 'Electronics', 'Data Science'],
      images: [CAMPUS_3, CAMPUS_2, CAMPUS_1],
      about: 'Private tech campus near Electronic City with strong placement networks.',
    }),
    college({
      id: 'col-govt-mtech-chennai',
      slug: 'chennai-pg-eng',
      name: 'Chennai Government PG Engineering College',
      type: 'government',
      programIds: ['prog-mtech'],
      city: 'Chennai',
      location: 'Guindy, Chennai, Tamil Nadu 600025',
      principalName: 'Dr. Lakshmi Narayanan',
      feesStructure: 'M.Tech ₹15,000 / year · Research fee ₹4,000',
      courses: [
        'M.Tech Structural Engineering',
        'M.Tech VLSI Design',
        'M.Tech Power Systems',
      ],
      branches: ['Structural Engineering', 'VLSI', 'Power Systems'],
      images: [LAB, CAMPUS_4],
      about: 'Postgraduate-focused government college with research labs and funded projects.',
    }),
  ],
}
