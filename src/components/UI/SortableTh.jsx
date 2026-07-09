import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';

export function SortableTh({ label, sortKey, currentKey, dir, onSort, style }) {
  const active = currentKey === sortKey;
  return (
    <th
      className="table-th"
      style={{ cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap', ...style }}
      onClick={() => onSort(sortKey)}
    >
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
        {label}
        {active
          ? (dir === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />)
          : <ChevronsUpDown size={12} color="var(--c-cbd5e1)" />
        }
      </span>
    </th>
  );
}
