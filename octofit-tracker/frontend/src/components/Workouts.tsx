import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type WorkoutSuggestion = {
  title?: string;
  focus?: string;
  reason?: string;
};

export default function Workouts() {
  const [suggestions, setSuggestions] = useState<WorkoutSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const result = await getJson<{ suggestions?: WorkoutSuggestion[] }>('/api/workouts/suggestions/mona@example.com');
        if (!active) return;
        setSuggestions(result.suggestions ?? []);
      } catch {
        if (!active) return;
        setError('Unable to load workout suggestions.');
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
      title="Workout suggestions"
      description="Recommend workouts from activity patterns."
      loading={loading}
      error={error}
      empty={suggestions.length === 0 && !loading && !error}
      emptyMessage="No workout suggestions."
    >
      <ul className="list-group list-group-flush">
        {suggestions.map((suggestion, index) => (
          <li key={`${suggestion.title ?? 'workout'}-${index}`} className="list-group-item">
            <strong>{suggestion.title ?? 'Workout'}</strong>
            {suggestion.focus ? ` · ${suggestion.focus}` : ''}
            {suggestion.reason ? ` · ${suggestion.reason}` : ''}
          </li>
        ))}
      </ul>
    </CapabilityCard>
  );
}
