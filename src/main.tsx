import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './styles.css';
import './company-branding.css';
import { startSupportPersistence } from './lib/supportPersistence';
import { initCompanyBranding } from './companyBranding';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
);

startSupportPersistence();
initCompanyBranding();
