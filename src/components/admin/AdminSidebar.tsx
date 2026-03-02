import { NavLink, useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  LayoutDashboard,
  FileText,
  Settings,
  Key,
  FileEdit,
  Search,
  Tags,
  Bot,
  MapIcon,
  ChevronDown,
} from "lucide-react";
import { useState } from "react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

const mainMenuItems = [
  { title: "Dashboard", url: "/admin", icon: LayoutDashboard },
  { title: "Oldal tartalmak", url: "/admin/pages", icon: FileEdit },
  { title: "Hírek", url: "/admin/news", icon: FileText },
  { title: "API Kulcsok", url: "/admin/api-settings", icon: Key },
  { title: "Beállítások", url: "/admin/settings", icon: Settings },
];

const seoMenuItems = [
  { title: "Meta címkék", url: "/admin/seo/meta-tags", icon: Tags },
  { title: "Robots.txt", url: "/admin/seo/robots", icon: Bot },
  { title: "Sitemap", url: "/admin/seo/sitemap", icon: MapIcon },
];

export function AdminSidebar() {
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";
  const location = useLocation();
  const isSeoActive = location.pathname.startsWith("/admin/seo");
  const [seoOpen, setSeoOpen] = useState(isSeoActive);

  return (
    <Sidebar collapsible="icon" className="border-r border-border">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/70">Menü</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainMenuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.url === "/admin"}
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                          isActive
                            ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                            : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                        }`
                      }
                    >
                      <item.icon className="h-5 w-5" />
                      {!isCollapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}

              {/* SEO Submenu */}
              <SidebarMenuItem>
                <Collapsible open={seoOpen} onOpenChange={setSeoOpen}>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton
                      className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors w-full ${
                        isSeoActive
                          ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                          : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                      }`}
                    >
                      <Search className="h-5 w-5" />
                      {!isCollapsed && (
                        <>
                          <span className="flex-1 text-left">SEO eszközök</span>
                          <ChevronDown className={`h-4 w-4 transition-transform ${seoOpen ? "rotate-180" : ""}`} />
                        </>
                      )}
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  {!isCollapsed && (
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        {seoMenuItems.map((item) => (
                          <SidebarMenuSubItem key={item.title}>
                            <SidebarMenuSubButton asChild>
                              <NavLink
                                to={item.url}
                                className={({ isActive }) =>
                                  `flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors ${
                                    isActive
                                      ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                                      : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                                  }`
                                }
                              >
                                <item.icon className="h-4 w-4" />
                                <span>{item.title}</span>
                              </NavLink>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        ))}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  )}
                </Collapsible>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
