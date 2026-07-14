import mealImg from "@assets/gallery/family_enjoying_a_healthy_meal_together.webp";
import girlImg from "@assets/gallery/happy_young_girl_holding_books_in_classroom.webp";
import elderlyImg from "@assets/gallery/elderly_person_smiling_with_caregiver.webp";
import charityImg from "@assets/gallery/charitable_work_in_pakistan_background.webp";
import volunteersImg from "@assets/gallery/volunteers_handing_out_food_to_community.webp";
import unityImg from "@assets/gallery/diverse_hands_joining_together_in_unity_against_blue_sky.webp";

// ─── Impact stats (homepage band) ──────────────────────────────────────────
export const impactStats = [
  { icon: "users", value: "15,402", label: "Families Helped" },
  { icon: "heart", value: "Rs. 42M", label: "Donations Distributed" },
  { icon: "hand", value: "820", label: "Active Volunteers" },
  { icon: "cap", value: "450", label: "Student Fees Sponsored" },
];

// ─── Fund distribution (transparency donut) ────────────────────────────────
export const fundDistribution = [
  { label: "Direct Aid", value: 85, color: "#0F4C3A" },
  { label: "Logistics", value: 10, color: "#E8A33D" },
  { label: "Admin & Platform", value: 5, color: "#D8D2C4" },
];

// ─── Gallery: verified completed events, each with a small photo set ──────
export type GalleryEvent = {
  id: string;
  title: string;
  date: string;
  location: string;
  description: string;
  images: string[];
  families: string;
  items: string;
  funds: string;
};

export const galleryEvents: GalleryEvent[] = [
  {
    id: "winter-relief-2025",
    title: "Winter Relief Drive 2025",
    date: "December 15, 2025",
    location: "Tharparkar, Sindh",
    description:
      "Distributed winter kits containing blankets, warm clothing, and food supplies to families facing extreme weather conditions.",
    images: [charityImg, volunteersImg, mealImg, unityImg],
    families: "520 Families",
    items: "1,500+ Kits",
    funds: "PKR 450,000",
  },
  {
    id: "school-supplies-bwp",
    title: "School Supplies, Bahawalpur",
    date: "January 2026",
    location: "Bahawalpur, Punjab",
    description:
      "95 children returned to school fully equipped with books, bags, and uniforms for the new term.",
    images: [girlImg, unityImg, volunteersImg],
    families: "95 Children",
    items: "300+ Kits",
    funds: "PKR 210,000",
  },
  {
    id: "elderly-care-multan",
    title: "Elderly Care Support, Multan",
    date: "February 2026",
    location: "Multan, Punjab",
    description:
      "Ongoing medical checkups and caregiver support delivered to elderly residents across four neighborhoods.",
    images: [elderlyImg, mealImg, charityImg],
    families: "22 Residents",
    items: "60+ Visits",
    funds: "PKR 150,000",
  },
];

// ─── Success stories: individual before/after journeys ────────────────────
export type SuccessStory = {
  id: string;
  name: string;
  title: string;
  date: string;
  quote: string;
  before: string;
  after: string;
};

export const successStories: SuccessStory[] = [
  {
    id: "usman",
    name: "Usman",
    title: "Usman's Journey",
    date: "October 2025",
    quote:
      "Usman's family was devastated when he was diagnosed with a critical kidney condition. Aik Kadam donors raised the funds for his surgery within 72 hours. Today, Usman is back to playing cricket with his friends.",
    before: elderlyImg,
    after: charityImg,
  },
  {
    id: "zainab",
    name: "Zainab",
    title: "Zainab's Story",
    date: "January 2026",
    quote:
      "Successful vision correction surgery restored Zainab's sight, enabling her to return to her studies with confidence and rejoin her classmates.",
    before: girlImg,
    after: mealImg,
  },
  {
    id: "bilal",
    name: "Bilal",
    title: "Bilal's Story",
    date: "December 2025",
    quote:
      "Provided Bilal with a brand new rickshaw, transforming him from a daily laborer to a self-reliant business owner supporting his family.",
    before: volunteersImg,
    after: unityImg,
  },
];

// ─── Ongoing cases ──────────────────────────────────────────────────────────
export type OngoingCase = {
  id: string;
  title: string;
  image: string;
  location: string;
  description: string;
  collected: number;
  goal: number;
};

export const ongoingCases: OngoingCase[] = [
  {
    id: "cardiac-karachi",
    title: "Emergency Cardiac Surgery",
    image: charityImg,
    location: "Karachi, Pakistan",
    description:
      "Financial assistance needed for a 45-year-old father of three requiring immediate heart valve replacement surgery.",
    collected: 620000,
    goal: 850000,
  },
  {
    id: "drought-tharparkar",
    title: "Tharparkar Drought Relief",
    image: unityImg,
    location: "Tharparkar, Pakistan",
    description:
      "Providing 100 essential food kits containing flour, oil, pulses, and dates for families affected by severe drought.",
    collected: 125000,
    goal: 300000,
  },
  {
    id: "school-swat",
    title: "Village School Renovation",
    image: girlImg,
    location: "Swat, Pakistan",
    description:
      "Repairing roofs and providing desks for a primary school serving 80 children in a remote village.",
    collected: 405000,
    goal: 450000,
  },
];

// ─── Volunteers ──────────────────────────────────────────────────────────
export type Volunteer = {
  badgeId: string;
  name: string;
  role: string;
  city: string;
  email: string;
  projects: string[];
  quote: string;
  hours: number;
  joined: string;
  active: boolean;
};

export const volunteers: Volunteer[] = [
  {
    badgeId: "VOL-8821",
    name: "Sarah Jameel",
    role: "Field Coordinator",
    city: "Karachi, Sindh",
    email: "sarah.j@aikkadam.org",
    projects: ["Sindh Food Drive", "Tharparkar Water Relief", "Flood Shelter Phase 1"],
    quote: "Dedicated to improving food security in rural Sindh. Passionate about community building.",
    hours: 120,
    joined: "Mar 2024",
    active: true,
  },
  {
    badgeId: "VOL-9932",
    name: "David Malik",
    role: "Medical Assistant",
    city: "Lahore, Punjab",
    email: "david.m@aikkadam.org",
    projects: ["Lahore Mobile Clinic", "Polio Awareness Drive", "Heatwave Emergency Response"],
    quote: "Medical professional volunteering for mobile health clinics across Punjab.",
    hours: 85,
    joined: "Jun 2024",
    active: true,
  },
  {
    badgeId: "VOL-1120",
    name: "Priya Khan",
    role: "Volunteer Teacher",
    city: "Islamabad, ICT",
    email: "priya.k@aikkadam.org",
    projects: ["Slum Education Project", "Digital Literacy for Girls", "Adult Education Program"],
    quote: "Empowering children through education. Lead instructor for our weekend classes.",
    hours: 210,
    joined: "Jan 2023",
    active: true,
  },
  {
    badgeId: "VOL-0063",
    name: "Hamza Tariq",
    role: "Logistics Volunteer",
    city: "Sialkot, Punjab",
    email: "hamza.t@aikkadam.org",
    projects: ["Winter Relief Drive", "Ration Distribution"],
    quote: "Making sure every kit reaches the right family, on time.",
    hours: 54,
    joined: "Sep 2025",
    active: true,
  },
];
