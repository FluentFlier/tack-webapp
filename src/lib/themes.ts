export interface ThemeColors {
    primary: string;
    secondary: string;
    background: string;
    surface: string;
    text: string;
    mutedText: string;
    accent: string;
    error: string;
    success: string;
    border: string;
    link: string;
}

export const THEMES: Record<string, ThemeColors> = {
    default: {
        primary: "#1e293b",
        secondary: "#e2e8f0",
        background: "#ffffff",
        surface: "#f8fafc",
        text: "#0f172a",
        mutedText: "#64748b",
        accent: "#3b82f6",
        error: "#dc2626",
        success: "#16a34a",
        border: "#e2e8f0",
        link: "#2563eb",
    },
    protanopia: {
        primary: "#0072b2",
        secondary: "#d4eaf7",
        background: "#ffffff",
        surface: "#f0f7ff",
        text: "#0a1929",
        mutedText: "#4a6785",
        accent: "#56b4e9",
        error: "#e69f00",
        success: "#009e73",
        border: "#b8d4e8",
        link: "#0072b2",
    },
    deuteranopia: {
        primary: "#0072b2",
        secondary: "#d4eaf7",
        background: "#ffffff",
        surface: "#f0f7ff",
        text: "#0a1929",
        mutedText: "#4a6785",
        accent: "#56b4e9",
        error: "#e69f00",
        success: "#0072b2",
        border: "#b8d4e8",
        link: "#0072b2",
    },
    tritanopia: {
        primary: "#d55e00",
        secondary: "#fce8d5",
        background: "#ffffff",
        surface: "#fff8f2",
        text: "#1a0a00",
        mutedText: "#6b4d33",
        accent: "#cc4400",
        error: "#d55e00",
        success: "#009e73",
        border: "#e8d0b8",
        link: "#cc4400",
    },
    protanomaly: {
        primary: "#2b6ca3",
        secondary: "#dce8f3",
        background: "#ffffff",
        surface: "#f2f7fc",
        text: "#0d1f33",
        mutedText: "#4e6a84",
        accent: "#6a9fcf",
        error: "#c8922e",
        success: "#2e8b6a",
        border: "#c0d4e4",
        link: "#2b6ca3",
    },
    deuteranomaly: {
        primary: "#2b6ca3",
        secondary: "#dce8f3",
        background: "#ffffff",
        surface: "#f2f7fc",
        text: "#0d1f33",
        mutedText: "#4e6a84",
        accent: "#6a9fcf",
        error: "#c8922e",
        success: "#2b6ca3",
        border: "#c0d4e4",
        link: "#2b6ca3",
    },
    achromatopsia: {
        primary: "#2d2d2d",
        secondary: "#e0e0e0",
        background: "#ffffff",
        surface: "#f5f5f5",
        text: "#1a1a1a",
        mutedText: "#6b6b6b",
        accent: "#4a4a4a",
        error: "#3d3d3d",
        success: "#5a5a5a",
        border: "#c0c0c0",
        link: "#2d2d2d",
    },
    universal: {
        primary: "#0072b2",
        secondary: "#dce8f3",
        background: "#ffffff",
        surface: "#f8fafc",
        text: "#000000",
        mutedText: "#525252",
        accent: "#56b4e9",
        error: "#d55e00",
        success: "#009e73",
        border: "#cccccc",
        link: "#0072b2",
    },
};

function hexToRgbComponents(hex: string): [number, number, number] {
    const h = hex.replace("#", "");
    return [
        parseInt(h.slice(0, 2), 16) / 255,
        parseInt(h.slice(2, 4), 16) / 255,
        parseInt(h.slice(4, 6), 16) / 255,
    ];
}

