import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './components/auth/Login';
import SignUp from './components/auth/SignUp';
import Profile from './components/auth/Profile';
import Dashboard from './components/Dashboard';
import AddFamilyMember from './components/family/AddFamilyMember';
import FamilyMemberDetails from './components/family/FamilyMemberDetails';
import EditFamilyMember from './components/family/EditFamilyMember';
import AddMedicalRecord from './components/medical/AddMedicalRecord';
import MedicalRecords from './components/medical/MedicalRecords';

// Protected Route component
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }
  
  return user ? children : <Navigate to="/login" />;
};

// Public Route component (redirect to dashboard if already logged in)
const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }
  
  return user ? <Navigate to="/dashboard" /> : children;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<Navigate to="/login" />} />
            <Route path="/login" element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            } />
            <Route path="/signup" element={
              <PublicRoute>
                <SignUp />
              </PublicRoute>
            } />
            
            {/* Protected routes */}
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />
            <Route path="/profile" element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            } />
            <Route path="/add-family-member" element={
              <ProtectedRoute>
                <AddFamilyMember />
              </ProtectedRoute>
            } />
            <Route path="/family-member/:id" element={
              <ProtectedRoute>
                <FamilyMemberDetails />
              </ProtectedRoute>
            } />
            <Route path="/family-member/:id/edit" element={
              <ProtectedRoute>
                <EditFamilyMember />
              </ProtectedRoute>
            } />
            <Route path="/family-member/:id/add-record" element={
              <ProtectedRoute>
                <AddMedicalRecord />
              </ProtectedRoute>
            } />
            <Route path="/family-member/:id/records" element={
              <ProtectedRoute>
                <MedicalRecords />
              </ProtectedRoute>
            } />
          </Routes>
          
          {/* Toast notifications */}
          <Toaster 
            position="top-center"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#363636',
                color: '#fff',
              },
            }}
          />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
