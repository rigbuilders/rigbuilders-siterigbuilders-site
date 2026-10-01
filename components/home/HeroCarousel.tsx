"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { supabase } from "@/lib/supabaseClient";
import {
  HeroSlide, DEFAULT_SLIDE, ASPECT_CLASS, normalizeSlide, TextAlign,
} from "@/lib/hero";

const EASE = [0.22, 1, 0.36, 1] as const;
const AUTOPLAY_MS = 6000;

const alignBlock: Record<TextAlign, string> = {
  left: "items-start text-left",
  center: "items-center text-center",
  right: "items-end text-right",
};
const alignRow: Record<TextAlign, string> = {
  left: "justify-start",
  center: "justify-center",
  right: "justify-end",
};
const alignSelf: Record<TextAlign, string> = {
  left: "lg:mr-auto",
  center: "mx-auto",
  right: "lg:ml-auto",
};

/* ── one slide's text block (with per-slide entrance motion) ── */
function TextBlock({ slide, reduce }: { slide: HeroSlide; reduce: boolean | null }) {
  const a = slide.text_align;
  const ctas = [
    { label: slide.cta1_label, link: slide.cta1_link, style: slide.cta1_style },
    { label: slide.cta2_label, link: slide.cta2_link, style: slide.cta2_style },
  ].filter((c) => c.label && c.link);

  return (
    <div className={`flex flex-col ${alignBlock[a]}`}>
      {slide.eyebrow && (
        <motion.p
          className="font-orbitron uppercase tracking-[0.32em] text-rb-silver text-xs sm:text-sm md:text-base mb-3 md:mb-4"
          initial={reduce ? { opacity: 1 } : { scale: 1.7, filter: "blur(6px)", opacity: 0 }}
          animate={{ scale: 1, filter: "blur(0px)", opacity: 1 }}
          transition={{ duration: 0.7, ease: EASE }}
        >
          {slide.eyebrow}
        </motion.p>
      )}

      <motion.h1
        className="font-orbitron font-black uppercase leading-[0.9] text-rb-white text-5xl sm:text-6xl md:text-7xl"
        initial={reduce ? { opacity: 1 } : { opacity: 0, y: 22 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: reduce ? 0 : 0.15, duration: 0.7, ease: EASE }}
      >
        {slide.heading}
        {slide.heading_accent && (
          <>
            {" "}
            <span className="rb-text-ember bg-gradient-to-b from-rb-orange to-rb-orange-deep bg-clip-text text-transparent">
              {slide.heading_accent}
            </span>
          </>
        )}
      </motion.h1>

      {slide.subheading && (
        <motion.p
          className="mt-6 md:mt-8 font-saira text-rb-silver text-sm sm:text-base md:text-lg max-w-md leading-relaxed"
          initial={reduce ? { opacity: 1 } : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: reduce ? 0 : 0.3, duration: 0.6, ease: EASE }}
        >
          {slide.subheading}
        </motion.p>
      )}

      {ctas.length > 0 && (
        <motion.div
          className={`mt-10 flex flex-col sm:flex-row gap-4 w-full ${alignRow[a]} items-center`}
          initial={reduce ? { opacity: 1 } : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: reduce ? 0 : 0.42, duration: 0.6, ease: EASE }}
        >
          {ctas.map((c, i) => (
            <Link key={i} href={c.link!} className="w-full sm:w-auto">
              <button
                className={`rb-sheen w-full sm:w-auto px-9 py-4 uppercase tracking-widest text-sm ${
                  c.style === "primary" ? "rb-cta" : "rb-ghost font-saira font-bold"
                }`}
              >
                {c.label}
              </button>
            </Link>
          ))}
        </motion.div>
      )}
    </div>
  );
}

/* ── framed image for split layouts ── */
function FramedImage({ slide, src }: { slide: HeroSlide; src: string | null }) {
  if (!src) return null;
  return (
    <motion.div
      className="relative"
      initial={{ opacity: 0, x: slide.image_position === "left" ? -40 : 40 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.2, duration: 1, ease: EASE }}
    >
      <div className="absolute -inset-6 bg-rb-orange/15 blur-3xl rounded-[40px] pointer-events-none" />
      <div className="rb-float relative rounded-2xl overflow-hidden border border-rb-line shadow-[0_30px_80px_-30px_rgba(0,0,0,0.9)]">
        <div className={`relative w-full ${ASPECT_CLASS[slide.image_aspect]}`}>
          <Image src={src} alt={slide.heading || "Rig Builders"} fill priority className="object-cover" sizes="(max-width: 1024px) 100vw, 50vw" style={{ opacity: (slide.image_opacity ?? 100) / 100 }} />
          <div className="absolute inset-0 bg-gradient-to-t from-rb-black/70 via-transparent to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-tr from-rb-orange/10 via-transparent to-transparent mix-blend-screen" />
        </div>
      </div>
    </motion.div>
  );
}

/* Resolve which image to show for the current viewport. */
function pickSrc(slide: HeroSlide, isMobile: boolean): string | null {
  if (isMobile && slide.image_url_mobile) return slide.image_url_mobile;
  return slide.image_url;
}

