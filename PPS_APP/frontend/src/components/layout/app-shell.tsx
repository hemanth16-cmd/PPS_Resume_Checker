import * as DialogPrimitive from "@radix-ui/react-dialog";
import {
  BookOpen,
  ChevronsUpDown,
  ClipboardCheck,
  FlaskConical,
  GitCompareArrows,
  GraduationCap,
  History,
  Laptop,
  Layers,
  LayoutDashboard,
  Menu,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  ScanSearch,
  Settings,
  Sun,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useState, type ReactNode } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { Logo } from "@/components/brand";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Tooltip,
} from "@/components/ui/overlays";
import { Badge } from "@/components/ui/primitives";
import { useStore, type Role, type Theme } from "@/lib/store";
import { cn } from "@/lib/utils";
import { scanner } from "@/services/scanner";

interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  end?: boolean;
}

const NAV: Record<Role, { group: string; items: NavItem[] }[]> = {
  student: [
    {
      group: "Workspace",
      items: [
        { to: "/", label: "Dashboard", icon: LayoutDashboard, end: true },
        { to: "/scan", label: "Resume scanner", icon: ScanSearch },
        { to: "/history", label: "History", icon: History },
        { to: "/compare", label: "Compare", icon: GitCompareArrows },
      ],
    },
    { group: "Learn", items: [{ to: "/methodology", label: "How it works", icon: BookOpen }] },
  ],
  faculty: [
    {
      group: "Faculty",
      items: [
        { to: "/faculty", label: "Overview", icon: Users, end: true },
        { to: "/faculty/review", label: "Review desk", icon: ClipboardCheck },
        { to: "/batch", label: "Batch scanner", icon: Layers },
      ],
    },
    { group: "Learn", items: [{ to: "/methodology", label: "How it works", icon: BookOpen }] },
  ],
};

const HOME: Record<Role, string> = { student: "/", faculty: "/faculty" };

