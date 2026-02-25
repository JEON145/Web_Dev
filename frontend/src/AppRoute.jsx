import React, { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Spinner from './components/Spinner'; // Import your spinner

const RegisterPage = lazy(() => import('./pages/RegisterPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const RequestPage = lazy(() => import('./pages/RequestPage'));

export default function AppRoute({ user, setUser }) {
  return (
    <Suspense fallback={<Spinner />}>
      <Routes>
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/login" element={<LoginPage setUser={setUser} />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/request" element={user ? <RequestPage user={user} /> : <Navigate to="/login" />} />
        <Route path="/dashboard/*" element={user ? <DashboardPage user={user} setUser={setUser} /> : <Navigate to="/login" />} />
        <Route path="/" element={<Navigate to="/login" />} />
      </Routes>
    </Suspense>
  );
}