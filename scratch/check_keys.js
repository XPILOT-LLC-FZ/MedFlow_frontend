import { translations } from './src/lib/i18n.js';

const enKeys = Object.keys(translations.en);
const arKeys = Object.keys(translations.ar);

const missingInAr = enKeys.filter(k => !arKeys.includes(k));
const missingInEn = arKeys.filter(k => !enKeys.includes(k));

console.log('Missing in AR:', missingInAr);
console.log('Missing in EN:', missingInEn);
