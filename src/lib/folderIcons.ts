/**
 * Folder icon registry.
 *
 * Kept out of `FolderModal.tsx` so that file only exports components: mixing
 * a helper into a component module breaks Vite's fast refresh.
 */

import type { ComponentType } from 'react';
import {
  Folder,
  MessageSquare,
  Bot,
  Lightbulb,
  Wrench,
  FileText,
  Target,
  Rocket,
  Monitor,
  FlaskConical,
  BarChart3,
  Palette,
  BookOpen,
  Star,
  Lock,
  Globe,
  Pin,
  FolderArchive,
  Zap,
  Home,
  Gamepad2,
  TrendingUp,
  Hammer,
  Code,
  Heart,
  Music,
  Camera,
  ShoppingCart,
  Briefcase,
  GraduationCap,
  Plane,
  Coffee,
  type LucideProps,
} from 'lucide-react';

export interface IconOption {
  name: string;
  Icon: ComponentType<LucideProps>;
}

export const ICON_OPTIONS: IconOption[] = [
  { name: 'folder', Icon: Folder },
  { name: 'message', Icon: MessageSquare },
  { name: 'bot', Icon: Bot },
  { name: 'lightbulb', Icon: Lightbulb },
  { name: 'wrench', Icon: Wrench },
  { name: 'file-text', Icon: FileText },
  { name: 'target', Icon: Target },
  { name: 'rocket', Icon: Rocket },
  { name: 'monitor', Icon: Monitor },
  { name: 'flask', Icon: FlaskConical },
  { name: 'chart', Icon: BarChart3 },
  { name: 'palette', Icon: Palette },
  { name: 'book', Icon: BookOpen },
  { name: 'star', Icon: Star },
  { name: 'lock', Icon: Lock },
  { name: 'globe', Icon: Globe },
  { name: 'pin', Icon: Pin },
  { name: 'archive', Icon: FolderArchive },
  { name: 'zap', Icon: Zap },
  { name: 'home', Icon: Home },
  { name: 'gamepad', Icon: Gamepad2 },
  { name: 'trending', Icon: TrendingUp },
  { name: 'hammer', Icon: Hammer },
  { name: 'code', Icon: Code },
  { name: 'heart', Icon: Heart },
  { name: 'music', Icon: Music },
  { name: 'camera', Icon: Camera },
  { name: 'cart', Icon: ShoppingCart },
  { name: 'briefcase', Icon: Briefcase },
  { name: 'graduation', Icon: GraduationCap },
  { name: 'plane', Icon: Plane },
  { name: 'coffee', Icon: Coffee },
];

/** Lookup a Lucide icon component by its stored name. Falls back to Folder. */
export function getFolderIcon(iconName: string): ComponentType<LucideProps> {
  return ICON_OPTIONS.find((o) => o.name === iconName)?.Icon ?? Folder;
}
