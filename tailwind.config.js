// Tailwind static-CSS reproduction contract | WEB-UX1 FREEZE.md §4.
// Theme must stay byte-compatible with the inline `tailwind.config` currently
// embedded in the public HTML (homepage variant is canonical; see
// handoff Evidence/Tooling/css-config-conflict.txt for the guide-generator
// `muted` color drift that Phase 3 must reconcile before rollout).
export default {
  content: [
    './index.html',
    './404.html',
    './{changelog,feedback,help,impressum,privacy,roadmap,guides,market}/**/*.html',
    './{de,es,fr,it,pt,tr}/**/*.html',
    './tools/**/*.mjs',
    './tools/*.mjs',
  ],
  safelist: [
    // Dynamic-class safelist frozen in FREEZE §4 (runtime-constructed utility
    // variants only; custom keyframe classes like .phone-float live in the
    // page <style> blocks and are NOT Tailwind utilities).
    'bg-gold',
    'bg-gold/10',
    'bg-gold/15',
    'bg-gold/20',
    'bg-navy',
    'bg-navy-light',
    'bg-mint',
    // Metal theme classes
    'border-gold/30',
    'border-slate-400/30',
    'border-teal-400/30',
    'border-indigo-400/30',
    'ring-gold/50',
    'ring-slate-400/50',
    'ring-teal-400/50',
    'ring-indigo-400/50',
    'bg-amber',
    'border-gold/20',
    'border-gold/35',
    'text-gold',
    'text-amber',
    'text-mint',
  ],
  theme: {
    extend: {
      colors: {
        navy: '#0F0F1A',
        'navy-light': '#1A1A2E',
        card: '#16213E',
        border: '#1E3A5C',
        gold: '#D4A843',
        amber: '#FFE27A',
        mint: '#00D68F',
        coral: '#FF4757',
        muted: '#666677',
        purple: '#A78BFA',
      },
    },
  },
  plugins: [],
};
