#!/usr/bin/env python3
"""
Offline build script: pulls real NBA career data via nba_api,
aggregates into (player, team, decade) stints, normalizes teams/positions,
and emits src/data/players.ts.

Usage: python3 scripts/generate_players.py
"""

import time
import sys
import os
from collections import defaultdict

from nba_api.stats.endpoints import leagueleaders, playerindex

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

MIN_GAMES_PER_STINT = 20        # drop stints with fewer total games
DECADES = ['1960s', '1970s', '1980s', '1990s', '2000s', '2010s', '2020s']
RATE_LIMIT_DELAY = 0.8          # seconds between API calls

# ---------------------------------------------------------------------------
# Franchise normalization (historical → current code)
# ---------------------------------------------------------------------------

TEAM_ABBR_MAP = {
    # Current teams (identity)
    'ATL': 'ATL', 'BOS': 'BOS', 'BKN': 'BKN', 'CHA': 'CHA', 'CHI': 'CHI',
    'CLE': 'CLE', 'DAL': 'DAL', 'DEN': 'DEN', 'DET': 'DET', 'GSW': 'GSW',
    'HOU': 'HOU', 'IND': 'IND', 'LAC': 'LAC', 'LAL': 'LAL', 'MEM': 'MEM',
    'MIA': 'MIA', 'MIL': 'MIL', 'MIN': 'MIN', 'NOP': 'NOP', 'NYK': 'NYK',
    'OKC': 'OKC', 'ORL': 'ORL', 'PHI': 'PHI', 'PHX': 'PHX', 'POR': 'POR',
    'SAC': 'SAC', 'SAS': 'SAS', 'TOR': 'TOR', 'UTA': 'UTA', 'WAS': 'WAS',
    # Relocations / renames
    'NJN': 'BKN', 'SEA': 'OKC', 'VAN': 'MEM', 'NOH': 'NOP', 'NOK': 'NOP',
    'CHH': 'CHA', 'CHA': 'CHA', 'CHO': 'CHA',
    'WSB': 'WAS', 'BAL': 'WAS', 'CAP': 'WAS', 'WAS': 'WAS',
    'KCK': 'SAC', 'KCO': 'SAC', 'CIN': 'SAC', 'ROC': 'SAC',
    'SDC': 'LAC', 'BUF': 'LAC',
    'SFW': 'GSW', 'PHW': 'GSW',
    'STL': 'ATL', 'MLH': 'ATL', 'TRI': 'ATL',
    'SYR': 'PHI',
    'SDR': 'HOU',
    'MNL': 'LAL',
    'NYN': 'BKN',
    'NOJ': 'UTA',  # New Orleans Jazz → Utah Jazz
    'SAN': 'SAS',
    'GOS': 'GSW',
}

VALID_TEAMS = {
    'ATL', 'BOS', 'BKN', 'CHA', 'CHI', 'CLE', 'DAL', 'DEN', 'DET', 'GSW',
    'HOU', 'IND', 'LAC', 'LAL', 'MEM', 'MIA', 'MIL', 'MIN', 'NOP', 'NYK',
    'OKC', 'ORL', 'PHI', 'PHX', 'POR', 'SAC', 'SAS', 'TOR', 'UTA', 'WAS',
}

# ---------------------------------------------------------------------------
# Position normalization
# ---------------------------------------------------------------------------

POSITION_MAP = {
    'G':   ['PG', 'SG'],
    'F':   ['SF', 'PF'],
    'C':   ['C'],
    'G-F': ['SG', 'SF'],
    'F-G': ['SG', 'SF'],
    'F-C': ['PF', 'C'],
    'C-F': ['PF', 'C'],
}


def normalize_position(pos_str: str) -> list[str]:
    if not pos_str or pos_str == 'nan':
        return ['SF']  # fallback
    return POSITION_MAP.get(pos_str.strip(), ['SF'])


def season_to_decade(season_str: str) -> str:
    year = int(season_str.split('-')[0])
    return f'{(year // 10) * 10}s'