/* ── one slide, laid out per its image_position ── */
function SlideView({ slide, reduce, isMobile }: { slide: HeroSlide; reduce: boolean | null; isMobile: boolean }) {
  // Background image is rendered full-bleed at the SECTION level (see below),
  // so here we only lay out the text over it.
  if (slide.image_position === "background") {
    return (
      <div className="relative min-h-[60vh] flex items-center">
        <div className={`w-full flex ${alignRow[slide.text_align]}`}>
          <div className={`w-full max-w-xl ${alignSelf[slide.text_align]}`}>
            <TextBlock slide={slide} reduce={reduce} />
          </div>
        </div>
      </div>
    );
  }

  // Split: text + framed image. image_position decides the order.
  const imageFirst = slide.image_position === "left";
  return (
    <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
      <div className={imageFirst ? "order-1 lg:order-2" : "order-1"}>
        <TextBlock slide={slide} reduce={reduce} />
      </div>
      <div className={imageFirst ? "order-2 lg:order-1" : "order-2"}>
        <FramedImage slide={slide} src={pickSrc(slide, isMobile)} />
      </div>
    </div>
  );
}

export default function HeroCarousel({
  location = "home",
  compact = false,
}: {
  location?: string;
  compact?: boolean;
}) {
  const reduce = useReducedMotion();
  const [slides, setSlides] = useState<HeroSlide[]>(location === "home" ? [DEFAULT_SLIDE] : []);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 640px)");
    const sync = () => setIsMobile(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    supabase
      .from("hero_slides")
      .select("*")
      .eq("active", true)
      .eq("location", location)
      .order("sort_order", { ascending: true })
      .then(({ data, error }) => {
        if (!error && data && data.length > 0) setSlides(data.map(normalizeSlide));
      });
  }, [location]);

  useEffect(() => {
    if (index > slides.length - 1) setIndex(0);
  }, [slides.length, index]);

  useEffect(() => {
    if (paused || slides.length <= 1) return;
    const t = setInterval(() => setIndex((i) => (i + 1) % slides.length), AUTOPLAY_MS);
    return () => clearInterval(t);
  }, [paused, slides.length]);

  const go = (i: number) => setIndex(((i % slides.length) + slides.length) % slides.length);

  // Non-home locations with no configured slides simply render nothing.
  if (slides.length === 0) return null;
  const slide = slides[Math.min(index, slides.length - 1)];

  return (
    <section
      className={`relative flex items-center overflow-hidden bg-rb-black pt-28 pb-20 ${compact ? "min-h-[70vh]" : "min-h-screen"}`}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* full-bleed background image for 'background' slides — spans the whole
          section edge-to-edge and starts at the very top (behind the navbar). */}
      <AnimatePresence>
        {slide.image_position === "background" && pickSrc(slide, isMobile) && (
          <motion.div
            key={slide.id + "-bg"}
            className="absolute inset-0 z-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: EASE }}
          >
            <Image
              src={pickSrc(slide, isMobile)!}
              alt=""
              fill
              priority
              sizes="100vw"
              className="object-cover"
              style={{ opacity: (slide.image_opacity ?? 100) / 100 }}
            />
            {/* legibility gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-rb-black via-rb-black/25 to-rb-black/55" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* constant premium background */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="rb-ember-pulse absolute top-[10%] left-[2%] w-[460px] h-[460px] max-w-[60vw] rounded-full"
             style={{ background: "radial-gradient(circle, rgba(255,90,31,0.12), transparent 66%)" }} />
        <div className="rb-dots absolute inset-0 opacity-30" />
      </div>

      {/* slides */}
      <div className="rb-shell relative z-10 w-full">
        <AnimatePresence mode="wait">
          <motion.div
            key={slide.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: EASE }}
            drag={slides.length > 1 ? "x" : false}
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.15}
            onDragEnd={(_e, info) => {
              if (info.offset.x < -80) go(index + 1);
              else if (info.offset.x > 80) go(index - 1);
            }}
          >
            <SlideView slide={slide} reduce={reduce} isMobile={isMobile} />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* arrows */}
      {slides.length > 1 && (
        <>
          <button
            aria-label="Previous slide"
            onClick={() => go(index - 1)}
            className="hidden md:flex absolute left-4 xl:left-8 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full items-center justify-center bg-rb-black/60 backdrop-blur-md text-rb-mist hover:text-rb-orange hover:bg-rb-black/80 transition-colors"
          >
            <FaChevronLeft size={14} />
          </button>
          <button
            aria-label="Next slide"
            onClick={() => go(index + 1)}
            className="hidden md:flex absolute right-4 xl:right-8 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full items-center justify-center bg-rb-black/60 backdrop-blur-md text-rb-mist hover:text-rb-orange hover:bg-rb-black/80 transition-colors"
          >
            <FaChevronRight size={14} />
          </button>

          {/* dots */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex gap-2.5">
            {slides.map((s, i) => (
              <button
                key={s.id}
                aria-label={`Go to slide ${i + 1}`}
                onClick={() => go(i)}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === index ? "w-8 bg-rb-orange" : "w-2.5 bg-white/25 hover:bg-white/50"
                }`}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
