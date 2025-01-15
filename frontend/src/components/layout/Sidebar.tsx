import { Users } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import {
  Sidebar as ShadcnSidebar,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar';

const Sidebar = () => {
  const { user, hasPermission } = useAuth();
  
  return (
    <ShadcnSidebar>
      <SidebarContent>
        <SidebarMenu>
          {hasPermission('manage_users') && (
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={false} tooltip="User Management">
                <a href="/dashboard/users">
                  <Users className="h-4 w-4" />
                  <span>User Management</span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )}
        </SidebarMenu>
      </SidebarContent>
    </ShadcnSidebar>
  );
};

export default Sidebar; 