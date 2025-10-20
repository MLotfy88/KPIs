import * as React from "react";
import { NavLink, Outlet } from "react-router-dom";
import { 
  Sidebar, 
  SidebarHeader, 
  SidebarContent, 
  SidebarMenu, 
  SidebarMenuItem, 
  SidebarMenuButton,
  useSidebar
} from "@/components/ui/sidebar";
import { Header } from "@/components/ui/header";
import { Home, Edit, List, Library } from "lucide-react";

const SupervisorLayout: React.FC = () => {
  const { setOpenMobile } = useSidebar();
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
              <SidebarMenuItem key={link.href} onClick={() => setOpenMobile(false)}>
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
      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        <main className="flex-1 flex flex-col p-4 sm:p-6 md:p-8">
          <div className="max-w-7xl mx-auto w-full flex-grow flex">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export { SupervisorLayout };
