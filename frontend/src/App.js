import React from 'react';
import { Routes, Route, Link as RouterLink, Navigate, useLocation } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  Paper,
  Stack,
} from '@mui/material';
import Products from './components/Products';
import Categories from './components/Categories';
import Suppliers from './components/Suppliers';
import Login from './components/Login';
import Register from './components/Register';
import ForgotPassword from './components/ForgotPassword';
import { useAuth } from './AuthContext';

function Sidebar() {
  const location = useLocation();
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) return null;

  const isActive = (path) => location.pathname === path;

  return (
    <Paper
      elevation={6}
      sx={{
        width: 260,
        p: 2,
        mr: 3,
        display: { xs: 'none', md: 'flex' },
        flexDirection: 'column',
        gap: 2,
      }}
    >
      <Typography
        variant="overline"
        sx={{ letterSpacing: 1.2, color: 'text.secondary' }}
      >
        Navigation
      </Typography>
      <Stack spacing={1}>
        <Button
          component={RouterLink}
          to="/"
          variant={isActive('/') ? 'contained' : 'text'}
          color="primary"
          startIcon={<span>📦</span>}
          sx={{ justifyContent: 'flex-start' }}
        >
          Products
        </Button>
        <Button
          component={RouterLink}
          to="/categories"
          variant={isActive('/categories') ? 'contained' : 'text'}
          color="primary"
          startIcon={<span>📂</span>}
          sx={{ justifyContent: 'flex-start' }}
        >
          Categories
        </Button>
        <Button
          component={RouterLink}
          to="/suppliers"
          variant={isActive('/suppliers') ? 'contained' : 'text'}
          color="primary"
          startIcon={<span>🏭</span>}
          sx={{ justifyContent: 'flex-start' }}
        >
          Suppliers
        </Button>
      </Stack>
      <Box sx={{ mt: 'auto', pt: 2 }}>
        <Typography variant="caption" color="text.secondary">
          Inventory Manager · v1.0
        </Typography>
      </Box>
    </Paper>
  );
}

function App() {
  const { user, isAuthenticated, logout } = useAuth();
  const location = useLocation();
  const isAuthRoute = ['/login', '/register', '/forgot-password'].includes(
    location.pathname
  );

  // For unauthenticated auth routes, show full-screen auth UI without header/shell
  if (isAuthRoute && !isAuthenticated) {
    return (
      <Box sx={{ minHeight: '100vh' }}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
        </Routes>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppBar position="static" color="primary" elevation={3}>
        <Toolbar sx={{ maxWidth: 1440, mx: 'auto', width: '100%' }}>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            📦 Inventory Management
          </Typography>
          {isAuthenticated ? (
            <Stack direction="row" spacing={2} alignItems="center">
              <Typography variant="body2">
                {user?.name || user?.email}
              </Typography>
              <Button color="inherit" variant="outlined" onClick={logout}>
                Logout
              </Button>
            </Stack>
          ) : (
            <Stack direction="row" spacing={1}>
              <Button
                color="inherit"
                component={RouterLink}
                to="/login"
              >
                Login
              </Button>
              <Button
                color="inherit"
                component={RouterLink}
                to="/register"
              >
                Register
              </Button>
            </Stack>
          )}
        </Toolbar>
      </AppBar>

      {/* Main app shell for authenticated area */}
      {!isAuthRoute || isAuthenticated ? (
        <Box
          sx={{
            maxWidth: 1440,
            mx: 'auto',
            p: 3,
            display: 'flex',
            gap: 3,
          }}
        >
          <Sidebar />
          <Box sx={{ flex: 1 }}>
            <Paper elevation={4} sx={{ p: 3, borderRadius: 3 }}>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  mb: 3,
                }}
              >
                <Box>
                  <Typography variant="h5" fontWeight={600}>
                    Inventory Workspace
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Manage your products, categories and suppliers
                  </Typography>
                </Box>
              </Box>
              <Routes>
                <Route
                  path="/"
                  element={isAuthenticated ? <Products /> : <Navigate to="/login" replace />}
                />
                <Route
                  path="/categories"
                  element={isAuthenticated ? <Categories /> : <Navigate to="/login" replace />}
                />
                <Route
                  path="/suppliers"
                  element={isAuthenticated ? <Suppliers /> : <Navigate to="/login" replace />}
                />
                <Route
                  path="/login"
                  element={isAuthenticated ? <Navigate to="/" replace /> : <Login />}
                />
                <Route
                  path="/register"
                  element={isAuthenticated ? <Navigate to="/" replace /> : <Register />}
                />
                <Route path="/forgot-password" element={<ForgotPassword />} />
              </Routes>
            </Paper>
          </Box>
        </Box>
      ) : null}
    </Box>
  );
}

export default App;


