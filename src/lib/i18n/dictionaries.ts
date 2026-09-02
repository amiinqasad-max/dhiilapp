import type { Locale } from "./config";

// Somali (so)
import soCommon from "./locales/so/common.json";
import soNav from "./locales/so/nav.json";
import soHome from "./locales/so/home.json";
import soAuth from "./locales/so/auth.json";
import soJobs from "./locales/so/jobs.json";
import soApplications from "./locales/so/applications.json";
import soProfessionals from "./locales/so/professionals.json";
import soProfile from "./locales/so/profile.json";
import soDashboard from "./locales/so/dashboard.json";
import soNotifications from "./locales/so/notifications.json";
import soSettings from "./locales/so/settings.json";
import soAdmin from "./locales/so/admin.json";
import soWhatsapp from "./locales/so/whatsapp.json";
import soPwa from "./locales/so/pwa.json";
import soErrors from "./locales/so/errors.json";
import soProjects from "./locales/so/projects.json";
import soReviews from "./locales/so/reviews.json";
import soFavorites from "./locales/so/favorites.json";

// English (en)
import enCommon from "./locales/en/common.json";
import enNav from "./locales/en/nav.json";
import enHome from "./locales/en/home.json";
import enAuth from "./locales/en/auth.json";
import enJobs from "./locales/en/jobs.json";
import enApplications from "./locales/en/applications.json";
import enProfessionals from "./locales/en/professionals.json";
import enProfile from "./locales/en/profile.json";
import enDashboard from "./locales/en/dashboard.json";
import enNotifications from "./locales/en/notifications.json";
import enSettings from "./locales/en/settings.json";
import enAdmin from "./locales/en/admin.json";
import enWhatsapp from "./locales/en/whatsapp.json";
import enPwa from "./locales/en/pwa.json";
import enErrors from "./locales/en/errors.json";
import enProjects from "./locales/en/projects.json";
import enReviews from "./locales/en/reviews.json";
import enFavorites from "./locales/en/favorites.json";

// A dictionary is a flat map of "namespace.key" -> translated string. Kept
// as plain JSON + a flat map (not a class or framework object) so a future
// native client can load the exact same files.
export type Dictionary = Record<string, string>;

function buildDictionary(namespaces: Record<string, Record<string, string>>): Dictionary {
  const flat: Dictionary = {};
  for (const [namespace, entries] of Object.entries(namespaces)) {
    for (const [key, value] of Object.entries(entries)) {
      flat[`${namespace}.${key}`] = value;
    }
  }
  return flat;
}

const dictionaries: Record<Locale, Dictionary> = {
  so: buildDictionary({
    common: soCommon,
    nav: soNav,
    home: soHome,
    auth: soAuth,
    jobs: soJobs,
    applications: soApplications,
    professionals: soProfessionals,
    profile: soProfile,
    dashboard: soDashboard,
    notifications: soNotifications,
    settings: soSettings,
    admin: soAdmin,
    whatsapp: soWhatsapp,
    pwa: soPwa,
    errors: soErrors,
    projects: soProjects,
    reviews: soReviews,
    favorites: soFavorites,
  }),
  en: buildDictionary({
    common: enCommon,
    nav: enNav,
    home: enHome,
    auth: enAuth,
    jobs: enJobs,
    applications: enApplications,
    professionals: enProfessionals,
    profile: enProfile,
    dashboard: enDashboard,
    notifications: enNotifications,
    settings: enSettings,
    admin: enAdmin,
    whatsapp: enWhatsapp,
    pwa: enPwa,
    errors: enErrors,
    projects: enProjects,
    reviews: enReviews,
    favorites: enFavorites,
  }),
};

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale];
}
