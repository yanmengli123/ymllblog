/**
 * 主题管理工具
 * 支持自定义主题、动态背景、个性化设置
 */

export type ThemeMode = 'light' | 'dark' | 'auto';
export type ColorTheme = 'purple' | 'green' | 'blue' | 'pink' | 'orange' | 'cyan' | 'red' | 'yellow';
export type BackgroundMode = 'gradient' | 'aurora' | 'particles' | 'waves' | 'mesh' | 'stars' | 'image' | 'solid';
export type BannerMode = 'parallax' | 'fullscreen' | 'minimal' | 'wave' | 'particles';
export type PostLayout = 'list' | 'grid' | 'card' | 'masonry';
export type FontFamily = 'sans' | 'serif' | 'mono' | 'rounded';

export interface UserSettings {
  themeMode: ThemeMode;
  colorTheme: ColorTheme;
  hue: number;
  saturation: number;
  lightness: number;
  backgroundMode: BackgroundMode;
  customBackground: string;
  bannerMode: BannerMode;
  showHero: boolean;
  showWave: boolean;
  showGlass: boolean;
  showParticles: boolean;
  showMusicPlayer: boolean;
  showAnnouncement: boolean;
  postLayout: PostLayout;
  fontFamily: FontFamily;
  fontSize: 'sm' | 'base' | 'lg';
  animationsEnabled: boolean;
  customAnnouncement: string;
  customCSS: string;
  customAvatar: string;
  customGreeting: string;
}

export const DEFAULT_SETTINGS: UserSettings = {
  themeMode: 'light',
  colorTheme: 'blue',
  hue: 240,
  saturation: 60,
  lightness: 55,
  backgroundMode: 'gradient',
  customBackground: '',
  bannerMode: 'parallax',
  showHero: true,
  showWave: true,
  showGlass: true,
  showParticles: false,
  showMusicPlayer: true,
  showAnnouncement: true,
  postLayout: 'grid',
  fontFamily: 'sans',
  fontSize: 'base',
  animationsEnabled: true,
  customAnnouncement: '🎉 欢迎来到 YMLL Blog！这里分享技术、设计与生活。',
  customCSS: '',
  customAvatar: '',
  customGreeting: '都是风景，幸会！',
};

/**
 * 主题色配置
 */
export const COLOR_THEMES: Record<ColorTheme, { hue: number; saturation: number; lightness: number; name: string; label: string }> = {
  purple: { hue: 262, saturation: 40, lightness: 56, name: 'purple', label: '💜 神秘紫' },
  green:  { hue: 150, saturation: 60, lightness: 45, name: 'green',  label: '💚 清新绿' },
  blue:   { hue: 210, saturation: 70, lightness: 55, name: 'blue',   label: '💙 天空蓝' },
  pink:   { hue: 330, saturation: 70, lightness: 60, name: 'pink',   label: '💗 樱花粉' },
  orange: { hue: 30,  saturation: 80, lightness: 55, name: 'orange', label: '🧡 活力橙' },
  cyan:   { hue: 180, saturation: 60, lightness: 50, name: 'cyan',   label: '💎 薄荷青' },
  red:    { hue: 0,   saturation: 70, lightness: 55, name: 'red',    label: '❤️ 中国红' },
  yellow: { hue: 50,  saturation: 80, lightness: 55, name: 'yellow', label: '💛 阳光黄' },
};

/**
 * 背景模式配置
 */
export const BACKGROUND_MODES: Record<BackgroundMode, { name: string; label: string; description: string }> = {
  gradient:  { name: 'gradient',  label: '🌅 渐变流动',  description: '平滑的渐变色彩流动' },
  aurora:    { name: 'aurora',    label: '🌌 极光极光',  description: '极光般的彩色光晕' },
  particles: { name: 'particles', label: '✨ 粒子星空',  description: '动态粒子背景' },
  waves:     { name: 'waves',     label: '🌊 波浪起伏',  description: '动态波浪背景' },
  mesh:      { name: 'mesh',      label: '🎨 网格渐变',  description: '网格彩色渐变' },
  stars:     { name: 'stars',     label: '⭐ 繁星点点',  description: '闪烁星空背景' },
  image:     { name: 'image',     label: '🖼️ 自定义图',  description: '使用自定义图片' },
  solid:     { name: 'solid',     label: '🎭 纯色背景',  description: '简洁的纯色背景' },
};

/**
 * 横幅模式配置
 */
export const BANNER_MODES: Record<BannerMode, { name: string; label: string }> = {
  parallax:   { name: 'parallax',   label: '🏔️ 视差滚动' },
  fullscreen: { name: 'fullscreen', label: '🌅 全屏展示' },
  minimal:    { name: 'minimal',    label: '🎯 极简模式' },
  wave:       { name: 'wave',       label: '🌊 波浪横幅' },
  particles:  { name: 'particles',  label: '✨ 粒子横幅' },
};

/**
 * 文章布局配置
 */
export const POST_LAYOUTS: Record<PostLayout, { name: string; label: string; icon: string }> = {
  list:    { name: 'list',    label: '列表布局', icon: '☰' },
  grid:    { name: 'grid',    label: '网格布局', icon: '▦' },
  card:    { name: 'card',    label: '卡片布局', icon: '▢' },
  masonry: { name: 'masonry', label: '瀑布流',   icon: '▤' },
};

