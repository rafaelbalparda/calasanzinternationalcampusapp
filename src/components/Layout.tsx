import { ReactNode, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import logo from "@/assets/logo_calasanz.png";
import {
  LayoutDashboard,
  FileText,
  CalendarDays,
  BookOpen,
  Info,
  Shield,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const studentLinks = [
  { to: "/dashboard", label: "Panel", icon: LayoutDashboard },
  { to: "/documents", label: "Documentación", icon: FileText },
  { to: "/weekly-reports", label: "Reportes Semanales", icon: CalendarDays },
  { to: "/memoria", label: "Memoria", icon: BookOpen },
  { to: "/guide", label: "Guía Erasmus+", icon: Info },
];

const adminLinks = [
  { to: "/admin", label: "Panel Admin", icon: Shield },
  { to: "/guide", label: "Guía Erasmus+", icon: Info },
];

export default function Layout({ children }: { children: ReactNode }) {
  const { profile, isAdmin, signOut } = useAuth();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const links = isAdmin ? adminLinks : studentLinks;

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Mobile header */}
      <header className="nav-gradient md:hidden flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <img src={logo} alt="Calasanz" className="h-8" />
          <span className="text-primary-foreground font-semibold text-sm">Erasmus+</span>
        </div>
        <button onClick={() => setMobileOpen(!mobileOpen)} className="text-primary-foreground">
          {mobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </header>

      {/* Sidebar */}
      <aside
        className={`nav-gradient w-full md:w-64 md:min-h-screen flex-shrink-0 ${
          mobileOpen ? "block" : "hidden md:block"
        }`}
      >
        <div className="hidden md:flex items-center gap-3 px-6 py-6 border-b border-sidebar-border">
          <img src={logo} alt="Calasanz Santurtzi" className="h-10 brightness-0 invert" />
        </div>
        <div className="px-4 py-3 md:py-4 border-b border-sidebar-border">
          <p className="text-sidebar-foreground/70 text-xs uppercase tracking-wider">
            {isAdmin ? "Administración" : "Alumno/a"}
          </p>
          {profile && (
            <p className="text-sidebar-foreground font-medium text-sm mt-1 truncate">
              {profile.name} {profile.surnames}
            </p>
          )}
        </div>
        <nav className="px-3 py-4 space-y-1">
          {links.map(({ to, label, icon: Icon }) => {
            const active = location.pathname === to;
            return (
              <Link
                key={to}
                to={to}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${
                  active
                    ? "bg-sidebar-accent text-sidebar-primary font-semibold"
                    : "text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                }`}
              >
                <Icon size={18} />
                {label}
              </Link>
            );
          })}
        </nav>
        <div className="px-3 mt-auto pb-6 absolute bottom-0 left-0 right-0 md:relative">
          <Button
            variant="ghost"
            onClick={signOut}
            className="w-full justify-start text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/50 gap-3"
          >
            <LogOut size={18} />
            Cerrar Sesión
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <div className="max-w-6xl mx-auto px-4 md:px-8 py-6 md:py-8">
          {children}
        </div>
      </main>
    </div>
  );
}
