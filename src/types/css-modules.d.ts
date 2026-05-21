// Ambient declarations for third-party CSS subpath imports.
// These packages expose CSS via their package.json "exports" field
// without a .css extension, and TS strict mode cannot resolve
// side-effect imports that lack type files. These declarations tell
// TS the imports are valid side-effects only.

// Swiper CSS subpaths
declare module 'swiper/css';
declare module 'swiper/css/navigation';
declare module 'swiper/css/pagination';
declare module 'swiper/css/autoplay';

// @fontsource-variable — self-hosted variable fonts
declare module '@fontsource-variable/inter';
declare module '@fontsource-variable/inter/wght-italic.css';
declare module '@fontsource-variable/inter-tight';
declare module '@fontsource-variable/inter-tight/wght-italic.css';
