// Shared hero-slide types + the default (fallback) slide.
// Used by both the homepage carousel and the admin editor.

export type TextAlign = "left" | "center" | "right";
export type ImagePosition = "left" | "right" | "background";
export type ImageAspect = "portrait" | "landscape" | "square";
export type CtaStyle = "primary" | "secondary";
export type TextSize = "sm" | "md" | "lg" | "xl";

export interface HeroSlide {
  id: string;
  sort_order: number;
  active: boolean;
  eyebrow: string | null;
  heading: string;
  heading_accent: string | null;
  subheading: string | null;
  text_align: TextAlign;
  text_size: TextSize; // heading scale
  image_url: string | null;
  image_url_mobile: string | null; // optional separate image for phones
  image_position: ImagePosition;
  image_aspect: ImageAspect;
  image_opacity: number; // 0..100
  location: string; // which page's carousel
  cta1_label: string | null;
  cta1_link: string | null;
  cta1_style: CtaStyle;
  cta2_label: string | null;
  cta2_link: string | null;
  cta2_style: CtaStyle;
}

// Rendered if the DB is empty/unreachable so the hero never breaks.
export const DEFAULT_SLIDE: HeroSlide = {
  id: "default",
  sort_order: 0,
  active: true,
  eyebrow: "Welcome to",
  heading: "RIG",
  heading_accent: "BUILDERS",
  subheading:
    "Commissioned. Not assembled. Precision custom PCs — built and proven for exactly how you play, create and work.",
  text_align: "left",
  text_size: "lg",
  image_url: "/images/homepage/hero/1.jpg",
  image_url_mobile: null,
  image_position: "right",
  image_aspect: "portrait",
  image_opacity: 100,
  location: "home",
  cta1_label: "Build Your Rig",
  cta1_link: "/configure",
  cta1_style: "primary",
  cta2_label: "Explore Rigs",
  cta2_link: "/products",
  cta2_style: "secondary",
};

export const ASPECT_CLASS: Record<ImageAspect, string> = {
  portrait: "aspect-[4/5]",
  landscape: "aspect-[16/9]",
  square: "aspect-square",
};

// Heading scale per text_size (mobile → desktop).
export const HEADING_SIZE_CLASS: Record<TextSize, string> = {
  sm: "text-3xl sm:text-4xl md:text-5xl",
  md: "text-4xl sm:text-5xl md:text-6xl",
  lg: "text-5xl sm:text-6xl md:text-7xl",
  xl: "text-6xl sm:text-7xl md:text-8xl",
};

// Normalises a raw DB row into a fully-typed HeroSlide (fills gaps).
export function normalizeSlide(row: any): HeroSlide {
  return {
    id: String(row.id),
    sort_order: row.sort_order ?? 0,
    active: row.active ?? true,
    eyebrow: row.eyebrow ?? null,
    heading: row.heading ?? "",
    heading_accent: row.heading_accent ?? null,
    subheading: row.subheading ?? null,
    text_align: (row.text_align as TextAlign) || "left",
    text_size: (row.text_size as TextSize) || "lg",
    image_url: row.image_url ?? null,
    image_url_mobile: row.image_url_mobile ?? null,
    image_position: (row.image_position as ImagePosition) || "right",
    image_aspect: (row.image_aspect as ImageAspect) || "portrait",
    image_opacity: typeof row.image_opacity === "number" ? row.image_opacity : 100,
    location: row.location ?? "home",
    cta1_label: row.cta1_label ?? null,
    cta1_link: row.cta1_link ?? null,
    cta1_style: (row.cta1_style as CtaStyle) || "primary",
    cta2_label: row.cta2_label ?? null,
    cta2_link: row.cta2_link ?? null,
    cta2_style: (row.cta2_style as CtaStyle) || "secondary",
  };
}
