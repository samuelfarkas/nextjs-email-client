'use client';

import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useCallback, useMemo, useRef } from 'react';
import { z } from 'zod/v4';

type UseTypedSearchParamsOptions = {
  scroll?: boolean;
};

export function useTypedSearchParams<T extends z.ZodObject<z.ZodRawShape>>(
  schema: T,
  options?: UseTypedSearchParamsOptions,
): {
  params: z.infer<T>;
  setParams: (updates: Partial<z.infer<T>>) => void;
  toQueryString: () => string;
} {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  // Use ref to read current searchParams at call time (makes setParams stable)
  const searchParamsRef = useRef(searchParams);
  searchParamsRef.current = searchParams;

  // Parse current params with schema defaults
  const params = useMemo(() => {
    const raw = Object.fromEntries(searchParams.entries());
    return schema.parse(raw) as z.infer<T>;
  }, [searchParams, schema]);

  // Compute defaults once for comparison
  const defaults = useMemo(() => schema.parse({}) as z.infer<T>, [schema]);

  // Stable setParams - reads searchParams from ref at call time
  const setParams = useCallback(
    (updates: Partial<z.infer<T>>) => {
      const newParams = new URLSearchParams(searchParamsRef.current.toString());

      for (const [key, value] of Object.entries(updates)) {
        if (value === null || value === undefined) {
          newParams.delete(key);
        } else if (value === defaults[key as keyof typeof defaults]) {
          // Remove from URL if value equals default
          newParams.delete(key);
        } else {
          newParams.set(key, String(value));
        }
      }

      const query = newParams.toString();
      router.replace(`${pathname}${query ? `?${query}` : ''}`, {
        scroll: options?.scroll ?? false,
      });
    },
    [router, pathname, defaults, options?.scroll],
  );

  // Get URL string preserving current non-default params (for links)
  const toQueryString = useCallback(() => {
    const nonDefaults = new URLSearchParams();

    for (const [key, value] of Object.entries(params)) {
      if (value !== defaults[key as keyof typeof defaults]) {
        nonDefaults.set(key, String(value));
      }
    }
    return nonDefaults.toString();
  }, [params, defaults]);

  return { params, setParams, toQueryString };
}
