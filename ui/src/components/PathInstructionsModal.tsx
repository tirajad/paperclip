import { useState } from "react";
import { Apple, Monitor, Terminal } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

type Platform = "mac" | "windows" | "linux";

const platforms: { id: Platform; label: string; icon: typeof Apple }[] = [
  { id: "mac", label: "macOS", icon: Apple },
  { id: "windows", label: "Windows", icon: Monitor },
  { id: "linux", label: "Linux", icon: Terminal },
];

const instructions: Record<Platform, { steps: string[]; tip?: string }> = {
  mac: {
    steps: [
      "เปิด Finder และไปที่โฟลเดอร์",
      "คลิกขวา (หรือ Control-คลิก) ที่โฟลเดอร์",
      "กดค้างปุ่ม Option (⌥) — \"คัดลอก\" จะเปลี่ยนเป็น \"คัดลอกเป็นเส้นทาง\"",
      "คลิก \"คัดลอกเป็นเส้นทาง\" แล้ววางที่นี่",
    ],
    tip: "คุณยังสามารถเปิด Terminal พิมพ์ cd ลากโฟลเดอร์เข้าหน้าต่าง Terminal แล้วกด Enter จากนั้นพิมพ์ pwd เพื่อดูเส้นทางเต็ม",
  },
  windows: {
    steps: [
      "เปิด File Explorer และไปที่โฟลเดอร์",
      "คลิกที่แถบที่อยู่ด้านบน — เส้นทางเต็มจะปรากฏ",
      "คัดลอกเส้นทาง แล้ววางที่นี่",
    ],
    tip: "อีกทางหนึ่ง กด Shift ค้างแล้วคลิกขวาที่โฟลเดอร์ จากนั้นเลือก \"คัดลอกเป็นเส้นทาง\"",
  },
  linux: {
    steps: [
      "เปิดเทอร์มินัลและไปที่ไดเรกทอรีด้วย cd",
      "รัน pwd เพื่อแสดงเส้นทางเต็ม",
      "คัดลอกผลลัพธ์แล้ววางที่นี่",
    ],
    tip: "ในตัวจัดการไฟล์ส่วนใหญ่ Ctrl+L จะแสดงเส้นทางเต็มในแถบที่อยู่",
  },
};

function detectPlatform(): Platform {
  const ua = navigator.userAgent.toLowerCase();
  if (ua.includes("mac")) return "mac";
  if (ua.includes("win")) return "windows";
  return "linux";
}

interface PathInstructionsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PathInstructionsModal({
  open,
  onOpenChange,
}: PathInstructionsModalProps) {
  const [platform, setPlatform] = useState<Platform>(detectPlatform);

  const current = instructions[platform];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base">วิธีรับเส้นทางเต็ม</DialogTitle>
          <DialogDescription>
            วางเส้นทางสัมบูรณ์ (เช่น{" "}
            <code className="text-xs bg-muted px-1 py-0.5 rounded">/Users/you/project</code>
            ) ลงในช่องป้อนข้อมูล
          </DialogDescription>
        </DialogHeader>

        {/* Platform tabs */}
        <div className="flex gap-1 rounded-md border border-border p-0.5">
          {platforms.map((p) => (
            <button
              key={p.id}
              type="button"
              className={cn(
                "flex flex-1 items-center justify-center gap-1.5 rounded px-2 py-1 text-xs transition-colors",
                platform === p.id
                  ? "bg-accent text-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent/50",
              )}
              onClick={() => setPlatform(p.id)}
            >
              <p.icon className="h-3.5 w-3.5" />
              {p.label}
            </button>
          ))}
        </div>

        {/* Steps */}
        <ol className="space-y-2 text-sm">
          {current.steps.map((step, i) => (
            <li key={i} className="flex gap-2">
              <span className="text-muted-foreground font-mono text-xs mt-0.5 shrink-0">
                {i + 1}.
              </span>
              <span>{step}</span>
            </li>
          ))}
        </ol>

        {current.tip && (
          <p className="text-xs text-muted-foreground border-l-2 border-border pl-3">
            {current.tip}
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}

/**
 * Small "Choose" button that opens the PathInstructionsModal.
 * Drop-in replacement for the old showDirectoryPicker buttons.
 */
export function ChoosePathButton({ className }: { className?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        className={cn(
          "inline-flex items-center rounded-md border border-border px-2 py-0.5 text-xs text-muted-foreground hover:bg-accent/50 transition-colors shrink-0",
          className,
        )}
        onClick={() => setOpen(true)}
      >
        เลือก
      </button>
      <PathInstructionsModal open={open} onOpenChange={setOpen} />
    </>
  );
}