const STORAGE_KEY = 'ymll_user_settings';

/**
 * 加载用户设置
 */
export function loadSettings(): UserSettings {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS;
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

/**
 * 保存用户设置
 */
export function saveSettings(settings: Partial<UserSettings>): UserSettings {
  const current = loadSettings();
  const updated = { ...current, ...settings };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.warn('Failed to save settings:', e);
  }
  return updated;
}

/**
 * 重置设置
 */
export function resetSettings(): UserSettings {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {}
  return DEFAULT_SETTINGS;
}

/**
 * 应用主题色到 CSS 变量
 */
export function applyColorTheme(settings: UserSettings) {
  const root = document.documentElement;
  const theme = COLOR_THEMES[settings.colorTheme] || COLOR_THEMES.purple;
  const hue = settings.hue ?? theme.hue;
  const saturation = settings.saturation ?? theme.saturation;
  const lightness = settings.lightness ?? theme.lightness;

  root.style.setProperty('--primary-hue', String(hue));
  root.style.setProperty('--primary-saturation', `${saturation}%`);
  root.style.setProperty('--primary-lightness', `${lightness}%`);
  root.style.setProperty('--primary', `hsl(${hue}, ${saturation}%, ${lightness}%)`);
  root.style.setProperty('--primary-light', `hsl(${hue}, ${saturation}%, ${lightness + 10}%)`);
  root.style.setProperty('--primary-dark', `hsl(${hue}, ${saturation}%, ${lightness - 10}%)`);
  root.style.setProperty('--title-color', `hsl(${hue}, ${saturation}%, ${lightness - 10}%)`);

  // 紫绿渐变
  const complementHue = (hue + 180) % 360;
  root.style.setProperty('--gradient-start', `hsl(${complementHue}, 60%, 50%)`);
  root.style.setProperty('--gradient-end', `hsl(${hue}, ${saturation}%, ${lightness}%)`);
}

/**
 * 应用主题模式
 */
export function applyThemeMode(mode: ThemeMode) {
  const root = document.documentElement;
  const body = document.body;
  body.classList.remove('theme-light', 'theme-dark', 'theme-auto');

  if (mode === 'dark') {
    root.classList.add('dark');
    body.classList.add('theme-dark');
  } else if (mode === 'light') {
    root.classList.remove('dark');
    body.classList.add('theme-light');
  } else {
    // auto - 跟随系统
    body.classList.add('theme-auto');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (prefersDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }
}

/**
 * 应用字体
 */
export function applyFont(font: FontFamily, size: 'sm' | 'base' | 'lg') {
  const root = document.documentElement;
  root.classList.remove('font-sans-custom', 'font-serif-custom', 'font-mono-custom', 'font-rounded-custom');
  root.classList.add(`font-${font}-custom`);

  root.classList.remove('text-sm', 'text-base', 'text-lg');
  root.classList.add(`text-${size}`);
}

/**
 * 应用背景模式
 */
export function applyBackground(mode: BackgroundMode, customImage: string) {
  const body = document.body;
  // 清除所有背景类
  body.classList.remove(
    'bg-gradient', 'bg-aurora', 'bg-particles', 'bg-waves',
    'bg-mesh', 'bg-stars', 'bg-image', 'bg-solid',
    'wallpaper-light', 'wallpaper-dark', 'wallpaper-gradient'
  );
  body.classList.add(`bg-${mode}`);

  if (mode === 'image' && customImage) {
    body.style.setProperty('--custom-bg-image', `url('${customImage}')`);
  } else {
    body.style.removeProperty('--custom-bg-image');
  }
}

/**
 * 应用横幅模式
 */
export function applyBanner(mode: BannerMode) {
  const banner = document.getElementById('hero-banner');
  if (!banner) return;
  banner.setAttribute('data-banner-mode', mode);
  banner.classList.remove('banner-parallax', 'banner-fullscreen', 'banner-minimal', 'banner-wave', 'banner-particles');
  banner.classList.add(`banner-${mode}`);
}

/**
 * 应用所有设置
 */
export function applyAllSettings(settings: UserSettings) {
  applyColorTheme(settings);
  applyThemeMode(settings.themeMode);
  applyFont(settings.fontFamily, settings.fontSize);
  applyBackground(settings.backgroundMode, settings.customBackground);
  applyBanner(settings.bannerMode);

  // 切换各组件显隐
  toggleElement('.wave-container', settings.showWave);
  toggleElement('#board', settings.showGlass);
  toggleElement('#hero-banner', settings.showHero);
  toggleElement('#music-player', settings.showMusicPlayer);
  toggleElement('#announcement', settings.showAnnouncement);

  // 动画
  if (!settings.animationsEnabled) {
    document.documentElement.classList.add('no-animations');
  } else {
    document.documentElement.classList.remove('no-animations');
  }

  // 自定义 CSS
  let customStyle = document.getElementById('custom-user-css');
  if (!customStyle) {
    customStyle = document.createElement('style');
    customStyle.id = 'custom-user-css';
    document.head.appendChild(customStyle);
  }
  customStyle.textContent = settings.customCSS;
}

function toggleElement(selector: string, show: boolean) {
  const el = document.querySelector(selector) as HTMLElement | null;
  if (el) {
    el.style.display = show ? '' : 'none';
  }
}
