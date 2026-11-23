import { CloudUpload } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { useRef, useState, type DragEvent, type KeyboardEvent } from "react";
import { MAX_MB } from "@/lib/file-checks";
import { cn } from "@/lib/utils";

export function Dropzone({
  onFiles,
  multiple = false,
  compact = false,
  disabled = false,
}: {
  onFiles: (files: File[]) => void;
  multiple?: boolean;
  compact?: boolean;
  disabled?: boolean;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);
  const reduce = useReducedMotion();

  const accept = (list: FileList | null) => {
    if (!list?.length) return;
    onFiles(multiple ? Array.from(list) : [list[0]]);
  };
  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setOver(false);
    if (!disabled) accept(e.dataTransfer.files);
  };
  const onKey = (e: KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      input.current?.click();
    }
  };

  return (
    <div
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-disabled={disabled}
      aria-label={multiple ? "Upload resumes: drop files or press Enter to browse" : "Upload resume: drop a file or press Enter to browse"}
      onClick={() => !disabled && input.current?.click()}
      onKeyDown={onKey}
      onDragOver={(e) => {
        e.preventDefault();
        if (!disabled) setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={onDrop}
      className={cn(
        "group relative flex cursor-pointer flex-col items-center justify-center overflow-hidden rounded-2xl border-[1.5px] border-dashed text-center outline-none transition-all duration-200",
        compact ? "px-6 py-8" : "px-6 py-14 sm:py-16",
        over ? "border-primary bg-primary-soft/70 scale-[1.01]" : "border-border-strong bg-surface hover:border-primary/60 hover:bg-surface-2",
        "focus-visible:border-primary focus-visible:ring-4 focus-visible:ring-primary/15",
        disabled && "pointer-events-none opacity-50",
      )}
    >
      <div className="bg-grid pointer-events-none absolute inset-0 opacity-60 [mask-image:radial-gradient(ellipse_at_center,black_20%,transparent_70%)]" />
      <motion.div
        animate={over && !reduce ? { y: -4, scale: 1.06 } : { y: 0, scale: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        className={cn(
          "relative mb-4 flex items-center justify-center rounded-2xl border bg-surface shadow-sm transition-colors",
          compact ? "size-12" : "size-16",
          over ? "border-primary/40 text-primary" : "border-border text-fg-muted group-hover:text-primary",
        )}
      >
        <CloudUpload className={compact ? "size-5" : "size-7"} strokeWidth={1.6} />
      </motion.div>
      <div className="relative">
        <p className={cn("font-medium text-fg", compact ? "text-sm" : "text-base")}>
          {over ? "Drop to upload" : multiple ? "Drop resumes here" : "Drop your resume here"}
        </p>
        <p className="mt-1 text-sm text-fg-muted">
          or <span className="font-medium text-primary underline-offset-4 group-hover:underline">browse files</span>
        </p>
        <p className="mt-3 text-xs text-fg-subtle">PDF or DOCX · up to {MAX_MB} MB{multiple ? " each" : ""}</p>
      </div>
      <input
        ref={input}
        type="file"
        className="hidden"
        multiple={multiple}
        accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        onChange={(e) => {
          accept(e.target.files);
          e.target.value = "";
        }}
        data-testid="file-input"
      />
    </div>
  );
}
