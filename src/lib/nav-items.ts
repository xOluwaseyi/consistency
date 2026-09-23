import { CalendarDays, ListChecks, BarChart3, Settings } from "lucide-react";

export const NAV_ITEMS = [
  { href: "/today", label: "Today", icon: ListChecks },
  { href: "/week", label: "Week", icon: CalendarDays },
  { href: "/overview", label: "Overview", icon: BarChart3 },
  { href: "/settings", label: "Settings", icon: Settings },
];