function srgbToLinear(c: number): number {
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

export function relativeLuminance(hex: string): number {
    const [r, g, b] = hexToRgbComponents(hex).map(srgbToLinear);
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrastRatio(fg: string, bg: string): number {
    const l1 = relativeLuminance(fg);
    const l2 = relativeLuminance(bg);
    const lighter = Math.max(l1, l2);
    const darker = Math.min(l1, l2);
    return (lighter + 0.05) / (darker + 0.05);
}

function foregroundFor(bg: string): string {
    return relativeLuminance(bg) > 0.179 ? "#000000" : "#ffffff";
}

export function hexToHsl(hex: string): string {
    const [r, g, b] = hexToRgbComponents(hex);
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0;
    let s = 0;
    const l = (max + min) / 2;
    if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
            case g: h = ((b - r) / d + 2) / 6; break;
            case b: h = ((r - g) / d + 4) / 6; break;
        }
    }
    return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

const SHADCN_PROPS = [
    "--background", "--foreground", "--card", "--card-foreground",
    "--popover", "--popover-foreground", "--primary", "--primary-foreground",
    "--secondary", "--secondary-foreground", "--muted", "--muted-foreground",
    "--accent", "--accent-foreground", "--destructive", "--destructive-foreground",
    "--border", "--input", "--ring",
];

export function applyTheme(name: string): void {
    const root = document.documentElement;

    if (name === "default" || !THEMES[name]) {
        root.removeAttribute("data-color-profile");
        SHADCN_PROPS.forEach((p) => root.style.removeProperty(p));
        Object.keys(THEMES.default).forEach((k) => root.style.removeProperty(`--theme-${k}`));
        checkThemeContrast("default");
        return;
    }

    const t = THEMES[name];
    root.setAttribute("data-color-profile", name);

    root.style.setProperty("--background", hexToHsl(t.background));
    root.style.setProperty("--foreground", hexToHsl(t.text));
    root.style.setProperty("--card", hexToHsl(t.surface));
    root.style.setProperty("--card-foreground", hexToHsl(t.text));
    root.style.setProperty("--popover", hexToHsl(t.surface));
    root.style.setProperty("--popover-foreground", hexToHsl(t.text));
    root.style.setProperty("--primary", hexToHsl(t.primary));
    root.style.setProperty("--primary-foreground", hexToHsl(foregroundFor(t.primary)));
    root.style.setProperty("--secondary", hexToHsl(t.secondary));
    root.style.setProperty("--secondary-foreground", hexToHsl(t.text));
    root.style.setProperty("--muted", hexToHsl(t.surface));
    root.style.setProperty("--muted-foreground", hexToHsl(t.mutedText));
    root.style.setProperty("--accent", hexToHsl(t.accent));
    root.style.setProperty("--accent-foreground", hexToHsl(foregroundFor(t.accent)));
    root.style.setProperty("--destructive", hexToHsl(t.error));
    root.style.setProperty("--destructive-foreground", hexToHsl(foregroundFor(t.error)));
    root.style.setProperty("--border", hexToHsl(t.border));
    root.style.setProperty("--input", hexToHsl(t.border));
    root.style.setProperty("--ring", hexToHsl(t.accent));

    Object.entries(t).forEach(([key, value]) => {
        root.style.setProperty(`--theme-${key}`, value);
    });

    checkThemeContrast(name);
}

export function checkThemeContrast(name: string): void {
    const t = THEMES[name];
    if (!t) return;
    const pairs = [
        { label: "text/background", fg: t.text, bg: t.background },
        { label: "mutedText/background", fg: t.mutedText, bg: t.background },
        { label: "text/surface", fg: t.text, bg: t.surface },
        { label: "link/background", fg: t.link, bg: t.background },
        { label: "error/background", fg: t.error, bg: t.background },
        { label: "success/background", fg: t.success, bg: t.background },
    ];
    console.group(`[A11y] Contrast — "${name}"`);
    pairs.forEach(({ label, fg, bg }) => {
        const r = contrastRatio(fg, bg);
        const ok = r >= 4.5;
        console.log(
            `%c${ok ? "✓" : "✗"} ${label}: ${r.toFixed(2)}:1 ${ok ? "(AA)" : "(FAIL)"}`,
            `color:${ok ? "green" : "red"}`
        );
    });
    console.groupEnd();
}
