import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type LeaderboardEntry = {
  teamName?: string;
  totalPoints?: number;
  rank?: number;
};

export default function Leaderboard() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const result = await getJson<{ leaderboard?: LeaderboardEntry[] }>('/api/leaderboard');
        if (!active) return;
        setLeaderboard(result.leaderboard ?? []);
      } catch {
        if (!active) return;
        setError('Unable to load leaderboard.');
      } finally {
        if (active) setLoading(false);
      }
    }

    void load();
    return () => {
      active = false;
    };
  }, []);

  return (
    <CapabilityCard
      title="Leaderboard"
      description="Compare team point totals."
      loading={loading}
      error={error}
      empty={leaderboard.length === 0 && !loading && !error}
      emptyMessage="No leaderboard rankings."
    >
      <ol className="mb-0 ps-3">
        {leaderboard.map((entry, index) => (
          <li key={`${entry.teamName ?? 'team'}-${index}`}>
            <strong>{entry.teamName ?? 'Unknown team'}</strong> · {entry.totalPoints ?? 0} points · Rank #{entry.rank ?? index + 1}
          </li>
        ))}
      </ol>
    </CapabilityCard>
  );
}
