import { Link } from "@/lib/router";
import { Identity } from "./Identity";
import { timeAgo } from "../lib/timeAgo";
import { cn } from "../lib/utils";
import { deriveProjectUrlKey, type ActivityEvent, type Agent } from "@paperclipai/shared";

const ACTION_VERBS: Record<string, string> = {
  "issue.created": "สร้าง",
  "issue.updated": "อัปเดต",
  "issue.checked_out": "เช็คเอาต์",
  "issue.released": "ปล่อย",
  "issue.comment_added": "แสดงความคิดเห็นบน",
  "issue.attachment_added": "แนบไฟล์ไปที่",
  "issue.attachment_removed": "ลบไฟล์แนบออกจาก",
  "issue.document_created": "สร้างเอกสารสำหรับ",
  "issue.document_updated": "อัปเดตเอกสารบน",
  "issue.document_deleted": "ลบเอกสารจาก",
  "issue.commented": "แสดงความคิดเห็นบน",
  "issue.deleted": "ลบ",
  "agent.created": "สร้าง",
  "agent.updated": "อัปเดต",
  "agent.paused": "หยุดชั่วคราว",
  "agent.resumed": "ดำเนินการต่อ",
  "agent.terminated": "ยุติ",
  "agent.key_created": "สร้างคีย์ API สำหรับ",
  "agent.budget_updated": "อัปเดตงบประมาณสำหรับ",
  "agent.runtime_session_reset": "รีเซ็ตเซสชันสำหรับ",
  "heartbeat.invoked": "เรียกใช้ heartbeat สำหรับ",
  "heartbeat.cancelled": "ยกเลิก heartbeat สำหรับ",
  "approval.created": "ร้องขอการอนุมัติ",
  "approval.approved": "อนุมัติ",
  "approval.rejected": "ปฏิเสธ",
  "project.created": "สร้าง",
  "project.updated": "อัปเดต",
  "project.deleted": "ลบ",
  "goal.created": "สร้าง",
  "goal.updated": "อัปเดต",
  "goal.deleted": "ลบ",
  "cost.reported": "รายงานค่าใช้จ่ายสำหรับ",
  "cost.recorded": "บันทึกค่าใช้จ่ายสำหรับ",
  "company.created": "สร้างบริษัท",
  "company.updated": "อัปเดตบริษัท",
  "company.archived": "เก็บถาวร",
  "company.budget_updated": "อัปเดตงบประมาณสำหรับ",
};

function humanizeValue(value: unknown): string {
  if (typeof value !== "string") return String(value ?? "none");
  return value.replace(/_/g, " ");
}

function formatVerb(action: string, details?: Record<string, unknown> | null): string {
  if (action === "issue.updated" && details) {
    const previous = (details._previous ?? {}) as Record<string, unknown>;
    if (details.status !== undefined) {
      const from = previous.status;
      return from
        ? `เปลี่ยนสถานะจาก ${humanizeValue(from)} เป็น ${humanizeValue(details.status)} บน`
        : `เปลี่ยนสถานะเป็น ${humanizeValue(details.status)} บน`;
    }
    if (details.priority !== undefined) {
      const from = previous.priority;
      return from
        ? `เปลี่ยนความสำคัญจาก ${humanizeValue(from)} เป็น ${humanizeValue(details.priority)} บน`
        : `เปลี่ยนความสำคัญเป็น ${humanizeValue(details.priority)} บน`;
    }
  }
  return ACTION_VERBS[action] ?? action.replace(/[._]/g, " ");
}

function entityLink(entityType: string, entityId: string, name?: string | null): string | null {
  switch (entityType) {
    case "issue": return `/issues/${name ?? entityId}`;
    case "agent": return `/agents/${entityId}`;
    case "project": return `/projects/${deriveProjectUrlKey(name, entityId)}`;
    case "goal": return `/goals/${entityId}`;
    case "approval": return `/approvals/${entityId}`;
    default: return null;
  }
}

interface ActivityRowProps {
  event: ActivityEvent;
  agentMap: Map<string, Agent>;
  entityNameMap: Map<string, string>;
  entityTitleMap?: Map<string, string>;
  className?: string;
}

export function ActivityRow({ event, agentMap, entityNameMap, entityTitleMap, className }: ActivityRowProps) {
  const verb = formatVerb(event.action, event.details);

  const isHeartbeatEvent = event.entityType === "heartbeat_run";
  const heartbeatAgentId = isHeartbeatEvent
    ? (event.details as Record<string, unknown> | null)?.agentId as string | undefined
    : undefined;

  const name = isHeartbeatEvent
    ? (heartbeatAgentId ? entityNameMap.get(`agent:${heartbeatAgentId}`) : null)
    : entityNameMap.get(`${event.entityType}:${event.entityId}`);

  const entityTitle = entityTitleMap?.get(`${event.entityType}:${event.entityId}`);

  const link = isHeartbeatEvent && heartbeatAgentId
    ? `/agents/${heartbeatAgentId}/runs/${event.entityId}`
    : entityLink(event.entityType, event.entityId, name);

  const actor = event.actorType === "agent" ? agentMap.get(event.actorId) : null;
  const actorName = actor?.name ?? (event.actorType === "system" ? "ระบบ" : event.actorType === "user" ? "บอร์ด" : event.actorId || "ไม่ทราบ");

  const inner = (
    <div className="flex gap-3">
      <p className="flex-1 min-w-0 truncate">
        <Identity
          name={actorName}
          size="xs"
          className="align-baseline"
        />
        <span className="text-muted-foreground ml-1">{verb} </span>
        {name && <span className="font-medium">{name}</span>}
        {entityTitle && <span className="text-muted-foreground ml-1">— {entityTitle}</span>}
      </p>
      <span className="text-xs text-muted-foreground shrink-0 pt-0.5">{timeAgo(event.createdAt)}</span>
    </div>
  );

  const classes = cn(
    "px-4 py-2 text-sm",
    link && "cursor-pointer hover:bg-accent/50 transition-colors",
    className,
  );

  if (link) {
    return (
      <Link to={link} className={cn(classes, "no-underline text-inherit block")}>
        {inner}
      </Link>
    );
  }

  return (
    <div className={classes}>
      {inner}
    </div>
  );
}
