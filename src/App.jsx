import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import Dashboard from './pages/Dashboard';
import InterviewSetup from './pages/InterviewSetup';
import TrainingMode from './pages/TrainingMode';
import InterviewReport from './pages/InterviewReport';
import History from './pages/History';

function App() {
  return (
    <Router>
      <Routes>
        {/* Unused auth pages redirect to home */}
        <Route path="/login"    element={<Navigate to="/" replace />} />
        <Route path="/register" element={<Navigate to="/" replace />} />

        {/* Dashboard */}
        <Route path="/" element={
          <ProtectedRoute><Dashboard /></ProtectedRoute>
        } />

        {/* Training Session Setup */}
        <Route path="/setup" element={
          <ProtectedRoute><InterviewSetup /></ProtectedRoute>
        } />

        {/* Active Training Session */}
        <Route path="/training/:id" element={
          <ProtectedRoute><TrainingMode /></ProtectedRoute>
        } />

        {/* Legacy /interview/:id → redirect to setup */}
        <Route path="/interview/:id" element={<Navigate to="/setup" replace />} />

        {/* Session Report */}
        <Route path="/report/:id" element={
          <ProtectedRoute><InterviewReport /></ProtectedRoute>
        } />

        {/* History */}
        <Route path="/history" element={
          <ProtectedRoute><History /></ProtectedRoute>
        } />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
