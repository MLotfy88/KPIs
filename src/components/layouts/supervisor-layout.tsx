import * as React from "react";
import { NavLink, Outlet } from "react-router-dom";
import { 
  Sidebar, 
  SidebarHeader, 
  SidebarContent, 
  SidebarMenu, 
  SidebarMenuItem, 
  SidebarMenuButton 
} from "@/components/ui/sidebar";
import { Header } from "@/components/ui/header";
import { Home, Edit, List, Library } from "lucide-react";

const SupervisorLayout: React.FC = () => {
  const navLinks = [
    { href: "/supervisor/dashboard", label: "لوحة التحكم", icon: <Home /> },
    { href: "/supervisor/evaluate", label: "تقييم جديد", icon: <Edit /> },
    { href: "/supervisor/history", label: "سجل التقييمات", icon: <List /> },
    { href: "/all-badges", label: "مكتبة الشارات", icon: <Library /> },
  ];

  return (
    <div className="flex min-h-screen">
      <Sidebar>
        <SidebarHeader>
          <h1 className="text-2xl font-bold text-center">أداء</h1>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            {navLinks.map((link) => (
              <SidebarMenuItem key={link.href}>
                <NavLink to={link.href}>
                  {({ isActive }) => (
                    <SidebarMenuButton isActive={isActive}>
                      {link.icon}
                      <span>{link.label}</span>
                    </SidebarMenuButton>
                  )}
                </NavLink>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>
      </Sidebar>
      <div className="flex-1">
        <Header />
        <main className="p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export { SupervisorLayout };
