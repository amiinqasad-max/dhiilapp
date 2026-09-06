/**
 * Demo data seed script.
 *
 * Creates 10 demo clients + 10 demo jobs, and 10 demo professionals with
 * complete profiles, skills, and one gig each. Safe to re-run: every
 * record is keyed by a fixed demo email/title so re-running upserts
 * instead of duplicating.
 *
 * Usage: npx tsx prisma/seed.ts
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const DEMO_PASSWORD = "Demo12345!";

async function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

const professionals = [
  {
    email: "amina.hassan@demo.dhiil.app",
    name: "Amina Hassan",
    title: "Graphic Designer",
    bio: "Brand identity and social media graphics specialist with 6 years of experience helping Somali businesses stand out online.",
    hourlyRate: 15,
    experience: 6,
    location: "Mogadishu, Somalia",
    languages: "Somali, English, Arabic",
    skills: ["Graphic Design", "Adobe Photoshop", "Branding", "Illustrator"],
    gig: { title: "I will design a modern logo and brand kit", description: "A complete brand identity package: logo, color palette, and typography guide delivered in 5 days.", price: 80 },
  },
  {
    email: "mohamed.abdi@demo.dhiil.app",
    name: "Mohamed Abdi",
    title: "Full-Stack Web Developer",
    bio: "I build fast, mobile-friendly websites and web apps using React and Node.js for small businesses and startups.",
    hourlyRate: 25,
    experience: 5,
    location: "Hargeisa, Somalia",
    languages: "Somali, English",
    skills: ["React", "Node.js", "TypeScript", "Web Development"],
    gig: { title: "I will build a responsive business website", description: "A custom-coded, mobile-first website with up to 5 pages, contact form, and basic SEO.", price: 250 },
  },
  {
    email: "faadumo.warsame@demo.dhiil.app",
    name: "Faadumo Warsame",
    title: "Social Media Manager",
    bio: "Helping brands grow their audience with consistent, engaging content across Instagram, TikTok, and Facebook.",
    hourlyRate: 12,
    experience: 4,
    location: "Bosaso, Somalia",
    languages: "Somali, English",
    skills: ["Social Media Marketing", "Content Creation", "Copywriting"],
    gig: { title: "I will manage your social media for one month", description: "Content calendar, daily posts, and engagement across 2 platforms for 30 days.", price: 150 },
  },
  {
    email: "ahmed.ali@demo.dhiil.app",
    name: "Ahmed Ali",
    title: "Video Editor & Motion Designer",
    bio: "Cinematic video editing for weddings, ads, and YouTube content, plus simple motion graphics.",
    hourlyRate: 18,
    experience: 5,
    location: "Mogadishu, Somalia",
    languages: "Somali, English",
    skills: ["Video Editing", "Adobe Premiere Pro", "After Effects"],
    gig: { title: "I will edit your video with professional transitions", description: "Up to 10 minutes of raw footage edited into a polished final cut with color grading.", price: 60 },
  },
  {
    email: "hodan.mohamud@demo.dhiil.app",
    name: "Hodan Mohamud",
    title: "Content Writer & Translator",
    bio: "Bilingual (Somali/English) writer producing articles, product descriptions, and accurate translations.",
    hourlyRate: 10,
    experience: 3,
    location: "Garoowe, Somalia",
    languages: "Somali, English, Arabic",
    skills: ["Content Writing", "Translation", "Copywriting"],
    gig: { title: "I will write or translate up to 1000 words", description: "SEO-friendly articles or accurate Somali-English translation, delivered within 48 hours.", price: 25 },
  },
  {
    email: "abdirahman.jama@demo.dhiil.app",
    name: "Abdirahman Jama",
    title: "Mobile App Developer",
    bio: "Building Android and cross-platform mobile apps with Flutter for local businesses and startups.",
    hourlyRate: 30,
    experience: 6,
    location: "Hargeisa, Somalia",
    languages: "Somali, English",
    skills: ["Flutter", "Mobile Development", "Firebase"],
    gig: { title: "I will build a cross-platform mobile app MVP", description: "A functional Android + iOS app MVP with up to 4 screens using Flutter and Firebase.", price: 400 },
  },
  {
    email: "sagal.nur@demo.dhiil.app",
    name: "Sagal Nur",
    title: "Photographer",
    bio: "Event, portrait, and product photography with fast turnaround and professional retouching.",
    hourlyRate: 20,
    experience: 7,
    location: "Mogadishu, Somalia",
    languages: "Somali, English",
    skills: ["Photography", "Photo Editing", "Adobe Lightroom"],
    gig: { title: "I will shoot and edit product photos for your store", description: "Up to 15 professionally lit and edited product photos, delivered in 3 days.", price: 90 },
  },
  {
    email: "khalid.omar@demo.dhiil.app",
    name: "Khalid Omar",
    title: "Accountant & Bookkeeper",
    bio: "Certified accountant helping small businesses with bookkeeping, invoicing, and monthly financial reports.",
    hourlyRate: 16,
    experience: 8,
    location: "Bosaso, Somalia",
    languages: "Somali, English, Arabic",
    skills: ["Accounting", "Bookkeeping", "Excel"],
    gig: { title: "I will set up and manage your monthly bookkeeping", description: "Full bookkeeping setup plus a monthly financial summary report.", price: 100 },
  },
  {
    email: "ikraan.said@demo.dhiil.app",
    name: "Ikraan Said",
    title: "UI/UX Designer",
    bio: "Designing clean, user-friendly interfaces for mobile apps and websites, from wireframes to final mockups.",
    hourlyRate: 22,
    experience: 4,
    location: "Hargeisa, Somalia",
    languages: "Somali, English",
    skills: ["UI/UX Design", "Figma", "Prototyping"],
    gig: { title: "I will design a complete app UI in Figma", description: "Up to 10 polished, ready-to-develop mobile app screens with a design system.", price: 180 },
  },
  {
    email: "yusuf.farah@demo.dhiil.app",
    name: "Yusuf Farah",
    title: "Digital Marketing Specialist",
    bio: "Running results-driven Facebook and Google ad campaigns for local businesses on a budget.",
    hourlyRate: 20,
    experience: 5,
    location: "Mogadishu, Somalia",
    languages: "Somali, English",
    skills: ["Digital Marketing", "Facebook Ads", "Google Ads", "SEO"],
    gig: { title: "I will set up and manage your ad campaign for 2 weeks", description: "Campaign setup, targeting, and optimization on Facebook or Google Ads.", price: 120 },
  },
];

const clients = [
  { email: "client1@demo.dhiil.app", name: "Nasteexo Ibrahim", country: "Somalia" },
  { email: "client2@demo.dhiil.app", name: "Cabdullahi Xasan", country: "Somalia" },
  { email: "client3@demo.dhiil.app", name: "Sahra Maxamed", country: "Somalia" },
  { email: "client4@demo.dhiil.app", name: "Warsame Cali", country: "Somalia" },
  { email: "client5@demo.dhiil.app", name: "Deeqa Yusuf", country: "Somalia" },
];

const jobs = [
  {
    clientEmail: "client1@demo.dhiil.app",
    title: "Design a logo for a new coffee shop",
    description: "We are opening a coffee shop in Mogadishu and need a modern, memorable logo plus a simple brand color palette we can use on our menus and signage.",
    category: "Graphic Design",
    budget: 100,
    budgetType: "FIXED",
    jobType: "ONE_TIME",
    location: "Mogadishu, Somalia",
    remote: true,
    skills: ["Graphic Design", "Branding"],
  },
  {
    clientEmail: "client1@demo.dhiil.app",
    title: "Build a website for a small retail business",
    description: "Looking for a developer to build a 5-page responsive website for our clothing store, including a product catalog page and a contact form.",
    category: "Web Development",
    budget: 300,
    budgetType: "FIXED",
    jobType: "ONE_TIME",
    location: "Hargeisa, Somalia",
    remote: true,
    skills: ["Web Development", "React"],
  },
  {
    clientEmail: "client2@demo.dhiil.app",
    title: "Manage our restaurant's social media pages",
    description: "We need someone to create and post daily content on Instagram and Facebook for our restaurant, including photos, captions, and responding to comments.",
    category: "Social Media Marketing",
    budget: 180,
    budgetType: "FIXED",
    jobType: "ONGOING",
    location: "Mogadishu, Somalia",
    remote: true,
    skills: ["Social Media Marketing", "Content Creation"],
  },
  {
    clientEmail: "client2@demo.dhiil.app",
    title: "Edit a 3-minute promotional video",
    description: "We have raw footage from a recent company event and need it edited into a polished 3-minute promotional video with music and simple text overlays.",
    category: "Video Editing",
    budget: 70,
    budgetType: "FIXED",
    jobType: "ONE_TIME",
    location: null,
    remote: true,
    skills: ["Video Editing", "Adobe Premiere Pro"],
  },
  {
    clientEmail: "client3@demo.dhiil.app",
    title: "Translate a business document from English to Somali",
    description: "We have a 10-page business proposal in English that needs to be accurately translated into Somali, keeping formal business tone.",
    category: "Translation",
    budget: 40,
    budgetType: "FIXED",
    jobType: "ONE_TIME",
    location: null,
    remote: true,
    skills: ["Translation"],
  },
  {
    clientEmail: "client3@demo.dhiil.app",
    title: "Develop a simple mobile app for order tracking",
    description: "We want a basic mobile app where our customers can place and track delivery orders. Should work on Android at minimum.",
    category: "Mobile Development",
    budget: 500,
    budgetType: "FIXED",
    jobType: "ONE_TIME",
    location: "Hargeisa, Somalia",
    remote: true,
    skills: ["Flutter", "Mobile Development"],
  },
  {
    clientEmail: "client4@demo.dhiil.app",
    title: "Product photography for online store",
    description: "We need clean, well-lit photos of about 20 products for our online store listings, with white background and consistent style.",
    category: "Photography",
    budget: 90,
    budgetType: "FIXED",
    jobType: "ONE_TIME",
    location: "Mogadishu, Somalia",
    remote: false,
    skills: ["Photography", "Photo Editing"],
  },
  {
    clientEmail: "client4@demo.dhiil.app",
    title: "Monthly bookkeeping for a small trading company",
    description: "We need a bookkeeper to manage our monthly invoices, expenses, and provide a simple financial summary each month.",
    category: "Accounting",
    budget: 120,
    budgetType: "HOURLY",
    jobType: "ONGOING",
    location: null,
    remote: true,
    skills: ["Accounting", "Bookkeeping"],
  },
  {
    clientEmail: "client5@demo.dhiil.app",
    title: "Design UI mockups for a delivery app",
    description: "We are building a food delivery app and need a designer to create clean, modern UI mockups for around 8 core screens in Figma.",
    category: "UI/UX Design",
    budget: 220,
    budgetType: "FIXED",
    jobType: "ONE_TIME",
    location: null,
    remote: true,
    skills: ["UI/UX Design", "Figma"],
  },
  {
    clientEmail: "client5@demo.dhiil.app",
    title: "Run a Facebook ads campaign for product launch",
    description: "We're launching a new product and need someone to set up and manage a 2-week Facebook ads campaign with a modest budget.",
    category: "Digital Marketing",
    budget: 150,
    budgetType: "FIXED",
    jobType: "ONE_TIME",
    location: "Mogadishu, Somalia",
    remote: true,
    skills: ["Digital Marketing", "Facebook Ads"],
  },
];

async function main() {
  console.log("Seeding demo clients + jobs...");
  const passwordHash = await hashPassword(DEMO_PASSWORD);

  const clientIdByEmail = new Map<string, string>();
  for (const c of clients) {
    const user = await prisma.user.upsert({
      where: { email: c.email },
      update: {},
      create: {
        email: c.email,
        passwordHash,
        role: "CLIENT",
        name: c.name,
        country: c.country,
      },
    });
    clientIdByEmail.set(c.email, user.id);
  }

  for (const j of jobs) {
    const clientId = clientIdByEmail.get(j.clientEmail)!;
    const existing = await prisma.job.findFirst({ where: { title: j.title, clientId } });
    if (existing) {
      console.log(`  job exists, skipping: ${j.title}`);
      continue;
    }
    await prisma.job.create({
      data: {
        clientId,
        title: j.title,
        description: j.description,
        category: j.category,
        budget: j.budget,
        budgetType: j.budgetType,
        jobType: j.jobType,
        location: j.location,
        remote: j.remote,
        skills: j.skills.join(","),
        status: "OPEN",
      },
    });
    console.log(`  created job: ${j.title}`);
  }

  console.log("Seeding demo professionals + profiles + gigs...");
  for (const p of professionals) {
    const user = await prisma.user.upsert({
      where: { email: p.email },
      update: {},
      create: {
        email: p.email,
        passwordHash,
        role: "PROFESSIONAL",
        name: p.name,
        country: "Somalia",
      },
    });

    const profile = await prisma.professionalProfile.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id,
        title: p.title,
        bio: p.bio,
        hourlyRate: p.hourlyRate,
        experience: p.experience,
        location: p.location,
        languages: p.languages,
        availability: "AVAILABLE",
        profileComplete: true,
      },
    });

    for (const skillName of p.skills) {
      const skill = await prisma.skill.upsert({
        where: { name: skillName },
        update: {},
        create: { name: skillName },
      });
      await prisma.professionalSkill.upsert({
        where: { professionalProfileId_skillId: { professionalProfileId: profile.id, skillId: skill.id } },
        update: {},
        create: { professionalProfileId: profile.id, skillId: skill.id },
      });
    }

    const existingGig = await prisma.gig.findFirst({ where: { professionalProfileId: profile.id, title: p.gig.title } });
    if (!existingGig) {
      await prisma.gig.create({
        data: {
          professionalProfileId: profile.id,
          title: p.gig.title,
          description: p.gig.description,
          price: p.gig.price,
          active: true,
        },
      });
    }

    console.log(`  seeded professional: ${p.name}`);
  }

  console.log("Done.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
