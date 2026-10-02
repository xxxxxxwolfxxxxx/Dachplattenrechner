import { z } from 'astro/zod';

export const PHASEN = ['planung', 'vorbereitung', 'unterbau', 'eindeckung', 'details', 'pflege'] as const;
export const GEWERKE = ['blechdach'] as const;

export type Phase = (typeof PHASEN)[number];
export type Gewerk = (typeof GEWERKE)[number];

const link = z.object({
  titel: z.string().min(1),
  href: z.string().regex(/^(\/|https:\/\/)/, 'Link muss mit / oder https:// beginnen'),
});

const schritt = z
  .object({
    titel: z.string().min(3),
    text: z.string().min(10),
    bild: z.string().regex(/^\/ratgeber\/(svg|fotos)\//).optional(),
    alt: z.string().min(10).optional(),
  })
  .refine((s) => !s.bild || !!s.alt, { message: 'Ein Bild braucht einen alt-Text', path: ['alt'] });

export const ratgeberSchema = z.object({
  titel: z.string().min(10).max(50),
  gewerk: z.enum(GEWERKE),
  phase: z.enum(PHASEN),
  reihenfolge: z.number().int().positive(),
  beschreibung: z.string().min(120).max(160),
  dauer: z.string().min(1),
  schwierigkeit: z.number().int().min(1).max(3),
  personen: z.number().int().min(1),
  wetter: z.string().min(1),
  werkzeug: z.array(z.string().min(1)).default([]),
  material: z.array(z.object({ name: z.string().min(1), menge: z.string().optional() })).default([]),
  sicherheit: z.string().min(20),
  schritte: z.array(schritt).min(3),
  typischeFehler: z.array(z.string().min(5)).min(1),
  rechner: z.array(link).default([]),
  verwandt: z.array(z.string()).default([]),
  quellen: z.array(link).default([]),
  titelbild: z.string().regex(/^\/ratgeber\/(svg|fotos)\//).optional(),
});

export type RatgeberDaten = z.infer<typeof ratgeberSchema>;
