import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AccessibilityProvider } from './context/AccessibilityContext';
import { Layout } from './components/Layout';
import { HomePage } from './pages/HomePage';
import { DirectoryPage } from './pages/DirectoryPage';
import { AssociationDetailPage } from './pages/AssociationDetailPage';
import { QuickBookingFlowPage } from './pages/QuickBookingFlowPage';
import { UserSpacePage } from './pages/UserSpacePage';
import { ProSpacePage } from './pages/ProSpacePage';
import { AdminObservatoryPage } from './pages/AdminObservatoryPage';
import { AssociationSignupPage } from './pages/AssociationSignupPage';

export function App() {
  return (
    <AccessibilityProvider>
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/annuaire" element={<DirectoryPage />} />
            <Route path="/association/:id" element={<AssociationDetailPage />} />
            <Route path="/parcours-rapide" element={<QuickBookingFlowPage />} />
            <Route path="/espace-usager" element={<UserSpacePage />} />
            <Route path="/espace-pro" element={<ProSpacePage />} />
            <Route path="/inscription-association" element={<AssociationSignupPage />} />
            <Route path="/observatoire" element={<AdminObservatoryPage />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </AccessibilityProvider>
  );
}

export default App;
