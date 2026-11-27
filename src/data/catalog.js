import { IMG } from './images';

/* --------------------------------------------------------------------------
   Activities
   -------------------------------------------------------------------------- */

export const ACTIVITIES = {
  coffee: {
    id: 'coffee',
    label: 'Coffee',
    tile: IMG['tile-coffee'],
    people: IMG['people-coffee'],
    cover: IMG['friends-cafe'],
    defaultTitle: 'Coffee & conversations',
    defaultAbout: 'Good coffee, easy conversation, and a few new faces.',
  },
  walk: {
    id: 'walk',
    label: 'Walk',
    tile: IMG['tile-walk'],
    people: IMG['people-walk'],
    cover: IMG['evening-walk'],
    defaultTitle: 'Evening park walk',
    defaultAbout: 'An easy-paced walk and good company. Comfortable shoes recommended.',
  },
  pickleball: {
    id: 'pickleball',
    label: 'Pickleball',
    tile: IMG['tile-pickleball'],
    people: IMG['people-pickleball'],
    cover: IMG['pickleball-court'],
    defaultTitle: 'Pickleball rally',
    defaultAbout: 'Friendly doubles for every level. Paddles available to borrow.',
  },
  sports: {
    id: 'sports',
    label: 'Sports',
    tile: IMG['tile-pickleball'],
    people: IMG['pickleball-player'],
    cover: IMG['pickleball-court'],
    defaultTitle: 'Pickleball rally',
    defaultAbout: 'Friendly doubles for every level. Paddles available to borrow.',
  },
  movies: {
    id: 'movies',
    label: 'Movies',
    tile: IMG['tile-movies'],
    people: IMG['people-movies'],
    cover: IMG['tile-movies'],
    defaultTitle: 'Movie night',
    defaultAbout: 'Catch a new release together, then chat about it over chai.',
  },
  food: {
    id: 'food',
    label: 'Food',
    tile: IMG['tile-food'],
    people: IMG['people-food'],
    cover: IMG['tile-food'],
    defaultTitle: 'Dinner & banter',
    defaultAbout: 'Share a table, try something new, and split the bill.',
  },
  travel: { id: 'travel', label: 'Travel' },
  music: { id: 'music', label: 'Music' },
  gaming: { id: 'gaming', label: 'Gaming' },
  books: { id: 'books', label: 'Books' },
};

export const INTERESTS = ['coffee', 'walk', 'pickleball', 'movies', 'food', 'travel', 'music', 'gaming', 'books'];
export const DISCOVER_FILTERS = ['all', 'coffee', 'walk', 'sports', 'movies', 'food'];
export const CREATE_ACTIVITIES = ['coffee', 'walk', 'sports', 'movies', 'food'];
export const HOME_TILES = ['coffee', 'walk', 'pickleball', 'movies', 'food'];

export function matchesActivity(plan, filter) {
  if (!filter || filter === 'all') return true;
  if (filter === 'sports' || filter === 'pickleball') return plan.activity === 'sports' || plan.activity === 'pickleball';
  return plan.activity === filter;
}

export function venueType(activity) {
  return activity === 'pickleball' ? 'sports' : activity;
}

/* --------------------------------------------------------------------------
   Places (public venues only — members' locations are never shown)
   -------------------------------------------------------------------------- */

export const VENUES = [
  { id: 'jh-cafe', name: 'Jubilee Hills Café', area: 'Jubilee Hills', type: 'coffee', km: 1.2, map: [30, 44] },
  { id: 'third-wave', name: 'Third Wave Coffee', area: 'Jubilee Hills', type: 'coffee', km: 1.6, map: [56, 34] },
  { id: 'daily-bean', name: 'The Daily Bean', area: 'Jubilee Hills', type: 'coffee', km: 1.2, map: [18, 28] },
  { id: 'roastery', name: 'Roastery Coffee House', area: 'Banjara Hills', type: 'coffee', km: 2.9, map: [84, 58] },
  { id: 'kbr', name: 'KBR Park', area: 'Jubilee Hills', type: 'walk', km: 2.4, map: [66, 72] },
  { id: 'nature-park', name: 'Jubilee Hills Nature Park', area: 'Jubilee Hills', type: 'walk', km: 2.1, map: [38, 74] },
  { id: 'tank-bund', name: 'Tank Bund Promenade', area: 'Tank Bund', type: 'walk', km: 7.8, map: [90, 90] },
  { id: 'paddle-club', name: 'Hyderabad Paddle Club', area: 'Jubilee Hills', type: 'sports', km: 1.9, map: [78, 24] },
  { id: 'arena', name: 'Gachibowli Sports Arena', area: 'Gachibowli', type: 'sports', km: 9.4, map: [8, 88] },
  { id: 'galleria', name: 'Galleria Cinemas', area: 'Panjagutta', type: 'movies', km: 4.1, map: [90, 38] },
  { id: 'inorbit', name: 'Inorbit Cinemas', area: 'Madhapur', type: 'movies', km: 6.3, map: [8, 54] },
  { id: 'spice-route', name: 'Spice Route Kitchen', area: 'Banjara Hills', type: 'food', km: 3.2, map: [56, 56] },
  { id: 'sunday-table', name: 'Sunday Table Bistro', area: 'Jubilee Hills', type: 'food', km: 1.4, map: [20, 60] },
];

export function venueByName(name) {
  return VENUES.find((v) => v.name === name);
}

