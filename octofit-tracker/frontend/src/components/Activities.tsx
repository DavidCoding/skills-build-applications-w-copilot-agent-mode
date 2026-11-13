import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type ActivityItem = {
  type?: string;
  minutes?: number;
  points?: number;
};

export default function Activities() {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const result = await getJson<{ activities?: ActivityItem[] }>('/api/activities');
        if (!active) return;
        setActivities(result.activities ?? []);
      } catch {
        if (!active) return;
        setError('Unable to load activities.');
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
      title="Activities"
      description="Track student activity minutes and points."
      loading={loading}
      error={error}
      empty={activities.length === 0 && !loading && !error}
      emptyMessage="No activities."
    >
      <ul className="list-group list-group-flush">
        {activities.map((activity, index) => (
          <li key={`${activity.type ?? 'activity'}-${index}`} className="list-group-item">
            <strong>{activity.type ?? 'Activity'}</strong> · {activity.minutes ?? 0} minutes · {activity.points ?? 0} points
          </li>
        ))}
      </ul>
    </CapabilityCard>
  );
}
