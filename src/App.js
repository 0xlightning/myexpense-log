import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import PrivateRoute from './components/auth/PrivateRoute';
import { Layout } from './components/layout/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Income from './pages/Income';
import Expenditure from './pages/Expenditure';
import CardPage from './pages/Card';
import Exchange from './pages/Exchange';
import OnCredit from './pages/OnCredit';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route path="/" element={
            <PrivateRoute>
              <Layout />
            </PrivateRoute>
          }>
            <Route index element={<Dashboard />} />
            <Route path="income" element={<Income />} />
            <Route path="expenditure" element={<Expenditure />} />
            <Route path="card" element={<CardPage />} />
            <Route path="exchange" element={<Exchange />} />
            <Route path="on-credit" element={<OnCredit />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
