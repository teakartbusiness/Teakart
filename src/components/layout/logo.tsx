import { cn } from '@/lib/utils'

interface Props {
  /** Tailwind classes for sizing (e.g. "h-9 w-auto"). Aspect ratio is ≈ 6.8:1. */
  className?: string
  /** Accessible label for screen readers. */
  title?: string
}

/**
 * TeaKart wordmark. The SVG ships with `fill: currentColor` baked in, and
 * this component sets `color: var(--logo-color)` on its root so the fill is
 * controlled by the active theme. Admins can tune the logo color from
 * /admin/customize like any other token.
 *
 * Visual treatment vs the source file:
 *   - viewBox tightened around the actual letter bounds so the wordmark
 *     fills its sized container rather than floating in dead space.
 *   - every filled letter group gets a matching stroke, so the strokes
 *     thicken the glyphs by ~4px on each side without rebuilding paths.
 *   - chair stroke bumped from 8 → 11 so it reads as bold next to the
 *     thickened letters.
 *
 * Source: public/logo.svg — inlined here so currentColor + CSS variables can
 * actually cascade into the SVG (which they can't when it's loaded as an
 * <img src>).
 */
export default function Logo({ className, title = 'TeaKart' }: Props) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="18 14 1518 224"
      role="img"
      aria-label={title}
      className={cn('block', className)}
      style={{ color: 'var(--logo-color)' }}
    >
      <title>{title}</title>

      {/* All non-chair groups: fill + matching stroke so the letters read bolder. */}
      <g
        fill="currentColor"
        stroke="currentColor"
        strokeWidth={4}
        strokeLinejoin="round"
      >
        {/* LEFT T */}
        <rect x="28" y="34" width="126" height="16" rx="3" />
        <rect x="83" y="50" width="16" height="176" rx="3" />

        {/* E */}
        <rect x="228" y="38" width="94" height="16" rx="4" />
        <rect x="228" y="122" width="94" height="16" rx="4" />
        <rect x="228" y="208" width="94" height="16" rx="4" />

        {/* K */}
        <rect x="760" y="34" width="16" height="192" rx="2" />
        <path d="M776 132 L862 34 H890 L794 142 L776 142 Z" />
        <path d="M776 126 H794 L896 226 H868 L776 144 Z" />

        {/* Ä */}
        <rect x="1009" y="20" width="58" height="12" rx="3" />
        <path d="M1040 48 L1118 226 H1097 L1040 92 L983 226 H962 Z" />

        {/* R */}
        <rect x="1214" y="34" width="16" height="192" rx="2" />
        <path d="M1230 34 H1298 Q1354 34 1354 88 Q1354 142 1298 142 H1230 L1230 126 H1288 Q1334 126 1334 88 Q1334 50 1288 50 H1230 Z" />
        <path d="M1230 134 H1248 L1338 226 H1314 L1230 144 Z" />

        {/* RIGHT T */}
        <rect x="1388" y="34" width="138" height="16" rx="3" />
        <rect x="1449" y="50" width="16" height="176" rx="3" />
      </g>

      {/* CHAIR — mixed fill + stroke, kept distinct so its existing stroke
          treatment isn't disturbed. Stroke bumped from 8 → 11 to match the
          new heavier letter weight. */}
      <g
        stroke="currentColor"
        strokeWidth={11}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      >
        <rect x="468" y="30" width="144" height="92" rx="26" fill="currentColor" stroke="none" />
        <line x1="492" y1="120" x2="490" y2="145" />
        <line x1="588" y1="120" x2="590" y2="145" />
        <path d="M452 148 Q540 128 628 148 L628 170 Q540 190 452 170 Z" fill="currentColor" stroke="none" />
        <path d="M452 148 Q540 128 628 148" />
        <path d="M452 170 Q540 190 628 170" />
        <line x1="452" y1="148" x2="452" y2="170" />
        <line x1="628" y1="148" x2="628" y2="170" />
        <line x1="488" y1="178" x2="478" y2="232" />
        <line x1="592" y1="178" x2="602" y2="232" />
      </g>
    </svg>
  )
}
