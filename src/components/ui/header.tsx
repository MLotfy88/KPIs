import * as React from "react";
import { useSidebar, SidebarTrigger } from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { LogOut, User } from "lucide-react";
import { Notifications } from "@/components/common/Notifications";
import { useAuth } from "@/contexts/AuthContext";

const Header: React.FC = () => {
  const { isMobile } = useSidebar();
  const { user, logout } = useAuth();

  const userInitials = user?.name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U';
  const avatarUrl = `https://api.dicebear.com/8.x/adventurer/svg?seed=${user?.email || 'default'}`;

  return (
    <header className="w-full p-4 bg-white border-b dark:bg-gray-800">
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center gap-2">
          <SidebarTrigger />
          {/* Breadcrumbs or page title can go here */}
        </div>
        <div className="flex items-center gap-4">
          <Notifications />
          <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative w-8 h-8 rounded-full">
              <Avatar>
                <AvatarImage src={avatarUrl} alt={user?.name || 'User Avatar'} />
                <AvatarFallback>{userInitials}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>{user?.name || 'My Account'}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <User className="w-4 h-4 mr-2" />
              <span>Profile</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={logout}>
              <LogOut className="w-4 h-4 mr-2" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        </div>
      </div>
    </header>
  );
};

export { Header };
