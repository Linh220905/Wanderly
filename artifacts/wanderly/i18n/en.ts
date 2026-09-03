/**
 * English translations — the default / fallback language.
 *
 * Convention:
 *   • Keys use dot-separated namespaces: "section.key"
 *   • Interpolation uses {{variable}} syntax
 *   • Plurals use _one / _other suffixes
 */

const en = {
  // ── Common ──────────────────────────────────────────────
  common: {
    continue: 'Continue',
    back: 'Back',
    cancel: 'Cancel',
    save: 'Save',
    done: 'Done',
    skip: 'Skip',
    close: 'Close',
    reset: 'Reset',
    delete: 'Delete',
    share: 'Share',
    loading: 'Loading…',
    retry: 'Retry',
    ok: 'OK',
    yes: 'Yes',
    no: 'No',
  },

  // ── Welcome / Onboarding ───────────────────────────────
  welcome: {
    eyebrow: 'YOUR NEXT ADVENTURE IS OUT THERE',
    title: 'Turn every run into an adventure.',
    subtitle: 'Run, reveal the map, discover rewards.',
    privacy: 'Your route stays private by default.',
    start: 'Start Exploring',
    note: 'Wanderly only tracks when you choose to start an activity.',
  },

  onboarding: {
    eyebrow: "LET'S GET TO KNOW YOUR ADVENTURE",
    selectAll: 'Select all that feel right.',
    selectOne: 'Choose one to continue.',
    seeType: 'See my explorer type',
    q1: 'What would you like Wanderly to help you achieve?',
    q1_opts: 'Explore new places|Run more consistently|Improve my fitness|Stay motivated|Compete and earn rewards',
    q2: 'How do you usually explore?',
    q2_opts: 'Walking|Running|Hiking|A mix of activities',
    q3: 'What best describes your current level?',
    q3_opts: 'Just getting started|Casual explorer|Regular runner|Experienced runner',
    q4: 'How often are you active each week?',
    q4_opts: '0–1 days|2–3 days|4–5 days|6–7 days',
    q5: 'How far do you usually go in one session?',
    q5_opts: 'Less than 2 km|2–5 km|5–10 km|More than 10 km|I\'m not sure yet',
    q6: 'Choose a weekly distance goal.',
    q6_opts: '5 km|10 km|20 km|30 km|Custom',
    q7: 'Where do you enjoy exploring most?',
    q7_opts: 'City streets|Parks and waterfronts|Trails and nature|Anywhere with something new',
    q8: 'When do you usually run or walk?',
    q8_opts: 'Early morning|Daytime|Evening|It changes often',
    q9: 'What would motivate you most?',
    q9_opts: 'Clearing the fog|Collecting rare rewards|Completing missions|Building a streak|Climbing leaderboards',
    q10: 'How social should your adventure feel?',
    q10_opts: 'Private and personal|Compare with friends|Compete locally|Compete globally',
  },

  summary: {
    eyebrow: 'YOUR EXPLORER TYPE',
    types: {
      trailSeeker: 'Trail Seeker',
      rewardHunter: 'Reward Hunter',
      cityPathfinder: 'City Pathfinder',
      consistencyBuilder: 'Consistency Builder',
    },
    body: "You're ready to turn everyday movement into a personal map of places, progress, and small wins.",
    weeklyTarget: 'WEEKLY TARGET',
    recommended: 'RECOMMENDED',
    days: '{{count}} days',
    quote: 'Every path you reveal becomes part of your story.',
    buildAdventure: 'Build My Adventure',
  },

  paywall: {
    badge: 'WANDERLY PLUS',
    title: 'Go further, see more.',
    body: 'Make your progress feel as expansive as the places you explore.',
    benefits: [
      'Advanced weekly and monthly analytics',
      'Unlimited detailed journey history',
      'Custom fog colors and map themes',
      'Exclusive missions and rewards',
    ],
    bestValue: 'BEST VALUE',
    yearlyName: 'Yearly explorer',
    yearlySub: 'Unlock every trail for a full year',
    yearlyPrice: '$39.99',
    perYear: '/ year',
    continuePremium: 'Continue with Premium',
    continueFree: 'Continue with Free',
    legal: 'Premium renews automatically. Prices are shown by StoreKit in production.',
  },

  auth: {
    title: 'Save your adventure.',
    body: 'Create an account to keep your revealed map, rewards, and journey safe across devices.',
    apple: 'Continue with Apple',
    google: 'Continue with Google',
    email: 'Sign in with email',
    legal: "By continuing, you agree to Wanderly's Terms and Privacy Policy.",
    skip: 'Continue without account',
  },

  location: {
    title: 'Let the map reveal itself.',
    body: 'Wanderly uses your location only while you explore. It draws your route and clears fog around the places you travel.',
    tips: [
      'Tracking starts only when you tap Start.',
      'Background GPS can use more battery.',
      'Your precise route stays private.',
    ],
    enable: 'Enable location',
    requesting: 'Requesting access…',
    later: 'Set up later',
    deniedTitle: 'Location stays in your control',
    deniedBody: 'Enable access later in Settings. Live route tracking needs permission.',
  },

  // ── Map ─────────────────────────────────────────────────
  map: {
    greetingMorning: 'GOOD MORNING, EXPLORER',
    greetingAfternoon: 'GOOD AFTERNOON, EXPLORER',
    greetingEvening: 'GOOD EVENING, EXPLORER',
    whereReveal: 'Where will you reveal?',
    thisWeek: 'THIS WEEK',
    revealed: 'REVEALED',
    cells: 'cells',
    km: 'km',
    activeExploration: 'ACTIVE EXPLORATION',
    gpsRevealZone: 'GPS reveal zone · {{area}} m²',
    startExploring: 'Start exploring',
    locating: 'Locating you…',
    pathOpening: 'Your path is opening the fog',
    moveToReveal: 'Move to reveal the map',
    recenter: 'Back to me',
    journeySaved: 'Journey saved',
    journeySavedBody: 'Your route is now part of your permanent map.',
  },

  // ── Missions ────────────────────────────────────────────
  missions: {
    eyebrow: 'YOUR ADVENTURE BOARD',
    title: 'Missions',
    body: 'Small goals, bigger map. Progress updates as you explore.',
    daily: 'Daily',
    weekly: 'Weekly',
    claim: 'Claim',
    completed: 'Completed',
    refreshIn: 'Refreshes in {{time}}',
    templates: {
      moveDistance: 'Move {{distance}} km today',
      exploreCells: 'Explore {{count}} new cells',
      completeSessions: 'Complete {{count}} sessions',
      maintainStreak: 'Maintain a {{count}}-day streak',
      discoverCheckpoint: 'Discover a checkpoint',
      weeklyDistance: 'Cover {{distance}} km this week',
      weeklyExplore: 'Reveal {{count}} cells this week',
    },
  },

  // ── Journey ─────────────────────────────────────────────
  journey: {
    eyebrow: 'YOUR PATH SO FAR',
    title: 'Journey',
    week: 'Week',
    month: 'Month',
    year: 'Year',
    allTime: 'All time',
    distance: 'DISTANCE',
    sessions: 'SESSIONS',
    streak: 'STREAK',
    emptyTitle: 'Your first journey is waiting',
    emptyBody: 'Start an exploration from the Map tab and your route will appear here.',
    sessionTitle: 'A new path revealed',
    today: 'Today',
    run: 'Run',
  },

  // ── Collection ──────────────────────────────────────────
  collection: {
    eyebrow: 'YOUR DISCOVERIES',
    title: 'Collection',
    body: 'Every badge marks a place, a habit, or a brave little detour.',
    all: 'All',
    explorer: 'Explorer',
    consistency: 'Consistency',
    discovery: 'Discovery',
    special: 'Special',
    locked: 'LOCKED',
    common: 'COMMON',
    rare: 'RARE',
    epic: 'EPIC',
    legendary: 'LEGENDARY',
    unlocked: 'Unlocked!',
    progress: '{{current}} / {{total}} collected',
  },

  // ── Profile ─────────────────────────────────────────────
  profile: {
    explorerLevel: 'EXPLORER LEVEL {{level}}',
    xpProgress: '{{current}} / {{target}} XP',
    distance: 'DISTANCE',
    sessions: 'SESSIONS',
    revealed: 'REVEALED',
    checkpoints: 'CHECKPOINTS',
    settings: 'Settings',
    unitPreferences: 'Unit preferences',
    trackingPrivacy: 'Tracking & privacy',
    fogAppearance: 'Fog appearance',
    hapticsReminders: 'Haptics & reminders',
    restorePurchases: 'Restore purchases',
    language: 'Language',
    about: 'About Wanderly',
    signOut: 'Sign out / reset local profile',
    signOutConfirmTitle: 'Reset local adventure?',
    signOutConfirmBody: 'This clears local progress.',
    freeExplorer: 'Free Explorer',
    premiumPathfinder: 'Premium Pathfinder',
  },

  // ── Session Summary ─────────────────────────────────────
  sessionSummary: {
    title: 'Exploration Complete!',
    distance: 'Distance',
    duration: 'Duration',
    cellsRevealed: 'Cells Revealed',
    xpEarned: 'XP Earned',
    coinsEarned: 'Coins Earned',
    newLevel: 'New Level!',
    saveJourney: 'Save Journey',
    greatJob: 'Great exploration! Keep revealing the world.',
  },

  // ── Level Up ────────────────────────────────────────────
  levelUp: {
    title: 'Level Up!',
    body: 'You reached Explorer Level {{level}}',
    reward: 'Reward: {{reward}}',
    celebrate: "Let's go!",
  },

  // ── Checkpoint ──────────────────────────────────────────
  checkpoint: {
    discovered: 'Checkpoint Discovered!',
    landmark: 'Landmark',
    cache: 'Rare Cache',
    fragment: 'City Fragment',
    mystery: 'Mystery Chest',
    reward: '+{{amount}} {{type}}',
    collect: 'Collect Reward',
  },

  // ── Errors ──────────────────────────────────────────────
  errors: {
    generic: 'Something went wrong',
    tryAgain: 'Please try again',
    noConnection: 'No internet connection',
    locationDenied: 'Location access denied',
  },
};

// Recursive type that accepts the same shape but with any string values
type DeepStringShape<T> = {
  [K in keyof T]: T[K] extends string
    ? string
    : T[K] extends readonly string[]
    ? string[]
    : T[K] extends Record<string, unknown>
    ? DeepStringShape<T[K]>
    : T[K];
};

export type TranslationKeys = DeepStringShape<typeof en>;
export default en as TranslationKeys;
