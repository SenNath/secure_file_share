import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import {
  Shield,
  LogOut,
  FileText,
  Upload,
  Clock,
  Share2,
  Trash2,
} from "lucide-react";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const { user, logout } = useAuth();

  const navItems = [
    { label: "Files", icon: FileText, path: "/dashboard" },
    { label: "Upload", icon: Upload, path: "/dashboard/upload" },
    { label: "Recent", icon: Clock, path: "/dashboard/recent" },
    { label: "Shared", icon: Share2, path: "/dashboard/shared" },
    { label: "Trash", icon: Trash2, path: "/dashboard/trash" },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Shield className="h-6 w-6 text-primary" />
            <span className="font-bold text-xl">SecureShare</span>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600">
              {user?.email}
            </span>
            <Button variant="outline" onClick={logout}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 flex gap-8">
        <nav className="w-64 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className="flex items-center space-x-2 px-4 py-2 text-gray-700 rounded-lg hover:bg-gray-100"
              >
                <Icon className="h-5 w-5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <main className="flex-1">
          <div className="bg-white p-6 rounded-lg shadow">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}; 