def main():
    # Step 1: Build player_id → position map from PlayerIndex
    print('Fetching player index (positions)...', file=sys.stderr)
    pi = playerindex.PlayerIndex(season='2024-25', historical_nullable=1)
    pi_df = pi.get_data_frames()[0]

    position_map: dict[int, str] = {}
    name_map: dict[int, str] = {}
    for _, row in pi_df.iterrows():
        pid = row['PERSON_ID']
        first = row.get('PLAYER_FIRST_NAME', '') or ''
        last = row.get('PLAYER_LAST_NAME', '') or ''
        pos = row.get('POSITION', '') or ''
        position_map[pid] = str(pos)
        name_map[pid] = f'{first} {last}'.strip()

    print(f'  Got positions for {len(position_map)} players', file=sys.stderr)
    time.sleep(RATE_LIMIT_DELAY)

    # Step 2: Fetch season-by-season stats via LeagueLeaders
    # LeagueLeaders works from 1946-47 onward and includes PLAYER_ID, TEAM, GP, PTS, REB, AST, STL, BLK
    stints: dict[tuple, dict] = defaultdict(lambda: {
        'gp': 0, 'ppg_w': 0.0, 'rpg_w': 0.0, 'apg_w': 0.0,
        'spg_w': 0.0, 'bpg_w': 0.0, 'positions': set(), 'player_id': None,
    })

    seasons = []
    for year in range(1960, 2025):
        next_yr = (year + 1) % 100
        seasons.append(f'{year}-{next_yr:02d}')

    print(f'Fetching {len(seasons)} seasons via LeagueLeaders...', file=sys.stderr)

    for i, season in enumerate(seasons):
        decade = season_to_decade(season)
        if decade not in DECADES:
            continue

        print(f'  [{i+1}/{len(seasons)}] {season} ({decade})...', file=sys.stderr)

        try:
            result = leagueleaders.LeagueLeaders(
                season=season,
                stat_category_abbreviation='PTS',
                per_mode48='PerGame',
                timeout=30,
            )
            df = result.get_data_frames()[0]
        except Exception as e:
            print(f'    Warning: {e}', file=sys.stderr)
            time.sleep(RATE_LIMIT_DELAY)
            continue

        for _, row in df.iterrows():
            player_id = row.get('PLAYER_ID')
            player_name = row.get('PLAYER', '')
            team_abbr = row.get('TEAM', '')
            gp = row.get('GP', 0) or 0

            if not player_name or not team_abbr or gp < 1:
                continue

            # Normalize team
            team_code = TEAM_ABBR_MAP.get(team_abbr, team_abbr)
            if team_code not in VALID_TEAMS:
                continue

            # Stats (per game) — STL/BLK are None pre-1973-74
            pts = row.get('PTS', 0.0) or 0.0
            reb = row.get('REB', 0.0) or 0.0
            ast = row.get('AST', 0.0) or 0.0
            stl = row.get('STL') if row.get('STL') is not None else 0.0
            blk = row.get('BLK') if row.get('BLK') is not None else 0.0
            stl = float(stl) if stl else 0.0
            blk = float(blk) if blk else 0.0

            # Get position from index
            pos_str = position_map.get(player_id, 'F')
            positions = normalize_position(pos_str)

            # Use name from PlayerIndex if available (better formatting)
            name = name_map.get(player_id, player_name)

            key = (name, team_code, decade)
            stint = stints[key]
            stint['gp'] += gp
            stint['ppg_w'] += pts * gp
            stint['rpg_w'] += reb * gp
            stint['apg_w'] += ast * gp
            stint['spg_w'] += stl * gp
            stint['bpg_w'] += blk * gp
            stint['positions'].update(positions)
            stint['player_id'] = player_id

        time.sleep(RATE_LIMIT_DELAY)

    # Step 3: Build output records
    print(f'\nProcessing {len(stints)} raw stints...', file=sys.stderr)
    players = []

    for (name, team, decade), stint in stints.items():
        gp = stint['gp']
        if gp < MIN_GAMES_PER_STINT:
            continue

        positions = sorted(stint['positions'],
                          key=lambda p: ['PG', 'SG', 'SF', 'PF', 'C'].index(p)
                          if p in ['PG', 'SG', 'SF', 'PF', 'C'] else 99)
        if not positions:
            continue

        ppg = round(stint['ppg_w'] / gp, 1)
        rpg = round(stint['rpg_w'] / gp, 1)
        apg = round(stint['apg_w'] / gp, 1)
        spg = round(stint['spg_w'] / gp, 1)
        bpg = round(stint['bpg_w'] / gp, 1)

        players.append({
            'name': name,
            'positions': positions,
            'team': team,
            'decade': decade,
            'stats': {'ppg': ppg, 'rpg': rpg, 'apg': apg, 'spg': spg, 'bpg': bpg},
        })

    # Sort for stable output
    players.sort(key=lambda p: (p['team'], p['decade'], -p['stats']['ppg'], p['name']))

    # Stats
    teams_found = set(p['team'] for p in players)
    decades_found = sorted(set(p['decade'] for p in players))
    combos = set((p['team'], p['decade']) for p in players)
    print(f'Output: {len(players)} stints across {len(teams_found)} teams, '
          f'decades: {decades_found}', file=sys.stderr)
    print(f'Team/decade combos populated: {len(combos)}', file=sys.stderr)

    # Step 4: Emit TypeScript
    out_path = os.path.join(os.path.dirname(__file__), '..', 'src', 'data', 'players.ts')
    with open(out_path, 'w') as f:
        f.write("import type { Player } from '../engine/types';\n\n")
        f.write("// Auto-generated from real NBA data via scripts/generate_players.py\n")
        f.write(f"// {len(players)} player stints, {len(combos)} team/decade combos\n")
        f.write("// Pre-1973-74: steals/blocks stored as 0 (handled by zero-exclusion rule)\n\n")
        f.write("export const players: Player[] = [\n")

        for p in players:
            name_escaped = p['name'].replace("\\", "\\\\").replace("'", "\\'")
            pos_list = ', '.join(f"'{pos}'" for pos in p['positions'])
            s = p['stats']
            f.write(f"  {{ name: '{name_escaped}', positions: [{pos_list}], "
                    f"team: '{p['team']}', decade: '{p['decade']}', "
                    f"stats: {{ ppg: {s['ppg']}, rpg: {s['rpg']}, apg: {s['apg']}, "
                    f"spg: {s['spg']}, bpg: {s['bpg']} }} }},\n")

        f.write("];\n")

    print(f'Wrote {out_path}', file=sys.stderr)


if __name__ == '__main__':
    main()
