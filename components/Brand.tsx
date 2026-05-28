type BrandProps = {
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'hero';
  tone?: 'gold' | 'ink' | 'cream';
  href?: string;
};

const SIZES: Record<NonNullable<BrandProps['size']>, { medad: string; tahdir: string; gap: string }> = {
  sm:   { medad: 'text-2xl',           tahdir: 'text-[0.7rem]',  gap: 'mr-2' },
  md:   { medad: 'text-3xl',           tahdir: 'text-xs',        gap: 'mr-2' },
  lg:   { medad: 'text-5xl',           tahdir: 'text-sm',        gap: 'mr-3' },
  xl:   { medad: 'text-7xl',           tahdir: 'text-base',      gap: 'mr-4' },
  hero: { medad: 'text-[clamp(4rem,15vw,11rem)]', tahdir: 'text-[clamp(0.9rem,1.6vw,1.4rem)]', gap: 'mr-5' }
};

const TONES: Record<NonNullable<BrandProps['tone']>, { medad: string; tahdir: string }> = {
  gold:  { medad: 'text-[#B8860B]', tahdir: 'text-ink-500' },
  ink:   { medad: 'text-ink-900',   tahdir: 'text-ink-500' },
  cream: { medad: 'text-cream-100', tahdir: 'text-ink-300' }
};

export default function Brand({ size = 'md', tone = 'gold', href }: BrandProps) {
  const s = SIZES[size];
  const t = TONES[tone];

  const inner = (
    <span className="inline-flex items-baseline leading-none select-none" aria-label="مداد تحضير">
      <span
        className={`font-display font-black ${s.medad} ${t.medad} whitespace-nowrap`}
        style={{ lineHeight: 1, letterSpacing: 0 }}
      >
        مـــــداد
      </span>
      <span
        className={`font-body font-medium ${s.tahdir} ${t.tahdir} ${s.gap}`}
        style={{ letterSpacing: 0 }}
      >
        تحضير
      </span>
    </span>
  );

  if (href) return <a href={href} className="inline-block">{inner}</a>;
  return inner;
}
