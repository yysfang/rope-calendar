import { createRoot } from 'react-dom/client';
import CalendarApp from './calendar-app';
import seed from './data/seed.json';
import { catalogSchema } from './lib/catalog';
import './globals.css';

createRoot(document.getElementById('root')!).render(
  <CalendarApp initialCatalog={catalogSchema.parse(seed)} />
);
