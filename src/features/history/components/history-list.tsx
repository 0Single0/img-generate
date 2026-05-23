"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Calendar,
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  Eye,
  ImageOff,
  Loader2,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils/cn";
import { createSignedUrl, deleteGeneration, listGenerations } from "../api/history-api";
import type { GenerationListParams, GenerationRecord } from "@/types/provider";

type HistoryListProps = {
  emptyLabel: string;
};

type StatusFilter = "all" | GenerationRecord["status"];
type PreviewUrls = Record<string, string>;
type DatePickerFieldProps = {
  value: string;
  min?: string;
  max?: string;
  onChange: (value: string) => void;
};

const pageSizeOptions = [10, 20, 50];
const weekDays = ["\u65e5", "\u4e00", "\u4e8c", "\u4e09", "\u56db", "\u4e94", "\u516d"];

const text = {
  actions: "\u64cd\u4f5c",
  all: "\u5168\u90e8",
  allModels: "\u5168\u90e8\u6a21\u578b",
  clear: "\u6e05\u9664",
  createdAt: "\u521b\u5efa\u65f6\u95f4",
  datePlaceholder: "\u5e74 / \u6708 / \u65e5",
  delete: "\u5220\u9664",
  duration: "\u8017\u65f6",
  failed: "\u5931\u8d25",
  imagePreview: "\u56fe\u7247\u9884\u89c8",
  itemsPerPage: "\u6761/\u9875",
  model: "\u6a21\u578b",
  month: "\u6708",
  pageSize: "\u6bcf\u9875\u6761\u6570",
  pending: "\u5904\u7406\u4e2d",
  prompt: "\u63d0\u793a\u8bcd",
  search: "\u641c\u7d22",
  searchPlaceholder: "\u641c\u7d22\u5173\u952e\u8bcd\u6216\u4efb\u52a1 ID",
  size: "\u5c3a\u5bf8",
  status: "\u72b6\u6001",
  succeeded: "\u6210\u529f",
  taskId: "\u4efb\u52a1 ID",
  today: "\u4eca\u5929",
  totalPrefix: "\u5171",
  totalSuffix: "\u6761",
  view: "\u67e5\u770b",
  year: "\u5e74",
} as const;

const statusLabels: Record<GenerationRecord["status"], string> = {
  pending: text.pending,
  succeeded: text.succeeded,
  failed: text.failed,
};

const modelLabels: Record<string, string> = {
  all: text.allModels,
  chatgpt: "ChatGPT Image",
  openai: "OpenAI",
  seedream: "Seedance",
};

const statusFilters: Array<{ label: string; value: StatusFilter }> = [
  { label: text.all, value: "all" },
  { label: text.succeeded, value: "succeeded" },
  { label: text.failed, value: "failed" },
  { label: text.pending, value: "pending" },
];

const formatDateTime = (value?: string) => {
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  const pad = (unit: number) => unit.toString().padStart(2, "0");

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(
    date.getHours(),
  )}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
};

const getDateEnd = (value: string) => (value ? `${value}T23:59:59.999` : undefined);

const getSizeLabel = (record: GenerationRecord) => record.params.size ?? "1024 x 1024";

const getPreviewPath = (record: GenerationRecord) => record.output_image_paths[0];

