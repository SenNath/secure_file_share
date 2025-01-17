import { Users, FileText, Upload, Clock, Share2, Trash2, Files } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';

export function Sidebar() {
  const { user } = useAuth();
  const location = useLocation();
  
  const isAdmin = user?.role_name === 'ADMIN';
  const isGuest = user?.role_name === 'GUEST';

  const navigationItems = [
    { path: '/dashboard', icon: FileText, label: 'Files', hideForGuest: true },
    { path: '/dashboard/upload', icon: Upload, label: 'Upload', hideForGuest: true },
    { path: '/dashboard/shared', icon: Share2, label: 'Shared', hideForGuest: false },
    { path: '/dashboard/trash', icon: Trash2, label: 'Trash', hideForGuest: true },
  ];

  const filteredNavigationItems = isGuest 
    ? navigationItems.filter(item => !item.hideForGuest)
    : navigationItems;

  return (
    <div className="min-h-screen border-r w-64">
      <nav className="space-y-2 p-6">
        {/* Main Navigation */}
        <div className="space-y-2">
          {filteredNavigationItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center gap-4 px-5 py-3 w-full rounded-md hover:bg-accent text-base font-medium",
                  location.pathname === item.path && "bg-accent"
                )}
              >
                <Icon className="h-5 w-5 shrink-0" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>

        {/* Admin Section */}
        {isAdmin && (
          <div className="mt-10 space-y-2">
            <h2 className="font-semibold text-lg px-5 py-2">Admin</h2>
            <Link
              to='/admin/users'
              className={cn(
                "flex items-center gap-4 px-5 py-3 w-full rounded-md hover:bg-accent text-base font-medium",
                location.pathname === '/admin/users' && "bg-accent"
              )}
            >
              <Users className="h-5 w-5 shrink-0" />
              <span>Manage Users</span>
            </Link>
            <Link
              to='/admin/files'
              className={cn(
                "flex items-center gap-4 px-5 py-3 w-full rounded-md hover:bg-accent text-base font-medium",
                location.pathname === '/admin/files' && "bg-accent"
              )}
            >
              <Files className="h-5 w-5 shrink-0" />
              <span>Manage Files</span>
            </Link>
          </div>
        )}
      </nav>
    </div>
  );
}

export default Sidebar; 