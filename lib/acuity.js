/**
 * lib/acuity.js
 * Maps Severity_Color (RED/YELLOW/GREEN/BLUE) to UI tokens.
 */

export const SEV_CONFIG = {
  RED: {
    color:       '#EF4444',
    bg:          'bg-red-950/60',
    border:      'border-red-500/40',
    badge:       'bg-red-500',
    text:        'text-red-400',
    textStrong:  'text-red-300',
    ring:        'sev-ring-red',
    glowShadow:  '0 0 32px rgba(239,68,68,0.4)',
    label:       'Emergency / Critical',
    emoji:       '🚨',
    action:      'Hospital + Ambulance',
    ctaLabel:    'Book Ambulance NOW',
    ctaClass:    'bg-red-600 hover:bg-red-500 border-red-500',
    description: 'Requires immediate emergency care. Call ambulance NOW.',
  },
  YELLOW: {
    color:       '#F59E0B',
    bg:          'bg-amber-950/50',
    border:      'border-amber-500/40',
    badge:       'bg-amber-500',
    text:        'text-amber-400',
    textStrong:  'text-amber-300',
    ring:        'sev-ring-yellow',
    glowShadow:  '0 0 28px rgba(245,158,11,0.35)',
    label:       'Urgent',
    emoji:       '⚠️',
    action:      'Hospital + Doctor (2-4 hours)',
    ctaLabel:    'Find Nearest Hospital',
    ctaClass:    'bg-amber-600 hover:bg-amber-500 border-amber-500',
    description: 'Needs urgent medical attention within 2–4 hours.',
  },
  GREEN: {
    color:       '#22C55E',
    bg:          'bg-green-950/50',
    border:      'border-green-500/40',
    badge:       'bg-green-500',
    text:        'text-green-400',
    textStrong:  'text-green-300',
    ring:        'sev-ring-green',
    glowShadow:  '0 0 24px rgba(34,197,94,0.28)',
    label:       'Standard Care',
    emoji:       '🏥',
    action:      'Doctor Consultation Required',
    ctaLabel:    'Find a Specialist',
    ctaClass:    'bg-green-700 hover:bg-green-600 border-green-500',
    description: 'See a doctor, but no immediate emergency.',
  },
  BLUE: {
    color:       '#3B82F6',
    bg:          'bg-blue-950/50',
    border:      'border-blue-500/40',
    badge:       'bg-blue-500',
    text:        'text-blue-400',
    textStrong:  'text-blue-300',
    ring:        'sev-ring-blue',
    glowShadow:  '0 0 20px rgba(59,130,246,0.25)',
    label:       'Routine / Minor',
    emoji:       '💊',
    action:      'Self-Care + Optional GP Visit',
    ctaLabel:    'Book Telehealth',
    ctaClass:    'bg-blue-700 hover:bg-blue-600 border-blue-500',
    description: 'Minor ailment — home care is sufficient for now.',
  },
};

export function getSevConfig(color) {
  return SEV_CONFIG[color] ?? SEV_CONFIG.BLUE;
}
