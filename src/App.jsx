import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import ScrollToTop from './components/ScrollToTop';
import ProtectedRoute from '@/components/ProtectedRoute';
import { TripProvider } from '@/lib/tripStore';
import Home from '@/pages/Home';
import CreateTrip from '@/pages/CreateTrip';
import ViagensHome from '@/pages/ViagensHome';
import TripLayout from '@/components/trip/TripLayout';
import TripDashboard from '@/pages/TripDashboard';
import Settlement from '@/pages/Settlement';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';
import FinishTrip from '@/pages/FinishTrip';
import { LoadingScreen } from '@/components/PaperPlaneLoader';
import AdRails from '@/components/AdRails';

const AuthenticatedApp = () => {
  const { isLoadingAuth } = useAuth();

  if (isLoadingAuth) {
    return <LoadingScreen />;
  }

  return (
    <TripProvider>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route element={<ProtectedRoute unauthenticatedElement={<Navigate to="/" replace />} />}>
          <Route path="/viagens" element={<ViagensHome />} />
          <Route path="/criar-viagem" element={<CreateTrip />} />
          <Route element={<TripLayout />}>
            <Route path="/viagem/:tripId" element={<TripDashboard />} />
            <Route path="/viagem/:tripId/acerto" element={<Settlement />} />
            <Route path="/viagem/:tripId/finalizar" element={<FinishTrip />} />
          </Route>
        </Route>
        <Route path="*" element={<PageNotFound />} />
      </Routes>
    </TripProvider>
  );
};

function App() {

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <ScrollToTop />
          <AdRails>
            <AuthenticatedApp />
          </AdRails>
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App
