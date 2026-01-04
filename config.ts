/**
 * Tasks Module Configuration
 * Defines routes, navigation items, and metadata for the Tasks module
 */

import {
  SquareCheck,
  ListTodo,
  Briefcase,
  MapPin,
  Calendar,
  Settings,
} from "lucide-svelte";
import type { ModuleConfig } from "$lib/config/types";
export const tasksConfig: ModuleConfig = {
  id: "MoLOS-Tasks",
  name: "Tasks",
  href: "/ui/MoLOS-Tasks",
  icon: SquareCheck,
  description: "Task management and project tracking",
  navigation: [
    {
      name: "Dashboard",
      icon: ListTodo,
      href: "/ui/MoLOS-Tasks/dashboard",
    },
    {
      name: "My Tasks",
      icon: SquareCheck,
      href: "/ui/MoLOS-Tasks/my",
    },
    {
      name: "Projects",
      icon: Briefcase,
      href: "/ui/MoLOS-Tasks/projects",
    },
    {
      name: "Areas",
      icon: MapPin,
      href: "/ui/MoLOS-Tasks/areas",
    },
    {
      name: "Daily Log",
      icon: Calendar,
      href: "/ui/MoLOS-Tasks/daily-log",
    },
    {
      name: "Settings",
      icon: Settings,
      href: "/ui/MoLOS-Tasks/settings",
    },
  ],
};

export const moduleConfig = tasksConfig;
export default tasksConfig;
