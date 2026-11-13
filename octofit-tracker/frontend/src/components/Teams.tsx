import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type TeamItem = {
  name?: string;
  mascot?: string;
  members?: Array<string | { _id?: string; id?: string; toString?: () => string }>;
};

export default function Teams() {
  const [teams, setTeams] = useState<TeamItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const result = await getJson<{ teams?: TeamItem[] }>('/api/teams');
        if (!active) return;
        setTeams(result.teams ?? []);
      } catch {
        if (!active) return;
        setError('Unable to load teams.');
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
      title="Teams"
      description="Manage teams and members."
      loading={loading}
      error={error}
      empty={teams.length === 0 && !loading && !error}
      emptyMessage="No teams."
    >
      <ul className="list-group list-group-flush">
        {teams.map((team, index) => (
          <li key={`${team.name ?? 'team'}-${index}`} className="list-group-item">
            <strong>{team.name ?? 'Unknown team'}</strong>
            {team.mascot ? ` · ${team.mascot}` : ''}
            {team.members && team.members.length > 0 ? ` · Members: ${team.members.length}` : ''}
          </li>
        ))}
      </ul>
    </CapabilityCard>
  );
}
