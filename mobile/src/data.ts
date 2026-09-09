export type Sport =
  | 'all'
  | 'football'
  | 'cricket'
  | 'basketball'
  | 'tennis'
  | 'esports';
import {enrichDemoEvent} from '../../shared/demo-details';
export type Match = {
  id: string;
  source?: 'live' | 'demo';
  fetchedAt?: string;
  startsAt?: string;
  markets?: {id: string; name: string; options: import('./model').Selection[]}[];
  sport: Sport;
  league: string;
  country: string;
  a: string;
  b: string;
  short: string[];
  colors: string[];
  score: string[];
  stage: string;
  live: boolean;
  suspended?: boolean;
  odds: number[];
  time: string;
  hours: number;
  popularity: number;
  statistics?: {label:string;home:string;away:string}[];
  players?: import('../../shared/contracts').PlayerDetail[];
  timeline?: import('../../shared/contracts').EventMoment[];
  playerMarkets?: {id:string;name:string;options:import('./model').Selection[]}[];
};
export const events: Match[] = [
  {
    id: 'e1',
    sport: 'football',
    league: 'Albion Premier League',
    country: 'Albion',
    a: 'Northbridge FC',
    b: 'Eastport United',
    short: ['NFC', 'EPU'],
    colors: ['#b6c8ed', '#e9c3a5'],
    score: ['2', '1'],
    stage: '67′ · 2nd half',
    live: true,
    odds: [1.85, 3.4, 4.2],
    time: '20:45',
    hours: 0,
    popularity: 100,
  },
  {
    id: 'e2',
    sport: 'cricket',
    league: 'Coastal T20 League',
    country: 'Coastland',
    a: 'Coastal Kings',
    b: 'Highland Royals',
    short: ['CK', 'HR'],
    colors: ['#b6dca4', '#c1b1de'],
    score: ['146/4', '132/6'],
    stage: '16.2 overs · 2nd innings',
    live: true,
    odds: [1.62, 2.3],
    time: '19:30',
    hours: 0,
    popularity: 96,
  },
  {
    id: 'e3',
    sport: 'basketball',
    league: 'National Hoops League',
    country: 'Albion',
    a: 'Metro Falcons',
    b: 'Harbor Wolves',
    short: ['MF', 'HW'],
    colors: ['#edbe94', '#99c8d0'],
    score: ['78', '72'],
    stage: 'Q3 · 04:28',
    live: true,
    odds: [1.74, 2.15],
    time: '20:00',
    hours: 0,
    popularity: 90,
  },
  {
    id: 'e4',
    sport: 'tennis',
    league: 'Azure Open · Singles',
    country: 'Coastland',
    a: 'L. Varen',
    b: 'A. Renzo',
    short: ['LV', 'AR'],
    colors: ['#cadcb4', '#b6c8e3'],
    score: ['1', '1'],
    stage: 'Set 3 · 4–3 · 30:15',
    live: true,
    odds: [1.91, 1.94],
    time: '19:00',
    hours: 0,
    popularity: 80,
  },
  {
    id: 'e5',
    sport: 'esports',
    league: 'Nexus Circuit · Semifinal',
    country: 'Virtual',
    a: 'Nova Five',
    b: 'Orbit Club',
    short: ['N5', 'OC'],
    colors: ['#d9baf1', '#9bd0c5'],
    score: ['1', '0'],
    stage: 'Map 2 · Tactical pause',
    live: true,
    suspended: true,
    odds: [1.45, 2.8],
    time: '21:00',
    hours: 0,
    popularity: 75,
  },
  {
    id: 'e6',
    sport: 'football',
    league: 'Albion Premier League',
    country: 'Albion',
    a: 'Westhaven Athletic',
    b: 'Oakfield City',
    short: ['WHA', 'OFC'],
    colors: ['#c6daa7', '#a9bed8'],
    score: ['–', '–'],
    stage: 'Today · 22:00',
    live: false,
    odds: [2.1, 3.25, 3.5],
    time: '22:00',
    hours: 1,
    popularity: 93,
  },
  {
    id: 'e7',
    sport: 'basketball',
    league: 'National Hoops League',
    country: 'Albion',
    a: 'Summit Bears',
    b: 'Valley Comets',
    short: ['SB', 'VC'],
    colors: ['#c8b2e5', '#e5c194'],
    score: ['–', '–'],
    stage: 'Today · 22:30',
    live: false,
    odds: [1.88, 1.96],
    time: '22:30',
    hours: 1.5,
    popularity: 78,
  },
  {
    id: 'e8',
    sport: 'cricket',
    league: 'Coastal T20 League',
    country: 'Coastland',
    a: 'Riverland XI',
    b: 'Dune Strikers',
    short: ['RXI', 'DS'],
    colors: ['#a5cbd6', '#d0bd96'],
    score: ['–', '–'],
    stage: 'Today · 23:00',
    live: false,
    odds: [1.77, 2.08],
    time: '23:00',
    hours: 2,
    popularity: 88,
  },
  {
    id: 'e9',
    sport: 'tennis',
    league: 'Azure Open · Singles',
    country: 'Coastland',
    a: 'M. Kellan',
    b: 'S. Alto',
    short: ['MK', 'SA'],
    colors: ['#b7d8b1', '#d6bcaf'],
    score: ['–', '–'],
    stage: 'Tomorrow · 01:00',
    live: false,
    odds: [2.2, 1.68],
    time: '01:00',
    hours: 4,
    popularity: 60,
  },
  {
    id: 'e10',
    sport: 'esports',
    league: 'Nexus Circuit · Final qualifier',
    country: 'Virtual',
    a: 'Prism Crew',
    b: 'Echo Squad',
    short: ['PC', 'ES'],
    colors: ['#c0b8de', '#b7d0a8'],
    score: ['–', '–'],
    stage: 'Today · 23:30',
    live: false,
    odds: [1.8, 2.04],
    time: '23:30',
    hours: 2.5,
    popularity: 70,
  },
];
// Keep the disconnected app preview as complete as the hackathon backend.
events.forEach(event=>{
  const enriched=enrichDemoEvent({...event,source:'demo',sourceName:'Fictional demo catalog',fetchedAt:event.fetchedAt||new Date().toISOString(),startsAt:event.startsAt||new Date().toISOString(),markets:[]} as import('../../shared/contracts').Event);
  event.statistics=enriched.statistics;event.players=enriched.players;event.timeline=enriched.timeline;event.playerMarkets=enriched.markets;
});
export const sports: { id: Sport; label: string; icon: string }[] = [
  { id: 'all', label: 'All sports', icon: 'grid' },
  { id: 'football', label: 'Football', icon: 'football' },
  { id: 'cricket', label: 'Cricket', icon: 'cricket' },
  { id: 'basketball', label: 'Basketball', icon: 'basketball' },
  { id: 'tennis', label: 'Tennis', icon: 'tennis' },
  { id: 'esports', label: 'Esports', icon: 'esports' },
];
