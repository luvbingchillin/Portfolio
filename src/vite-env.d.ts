/// <reference types="vite/client" />

declare module 'lucide-react' {
  import type { FC, SVGProps } from 'react';
  export interface IconProps extends SVGProps<SVGSVGElement> {
    size?: number | string;
    strokeWidth?: number | string;
    color?: string;
  }
  export const BookOpen: FC<IconProps>;
  export const RotateCw: FC<IconProps>;
  export const ChevronLeft: FC<IconProps>;
  export const ChevronRight: FC<IconProps>;
  export const ExternalLink: FC<IconProps>;
  export const Github: FC<IconProps>;
  export const Compass: FC<IconProps>;
  export const Library: FC<IconProps>;
  export const Clock: FC<IconProps>;
  export const Layers: FC<IconProps>;
  export const Award: FC<IconProps>;
  export const X: FC<IconProps>;
}
