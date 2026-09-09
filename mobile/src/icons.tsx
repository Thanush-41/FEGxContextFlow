import React from 'react';
import Svg, { Path } from 'react-native-svg';
const paths: Record<string, string> = {
  more: 'M5 12h.1M12 12h.1M19 12h.1',
  micOff: 'm3 3 18 18M9 9v3a3 3 0 0 0 5 2M9 5a3 3 0 0 1 6 0v4M6 11v1a6 6 0 0 0 10 4M18 11v1M12 18v4m-3 0h6',
  arrow: 'M5 12h14m-5-5 5 5-5 5',
  back: 'm14 6-6 6 6 6',
  chevron: 'm9 6 6 6-6 6',
  down: 'm6 9 6 6 6-6',
  x: 'm6 6 12 12M6 18 18 6',
  plus: 'M12 5v14M5 12h14',
  check: 'm5 12 4 4L19 6',
  search: 'M21 21l-5-5M18 10.5a7.5 7.5 0 1 1-15 0 7.5 7.5 0 0 1 15 0',
  bell: 'M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4',
  wallet:
    'M20 8V5H4a2 2 0 0 1 0-4h15v4M3 4v15a2 2 0 0 0 2 2h15V8H4m16 4h-5v5h5m-3-2.5h.1',
  mic: 'M9 5a3 3 0 0 1 6 0v7a3 3 0 0 1-6 0V5m-3 6v1a6 6 0 0 0 12 0v-1M12 18v4m-3 0h6',
  live: 'M8 7a7 7 0 0 0 0 10M5 4a11 11 0 0 0 0 16M16 7a7 7 0 0 1 0 10m3-13a11 11 0 0 1 0 16M13 12a1 1 0 1 1-2 0 1 1 0 0 1 2 0',
  calendar:
    'M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2M7 2v4m10-4v4M3 10h18M7 14h2m3 0h2m3 0h1M7 18h2m3 0h2',
  grid: 'M3 3h7v7H3V3m11 0h7v7h-7V3M3 14h7v7H3v-7m11 0h7v7h-7v-7',
  menu: 'M4 6h16M4 12h16M4 18h16',
  star: 'm12 3 2.8 5.8 6.4.9-4.6 4.5 1.1 6.4-5.7-3-5.7 3 1.1-6.4-4.6-4.5 6.4-.9L12 3',
  football:
    'M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0M12 7l5 4-2 6H9l-2-6 5-4m0-4v4m9 5-4-1m.5 8.5L15 17m-8.5 2.5L9 17M3 12l4-1',
  cricket:
    'm15 3 6 6-10 10-6-6L15 3M5 13l-3 3 6 6 3-3M17 4l3-3m-5 18a3 3 0 1 0 6 0 3 3 0 0 0-6 0',
  basketball:
    'M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0M3 12h18M12 3v18M5.6 5.6c6 3 6 9.8 0 12.8m12.8-12.8c-6 3-6 9.8 0 12.8',
  tennis:
    'M15 3c5-1 8 2 6 7-2 5-7 8-11 5s-1-11 5-12M10 15l-7 7m3-10 7 7M12 4l7 9M9 7l7 9M10 11l8-6',
  esports:
    'M7 6h10a4 4 0 0 1 4 3l2 9a2 2 0 0 1-3 2l-4-4H8l-4 4a2 2 0 0 1-3-2l2-9a4 4 0 0 1 4-3M7 9v5m-2.5-2.5h5M16 10h.1M19 13h.1',
  dice: 'M6 3h12a3 3 0 0 1 3 3v12a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3V6a3 3 0 0 1 3-3M7 7h.1M17 7h.1M12 12h.1M7 17h.1M17 17h.1',
  cards: 'M7 3h12v17H7V3M4 5 1 20l12 3m0-15-3 4 3 4 3-4-3-4',
  rocket:
    'M14 4c3-2 6-2 8-2 0 3 0 5-2 8l-7 7-6-6 7-7M7 11H2l4-6 7-1m0 13v5l6-4 1-7M4 16l-2 6 6-2M17 6h.1',
  trophy:
    'M7 3h10v7a5 5 0 0 1-10 0V3m0 2H3v3a4 4 0 0 0 4 4m10-7h4v3a4 4 0 0 1-4 4M12 15v5m-4 1h8',
  shield: 'm12 2 9 4v7c0 5-9 9-9 9S3 18 3 13V6l9-4m-4 10 3 3 5-6',
  stats: 'M4 20V10m8 10V4m8 16v-7',
  play: 'm8 4 13 8-13 8V4',
  refresh: 'M20 7a9 9 0 0 0-15-2L2 8m0-6v6h6M4 17a9 9 0 0 0 15 2l3-3m0 6v-6h-6',
  filter: 'M3 6h18M6 12h12M9 18h6',
  ticket: 'M3 5h18v5a2 2 0 0 0 0 4v5H3v-5a2 2 0 0 0 0-4V5m12 0v3m0 3v2m0 3v3',
  trash: 'M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7m4-7v7',
  expand: 'M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5',
  lock: 'M5 10h14v12H5V10m3 0V6a4 4 0 0 1 8 0v4m-4 5v3',
  info: 'M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0M12 11v6m0-10h.1',
  eye: 'M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12m13 0a3 3 0 1 1-6 0 3 3 0 0 1 6 0',
  user: 'M17 7a5 5 0 1 1-10 0 5 5 0 0 1 10 0M3 22v-2a9 9 0 0 1 18 0v2',
  clock: 'M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0M12 6v6l4 2',
  gift: 'M3 8h18v5H3V8m2 5v9h14v-9M12 8v14M12 8H8a3 3 0 1 1 3-3l1 3m0 0h4a3 3 0 1 0-3-3l-1 3',
  settings:
    'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8m-2-6h4l1 3 3 1 3 3-1 3 1 3-3 3-3 1-1 3h-4l-1-3-3-1-3-3 1-3-1-3 3-3 3-1 1-3',
  help: 'M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0M9 8a3 3 0 1 1 4 3c-1 0-1 1-1 3m0 3h.1',
  logout: 'M9 3H3v18h6m7-15 6 6-6 6M8 12h14',
  copy: 'M9 9h12v12H9V9M5 15H3V3h12v2',
  sun: 'M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0M12 1v3m0 16v3M1 12h3m16 0h3M4 4l2 2m12 12 2 2M4 20l2-2M18 6l2-2',
  moon: 'M21 13A9 9 0 1 1 11 3a7 7 0 0 0 10 10',
  spark: 'm12 2 3 7 7 3-7 3-3 7-3-7-7-3 7-3 3-7',
  headphones: 'M3 14v-3a9 9 0 0 1 18 0v3M3 12h4v8H3v-8m14 0h4v8h-4v-8',
  speaker: 'M4 10h4l5-4v12l-5-4H4v-4m12-1a4 4 0 0 1 0 6m2-9a8 8 0 0 1 0 12',
  flag: 'M4 22V3m0 0c5-4 9 4 16 0v11c-7 4-11-4-16 0',
  bolt: 'm13 2-9 12h7l-1 8 10-13h-8l1-7',
  mail: 'M3 5h18v14H3V5m0 0 9 8 9-8',
  building: 'M3 21h18M5 21V8h14v13M3 8l9-6 9 6M9 11v7m6-7v7',
};
export function Icon({
  name,
  size = 22,
  color = '#91baff',
}: {
  name: string;
  size?: number;
  color?: string;
}) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      accessible={false}
    >
      <Path d={paths[name] || paths.spark} />
    </Svg>
  );
}
