import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useParams, useSearchParams } from "@/lib/router";
import { Button } from "@/components/ui/button";
import { accessApi } from "../api/access";
import { authApi } from "../api/auth";
import { queryKeys } from "../lib/queryKeys";

export function CliAuthPage() {
  const queryClient = useQueryClient();
  const params = useParams();
  const [searchParams] = useSearchParams();
  const challengeId = (params.id ?? "").trim();
  const token = (searchParams.get("token") ?? "").trim();
  const currentPath = useMemo(
    () => `/cli-auth/${encodeURIComponent(challengeId)}${token ? `?token=${encodeURIComponent(token)}` : ""}`,
    [challengeId, token],
  );

  const sessionQuery = useQuery({
    queryKey: queryKeys.auth.session,
    queryFn: () => authApi.getSession(),
    retry: false,
  });
  const challengeQuery = useQuery({
    queryKey: ["cli-auth-challenge", challengeId, token],
    queryFn: () => accessApi.getCliAuthChallenge(challengeId, token),
    enabled: challengeId.length > 0 && token.length > 0,
    retry: false,
  });

  const approveMutation = useMutation({
    mutationFn: () => accessApi.approveCliAuthChallenge(challengeId, token),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.auth.session });
      await challengeQuery.refetch();
    },
  });

  const cancelMutation = useMutation({
    mutationFn: () => accessApi.cancelCliAuthChallenge(challengeId, token),
    onSuccess: async () => {
      await challengeQuery.refetch();
    },
  });

  if (!challengeId || !token) {
    return <div className="mx-auto max-w-xl py-10 text-sm text-destructive">URL การยืนยันตัวตน CLI ไม่ถูกต้อง</div>;
  }

  if (sessionQuery.isLoading || challengeQuery.isLoading) {
    return <div className="mx-auto max-w-xl py-10 text-sm text-muted-foreground">กำลังโหลดการยืนยันตัวตน CLI...</div>;
  }

  if (challengeQuery.error) {
    return (
      <div className="mx-auto max-w-xl py-10">
        <div className="rounded-lg border border-border bg-card p-6">
          <h1 className="text-lg font-semibold">การยืนยันตัวตน CLI ไม่พร้อมใช้งาน</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {challengeQuery.error instanceof Error ? challengeQuery.error.message : "คำขอไม่ถูกต้องหรือหมดอายุแล้ว"}
          </p>
        </div>
      </div>
    );
  }

  const challenge = challengeQuery.data;
  if (!challenge) {
    return <div className="mx-auto max-w-xl py-10 text-sm text-destructive">การยืนยันตัวตน CLI ไม่พร้อมใช้งาน</div>;
  }

  if (challenge.status === "approved") {
    return (
      <div className="mx-auto max-w-xl py-10">
        <div className="rounded-lg border border-border bg-card p-6">
          <h1 className="text-xl font-semibold">อนุมัติการเข้าถึง CLI แล้ว</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Paperclip CLI สามารถดำเนินการยืนยันตัวตนบนเครื่องที่ร้องขอได้แล้ว
          </p>
          <p className="mt-4 text-sm text-muted-foreground">
            คำสั่ง: <span className="font-mono text-foreground">{challenge.command}</span>
          </p>
        </div>
      </div>
    );
  }

  if (challenge.status === "cancelled" || challenge.status === "expired") {
    return (
      <div className="mx-auto max-w-xl py-10">
        <div className="rounded-lg border border-border bg-card p-6">
          <h1 className="text-xl font-semibold">
            {challenge.status === "expired" ? "การยืนยันตัวตน CLI หมดอายุแล้ว" : "การยืนยันตัวตน CLI ถูกยกเลิกแล้ว"}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            เริ่มกระบวนการยืนยันตัวตน CLI ใหม่จากเทอร์มินัลของคุณเพื่อสร้างคำขออนุมัติใหม่
          </p>
        </div>
      </div>
    );
  }

  if (challenge.requiresSignIn || !sessionQuery.data) {
    return (
      <div className="mx-auto max-w-xl py-10">
        <div className="rounded-lg border border-border bg-card p-6">
          <h1 className="text-xl font-semibold">ต้องเข้าสู่ระบบ</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            เข้าสู่ระบบหรือสร้างบัญชี จากนั้นกลับมาที่หน้านี้เพื่ออนุมัติคำขอเข้าถึง CLI
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
        <h1 className="text-xl font-semibold">อนุมัติการเข้าถึง Paperclip CLI</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          กระบวนการ Paperclip CLI ในเครื่องกำลังร้องขอการเข้าถึงบอร์ดไปยังอินสแตนซ์นี้
        </p>

        <div className="mt-5 space-y-3 text-sm">
          <div>
            <div className="text-muted-foreground">คำสั่ง</div>
            <div className="font-mono text-foreground">{challenge.command}</div>
          </div>
          <div>
            <div className="text-muted-foreground">ไคลเอนต์</div>
            <div className="text-foreground">{challenge.clientName ?? "paperclipai cli"}</div>
          </div>
          <div>
            <div className="text-muted-foreground">สิทธิ์การเข้าถึงที่ร้องขอ</div>
            <div className="text-foreground">
              {challenge.requestedAccess === "instance_admin_required" ? "ผู้ดูแลอินสแตนซ์" : "บอร์ด"}
            </div>
          </div>
          {challenge.requestedCompanyName && (
            <div>
              <div className="text-muted-foreground">บริษัทที่ร้องขอ</div>
              <div className="text-foreground">{challenge.requestedCompanyName}</div>
            </div>
          )}
        </div>

        {(approveMutation.error || cancelMutation.error) && (
          <p className="mt-4 text-sm text-destructive">
            {(approveMutation.error ?? cancelMutation.error) instanceof Error
              ? ((approveMutation.error ?? cancelMutation.error) as Error).message
              : "ไม่สามารถอัปเดตการยืนยันตัวตน CLI ได้"}
          </p>
        )}

        {!challenge.canApprove && (
          <p className="mt-4 text-sm text-destructive">
            คำขอนี้ต้องการสิทธิ์ผู้ดูแลอินสแตนซ์ เข้าสู่ระบบด้วยบัญชีผู้ดูแลอินสแตนซ์เพื่ออนุมัติ
          </p>
        )}

        <div className="mt-5 flex gap-3">
          <Button
            onClick={() => approveMutation.mutate()}
            disabled={!challenge.canApprove || approveMutation.isPending || cancelMutation.isPending}
          >
            {approveMutation.isPending ? "กำลังอนุมัติ..." : "อนุมัติการเข้าถึง CLI"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => cancelMutation.mutate()}
            disabled={approveMutation.isPending || cancelMutation.isPending}
          >
            {cancelMutation.isPending ? "กำลังยกเลิก..." : "ยกเลิก"}
          </Button>
        </div>
      </div>
    </div>
  );
}
