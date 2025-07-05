// hooks/useSafeSearchParams.ts
'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function useSafeSearchParams() {
  const [params, setParams] = useState<URLSearchParams | null>(null);
  const searchParams = useSearchParams();

  useEffect(() => {
    setParams(searchParams);
  }, [searchParams]);

  return params;
}