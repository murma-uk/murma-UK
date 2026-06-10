import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export function useIsTrusted() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["is-trusted", user?.id ?? null],
    enabled: !!user,
    queryFn: async () => {
      if (!user) return false;
      const { data, error } = await supabase
        .from("profiles")
        .select("is_trusted")
        .eq("user_id", user.id)
        .maybeSingle();
      if (error) return false;
      return !!data?.is_trusted;
    },
  });
}
