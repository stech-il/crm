import {
  Users,
  UserCircle,
  Building2,
  Package,
  FileText,
  Calendar,
  ShoppingCart,
  Briefcase,
  Award,
  Heart,
  Star,
  Layers,
  Folder,
  type LucideIcon,
} from "lucide-react";

export const ENTITY_ICONS: { value: string; label: string; Icon: LucideIcon }[] = [
  { value: "Users", label: "אנשים", Icon: Users },
  { value: "UserCircle", label: "איש קשר", Icon: UserCircle },
  { value: "Building2", label: "חברה", Icon: Building2 },
  { value: "Package", label: "מוצר", Icon: Package },
  { value: "FileText", label: "מסמך", Icon: FileText },
  { value: "Calendar", label: "תאריך", Icon: Calendar },
  { value: "ShoppingCart", label: "הזמנה", Icon: ShoppingCart },
  { value: "Briefcase", label: "עסקה", Icon: Briefcase },
  { value: "Award", label: "אישור", Icon: Award },
  { value: "Heart", label: "פרויקט", Icon: Heart },
  { value: "Star", label: "מועדף", Icon: Star },
  { value: "Layers", label: "כללי", Icon: Layers },
  { value: "Folder", label: "תיקייה", Icon: Folder },
];

const iconMap: Record<string, LucideIcon> = Object.fromEntries(
  ENTITY_ICONS.map((e) => [e.value, e.Icon])
);

export function getEntityIcon(iconName: string | null | undefined): LucideIcon {
  if (iconName && iconName in iconMap) return iconMap[iconName];
  return Layers;
}
