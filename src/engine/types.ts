import type { PlayerStats } from './scoring';

export type Pos = 'PG' | 'SG' | 'SF' | 'PF' | 'C';

export interface Player {
  name: string;
  positions: Pos[];
  team: string;
  decade: string;
  stats: PlayerStats;
}

export type GameMode = 'classic' | 'hoopiq';

export interface PlacedPlayer {
  player: Player;
  slot: Pos;
}

export const POSITIONS: Pos[] = ['PG', 'SG', 'SF', 'PF', 'C'];

export const DECADES = ['1960s', '1970s', '1980s', '1990s', '2000s', '2010s', '2020s'] as const;

export const TEAMS: { code: string; name: string }[] = [
  { code: 'ATL', name: 'Atlanta Hawks' },
  { code: 'BOS', name: 'Boston Celtics' },
  { code: 'BKN', name: 'Brooklyn Nets' },
  { code: 'CHI', name: 'Chicago Bulls' },
  { code: 'CLE', name: 'Cleveland Cavaliers' },
  { code: 'DAL', name: 'Dallas Mavericks' },
  { code: 'DEN', name: 'Denver Nuggets' },
  { code: 'DET', name: 'Detroit Pistons' },
  { code: 'GSW', name: 'Golden State Warriors' },
  { code: 'HOU', name: 'Houston Rockets' },
  { code: 'IND', name: 'Indiana Pacers' },
  { code: 'LAC', name: 'LA Clippers' },
  { code: 'LAL', name: 'Los Angeles Lakers' },
  { code: 'MEM', name: 'Memphis Grizzlies' },
  { code: 'MIA', name: 'Miami Heat' },
  { code: 'MIL', name: 'Milwaukee Bucks' },
  { code: 'MIN', name: 'Minnesota Timberwolves' },
  { code: 'NOP', name: 'New Orleans Pelicans' },
  { code: 'NYK', name: 'New York Knicks' },
  { code: 'OKC', name: 'Oklahoma City Thunder' },
  { code: 'ORL', name: 'Orlando Magic' },
  { code: 'PHI', name: 'Philadelphia 76ers' },
  { code: 'PHX', name: 'Phoenix Suns' },
  { code: 'POR', name: 'Portland Trail Blazers' },
  { code: 'SAC', name: 'Sacramento Kings' },
  { code: 'SAS', name: 'San Antonio Spurs' },
  { code: 'TOR', name: 'Toronto Raptors' },
  { code: 'UTA', name: 'Utah Jazz' },
  { code: 'WAS', name: 'Washington Wizards' },
  { code: 'CHA', name: 'Charlotte Hornets' },
];
