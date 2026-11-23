import { CloudOff, Database, Download, GraduationCap, Laptop, Moon, Palette, PlugZap, Sun, Trash2, Users } from "lucide-react";
import { useState, type ReactNode } from "react";
import { toast } from "sonner";
import { Page, PageHeader } from "@/components/layout/page";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent } from "@/components/ui/overlays";
import { Badge, Card, Kbd } from "@/components/ui/primitives";
import { download } from "@/lib/report";
import { useStore, type Role, type Theme } from "@/lib/store";
import { cn } from "@/lib/utils";
import { scanner } from "@/services/scanner";

function Section({ icon, title, description, children }: { icon: ReactNode; title: string; description: string; children: ReactNode }) {
  return (
    <Card className="grid gap-5 p-6 md:grid-cols-[260px_1fr]">
      <div>
        <div className="flex items-center gap-2 text-sm font-semibold [&_svg]:size-4 [&_svg]:text-fg-muted">{icon}{title}</div>
        <p className="mt-1 text-[13px] text-fg-muted">{description}</p>
      </div>
      <div>{children}</div>
    </Card>
  );
}

function Choice<T extends string>({ value, options, onChange, label }: { value: T; options: { id: T; label: string; icon: ReactNode }[]; onChange: (v: T) => void; label: string }) {
  return (
    <div role="radiogroup" aria-label={label} className="grid grid-cols-3 gap-2 sm:max-w-md">
      {options.map((o) => (
        <button
          key={o.id}
          role="radio"
          aria-checked={value === o.id}
          onClick={() => onChange(o.id)}
          className={cn(
            "flex flex-col items-center gap-2 rounded-lg border px-3 py-3 text-sm font-medium transition [&_svg]:size-5",
            value === o.id ? "border-primary bg-primary-soft/50 text-fg ring-1 ring-primary" : "border-border text-fg-muted hover:border-border-strong hover:text-fg",
          )}
        >
          {o.icon}
          {o.label}
        </button>
      ))}
    </div>
  );
}

export default function SettingsPage() {
  const { theme, setTheme, role, setRole, scans, clearScans } = useStore();
  const [confirm, setConfirm] = useState(false);

  return (
    <Page className="max-w-[960px]">
      <PageHeader eyebrow="Account" title="Settings" description="Preferences are stored in this browser." />
      <div className="grid gap-5">
        <Section icon={<Palette />} title="Appearance" description="Light, dark, or follow your system.">
          <Choice<Theme>
            label="Theme"
            value={theme}
            onChange={setTheme}
            options={[
              { id: "light", label: "Light", icon: <Sun /> },
              { id: "dark", label: "Dark", icon: <Moon /> },
              { id: "system", label: "System", icon: <Laptop /> },
            ]}
          />
        </Section>

        <Section icon={<Users />} title="Demo identity" description="Switch between the student and faculty experience. Real sign-in replaces this later.">
          <Choice<Role>
            label="View as"
            value={role}
            onChange={setRole}
            options={[
              { id: "student", label: "Student", icon: <GraduationCap /> },
              { id: "faculty", label: "Faculty", icon: <Users /> },
            ]}
          />
        </Section>

        <Section icon={<PlugZap />} title="Scanner connection" description="Where analysis requests are sent.">
          {scanner.mode === "live" ? (
            <div className="flex items-center gap-3">
              <Badge tone="success"><span className="size-1.5 rounded-full bg-success" /> Connected</Badge>
              <code className="truncate font-mono text-[13px] text-fg-muted">{scanner.baseUrl}</code>
            </div>
          ) : (
            <div className="grid gap-3">
              <div className="flex items-center gap-2"><Badge tone="demo"><CloudOff /> Demo mode</Badge></div>
              <p className="text-[13px] leading-5 text-fg-muted">
                No scanner API configured. Set <Kbd>VITE_SCANNER_API_URL</Kbd> in <Kbd>frontend/.env.local</Kbd> and restart the dev server.
                Until then, results are labelled sample data.
              </p>
            </div>
          )}
        </Section>

        <Section icon={<Database />} title="Your data" description={`${scans.length} scan${scans.length === 1 ? "" : "s"} saved in this browser. Uploaded files are never stored.`}>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="secondary"
              disabled={!scans.length}
              onClick={() => {
                download("pps_my_scans.json", JSON.stringify({ exportedAt: new Date().toISOString(), scans }, null, 2), "application/json");
                toast.success("Export downloaded");
              }}
            >
              <Download /> Export my data
            </Button>
            <Button variant="secondary" className="text-danger" disabled={!scans.length} onClick={() => setConfirm(true)}>
              <Trash2 /> Delete all scans
            </Button>
          </div>
        </Section>
      </div>

      <Dialog open={confirm} onOpenChange={setConfirm}>
        <DialogContent title="Delete all scans?" description={`This removes ${scans.length} scan${scans.length === 1 ? "" : "s"} from this browser. It can’t be undone.`}>
          <div className="mt-6 flex justify-end gap-2">
            <DialogClose asChild><Button variant="secondary">Cancel</Button></DialogClose>
            <Button
              variant="danger"
              onClick={() => {
                clearScans();
                setConfirm(false);
                toast("All scans deleted");
              }}
            >
              Delete all
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Page>
  );
}
