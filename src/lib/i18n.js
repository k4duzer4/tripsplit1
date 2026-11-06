import { messages } from './locales/messages.js';

/** @param {readonly string[]} languages */
export function resolveLanguage(languages = ['en']) {
  const locale = languages.find((value) => {
    try { return Intl.NumberFormat.supportedLocalesOf([value]).length > 0; } catch { return false; }
  }) || 'en';
  const language = languages.map((value) => value.split('-')[0].toLowerCase()).find((value) => ['pt', 'en', 'es'].includes(value)) || 'en';
  return { language, locale };
}

const preferences = typeof navigator === 'undefined' ? ['pt-BR'] : navigator.languages?.length ? navigator.languages : [navigator.language];
export const { language, locale } = resolveLanguage(preferences);

export function t(key, params = {}, lang = language) {
  const entry = messages[key];
  const template = entry?.[lang] ?? entry?.en ?? key;
  return template.replace(/\{(\w+)\}/g, (match, name) => String(params[name] ?? match));
}

export function applyDocumentLanguage() {
  document.documentElement.lang = language;
  document.documentElement.dir = 'ltr';
  document.title = t('Trip Split — Divida a viagem. Não a amizade.');
  document.querySelector('meta[name="description"]')?.setAttribute('content', t('Organize viagens em grupo, divida despesas e acerte as contas.'));
}
