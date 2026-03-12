import { router, protectedProcedure } from "../init";
import { z } from "zod";
import { supabase } from "~/lib/supabase";

export const snapshotsRouter = router({
  recent: protectedProcedure
    .input(z.object({ days: z.number().min(1).max(365).default(30) }))
    .query(async ({ input }) => {
      const { data, error } = await supabase
        .from("portfolio_snapshots")
        .select("*")
        .order("snapshot_date", { ascending: false })
        .limit(input.days);

      if (error) throw new Error(error.message);
      return data;
    }),

  byDate: protectedProcedure
    .input(z.object({ date: z.string() }))
    .query(async ({ input }) => {
      const { data, error } = await supabase
        .from("portfolio_snapshots")
        .select("*")
        .eq("snapshot_date", input.date)
        .single();

      if (error && error.code !== "PGRST116") throw new Error(error.message);
      return data;
    }),
});
