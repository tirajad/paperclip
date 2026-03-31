import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useParams, useSearchParams } from "@/lib/router";
import { accessApi } from "../api/access";
import { authApi } from "../api/auth";
import { queryKeys } from "../lib/queryKeys";
import { Button } from "@/components/ui/button";

export function BoardClaimPage() {
  const queryClient = useQueryClient();
  const params = useParams();
  const [searchParams] = useSearchParams();
  const token = (params.token ?? "").trim();
  const code = (searchParams.get("code") ?? "").trim();
  const currentPath = useMemo(
    () => `/board-claim/${encodeURIComponent(token)}${code ? `?code=${encodeURIComponent(code)}` : ""}`,
    [token, code],
  );

  const sessionQuery = useQuery({
    queryKey: queryKeys.auth.session,
    queryFn: () => authApi.getSession(),
    retry: false,
  });
  const statusQuery = useQuery({
    queryKey: ["board-claim", token, code],
    queryFn: () => accessApi.getBoardClaimStatus(token, code),
    enabled: token.length > 0 && code.length > 0,
    retry: false,
  });

  const claimMutation = useMutation({
    mutationFn: () => accessApi.claimBoard(token, code),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.auth.session });
      await queryClient.invalidateQueries({ queryKey: queryKeys.health });
      await queryClient.invalidateQueries({ queryKey: queryKeys.companies.all });
      await queryClient.invalidateQueries({ queryKey: queryKeys.companies.stats });
      await statusQuery.refetch();
    },
  });

  if (!token || !code) {
    return <div className="mx-auto max-w-xl py-10 text-sm text-destructive">URL อ้างสิทธิ์บอร์ดไม่ถูกต้อง</div>;
  }

  if (statusQuery.isLoading || sessionQuery.isLoading) {
    return <div className="mx-auto max-w-xl py-10 text-sm text-muted-foreground">กำลังโหลดการอ้างสิทธิ์...</div>;
  }

  if (statusQuery.error) {
    return (
      <div className="mx-auto max-w-xl py-10">
        <div className="rounded-lg border border-border bg-card p-6">
          <h1 className="text-lg font-semibold">การอ้างสิทธิ์ไม่พร้อมใช้งาน</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {statusQuery.error instanceof Error ? statusQuery.error.message : "คำขอไม่ถูกต้องหรือหมดอายุแล้ว"}
          </p>
        </div>
      </div>
    );
  }

  const status = statusQuery.data;
  if (!status) {
    return <div className="mx-auto max-w-xl py-10 text-sm text-destructive">การอ้างสิทธิ์ไม่พร้อมใช้งาน</div>;
  }

  if (status.status === "claimed") {
    return (
      <div className="mx-auto max-w-xl py-10">
        <div className="rounded-lg border border-border bg-card p-6">
          <h1 className="text-lg font-semibold">อ้างสิทธิ์ความเป็นเจ้าของบอร์ดแล้ว</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            อินสแตนซ์นี้เชื่อมต่อกับผู้ใช้ที่ยืนยันตัวตนของคุณแล้ว
          </p>
          <Button asChild className="mt-4">
            <Link to="/">เปิดบอร์ด</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (!sessionQuery.data) {
    return (
      <div className="mx-auto max-w-xl py-10">
        <div className="rounded-lg border border-border bg-card p-6">
          <h1 className="text-lg font-semibold">ต้องเข้าสู่ระบบ</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            เข้าสู่ระบบหรือสร้างบัญชี จากนั้นกลับมาที่หน้านี้เพื่ออ้างสิทธิ์ความเป็นเจ้าของบอร์ด
          </p>
          <Button asChild className="mt-4">
            <Link to={`/auth?next=${encodeURIComponent(currentPath)}`}>เข้าสู่ระบบ / สร้างบัญชี</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl py-10">
      <div className="rounded-lg border border-border bg-card p-6">
        <h1 className="text-xl font-semibold">อ้างสิทธิ์ความเป็นเจ้าของบอร์ด</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          การดำเนินการนี้จะเลื่อนระดับผู้ใช้ของคุณเป็นผู้ดูแลอินสแตนซ์ และย้ายสิทธิ์ความเป็นเจ้าของบริษัทจากโหมดเชื่อถือในเครื่อง
        </p>

        {claimMutation.error && (
          <p className="mt-3 text-sm text-destructive">
            {claimMutation.error instanceof Error ? claimMutation.error.message : "ไม่สามารถอ้างสิทธิ์ความเป็นเจ้าของบอร์ดได้"}
          </p>
        )}

        <Button
          className="mt-5"
          onClick={() => claimMutation.mutate()}
          disabled={claimMutation.isPending}
        >
          {claimMutation.isPending ? "กำลังอ้างสิทธิ์…" : "อ้างสิทธิ์ความเป็นเจ้าของ"}
        </Button>
      </div>
    </div>
  );
}
