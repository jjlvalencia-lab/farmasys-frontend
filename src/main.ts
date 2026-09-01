import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';
import { Chart, registerables } from 'chart.js'; // ← agregar

Chart.register(...registerables); // ← agregar

bootstrapApplication(App, appConfig)
  .catch((err) => console.error(err));