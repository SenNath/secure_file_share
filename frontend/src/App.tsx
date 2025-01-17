import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { UserManagement } from './components/admin/UserManagement';
import { ManageFiles } from './components/admin/ManageFiles';
import { SharedFileView } from '@/components/files/SharedFileView';
import { DashboardLayout } from "./components/layouts/DashboardLayout";

const queryClient = new QueryClient();

const App = () => {
  const { hasPermission, user } = useAuth();
  
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/login/*" element={<Login />} />
          <Route path="/register/*" element={<Register />} />
          <Route path="/share/:token" element={<SharedFileView />} />
          <Route path="/dashboard/*" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />
          <Route
            path="/admin/users"
            element={
              <ProtectedRoute>
                {user?.role_name === 'ADMIN' ? (
                  <DashboardLayout>
                    <UserManagement />
                  </DashboardLayout>
                ) : (
                  <Navigate to="/dashboard" replace />
                )}
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/files"
            element={
              <ProtectedRoute>
                {user?.role_name === 'ADMIN' ? (
                  <DashboardLayout>
                    <ManageFiles />
                  </DashboardLayout>
                ) : (
                  <Navigate to="/dashboard" replace />
                )}
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;