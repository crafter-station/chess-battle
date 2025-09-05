import { useQuery } from "@tanstack/react-query";

import type { CustomerResult } from "@/app/api/customer/route";

export function useCustomer() {
  return useQuery({
    queryKey: ["customer"],
    queryFn: async () => {
      const res = await fetch("/api/customer");
      if (!res.ok) {
        try {
          const error = (await res.json()) as CustomerResult;
          if (error.success === false) {
            throw new Error(error.error, { cause: error.detail });
          }
        } catch {
          throw new Error("Failed to fetch customer");
        }
      }
      const data = (await res.json()) as CustomerResult;
      if (data.success === false) {
        throw new Error(data.error, { cause: data.detail });
      }
      return data.data;
    },
    refetchInterval: 1000 * 15, // 15 seconds
    retry: (failureCount, error) => {
      console.log(failureCount, error);
      return failureCount < 3;
    },
  });
}
