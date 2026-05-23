"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/common/empty-state";
import { deleteGeneration, listGenerations } from "../api/history-api";
import { useGenerationStore } from "@/store/generation-store";
import type { GenerationRecord } from "@/types/provider";

type HistoryListProps = {
  emptyLabel: string;
};

export const HistoryList = ({ emptyLabel }: HistoryListProps) => {
  const router = useRouter();
  const [records, setRecords] = useState<GenerationRecord[]>([]);
  const [error, setError] = useState("");
  const setReusePrompt = useGenerationStore((state) => state.setReusePrompt);

  const refresh = useCallback(async () => {
    try {
      setRecords(await listGenerations());
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Failed to load history.");
    }
  }, []);

  const handleDelete = useCallback(
    async (id: string) => {
      await deleteGeneration(id);
      await refresh();
    },
    [refresh],
  );

  const handleReuse = useCallback(
    (prompt: string) => {
      setReusePrompt(prompt);
      router.push("/zh/generate");
    },
    [router, setReusePrompt],
  );

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      try {
        const nextRecords = await listGenerations();

        if (isMounted) {
          setRecords(nextRecords);
        }
      } catch (caught) {
        if (isMounted) {
          setError(caught instanceof Error ? caught.message : "Failed to load history.");
        }
      }
    };

    void load();

    return () => {
      isMounted = false;
    };
  }, []);

  if (records.length === 0) {
    return <EmptyState title={emptyLabel} />;
  }

  return (
    <div className="space-y-3">
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {records.map((record) => (
        <Card key={record.id}>
          <CardContent className="flex flex-col gap-4 pt-5 md:flex-row md:items-center md:justify-between">
            <div className="space-y-1">
              <p className="font-medium">{record.prompt}</p>
              <p className="text-sm text-muted-foreground">
                {record.provider} · {record.model_id} · {record.status}
              </p>
              <p className="text-xs text-muted-foreground">
                {record.output_image_paths.length} output file(s)
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => handleReuse(record.prompt)}>
                Reuse
              </Button>
              <Button variant="danger" onClick={() => handleDelete(record.id)}>
                Delete
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
