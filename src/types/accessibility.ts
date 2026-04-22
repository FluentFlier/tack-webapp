/**
 * Accessibility mode identifiers.
 * Multiple modes can be active simultaneously.
 */
export type AccessibilityMode =
  | "dyslexia"
  | "low-vision"
  | "color-blind"
  | "adhd";

/**
 * Full accessibility state managed by AccessibilityContext.
 * Persisted to localStorage under key `visionaccess_a11y`.
 */
export interface AccessibilityState {
  /** Array of currently active accessibility modes */
  activeModes: AccessibilityMode[];
  /** Font scale multiplier (1.0 = default, 1.5 = 150%, etc.) */
  fontScale: number;
  /** Contrast mode */
  contrastMode: "normal" | "high";
  /** Whether non-essential motion/animation is disabled */
  motionReduced: boolean;
  /** Text spacing level */
  textSpacing: "normal" | "wide" | "wider";
  /** Whether cognitive focus mode is active */
  focusMode: boolean;
}

/**
 * Actions exposed by AccessibilityContext for controlling modes.
 */
export interface AccessibilityActions {
  toggleMode: (mode: AccessibilityMode) => void;
  setFontScale: (scale: number) => void;
  setContrastMode: (mode: "normal" | "high") => void;
  setMotionReduced: (reduced: boolean) => void;
  setTextSpacing: (spacing: "normal" | "wide" | "wider") => void;
  setFocusMode: (enabled: boolean) => void;
  isModeActive: (mode: AccessibilityMode) => boolean;
  resetAll: () => void;
}

/**
 * Combined context value.
 */
export interface AccessibilityContextValue
  extends AccessibilityState,
    AccessibilityActions {}

/**
 * Mode metadata for rendering the UI.
 */
export interface AccessibilityModeInfo {
  id: AccessibilityMode;
  label: string;
  description: string;
  icon: string;
  activeColor: string;
}

/**
 * Definitions for each accessibility mode displayed on the homepage.
 */
export const ACCESSIBILITY_MODES: AccessibilityModeInfo[] = [
  {
    id: "dyslexia",
    label: "Dyslexia",
    description:
      "Dyslexia-friendly font, increased letter & line spacing, limited line width, reading guide.",
    icon: "BookOpen",
    activeColor: "hsl(270, 80%, 65%)",
  },
  {
    id: "low-vision",
    label: "Low Vision",
    description:
      "150% font scale, high contrast, enlarged buttons & icons, simplified layout.",
    icon: "Eye",
    activeColor: "hsl(180, 100%, 50%)",
  },
  {
    id: "color-blind",
    label: "Color Blind",
    description:
      "Accessible color palette, pattern overlays, icon + text labels on all color-coded UI.",
    icon: "Palette",
    activeColor: "hsl(30, 90%, 55%)",
  },
  {
    id: "adhd",
    label: "ADHD",
    description:
      "Calmer palette, no animations, reduced clutter, reading ruler, focus highlights.",
    icon: "Brain",
    activeColor: "hsl(150, 80%, 50%)",
  },
];
