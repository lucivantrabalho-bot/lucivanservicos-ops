import { useState, useEffect } from 'react';

const breakpoints = {
  xs: 0,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536
};

export function useResponsive() {
  const [screenSize, setScreenSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1024,
    height: typeof window !== 'undefined' ? window.innerHeight : 768
  });

  useEffect(() => {
    const handleResize = () => {
      setScreenSize({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };

    window.addEventListener('resize', handleResize);
    
    // Call once on mount to set initial size
    handleResize();

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Helper functions to check screen size
  const isMobile = screenSize.width < breakpoints.md;
  const isTablet = screenSize.width >= breakpoints.md && screenSize.width < breakpoints.lg;
  const isDesktop = screenSize.width >= breakpoints.lg;
  const isLarge = screenSize.width >= breakpoints.xl;

  // Check specific breakpoints
  const isXs = screenSize.width >= breakpoints.xs && screenSize.width < breakpoints.sm;
  const isSm = screenSize.width >= breakpoints.sm && screenSize.width < breakpoints.md;
  const isMd = screenSize.width >= breakpoints.md && screenSize.width < breakpoints.lg;
  const isLg = screenSize.width >= breakpoints.lg && screenSize.width < breakpoints.xl;
  const isXl = screenSize.width >= breakpoints.xl && screenSize.width < breakpoints['2xl'];
  const is2Xl = screenSize.width >= breakpoints['2xl'];

  // Min-width helpers
  const isSmUp = screenSize.width >= breakpoints.sm;
  const isMdUp = screenSize.width >= breakpoints.md;
  const isLgUp = screenSize.width >= breakpoints.lg;
  const isXlUp = screenSize.width >= breakpoints.xl;
  const is2XlUp = screenSize.width >= breakpoints['2xl'];

  // Max-width helpers
  const isSmDown = screenSize.width < breakpoints.md;
  const isMdDown = screenSize.width < breakpoints.lg;
  const isLgDown = screenSize.width < breakpoints.xl;
  const isXlDown = screenSize.width < breakpoints['2xl'];

  return {
    screenSize,
    isMobile,
    isTablet,
    isDesktop,
    isLarge,
    
    // Exact breakpoints
    isXs,
    isSm,
    isMd,
    isLg,
    isXl,
    is2Xl,
    
    // Min-width helpers
    isSmUp,
    isMdUp,
    isLgUp,
    isXlUp,
    is2XlUp,
    
    // Max-width helpers
    isSmDown,
    isMdDown,
    isLgDown,
    isXlDown
  };
}

export function useMediaQuery(query) {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    if (media.matches !== matches) {
      setMatches(media.matches);
    }
    
    const listener = () => setMatches(media.matches);
    media.addEventListener('change', listener);
    
    return () => media.removeEventListener('change', listener);
  }, [matches, query]);

  return matches;
}