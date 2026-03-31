import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FlaskConical } from "lucide-react";
import { instanceSettingsApi } from "@/api/instanceSettings";
import { useBreadcrumbs } from "../context/BreadcrumbContext";
import { queryKeys } from "../lib/queryKeys";
import { cn } from "../lib/utils";

export function InstanceExperimentalSettings() {
  const { setBreadcrumbs } = useBreadcrumbs();
  const queryClient = useQueryClient();
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    setBreadcrumbs([
      { label: "ตั้งค่าอินสแตนซ์" },
      { label: "ทดลอง" },
    ]);
  }, [setBreadcrumbs]);

  const experimentalQuery = useQuery({
    queryKey: queryKeys.instance.experimentalSettings,
    queryFn: () => instanceSettingsApi.getExperimental(),
  });

  const toggleMutation = useMutation({
    mutationFn: async (patch: { enableIsolatedWorkspaces?: boolean; autoRestartDevServerWhenIdle?: boolean }) =>
      instanceSettingsApi.updateExperimental(patch),
    onSuccess: async () => {
      setActionError(null);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.instance.experimentalSettings }),
        queryClient.invalidateQueries({ queryKey: queryKeys.health }),
      ]);
    },
    onError: (error) => {
      setActionError(error instanceof Error ? error.message : "ไม่สามารถอัปเดตการตั้งค่าทดลองได้");
    },
  });

  if (experimentalQuery.isLoading) {
    return <div className="text-sm text-muted-foreground">กำลังโหลดการตั้งค่าทดลอง...</div>;
  }

  if (experimentalQuery.error) {
    return (
      <div className="text-sm text-destructive">
        {experimentalQuery.error instanceof Error
          ? experimentalQuery.error.message
          : "ไม่สามารถโหลดการตั้งค่าทดลองได้"}
      </div>
    );
  }

  const enableIsolatedWorkspaces = experimentalQuery.data?.enableIsolatedWorkspaces === true;
  const autoRestartDevServerWhenIdle = experimentalQuery.data?.autoRestartDevServerWhenIdle === true;

  return (
    <div className="max-w-4xl space-y-6">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <FlaskConical className="h-5 w-5 text-muted-foreground" />
          <h1 className="text-lg font-semibold">ทดลอง</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          เลือกใช้ฟีเจอร์ที่ยังอยู่ระหว่างการประเมินก่อนที่จะกลายเป็นพฤติกรรมเริ่มต้น
        </p>
      </div>

      {actionError && (
        <div className="rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {actionError}
        </div>
      )}

      <section className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1.5">
            <h2 className="text-sm font-semibold">เปิดใช้งานพื้นที่ทำงานแยก</h2>
            <p className="max-w-2xl text-sm text-muted-foreground">
              แสดงตัวควบคุมพื้นที่ทำงานในการตั้งค่าโปรเจกต์ และอนุญาตพฤติกรรมพื้นที่ทำงานแยกสำหรับการรันงานใหม่และที่มีอยู่
            </p>
          </div>
          <button
            type="button"
            data-slot="toggle"
            aria-label="สลับการตั้งค่าทดลองพื้นที่ทำงานแยก"
            disabled={toggleMutation.isPending}
            className={cn(
              "relative inline-flex h-5 w-9 items-center rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-60",
              enableIsolatedWorkspaces ? "bg-green-600" : "bg-muted",
            )}
            onClick={() => toggleMutation.mutate({ enableIsolatedWorkspaces: !enableIsolatedWorkspaces })}
          >
            <span
              className={cn(
                "inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform",
                enableIsolatedWorkspaces ? "translate-x-4.5" : "translate-x-0.5",
              )}
            />
          </button>
        </div>
      </section>

      <section className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1.5">
            <h2 className="text-sm font-semibold">รีสตาร์ทเซิร์ฟเวอร์ dev อัตโนมัติเมื่อว่าง</h2>
            <p className="max-w-2xl text-sm text-muted-foreground">
              ใน `pnpm dev:once` รอให้การรันเอเจนต์ในเครื่องทั้งหมดที่อยู่ในคิวและกำลังทำงานเสร็จสิ้น จากนั้นรีสตาร์ทเซิร์ฟเวอร์โดยอัตโนมัติเมื่อการเปลี่ยนแปลงแบ็กเอนด์หรือการย้ายข้อมูลทำให้การบูตปัจจุบันล้าสมัย
            </p>
          </div>
          <button
            type="button"
            data-slot="toggle"
            aria-label="สลับการรีสตาร์ทเซิร์ฟเวอร์ dev อัตโนมัติ"
            disabled={toggleMutation.isPending}
            className={cn(
              "relative inline-flex h-5 w-9 items-center rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-60",
              autoRestartDevServerWhenIdle ? "bg-green-600" : "bg-muted",
            )}
            onClick={() =>
              toggleMutation.mutate({ autoRestartDevServerWhenIdle: !autoRestartDevServerWhenIdle })
            }
          >
            <span
              className={cn(
                "inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform",
                autoRestartDevServerWhenIdle ? "translate-x-4.5" : "translate-x-0.5",
              )}
            />
          </button>
        </div>
      </section>
    </div>
  );
}
