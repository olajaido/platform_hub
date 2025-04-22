import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { QueryClient, QueryClientProvider } from 'react-query';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ResourceRequest from './pages/ResourceRequest';
import DeploymentStatus from './pages/DeploymentStatus';
import StackDeploymentStatus from './pages/StackDeploymentStatus';

// Components
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';

// Context
import { AuthProvider } from './context/AuthContext';

// Create a client for React Query
const queryClient = new QueryClient();

// Create a theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#3f51b5',
    },
    secondary: {
      main: '#4caf50',
    },
    background: {
      default: '#f5f5f5',
    },
  },
  typography: {
    fontFamily: 'Roboto, Arial, sans-serif',
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <Router>
            <Navbar />
            <Routes>
              <Route path="/login" element={<Login />} />
              
              <Route 
                path="/dashboard" 
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                } 
              />
              
              <Route 
                path="/request" 
                element={
                  <ProtectedRoute>
                    <ResourceRequest />
                  </ProtectedRoute>
                } 
              />
              
              <Route 
                path="/deployments/:deploymentId" 
                element={
                  <ProtectedRoute>
                    <DeploymentStatus />
                  </ProtectedRoute>
                } 
              />
              
              <Route 
                path="/stacks/:stackId" 
                element={
                  <ProtectedRoute>
                    <StackDeploymentStatus />
                  </ProtectedRoute>
                } 
              />
              
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </Router>
        </ThemeProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;