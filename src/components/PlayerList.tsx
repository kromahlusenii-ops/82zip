import { useState, useMemo } from 'react';
import type { Player, Pos } from '../engine/types';

interface Props {
  pool: Player[];
  filledSlots: Set<Pos>;
  selectedPlayer: Player | null;
  onSelect: (player: Player) => void;
  hideStats: boolean;
}

type PosFilter = 'All' | 'G' | 'F' | 'C';
type SortKey = 'ppg' | 'rpg' | 'apg' | 'spg' | 'bpg';

const POS_FILTERS: PosFilter[] = ['All', 'G', 'F', 'C'];
const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: 'ppg', label: 'PPG' },
  { key: 'rpg', label: 'RPG' },
  { key: 'apg', label: 'APG' },
  { key: 'spg', label: 'SPG' },
  { key: 'bpg', label: 'BPG' },
];

function matchesFilter(player: Player, filter: PosFilter): boolean {
  if (filter === 'All') return true;
  if (filter === 'G') return player.positions.some(p => p === 'PG' || p === 'SG');
  if (filter === 'F') return player.positions.some(p => p === 'SF' || p === 'PF');
  if (filter === 'C') return player.positions.includes('C');
  return true;
}

export function PlayerList({ pool, filledSlots, selectedPlayer, onSelect, hideStats }: Props) {
  const [posFilter, setPosFilter] = useState<PosFilter>('All');
  const [sortKey, setSortKey] = useState<SortKey>('ppg');
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    let result = pool.filter(p => matchesFilter(p, posFilter));
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(p => p.name.toLowerCase().includes(q));
    }
    result.sort((a, b) => b.stats[sortKey] - a.stats[sortKey]);
    return result;
  }, [pool, posFilter, sortKey, search]);

  if (pool.length === 0) {
    return (
      <div className="text-gray-400 text-center py-8 text-sm">
        No players available. Spin again.
      </div>
    );
  }

  return (
    <div>
      {/* Filter bar */}
      <div className="flex items-center gap-2 mb-2 flex-wrap">
        <div className="flex bg-gray-100 rounded-full p-0.5">
          {POS_FILTERS.map(f => (
            <button
              key={f}
              onClick={() => setPosFilter(f)}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition ${
                posFilter === f ? 'bg-gray-900 text-white' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
        <input
          type="text"
          placeholder="Search..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 min-w-[80px] px-3 py-1.5 text-xs border border-gray-200 rounded-full bg-white text-gray-800 placeholder-gray-400 outline-none focus:border-orange-400"
        />
        {!hideStats && (
          <select
            value={sortKey}
            onChange={e => setSortKey(e.target.value as SortKey)}
            className="px-2 py-1.5 text-xs border border-gray-200 rounded-full bg-white text-gray-700 outline-none"
          >
            {SORT_OPTIONS.map(o => (
              <option key={o.key} value={o.key}>{o.label}</option>
            ))}
          </select>
        )}
      </div>

      <div className="text-xs text-gray-400 mb-2">{filtered.length} players available</div>

      {/* Player list */}
      <div className="space-y-0 max-h-[50vh] overflow-y-auto divide-y divide-gray-100">
        {filtered.map((player, i) => {
          const hasSlot = player.positions.some(p => !filledSlots.has(p));
          const isSelected = selectedPlayer === player;

          return (
            <button
              key={`${player.name}-${player.team}-${player.decade}-${i}`}
              onClick={() => hasSlot && onSelect(player)}
              disabled={!hasSlot}
              className={`w-full text-left py-3 px-2 transition flex items-center justify-between ${
                isSelected
                  ? 'bg-orange-50'
                  : hasSlot
                  ? 'hover:bg-gray-50'
                  : 'opacity-35 cursor-not-allowed'
              }`}
            >
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-gray-900 font-semibold text-sm truncate">{player.name}</span>
                  {!hasSlot && (
                    <span className="text-[10px] text-red-500 bg-red-50 px-1.5 py-0.5 rounded shrink-0">No slot</span>
                  )}
                </div>
                <div className="text-[11px] text-gray-400">
                  {player.positions.join(' · ')}{' '}
                  <span className="text-gray-300">|</span>{' '}
                  {player.team} · {player.decade}
                </div>
              </div>
              {!hideStats && (
                <div className="flex gap-2 text-[11px] text-gray-500 shrink-0 ml-2 tabular-nums">
                  <span className="w-8 text-right font-medium text-gray-800">{player.stats.ppg}</span>
                  <span className="w-7 text-right">{player.stats.rpg}</span>
                  <span className="w-7 text-right">{player.stats.apg}</span>
                  <span className="w-7 text-right">{player.stats.spg}</span>
                  <span className="w-7 text-right">{player.stats.bpg}</span>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Stat column headers */}
      {!hideStats && filtered.length > 0 && (
        <div className="flex justify-end gap-2 text-[10px] text-gray-400 mt-1 pr-2 tabular-nums">
          <span className="w-8 text-right">PPG</span>
          <span className="w-7 text-right">RPG</span>
          <span className="w-7 text-right">APG</span>
          <span className="w-7 text-right">SPG</span>
          <span className="w-7 text-right">BPG</span>
        </div>
      )}
    </div>
  );
}
