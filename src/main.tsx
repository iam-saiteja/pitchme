import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { LegalPageRouter } from './legalPages';
import './styles.css';
import './discovery.css';
import './company-branding.css';
import './admin-command-center.css';
import { startSupportPersistence } from './lib/supportPersistence';
import { initCompanyBranding } from './companyBranding';
import { initLegalFooter } from './legalFooter';
import { initDiscovery } from './discoveryEnhancer';
import { initAdminEnhancer } from './adminEnhancer';

const legalPaths = new Set(['/about','/terms','/privacy','/community-guidelines','/copyright-trademark']);
const path = window.location.pathname;
const root = ReactDOM.createRoot(document.getElementById('root')!);
if (legalPaths.has(path)) {
  root.render(<React.StrictMode><LegalPageRouter path={path} /></React.StrictMode>);
} else {
  root.render(<React.StrictMode><BrowserRouter><App /></BrowserRouter></React.StrictMode>);
  startSupportPersistence();
  initCompanyBranding();
  initLegalFooter();
  initDiscovery();
  initAdminEnhancer();
}