/** A place the host typed themselves (not in the list). Distance/map spot are stable per name. */
export function customVenue(name, area = 'Jubilee Hills') {
  const clean = String(name || '').trim().slice(0, 60);
  let h = 2166136261;
  for (let i = 0; i < clean.length; i++) {
    h ^= clean.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  h >>>= 0;
  return {
    id: `custom-${h.toString(36)}`,
    name: clean,
    area,
    type: 'custom',
    km: Math.round((0.8 + (h % 32) / 10) * 10) / 10,
    map: [16 + (h % 68), 24 + ((h >>> 8) % 52)],
    custom: true,
  };
}

/** Known venue by name, or a typed custom place. */
export function resolveVenue(name, area) {
  return venueByName(name) || customVenue(name, area);
}

export const AREAS = [
  'Jubilee Hills',
  'Banjara Hills',
  'Gachibowli',
  'Madhapur',
  'Hitech City',
  'Kondapur',
  'Begumpet',
  'Kukatpally',
  'Secunderabad',
  'Manikonda',
];

export const CITIES = ['Hyderabad', 'Bengaluru', 'Mumbai', 'Delhi', 'Chennai', 'Pune'];

/* --------------------------------------------------------------------------
   People (illustrative members)
   -------------------------------------------------------------------------- */

export const PEOPLE = {
  ananya: {
    id: 'ananya',
    name: 'Ananya Rao',
    avatar: IMG['av-ananya'],
    area: 'Jubilee Hills',
    bio: 'Coffee, long walks & good company.',
    interests: ['coffee', 'walk', 'movies'],
    plansHosted: 14,
    rating: 4.9,
  },
  rahul: {
    id: 'rahul',
    name: 'Rahul Verma',
    avatar: IMG['av-rahul'],
    area: 'Banjara Hills',
    bio: 'Product designer. Filter coffee loyalist.',
    interests: ['coffee', 'food', 'music'],
    plansHosted: 3,
    rating: 4.8,
  },
  meera: {
    id: 'meera',
    name: 'Meera Joshi',
    avatar: IMG['av-meera'],
    area: 'Madhapur',
    bio: 'Sunset walks and street food trails.',
    interests: ['walk', 'food', 'travel'],
    plansHosted: 5,
    rating: 4.9,
  },
  rohit: {
    id: 'rohit',
    name: 'Rohit Nair',
    avatar: IMG['av-rohit'],
    area: 'Jubilee Hills',
    bio: 'Pickleball on weekends, podcasts on weekdays.',
    interests: ['pickleball', 'coffee'],
    plansHosted: 2,
    rating: 4.7,
  },
  megha: {
    id: 'megha',
    name: 'Megha Sinha',
    avatar: IMG['av-megha'],
    area: 'Begumpet',
    bio: 'Board games, books and big breakfasts.',
    interests: ['books', 'gaming', 'coffee'],
    plansHosted: 9,
    rating: 5.0,
  },
  karthik: {
    id: 'karthik',
    name: 'Karthik S',
    avatar: IMG['av-karthik'],
    area: 'Kondapur',
    bio: 'Early runs, late movies.',
    interests: ['walk', 'movies'],
    plansHosted: 4,
    rating: 4.8,
  },
  sid: {
    id: 'sid',
    name: 'Sid Bhatia',
    avatar: IMG['av-sid'],
    area: 'Jubilee Hills',
    bio: 'Always up for a stroll and a story.',
    interests: ['walk', 'travel'],
    plansHosted: 6,
    rating: 4.8,
  },
  vikram: {
    id: 'vikram',
    name: 'Vikram Das',
    avatar: IMG['av-vikram'],
    area: 'Banjara Hills',
    bio: 'Cook, eater, recommender of biryani.',
    interests: ['food', 'coffee'],
    plansHosted: 7,
    rating: 4.9,
  },
  ananyaR: {
    id: 'ananyaR',
    name: 'Ananya Reddy',
    avatar: IMG['av-ananya-reddy'],
    area: 'Gachibowli',
    bio: 'Brunch enthusiast.',
    interests: ['food', 'music'],
    mutual: 12,
  },
  rohan: {
    id: 'rohan',
    name: 'Rohan Singh',
    avatar: IMG['av-rohan'],
    area: 'Secunderabad',
    bio: 'Lakeside walks, loud playlists.',
    interests: ['walk', 'music'],
    mutual: 8,
  },
  meeraI: {
    id: 'meeraI',
    name: 'Meera Iyer',
    avatar: IMG['av-meera-iyer'],
    area: 'Hitech City',
    bio: 'Books and long lunches.',
    interests: ['books', 'food'],
    mutual: 6,
  },
  aarav: {
    id: 'aarav',
    name: 'Aarav Menon',
    avatar: IMG['av-aarav'],
    area: 'Jubilee Hills',
    bio: 'Paddle in one hand, coffee in the other.',
    interests: ['pickleball', 'coffee'],
    plansHosted: 11,
    rating: 4.9,
  },
  diya: {
    id: 'diya',
    name: 'Diya Kapoor',
    avatar: IMG['av-diya'],
    area: 'Banjara Hills',
    bio: 'Film buff. Popcorn critic.',
    interests: ['movies', 'music'],
    plansHosted: 8,
    rating: 4.9,
  },
  karthikR: {
    id: 'karthikR',
    name: 'Karthik Rao',
    avatar: IMG['av-karthik-rao'],
    area: 'Madhapur',
    bio: 'Weekend wanderer.',
    interests: ['walk', 'travel'],
    plansHosted: 3,
    rating: 4.7,
  },
};

export const REPLIES = [
  'Sounds perfect!',
  'Count me in 🙌',
  'See you all there!',
  'Love this plan.',
  'Running 5 mins late, save me a seat!',
  'Should we grab a table by the window?',
  'Can’t wait 😄',
  'Haha yes!',
];
