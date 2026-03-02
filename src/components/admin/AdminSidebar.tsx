import { NavLink } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  LayoutDashboard,
  FileText,
  Settings,
  FileEdit,
  FolderKanban,
  Images,
  Folders,
  UsersRound,
  MapPin,
  HardDrive,
  ScrollText,
  Bug,
  Mail,
  Users,
  Globe,
} from "lucide-react";

const menuItems = [
  {
    title: "Dashboard",
    url: "/admin",
    icon: LayoutDashboard,
  },
  {
    title: "Oldal tartalmak",
    url: "/admin/pages",
    icon: FileEdit,
  },
  {
    title: "Térkép szerkesztő",
    url: "/admin/map-editor",
    icon: MapPin,
    dividerAfter: true,
  },
  {
    title: "Régiók",
    url: "/admin/regions",
    icon: MapPin,
  },
  {
    title: "Hírek",
    url: "/admin/news",
    icon: FileText,
  },
  {
    title: "Hírlevél",
    url: "/admin/newsletter",
    icon: Mail,
  },
  {
    title: "Csapat",
    url: "/admin/tagok",
    icon: Users,
  },
  {
    title: "Projektek",
    url: "/admin/projects",
    icon: FolderKanban,
  },
  {
    title: "Galéria",
    url: "/admin/gallery",
    icon: Images,
  },
  {
    title: "Dokumentumok",
    url: "/admin/documents",
    icon: ScrollText,
    dividerAfter: true,
  },
  {
    title: "Fájlkezelő",
    url: "/admin/file-manager",
    icon: HardDrive,
  },
  {
    title: "Médiatár",
    url: "/admin/media",
    icon: Folders,
    dividerAfter: true,
  },
  {
    title: "Felhasználók",
    url: "/admin/users",
    icon: UsersRound,
  },
  {
    title: "Hibajelentő",
    url: "/admin/bugreport",
    icon: Bug,
  },
  {
    title: "Lábléc",
    url: "/admin/footer-content",
    icon: ScrollText,
  },
  {
    title: "SEO eszközök",
    url: "/admin/seo-tools",
    icon: Globe,
  },
  {
    title: "Beállítások",
    url: "/admin/settings",
    icon: Settings,
  },
];

export function AdminSidebar() {
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

  return (
    <Sidebar collapsible="icon" className="border-r border-border">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/70">Menü</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <div key={item.title}>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to={item.url}
                        end={item.url === "/admin"}
                        className={({ isActive }) =>
                          `flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${isActive
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
                  {item.dividerAfter && <hr className="my-2 border-border" />}
                </div>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
