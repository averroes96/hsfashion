import 'server-only';

const dictionaries = {
  ar: () => import('@/dictionaries/ar.json').then((module) => module.default),
  fr: () => import('@/dictionaries/fr.json').then((module) => module.default),
};

export type Locale = keyof typeof dictionaries;

export const getDictionary = async (locale: Locale) => {
  if (dictionaries[locale]) {
    return dictionaries[locale]();
  }
  return dictionaries['ar'](); // default
};
