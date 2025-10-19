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
import { Home, Users, BarChart2, FileCheck, UserCog, Award, Library, ClipboardEdit, History, LayoutDashboard } from "lucide-react";

const ManagerLayout: React.FC = () => {
  const { setOpenMobile } = useSidebar();
  const navLinks = [
    { href: "/manager/dashboard", label: "لوحة تحكم المدير", icon: <Home /> },
    { href: "/manager/evaluate", label: "إجراء تقييم", icon: <ClipboardEdit /> },
    { href: "/manager/history", label: "سجل التقييمات", icon: <History /> },
    { href: "/manager/nurses", label: "فريق التمريض", icon: <Users /> },
    { href: "/manager/supervisors", label: "إدارة المشرفين", icon: <UserCog /> },
    { href: "/manager/audits", label: "المراجعات العشوائية", icon: <FileCheck /> },
    { href: "/manager/reports", label: "التقارير", icon: <BarChart2 /> },
    { href: "/manager/leaderboard", label: "لوحة الدرجات", icon: <BarChart2 /> },
    { href: "/manager/badges", label: "إدارة الشارات", icon: <Award /> },
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
      <div className="flex-1">
        <Header />
        <main className="p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export { ManagerLayout };
