export type NavLinkItem = {
  label: string
  to: string
  description?: string
}

export type NavSection = {
  title: string
  items: NavLinkItem[]
}

/** Public site menu — users only (no Super Admin links) */
export const primaryNav: NavLinkItem[] = [
  { label: 'Colleges', to: '/colleges', description: 'Browse and filter campuses' },
  { label: 'Courses', to: '/courses', description: 'Explore programs by stream' },
]

export const menuSections: NavSection[] = [
  {
    title: 'Discover',
    items: [
      { label: 'Home', to: '/', description: 'Start here' },
      { label: 'Colleges', to: '/colleges', description: 'Search campuses and take admission' },
      { label: 'Courses', to: '/courses', description: 'Engineering, Medical, MBA…' },
      { label: 'Streams', to: '/#streams', description: 'Browse by field of study' },
    ],
  },
  {
    title: 'For students',
    items: [
      { label: 'My Applications', to: '/applications', description: 'Track admission status' },
      { label: 'How it works', to: '/#how-it-works', description: 'Browse → apply → track' },
    ],
  },
  {
    title: 'Login',
    items: [
      { label: 'Student Login', to: '/login', description: 'Name, college, branch, phone & Gmail' },
      { label: 'College Login', to: '/college/login', description: 'Campus account access' },
    ],
  },
]
