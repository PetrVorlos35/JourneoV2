import { useState, useEffect } from 'react';
import api from '../../../services/api';

/**
 * Side data for the dashboard overview: pinned places, the cross-trip
 * settle-up rollup, and pending friend requests.
 *
 * Every call is independent and fails silently — a dead places endpoint must
 * degrade one tile to "—", never take the whole overview down with it. Trips
 * themselves are not fetched here; DashboardHome already owns them.
 *
 * `null` means "not known yet or unavailable", which is what the tiles render
 * their empty state from.
 */
const useOverviewData = () => {
  const [places, setPlaces] = useState(null);
  const [balances, setBalances] = useState(null);
  const [friendRequests, setFriendRequests] = useState(0);

  useEffect(() => {
    let alive = true;

    api.places.getAll()
      .then((d) => { if (alive) setPlaces(d.places || []); })
      .catch(() => {});

    api.trips.balancesSummary()
      .then((d) => { if (alive) setBalances(d); })
      .catch(() => {});

    api.friends.getRequests()
      .then((d) => { if (alive) setFriendRequests((d.requests || []).length); })
      .catch(() => {});

    return () => { alive = false; };
  }, []);

  return { places, balances, friendRequests };
};

export default useOverviewData;
