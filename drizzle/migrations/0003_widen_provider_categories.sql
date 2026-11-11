ALTER TABLE public.providers DROP CONSTRAINT providers_category_check;
ALTER TABLE public.providers ADD CONSTRAINT providers_category_check CHECK (category IN (
  'pediatrician', 'dentist', 'specialist', 'therapist', 'childcare',
  'classes and activities', 'clothing brands', 'toys', 'stores', 'services', 'other',
  'pediatricians', 'pediatric dentists', 'adult dentists', 'tongue tie and ENT',
  'feeding, sleep and doulas', 'massage, PT and therapy', 'preschools and daycares',
  'nannies and sitters', 'childcare agencies and tips', 'camps', 'swim',
  'free and drop-in', 'shoes and clothes', 'strollers and car seats',
  'feeding and home gear', 'travel with kids', 'toddler tower and furniture',
  'cleaners, handy people and gardeners', 'utilities, cars and money',
  'real estate and tenants', 'birthday party venues', 'dinner delivery and takeout',
  'kid-friendly restaurants', 'travel and outings', 'haircuts and styling',
  'photographers', 'pets', 'local businesses'
));