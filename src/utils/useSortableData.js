import { useState, useMemo } from 'react';

// columns: map of key -> get(row) => comparable value (string|number). Falls back to row[key].
export function useSortableData(data, columns = {}) {
  const [sortKey, setSortKey] = useState(null);
  const [sortDir, setSortDir] = useState('asc');

  const sorted = useMemo(() => {
    if (!sortKey) return data;
    const getValue = columns[sortKey] || (row => row[sortKey]);
    const copy = [...data];
    copy.sort((a, b) => {
      const va = getValue(a);
      const vb = getValue(b);
      if (va == null && vb == null) return 0;
      if (va == null) return 1;
      if (vb == null) return -1;
      if (typeof va === 'number' && typeof vb === 'number') return va - vb;
      return String(va).localeCompare(String(vb), 'id');
    });
    if (sortDir === 'desc') copy.reverse();
    return copy;
  }, [data, sortKey, sortDir, columns]);

  const requestSort = key => {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  return { sorted, sortKey, sortDir, requestSort };
}