const getDateValue = (date: Date) => {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const getDateLabel = (value: string) => {
  if (!value) {
    return text.datePlaceholder;
  }

  const [year, month, day] = value.split("-");
  return `${year} / ${month} / ${day}`;
};

const getInitialMonth = (value: string) => {
  if (value) {
    const [year, month] = value.split("-").map(Number);
    return new Date(year, month - 1, 1);
  }

  const today = new Date();
  return new Date(today.getFullYear(), today.getMonth(), 1);
};

const getMonthDays = (viewMonth: Date) => {
  const year = viewMonth.getFullYear();
  const month = viewMonth.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const lastDate = new Date(year, month + 1, 0).getDate();
  const previousLastDate = new Date(year, month, 0).getDate();
  const days: Array<{ label: number; value: string; isMuted: boolean }> = [];

  for (let index = firstDay - 1; index >= 0; index -= 1) {
    const date = new Date(year, month - 1, previousLastDate - index);
    days.push({ label: date.getDate(), value: getDateValue(date), isMuted: true });
  }

  for (let day = 1; day <= lastDate; day += 1) {
    const date = new Date(year, month, day);
    days.push({ label: day, value: getDateValue(date), isMuted: false });
  }

  while (days.length < 42) {
    const date = new Date(year, month + 1, days.length - firstDay - lastDate + 1);
    days.push({ label: date.getDate(), value: getDateValue(date), isMuted: true });
  }

  return days;
};

const getVisiblePages = (page: number, pageCount: number) => {
  if (pageCount <= 5) {
    return Array.from({ length: pageCount }, (_, index) => index + 1);
  }

  const start = Math.max(1, Math.min(page - 2, pageCount - 4));
  return Array.from({ length: 5 }, (_, index) => start + index);
};

const DatePickerField = ({ value, min, max, onChange }: DatePickerFieldProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [viewMonth, setViewMonth] = useState(() => getInitialMonth(value));
  const days = useMemo(() => getMonthDays(viewMonth), [viewMonth]);
  const today = getDateValue(new Date());

  const handleToggle = useCallback(() => {
    setViewMonth(getInitialMonth(value));
    setIsOpen((current) => !current);
  }, [value]);

  const handleMonthChange = useCallback((offset: number) => {
    setViewMonth((current) => new Date(current.getFullYear(), current.getMonth() + offset, 1));
  }, []);

  const handleSelectDate = useCallback(
    (nextValue: string) => {
      onChange(nextValue);
      setIsOpen(false);
    },
    [onChange],
  );

  const handleClear = useCallback(() => {
    onChange("");
    setIsOpen(false);
  }, [onChange]);

  const handleToday = useCallback(() => {
    onChange(today);
    setIsOpen(false);
  }, [onChange, today]);

  return (
    <div className="relative h-10 w-[150px]">
      <button
        className="flex h-10 w-full items-center justify-between rounded-md border border-[#e8edf5] bg-white px-3 text-left text-sm text-[#5d6688] shadow-none transition-colors hover:bg-[#fbfbff] focus:outline-none focus:ring-2 focus:ring-[#6f5cff]/25"
        onClick={handleToggle}
        type="button"
      >
        <span className={cn(!value && "text-[#96a0ba]")}>{getDateLabel(value)}</span>
        <Calendar className="size-4 text-[#8992b0]" />
      </button>

      {isOpen ? (
        <div className="absolute left-0 top-11 z-40 w-[244px] rounded-lg border border-[#edf1f7] bg-white p-3 shadow-[0_18px_45px_rgba(46,56,98,0.16)]">
          <div className="mb-2 flex items-center justify-between">
            <button
              aria-label="Previous month"
              className="flex size-7 items-center justify-center rounded-md text-[#6b7598] hover:bg-[#f4f3ff]"
              onClick={() => handleMonthChange(-1)}
              type="button"
            >
              <ChevronLeft className="size-4" />
            </button>
            <div className="text-sm font-semibold text-[#17213f]">
              {viewMonth.getFullYear()}{text.year}{viewMonth.getMonth() + 1}{text.month}
            </div>
            <button
              aria-label="Next month"
              className="flex size-7 items-center justify-center rounded-md text-[#6b7598] hover:bg-[#f4f3ff]"
              onClick={() => handleMonthChange(1)}
              type="button"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-[#7c86a6]">
            {weekDays.map((day) => (
              <div key={day} className="py-1">
                {day}
              </div>
            ))}
          </div>
          <div className="mt-1 grid grid-cols-7 gap-1">
            {days.map((day) => {
              const isSelected = day.value === value;
              const isToday = day.value === today;
              const isDisabled = Boolean((min && day.value < min) || (max && day.value > max));

              return (
                <button
                  key={day.value}
                  className={cn(
                    "flex size-7 items-center justify-center rounded-md text-xs font-medium transition-colors",
                    day.isMuted ? "text-[#a4acc3]" : "text-[#263252]",
                    isToday && "bg-[#f3f0ff] text-[#4b35ef]",
                    isSelected && "bg-[#5b4df5] text-white hover:bg-[#5b4df5]",
                    isDisabled ? "cursor-not-allowed opacity-35" : "hover:bg-[#f4f3ff]",
                  )}
                  disabled={isDisabled}
                  onClick={() => handleSelectDate(day.value)}
                  type="button"
                >
                  {day.label}
                </button>
              );
            })}
          </div>
          <div className="mt-3 flex items-center justify-between border-t border-[#edf1f7] pt-2">
            <button
              className="text-xs font-medium text-[#7a84a6] hover:text-[#4b35ef]"
              onClick={handleClear}
              type="button"
            >
              {text.clear}
            </button>
            <button
              className="text-xs font-medium text-[#4b35ef]"
              onClick={handleToday}
              type="button"
            >
              {text.today}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export const HistoryList = ({ emptyLabel }: HistoryListProps) => {
  const [records, setRecords] = useState<GenerationRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [availableModels, setAvailableModels] = useState<string[]>(["all"]);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [queryDraft, setQueryDraft] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [modelFilter, setModelFilter] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [previewUrls, setPreviewUrls] = useState<PreviewUrls>({});
  const [isLoading, setIsLoading] = useState(true);

  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, pageCount);
  const modelOptions = useMemo(
    () => Array.from(new Set(["all", ...availableModels, modelFilter])),
    [availableModels, modelFilter],
  );

  const params = useMemo<GenerationListParams>(
    () => ({
      q: query || undefined,
      status: statusFilter,
      model: modelFilter,
      start: startDate ? `${startDate}T00:00:00.000` : undefined,
      end: getDateEnd(endDate),
      page: safePage,
      pageSize,
    }),
    [endDate, modelFilter, pageSize, query, safePage, startDate, statusFilter],
  );

  const applyResponse = useCallback(async () => {
    try {
      const response = await listGenerations(params);
      setRecords(response.items);
      setTotal(response.total);
      setAvailableModels(["all", ...response.models]);
      setError("");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Failed to load history.");
    } finally {
      setIsLoading(false);
    }
  }, [params]);

  const handleDelete = useCallback(
    async (id: string) => {
      setIsLoading(true);
      await deleteGeneration(id);
      await applyResponse();
    },
    [applyResponse],
  );

  const handleStatusChange = useCallback((value: StatusFilter) => {
    setIsLoading(true);
    setStatusFilter(value);
    setPage(1);
  }, []);

  const handleQuerySubmit = useCallback(() => {
    setIsLoading(true);
    setQuery(queryDraft.trim());
    setPage(1);
  }, [queryDraft]);

  const handleDateChange = useCallback((kind: "start" | "end", value: string) => {
    setIsLoading(true);

    if (kind === "start") {
      setStartDate(value);
    } else {
      setEndDate(value);
    }

    setPage(1);
  }, []);

  const handleModelChange = useCallback((value: string) => {
    setIsLoading(true);
    setModelFilter(value);
    setPage(1);
  }, []);

  const handlePageSizeChange = useCallback((value: string) => {
    setIsLoading(true);
    setPageSize(Number(value));
    setPage(1);
  }, []);

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      try {
        const response = await listGenerations(params);

        if (isMounted) {
          setRecords(response.items);
          setTotal(response.total);
          setAvailableModels(["all", ...response.models]);
          setError("");
        }
      } catch (caught) {
        if (isMounted) {
          setError(caught instanceof Error ? caught.message : "Failed to load history.");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void load();

    return () => {
      isMounted = false;
    };
  }, [params]);

  useEffect(() => {
    const loadPreviews = async () => {
      const missingRecords = records.filter((record) => {
        const path = getPreviewPath(record);
        return path && !previewUrls[record.id];
      });

      if (missingRecords.length === 0) {
        return;
      }

      const nextEntries = await Promise.all(
        missingRecords.map(async (record) => {
          const path = getPreviewPath(record);

          if (!path) {
            return [record.id, ""] as const;
          }

          try {
            const result = await createSignedUrl(path);
            return [record.id, result.signedUrl] as const;
          } catch {
            return [record.id, ""] as const;
          }
        }),
      );

      setPreviewUrls((current) => ({
        ...current,
        ...Object.fromEntries(nextEntries),
      }));
    };

    void loadPreviews();
  }, [previewUrls, records]);

  return (
    <div className="flex min-h-[calc(100vh-var(--shell-header)-72px)] flex-col gap-4">
      <Card className="border-[#edf1f7] bg-white/95 p-3 shadow-[0_10px_28px_rgba(66,74,112,0.06)]">
        <div className="flex flex-wrap items-center gap-2">
          <label className="relative h-10 w-full max-w-[380px] sm:w-[320px] xl:w-[360px]">
            <span className="sr-only">{text.searchPlaceholder}</span>
            <Input
              className="h-10 border-[#e8edf5] bg-white pr-10 text-[#20294d] shadow-none placeholder:text-[#96a0ba] focus:ring-[#6f5cff]/25"
              onChange={(event) => setQueryDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  handleQuerySubmit();
                }
              }}
              placeholder={text.searchPlaceholder}
              value={queryDraft}
            />
            <button
              aria-label={text.search}
              className="absolute right-2 top-1/2 flex size-7 -translate-y-1/2 items-center justify-center rounded-md text-[#7580a5] hover:bg-[#f2f0ff] hover:text-[#4b35ef]"
              onClick={handleQuerySubmit}
              type="button"
            >
              <Search className="size-4" />
            </button>
          </label>

          <DatePickerField
            max={endDate || undefined}
            onChange={(value) => handleDateChange("start", value)}
            value={startDate}
          />

          <DatePickerField
            min={startDate || undefined}
            onChange={(value) => handleDateChange("end", value)}
            value={endDate}
          />

          <Select onValueChange={handleModelChange} value={modelFilter}>
            <SelectTrigger className="h-10 w-[150px] border-[#e8edf5] bg-white text-[#5d6688] shadow-none focus:ring-[#6f5cff]/25">
              <SelectValue placeholder={text.allModels} />
            </SelectTrigger>
            <SelectContent>
              {modelOptions.map((model) => (
                <SelectItem key={model} value={model}>
                  {modelLabels[model] ?? model}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="ml-auto flex h-10 overflow-hidden rounded-md border border-[#e8edf5] bg-white max-sm:ml-0">
            {statusFilters.map((filter) => (
              <button
                key={filter.value}
                className={cn(
                  "min-w-[66px] whitespace-nowrap border-r border-[#e8edf5] px-3 text-sm font-semibold leading-none transition-colors last:border-r-0",
                  "hover:bg-[#f6f4ff]",
                  filter.value === "all" && "text-[#4b35ef]",
                  filter.value === "succeeded" && "text-[#22af64]",
                  filter.value === "failed" && "text-[#ef4444]",
                  filter.value === "pending" && "text-[#f97316]",
                  statusFilter === filter.value && "bg-[#f3f0ff] ring-1 ring-inset ring-[#8272f7]",
                  statusFilter === filter.value && filter.value === "succeeded" && "bg-[#f2fff7]",
                  statusFilter === filter.value && filter.value === "failed" && "bg-[#fff6f6]",
                  statusFilter === filter.value && filter.value === "pending" && "bg-[#fff8ee]",
                )}
                onClick={() => handleStatusChange(filter.value)}
                type="button"
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {error ? <p className="rounded-md bg-[#fff4f4] px-4 py-3 text-sm text-[#d73737]">{error}</p> : null}

      <Card className="flex flex-1 flex-col overflow-hidden border-[#edf1f7] bg-white/95 p-2 shadow-[0_14px_38px_rgba(68,78,122,0.08)]">
        <div className="relative flex-1 overflow-auto">
          {isLoading ? (
            <div className="absolute inset-0 z-10 flex min-h-80 items-center justify-center bg-white/70 backdrop-blur-[1px]">
              <Loader2 className="size-6 animate-spin text-[#5b3ff2]" />
            </div>
          ) : null}
          <table className="w-full min-w-[980px] border-collapse text-left text-sm text-[#20294d]">
            <thead>
              <tr className="h-11 bg-[#f9faff] text-xs font-semibold text-[#606b8f]">
                <th className="w-24 px-3">{text.imagePreview}</th>
                <th className="w-28 px-3">{text.taskId}</th>
                <th className="w-64 px-3">{text.prompt}</th>
                <th className="w-36 px-3">{text.model}</th>
                <th className="w-28 px-3">{text.size}</th>
                <th className="w-24 px-3">{text.status}</th>
                <th className="w-20 px-3">{text.duration}</th>
                <th className="w-40 px-3">{text.createdAt}</th>
                <th className="w-32 px-3">{text.actions}</th>
              </tr>
            </thead>
            <tbody>
              {records.length === 0 ? (
                <tr>
                  <td colSpan={9}>
                    <div className="flex min-h-72 flex-col items-center justify-center text-center text-[#7a84a6]">
                      <ImageOff className="mb-3 size-8" />
                      <p className="font-medium">{emptyLabel}</p>
                    </div>
                  </td>
                </tr>
              ) : (
                records.map((record) => {
                  const previewUrl = previewUrls[record.id];
                  const status = record.status;
                  const displayId = record.request_id || record.id;
                  const shortId = displayId.slice(0, 8);

                  return (
                    <tr key={record.id} className="h-[68px] border-b border-[#edf1f7] last:border-b-0">
                      <td className="px-3">
                        <div className="flex h-12 w-[72px] items-center justify-center overflow-hidden rounded-md bg-[#eef1f7]">
                          {previewUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img alt={record.prompt} className="h-full w-full object-cover" src={previewUrl} />
                          ) : (
                            <ImageOff className="size-5 text-[#9aa4bf]" />
                          )}
                        </div>
                      </td>
                      <td className="px-3">
                        <button
                          className="inline-flex items-center gap-1.5 font-medium text-[#101936]"
                          onClick={() => void navigator.clipboard?.writeText(displayId)}
                          type="button"
                        >
                          {shortId}
                          <Copy className="size-3.5 text-[#8c96b5]" />
                        </button>
                      </td>
                      <td className="max-w-[260px] truncate px-3 font-medium text-[#273457]">{record.prompt}</td>
                      <td className="px-3 text-[#4f5d84]">{modelLabels[record.provider] ?? record.model_id}</td>
                      <td className="px-3 text-[#4f5d84]">{getSizeLabel(record)}</td>
                      <td className="px-3">
                        <span
                          className={cn(
                            "inline-flex h-8 items-center rounded-md px-3 text-xs font-semibold",
                            status === "succeeded" && "bg-[#eaf9f0] text-[#25ad62]",
                            status === "failed" && "bg-[#fff1f1] text-[#ef4444]",
                            status === "pending" && "bg-[#fff4e5] text-[#f97316]",
                          )}
                        >
                          {status === "succeeded" ? <Check className="mr-1 size-3.5" /> : null}
                          {status === "failed" ? <X className="mr-1 size-3.5" /> : null}
                          {statusLabels[status]}
                        </span>
                      </td>
                      <td className="px-3 text-[#273457]">{status === "succeeded" ? "18.6s" : "-"}</td>
                      <td className="px-3 text-[#4f5d84]">{formatDateTime(record.created_at)}</td>
                      <td className="px-3">
                        <div className="flex items-center gap-2">
                          <Button
                            className="h-8 rounded-md border border-transparent bg-[#f7f7ff] px-3 text-xs text-[#4b35ef] hover:bg-[#efecff]"
                            disabled={!previewUrl}
                            onClick={() => previewUrl && window.open(previewUrl, "_blank")}
                            type="button"
                            variant="ghost"
                          >
                            <Eye className="size-3.5" />
                            {text.view}
                          </Button>
                          <Button
                            className="h-8 rounded-md border border-transparent bg-[#fff7f7] px-3 text-xs text-[#ef4444] hover:bg-[#fff0f0]"
                            onClick={() => void handleDelete(record.id)}
                            type="button"
                            variant="ghost"
                          >
                            <Trash2 className="size-3.5" />
                            {text.delete}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <div className="mt-auto flex flex-wrap items-center justify-end gap-2 border-t border-[#edf1f7] px-2 py-3 text-sm text-[#3a456a]">
          <span className="mr-2">
            {text.totalPrefix} {total} {text.totalSuffix}
          </span>
          <button
            aria-label="Previous page"
            className="flex size-9 items-center justify-center rounded-md border border-[#e8edf5] bg-white text-[#687395] disabled:opacity-40"
            disabled={safePage <= 1}
            onClick={() => {
              setIsLoading(true);
              setPage((current) => Math.max(1, current - 1));
            }}
            type="button"
          >
            <ChevronLeft className="size-4" />
          </button>
          {getVisiblePages(safePage, pageCount).map((pageNumber) => (
            <button
              key={pageNumber}
              className={cn(
                "flex size-9 items-center justify-center rounded-md border bg-white font-semibold",
                safePage === pageNumber
                  ? "border-[#8272f7] text-[#4b35ef]"
                  : "border-transparent text-[#3a456a]",
              )}
              onClick={() => {
                setIsLoading(true);
                setPage(pageNumber);
              }}
              type="button"
            >
              {pageNumber}
            </button>
          ))}
          <button
            aria-label="Next page"
            className="flex size-9 items-center justify-center rounded-md border border-[#e8edf5] bg-white text-[#687395] disabled:opacity-40"
            disabled={safePage >= pageCount}
            onClick={() => {
              setIsLoading(true);
              setPage((current) => Math.min(pageCount, current + 1));
            }}
            type="button"
          >
            <ChevronRight className="size-4" />
          </button>
          <Select onValueChange={handlePageSizeChange} value={pageSize.toString()}>
            <SelectTrigger className="ml-2 h-9 w-[112px] border-[#e8edf5] bg-white text-[#3a456a] shadow-none">
              <SelectValue aria-label={text.pageSize} />
            </SelectTrigger>
            <SelectContent>
              {pageSizeOptions.map((option) => (
                <SelectItem key={option} value={option.toString()}>
                  {option} {text.itemsPerPage}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </Card>
    </div>
  );
};
