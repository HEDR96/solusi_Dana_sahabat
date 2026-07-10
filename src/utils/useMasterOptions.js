import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

// Opsi dropdown dari tabel master_options (dikelola owner di menu Master Data).
// Fallback dipakai selama loading / jika tabel belum ada.
export function useMasterOptions(category, fallback = []) {
  const [options, setOptions] = useState(fallback);
  useEffect(() => {
    let alive = true;
    supabase
      .from('master_options')
      .select('value,sort')
      .eq('category', category)
      .eq('active', true)
      .order('sort')
      .then(({ data }) => {
        if (alive && data?.length) setOptions(data.map(d => d.value));
      });
    return () => { alive = false; };
  }, [category]);
  return options;
}

// Versi berpasangan {value, label} — untuk kategori yang kunci ≠ tampilan
// (role, activity_type, activity_outcome). Fallback: [{value, label}, ...]
export function useMasterPairs(category, fallback = []) {
  const [pairs, setPairs] = useState(fallback);
  useEffect(() => {
    let alive = true;
    supabase
      .from('master_options')
      .select('value,label,sort')
      .eq('category', category)
      .eq('active', true)
      .order('sort')
      .then(({ data }) => {
        if (alive && data?.length) setPairs(data.map(d => ({ value: d.value, label: d.label || d.value })));
      });
    return () => { alive = false; };
  }, [category]);
  return pairs;
}
