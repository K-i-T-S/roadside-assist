import { getRequestConfig } from 'next-intl/server';

export default getRequestConfig(async ({ locale }) => {
  const localeToUse = locale || 'en';
  
  return {
    locale: localeToUse,
    messages: (await import(`./messages/${localeToUse}.json`)).default
  };
});
