import { normalizeDsaLanguage } from '../../../utils/dsaPersonalization.js';

export function getTopicEditorLanguage(topic, savedDsaLanguage) {
  const slug = topic?.domainId?.slug || topic?.domainId;
  if (slug === 'dsa') return normalizeDsaLanguage(savedDsaLanguage);
  if (slug === 'web-development') {
    const title = (topic.title || '').toLowerCase();
    if (title.includes('html')) return 'html';
    if (title.includes('css')) return 'css';
    return 'javascript';
  }
  return null;
}
