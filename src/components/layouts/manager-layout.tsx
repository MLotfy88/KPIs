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
  
  const leaderboardLink = { href: "/manager/leaderboard", label: "لوحة الدرجات", icon: <BarChart2 /> };
  
  const navLinks = [
    { href: "/manager/dashboard", label: "لوحة تحكم المدير", icon: <Home /> },
    { href: "/manager/evaluate", label: "إجراء تقييم", icon: <ClipboardEdit /> },
    { href: "/manager/history", label: "سجل التقييمات", icon: <History /> },
    { href: "/manager/nurses", label: "فريق التمريض", icon: <Users /> },
    { href: "/manager/supervisors", label: "إدارة المشرفين", icon: <UserCog /> },
    { href: "/manager/audits", label: "المراجعات العشوائية", icon: <FileCheck /> },
    { href: "/manager/reports", label: "التقارير", icon: <BarChart2 /> },
    { href: "/manager/badges", label: "إدارة الشارات", icon: <Award /> },
    { href: "/manager/evaluation-items", label: "بنود التقييم", icon: <ClipboardEdit /> },
    { href: "/all-badges", label: "مكتبة الشارات", icon: <Library /> },
  ];

  return (
    <div className="flex min-h-screen">
      <Sidebar>
        <SidebarHeader>
          <h1 className="text-2xl font-bold text-center">Nursing KPIs</h1>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            <SidebarMenuItem onClick={() => setOpenMobile(false)}>
              <NavLink to={leaderboardLink.href}>
                {({ isActive }) => (
                  <SidebarMenuButton 
                    isActive={isActive} 
                    className="bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground data-[active=true]:bg-primary/90 data-[active=true]:text-primary-foreground"
                  >
                    {leaderboardLink.icon}
                    <span>{leaderboardLink.label}</span>
                  </SidebarMenuButton>
                )}
              </NavLink>
            </SidebarMenuItem>

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
        <main className="flex-1 flex flex-col p-4 sm:p-6 md:p-8 w-full">
          <div className="w-full flex-grow flex flex-col">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export { ManagerLayout };