function NavItems({ role, collapsed, onNavigate }: { role: Role; collapsed: boolean; onNavigate?: () => void }) {
  return (
    <nav className="flex flex-col gap-6" aria-label="Main">
      {NAV[role].map((section) => (
        <div key={section.group}>
          {!collapsed && (
            <div className="mb-1.5 px-2.5 text-[11px] font-medium uppercase tracking-[0.12em] text-fg-subtle">{section.group}</div>
          )}
          <ul className="flex flex-col gap-0.5">
            {section.items.map((item) => {
              const link = (
                <NavLink
                  to={item.to}
                  end={item.end}
                  onClick={onNavigate}
                  className={({ isActive }) =>
                    cn(
                      "group relative flex h-9 items-center gap-3 rounded-md px-2.5 text-sm font-medium transition-colors",
                      isActive ? "bg-surface text-fg shadow-xs ring-1 ring-border" : "text-fg-muted hover:bg-bg-subtle hover:text-fg",
                      collapsed && "justify-center px-0",
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      <item.icon className={cn("size-[18px] shrink-0", isActive ? "text-primary" : "text-fg-subtle group-hover:text-fg-muted")} />
                      {!collapsed && <span className="truncate">{item.label}</span>}
                    </>
                  )}
                </NavLink>
              );
              return (
                <li key={item.to}>
                  {collapsed ? (
                    <Tooltip content={item.label} side="right">
                      {link}
                    </Tooltip>
                  ) : (
                    link
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

function ProfileMenu({ collapsed }: { collapsed: boolean }) {
  const { user, role, setRole } = useStore();
  const navigate = useNavigate();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className={cn(
            "flex w-full items-center gap-2.5 rounded-lg p-2 text-left transition hover:bg-bg-subtle",
            collapsed && "justify-center",
          )}
          aria-label="Account menu"
        >
          <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent text-xs font-semibold text-white">
            {user.initials}
          </span>
          {!collapsed && (
            <>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium">{user.name}</span>
                <span className="block truncate text-xs text-fg-subtle">{role === "student" ? "Student" : "Faculty"} · demo</span>
              </span>
              <ChevronsUpDown className="size-4 text-fg-subtle" />
            </>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent side="top" align="start" className="w-60">
        <DropdownMenuLabel>
          {user.email}
          <span className="mt-0.5 block font-normal">Demo identity — sign-in arrives with the auth API.</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuLabel>View as</DropdownMenuLabel>
        <DropdownMenuRadioGroup
          value={role}
          onValueChange={(v) => {
            setRole(v as Role);
            navigate(HOME[v as Role]);
          }}
        >
          <DropdownMenuRadioItem value="student">
            <GraduationCap /> Student
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="faculty">
            <Users /> Faculty
          </DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => navigate("/settings")}>
          <Settings /> Settings
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function ThemeMenu() {
  const { theme, setTheme } = useStore();
  const Icon = theme === "dark" ? Moon : theme === "light" ? Sun : Laptop;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon-sm" aria-label="Change theme">
          <Icon />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-40">
        <DropdownMenuRadioGroup value={theme} onValueChange={(v) => setTheme(v as Theme)}>
          <DropdownMenuRadioItem value="light"><Sun /> Light</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="dark"><Moon /> Dark</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="system"><Laptop /> System</DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function ModeBadge() {
  return scanner.mode === "live" ? (
    <Badge tone="success">
      <span className="size-1.5 rounded-full bg-success" /> Live scanner
    </Badge>
  ) : (
    <Tooltip content="No scanner API is configured. Scan results are labelled sample data. Set VITE_SCANNER_API_URL to connect.">
      <Badge tone="demo" tabIndex={0}>
        <FlaskConical /> Demo mode
      </Badge>
    </Tooltip>
  );
}

function SidebarFooter({ collapsed, onNavigate }: { collapsed: boolean; onNavigate?: () => void }) {
  const link = (
    <NavLink
      to="/settings"
      onClick={onNavigate}
      className={({ isActive }) =>
        cn(
          "flex h-9 items-center gap-3 rounded-md px-2.5 text-sm font-medium transition-colors",
          isActive ? "bg-surface text-fg shadow-xs ring-1 ring-border" : "text-fg-muted hover:bg-bg-subtle hover:text-fg",
          collapsed && "justify-center px-0",
        )
      }
    >
      <Settings className="size-[18px] text-fg-subtle" />
      {!collapsed && "Settings"}
    </NavLink>
  );
  return (
    <div className="flex flex-col gap-2 border-t border-border pt-3">
      {collapsed ? <Tooltip content="Settings" side="right">{link}</Tooltip> : link}
      <ProfileMenu collapsed={collapsed} />
    </div>
  );
}

export function AppShell() {
  const { role } = useStore();
  const location = useLocation();
  const reduce = useReducedMotion();
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem("pps-sidebar") === "collapsed";
    } catch {
      return false;
    }
  });
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem("pps-sidebar", collapsed ? "collapsed" : "open");
    } catch {
      /* ignore */
    }
  }, [collapsed]);

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [location.pathname]);

  return (
    <div className="flex min-h-dvh">
      {/* Desktop sidebar */}
      <motion.aside
        animate={{ width: collapsed ? 68 : 248 }}
        transition={{ duration: reduce ? 0 : 0.22, ease: [0.22, 1, 0.36, 1] }}
        className="sticky top-0 hidden h-dvh shrink-0 flex-col border-r border-border bg-bg-subtle/60 px-3 pb-3 pt-4 backdrop-blur lg:flex"
      >
        <div className={cn("mb-7 flex items-center justify-between px-1", collapsed && "flex-col gap-3 px-0")}>
          <NavLink to={HOME[role]} aria-label="PPS home">
            <Logo collapsed={collapsed} />
          </NavLink>
          <Tooltip content={collapsed ? "Expand sidebar" : "Collapse sidebar"} side="right">
            <Button variant="ghost" size="icon-sm" onClick={() => setCollapsed((c) => !c)} aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}>
              {collapsed ? <PanelLeftOpen /> : <PanelLeftClose />}
            </Button>
          </Tooltip>
        </div>
        <div className="flex-1 overflow-y-auto">
          <NavItems role={role} collapsed={collapsed} />
        </div>
        <SidebarFooter collapsed={collapsed} />
      </motion.aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top bar */}
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-bg/80 px-4 backdrop-blur-md sm:px-6 lg:px-10">
          <DialogPrimitive.Root open={mobileOpen} onOpenChange={setMobileOpen}>
            <DialogPrimitive.Trigger asChild>
              <Button variant="ghost" size="icon-sm" className="lg:hidden" aria-label="Open navigation">
                <Menu />
              </Button>
            </DialogPrimitive.Trigger>
            <MobileNav role={role} onClose={() => setMobileOpen(false)} />
          </DialogPrimitive.Root>
          <NavLink to={HOME[role]} className="lg:hidden" aria-label="PPS home">
            <Logo />
          </NavLink>
          <div className="ml-auto flex items-center gap-2">
            <ModeBadge />
            <ThemeMenu />
          </div>
        </header>

        <main className="relative flex-1">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={location.pathname}
              initial={reduce ? false : { opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduce ? undefined : { opacity: 0, y: -4 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}

function MobileNav({ role, onClose }: { role: Role; onClose: () => void }): ReactNode {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px] lg:hidden" />
      <DialogPrimitive.Content
        className="fixed inset-y-0 left-0 z-50 flex w-[84%] max-w-[300px] flex-col border-r border-border bg-bg px-3 pb-3 pt-4 shadow-lg outline-none lg:hidden"
        aria-describedby={undefined}
      >
        <DialogPrimitive.Title className="sr-only">Navigation</DialogPrimitive.Title>
        <div className="mb-7 flex items-center justify-between px-1">
          <Logo />
          <DialogPrimitive.Close asChild>
            <Button variant="ghost" size="icon-sm" aria-label="Close navigation">
              <X />
            </Button>
          </DialogPrimitive.Close>
        </div>
        <div className="flex-1 overflow-y-auto">
          <NavItems role={role} collapsed={false} onNavigate={onClose} />
        </div>
        <SidebarFooter collapsed={false} onNavigate={onClose} />
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}
