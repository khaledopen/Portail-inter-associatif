import React from 'react';
import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { authLink } from './data/portal';
import { WelcomePage } from './pages/WelcomePage';
import { AccessibilityProvider } from './context/AccessibilityContext';
import { Layout } from './components/Layout';
import { PortalProvider } from './context/PortalContext';
import { CancelBookingPage } from './pages/CancelBookingPage';
import { HomePage } from './pages/HomePage';
import { DirectoryPage } from './pages/DirectoryPage';
import { AssociationDetailPage } from './pages/AssociationDetailPage';
import { QuickBookingFlowPage } from './pages/QuickBookingFlowPage';
import { UserSpacePage } from './pages/UserSpacePage';
import { ProSpacePage } from './pages/ProSpacePage';
import { AdminObservatoryPage } from './pages/AdminObservatoryPage';
import { AssociationSignupPage } from './pages/AssociationSignupPage';

function AuthLinkRedirect() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  useEffect(() => {
    if ((authLink.type === 'invite' || authLink.type === 'recovery' || authLink.error) && pathname !== '/bienvenue') {
      navigate('/bienvenue', { replace: true });
    }
    // Redirection unique au chargement de la page ouverte depuis l’e-mail.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
}

export function App() {
  return (
    <AccessibilityProvider>
      <PortalProvider>
      <BrowserRouter>
        <AuthLinkRedirect />
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
            <Route path="/annulation" element={<CancelBookingPage />} />
            <Route path="/bienvenue" element={<WelcomePage />} />
          </Routes>
        </Layout>
      </BrowserRouter>
      </PortalProvider>
    </AccessibilityProvider>
  );
}

export default App;
