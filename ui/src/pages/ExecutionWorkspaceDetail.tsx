import { Link, useParams } from "@/lib/router";
import { useQuery } from "@tanstack/react-query";
import { ExternalLink } from "lucide-react";
import { executionWorkspacesApi } from "../api/execution-workspaces";
import { queryKeys } from "../lib/queryKeys";

function isSafeExternalUrl(value: string | null | undefined) {
  if (!value) return false;
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 py-1.5">
      <div className="w-28 shrink-0 text-xs text-muted-foreground">{label}</div>
      <div className="min-w-0 flex-1 text-sm">{children}</div>
    </div>
  );
}

export function ExecutionWorkspaceDetail() {
  const { workspaceId } = useParams<{ workspaceId: string }>();

  const { data: workspace, isLoading, error } = useQuery({
    queryKey: queryKeys.executionWorkspaces.detail(workspaceId!),
    queryFn: () => executionWorkspacesApi.get(workspaceId!),
    enabled: Boolean(workspaceId),
  });

  if (isLoading) return <p className="text-sm text-muted-foreground">กำลังโหลด...</p>;
  if (error) return <p className="text-sm text-destructive">{error instanceof Error ? error.message : "โหลดเวิร์กสเปซล้มเหลว"}</p>;
  if (!workspace) return null;

  return (
    <div className="max-w-2xl space-y-4">
      <div className="space-y-1">
        <div className="text-xs text-muted-foreground">เวิร์กสเปซการดำเนินการ</div>
        <h1 className="text-2xl font-semibold">{workspace.name}</h1>
        <div className="text-sm text-muted-foreground">
          {workspace.status} · {workspace.mode} · {workspace.providerType}
        </div>
      </div>

      <div className="rounded-lg border border-border p-4">
        <DetailRow label="โปรเจกต์">
          {workspace.projectId ? <Link to={`/projects/${workspace.projectId}`} className="hover:underline">{workspace.projectId}</Link> : "ไม่มี"}
        </DetailRow>
        <DetailRow label="งานต้นทาง">
          {workspace.sourceIssueId ? <Link to={`/issues/${workspace.sourceIssueId}`} className="hover:underline">{workspace.sourceIssueId}</Link> : "ไม่มี"}
        </DetailRow>
        <DetailRow label="สาขา">{workspace.branchName ?? "ไม่มี"}</DetailRow>
        <DetailRow label="อ้างอิงฐาน">{workspace.baseRef ?? "ไม่มี"}</DetailRow>
        <DetailRow label="ไดเรกทอรีทำงาน">
          <span className="break-all font-mono text-xs">{workspace.cwd ?? "ไม่มี"}</span>
        </DetailRow>
        <DetailRow label="อ้างอิงผู้ให้บริการ">
          <span className="break-all font-mono text-xs">{workspace.providerRef ?? "ไม่มี"}</span>
        </DetailRow>
        <DetailRow label="URL รีโป">
          {workspace.repoUrl && isSafeExternalUrl(workspace.repoUrl) ? (
            <a href={workspace.repoUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 hover:underline">
              {workspace.repoUrl}
              <ExternalLink className="h-3 w-3" />
            </a>
          ) : workspace.repoUrl ? (
            <span className="break-all font-mono text-xs">{workspace.repoUrl}</span>
          ) : "ไม่มี"}
        </DetailRow>
        <DetailRow label="เปิดเมื่อ">{new Date(workspace.openedAt).toLocaleString()}</DetailRow>
        <DetailRow label="ใช้งานล่าสุด">{new Date(workspace.lastUsedAt).toLocaleString()}</DetailRow>
        <DetailRow label="ล้างข้อมูล">
          {workspace.cleanupEligibleAt ? `${new Date(workspace.cleanupEligibleAt).toLocaleString()}${workspace.cleanupReason ? ` · ${workspace.cleanupReason}` : ""}` : "ยังไม่ได้กำหนด"}
        </DetailRow>
      </div>
    </div>
  );
}
