import { GitCompareArrows, Plus, SearchX, Trash2 } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { ResultMeta, ResultView } from "@/components/ats/result-view";
import { EmptyState, Page, PageHeader } from "@/components/layout/page";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogTrigger } from "@/components/ui/overlays";
import { useStore } from "@/lib/store";
import { hasScores } from "@/types/scan";

export default function ScanResultPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { scans, fileFor, toggleDone, removeScan } = useStore();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const record = scans.find((s) => s.id === id);

  if (!record) {
    return (
      <Page>
        <EmptyState
          icon={<SearchX />}
          title="Scan not found"
          description="It may have been deleted, or it was saved in a different browser."
          action={<Button asChild><Link to="/history">View history</Link></Button>}
        />
      </Page>
    );
  }

  const r = record.result;
  const scored = hasScores(r);
  const others = scans.filter((s) => s.id !== record.id && hasScores(s.result));

  return (
    <Page>
      <PageHeader
        eyebrow={<Link to="/history" className="hover:text-fg">History</Link>}
        title={scored ? "Resume analysis" : "Document not accepted"}
        description={<ResultMeta result={r} />}
        actions={
          <>
            {scored && others.length > 0 && (
              <Button variant="secondary" asChild>
                <Link to={`/compare?a=${others[0].id}&b=${record.id}`}><GitCompareArrows /> Compare</Link>
              </Button>
            )}
            <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Delete this scan"><Trash2 /></Button>
              </DialogTrigger>
              <DialogContent title="Delete this scan?" description="It will be removed from this browser’s history. This can’t be undone.">
                <div className="mt-6 flex justify-end gap-2">
                  <DialogClose asChild><Button variant="secondary">Cancel</Button></DialogClose>
                  <Button
                    variant="danger"
                    onClick={() => {
                      removeScan(record.id);
                      toast("Scan deleted");
                      navigate("/history");
                    }}
                  >
                    Delete
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
            <Button asChild><Link to="/scan"><Plus /> New scan</Link></Button>
          </>
        }
      />
      <ResultView result={r} file={fileFor(record.id)} done={record.doneItems} onToggleDone={(fid) => toggleDone(record.id, fid)} />
    </Page>
  );
}
