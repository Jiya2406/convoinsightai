import {
  LayoutDashboard,
  MessageSquareCode,
  Bot,
  BookOpen,
  FlaskConical,
  History,
  ClipboardCheck,
  ShieldCheck,
  BarChart3,
  ThumbsUp,
  ScrollText,
  Bell,
  Settings,
  Boxes,
  type LucideIcon,
} from "lucide-react";
import type { Permission } from "@/lib/auth/rbac";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  /** Permission required to see the item. */
  permission: Permission;
  /** Not yet implemented — shown disabled with a "Soon" badge. */
  soon?: boolean;
}

export interface NavGroup {
  title: string;
  items: NavItem[];
}

/**
 * Sidebar navigation. Items are filtered by the user's permissions. Modules
 * not yet built (later phases) are flagged `soon` and rendered disabled so the
 * full product surface is visible without dead links.
 */
export const NAV_GROUPS: NavGroup[] = [
  {
    title: "Overview",
    items: [
      { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, permission: "dashboard:view" },
      { label: "Analytics", href: "/analytics", icon: BarChart3, permission: "analytics:view" },
    ],
  },
  {
    title: "Studio",
    items: [
      { label: "Playground", href: "/playground", icon: MessageSquareCode, permission: "playground:use" },
      { label: "Prompt Studio", href: "/prompt-studio", icon: FlaskConical, permission: "prompt:test" },
    ],
  },
  {
    title: "Manage",
    items: [
      { label: "Assistants", href: "/assistants", icon: Bot, permission: "dashboard:view" },
      { label: "Knowledge", href: "/knowledge", icon: BookOpen, permission: "dashboard:view" },
      { label: "Providers", href: "/providers", icon: Boxes, permission: "dashboard:view" },
    ],
  },
  {
    title: "Quality",
    items: [
      { label: "Evaluations", href: "/evaluations", icon: ClipboardCheck, permission: "dashboard:view" },
      { label: "Governance", href: "/governance", icon: ShieldCheck, permission: "governance:manage" },
      { label: "Feedback", href: "/feedback", icon: ThumbsUp, permission: "dashboard:view" },
    ],
  },
  {
    title: "Monitor",
    items: [
      { label: "Conversations", href: "/conversations", icon: History, permission: "dashboard:view" },
      { label: "Audit Logs", href: "/audit-logs", icon: ScrollText, permission: "audit:view" },
      { label: "Notifications", href: "/notifications", icon: Bell, permission: "dashboard:view" },
    ],
  },
  {
    title: "System",
    items: [
      { label: "Settings", href: "/settings", icon: Settings, permission: "settings:manage", soon: true },
    ],
  },
];
