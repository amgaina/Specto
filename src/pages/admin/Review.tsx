import { useState } from "react";
import { usePipeline, type LabeledImage } from "@/context/PipelineContext";
import { AdminHeader } from "@/components/layout/AdminHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
    CheckCircle2,
    XCircle,
    Clock,
    MapPin,
    Calendar,
    User,
    Bird,
    Search,
    Eye,
    Sparkles,
    AlertTriangle,
    Camera,
    Bot,
    Loader2,
} from "lucide-react";

export default function AdminReview({ embedded = false }: { embedded?: boolean }) {
    const { images, runAI, approve, reject, gradioReady } = usePipeline();
    const [reviewImageId, setReviewImageId] = useState<string | null>(null);
    const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
    const [reviewNotes, setReviewNotes] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const [filterStatus, setFilterStatus] = useState<string>("all");

    const pendingCount = images.filter((s) => s.reviewStatus === "pending").length;
    const approvedCount = images.filter((s) => s.reviewStatus === "approved").length;
    const rejectedCount = images.filter((s) => s.reviewStatus === "rejected").length;

    const filteredImages = images.filter((s) => {
        const matchesSearch =
            (s.submittedBy?.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
            (s.species || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
            (s.location || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
            s.fileName.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = filterStatus === "all" || s.reviewStatus === filterStatus;
        return matchesSearch && matchesStatus;
    });

    const selectedPhoto = images.find((i) => i.id === reviewImageId) || null;

    const openReview = (photo: LabeledImage) => {
        setReviewImageId(photo.id);
        setReviewNotes("");
        setReviewDialogOpen(true);
        if (photo.aiStatus === "none") {
            runAI(photo.id);
        }
    };

    const handleApprove = () => {
        if (!selectedPhoto) return;
        approve(selectedPhoto.id, reviewNotes || "Approved");
        setReviewDialogOpen(false);
        setReviewImageId(null);
    };

    const handleReject = () => {
        if (!selectedPhoto) return;
        reject(selectedPhoto.id, reviewNotes || "Rejected");
        setReviewDialogOpen(false);
        setReviewImageId(null);
    };

    const formatTimeAgo = (date: Date) => {
        const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
        if (seconds < 60) return "Just now";
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return `${minutes}m ago`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours}h ago`;
        const days = Math.floor(hours / 24);
        return `${days}d ago`;
    };

    const content = (
        <div>
            {!embedded && (
                <div className="mb-4">
                    <h1 className="text-xl font-bold mb-1">Photo Review</h1>
                    <p className="text-sm text-muted-foreground">Review citizen scientist submissions</p>
                </div>
            )}

            {/* Stats + filters bar */}
            <div className="flex flex-wrap items-center gap-3 mb-3">
                <div className="flex items-center gap-2 text-xs">
                    <span className="flex items-center gap-1 text-amber-500"><Clock className="h-3 w-3" />{pendingCount} pending</span>
                    <span className="text-border">|</span>
                    <span className="flex items-center gap-1 text-green-500"><CheckCircle2 className="h-3 w-3" />{approvedCount}</span>
                    <span className="text-border">|</span>
                    <span className="flex items-center gap-1 text-red-500"><XCircle className="h-3 w-3" />{rejectedCount}</span>
                    {!gradioReady && (
                        <>
                            <span className="text-border">|</span>
                            <span className="flex items-center gap-1 text-muted-foreground">
                                <Loader2 className="h-3 w-3 animate-spin" />AI warming up
                            </span>
                        </>
                    )}
                </div>
                <div className="flex-1" />
                <div className="flex items-center gap-2">
                    <div className="relative">
                        <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                        <Input
                            placeholder="Search..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-7 h-7 w-36 text-xs"
                        />
                    </div>
                    <Select value={filterStatus} onValueChange={setFilterStatus}>
                        <SelectTrigger className="w-[100px] h-7 text-xs">
                            <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All</SelectItem>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="approved">Approved</SelectItem>
                            <SelectItem value="rejected">Rejected</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Compact table */}
            <div className="border border-border/50 rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-border/50 text-xs text-muted-foreground bg-muted/30">
                            <th className="text-left py-2 px-3 font-medium">Image</th>
                            <th className="text-left py-2 px-3 font-medium">Submitted By</th>
                            <th className="text-left py-2 px-3 font-medium">Species</th>
                            <th className="text-left py-2 px-3 font-medium">Location</th>
                            <th className="text-left py-2 px-3 font-medium">Time</th>
                            <th className="text-center py-2 px-3 font-medium">Status</th>
                            <th className="text-right py-2 px-3 font-medium">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredImages.map((photo) => (
                            <tr
                                key={photo.id}
                                className={`border-b border-border/30 hover:bg-muted/20 cursor-pointer ${photo.reviewStatus === "pending" ? "bg-amber-500/5" : ""}`}
                                onClick={() => openReview(photo)}
                            >
                                <td className="py-2 px-3">
                                    <div className="flex items-center gap-2">
                                        <img src={photo.imageUrl} alt="" className="w-10 h-10 rounded object-cover shrink-0" />
                                        <span className="text-xs truncate max-w-[100px]">{photo.fileName}</span>
                                    </div>
                                </td>
                                <td className="py-2 px-3">
                                    {photo.submittedBy ? (
                                        <div className="flex items-center gap-2">
                                            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center text-white text-[10px] font-medium shrink-0">
                                                {photo.submittedBy.name.split(" ").map((n) => n[0]).join("")}
                                            </div>
                                            <span className="text-xs truncate max-w-[100px]">{photo.submittedBy.name}</span>
                                        </div>
                                    ) : (
                                        <Badge variant="outline" className="text-[10px]">{photo.source}</Badge>
                                    )}
                                </td>
                                <td className="py-2 px-3">
                                    {photo.species ? (
                                        <span className="flex items-center gap-1 text-xs">
                                            <Bird className="h-3 w-3 text-primary shrink-0" />
                                            {photo.species}
                                        </span>
                                    ) : (
                                        <span className="text-xs text-muted-foreground/50 italic">Unknown</span>
                                    )}
                                </td>
                                <td className="py-2 px-3">
                                    {photo.location ? (
                                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                            <MapPin className="h-3 w-3 shrink-0" />
                                            {photo.location}
                                        </span>
                                    ) : (
                                        <span className="text-xs text-muted-foreground/50">—</span>
                                    )}
                                </td>
                                <td className="py-2 px-3 text-xs text-muted-foreground whitespace-nowrap">
                                    {formatTimeAgo(photo.submittedAt)}
                                </td>
                                <td className="py-2 px-3 text-center">
                                    {photo.reviewStatus === "pending" && (
                                        <Badge className="bg-amber-500/20 text-amber-500 border-amber-500/30 gap-1 text-[10px]">
                                            <Clock className="h-2.5 w-2.5" />Pending
                                        </Badge>
                                    )}
                                    {photo.reviewStatus === "approved" && (
                                        <Badge className="bg-green-500/20 text-green-500 border-green-500/30 gap-1 text-[10px]">
                                            <CheckCircle2 className="h-2.5 w-2.5" />Approved
                                        </Badge>
                                    )}
                                    {photo.reviewStatus === "rejected" && (
                                        <Badge className="bg-red-500/20 text-red-500 border-red-500/30 gap-1 text-[10px]">
                                            <XCircle className="h-2.5 w-2.5" />Rejected
                                        </Badge>
                                    )}
                                </td>
                                <td className="py-2 px-3 text-right">
                                    {photo.reviewStatus === "pending" ? (
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="h-7 text-xs gap-1"
                                            onClick={(e) => { e.stopPropagation(); openReview(photo); }}
                                        >
                                            <Eye className="h-3 w-3" />
                                            Review
                                        </Button>
                                    ) : (
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            className="h-7 text-xs gap-1"
                                            onClick={(e) => { e.stopPropagation(); openReview(photo); }}
                                        >
                                            <Eye className="h-3 w-3" />
                                            View
                                        </Button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {filteredImages.length === 0 && (
                    <div className="text-center py-12">
                        <Camera className="h-10 w-10 mx-auto text-muted-foreground/30 mb-3" />
                        <p className="text-sm text-muted-foreground">
                            {searchQuery || filterStatus !== "all"
                                ? "No matches — try adjusting filters"
                                : "No submissions yet"}
                        </p>
                    </div>
                )}
            </div>

            {/* Review Dialog with AI Analysis */}
            <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    {selectedPhoto && (
                        <>
                            <DialogHeader>
                                <DialogTitle className="flex items-center gap-2">
                                    <Camera className="h-5 w-5" />
                                    Review: {selectedPhoto.fileName}
                                </DialogTitle>
                                <DialogDescription>
                                    Review submission and AI analysis results
                                </DialogDescription>
                            </DialogHeader>

                            <div className="grid md:grid-cols-2 gap-6 py-4">
                                {/* Left: Image + AI Analysis */}
                                <div className="space-y-4">
                                    <div className="aspect-[4/3] rounded-xl overflow-hidden bg-muted relative">
                                        <img
                                            src={selectedPhoto.imageUrl}
                                            alt={selectedPhoto.species || "Wildlife photo"}
                                            className="w-full h-full object-cover"
                                        />
                                    </div>

                                    {/* AI Analysis Panel */}
                                    <div className="p-4 rounded-xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/30">
                                        <h4 className="font-semibold flex items-center gap-2 mb-3 text-sm">
                                            <Bot className="h-4 w-4 text-blue-400" />
                                            AI Analysis
                                            {selectedPhoto.aiStatus === "running" && (
                                                <Loader2 className="h-4 w-4 animate-spin text-blue-400" />
                                            )}
                                            {selectedPhoto.aiStatus === "done" && (
                                                <Badge className="bg-green-500/20 text-green-500 border-green-500/30 text-xs ml-auto">Complete</Badge>
                                            )}
                                            {selectedPhoto.aiStatus === "error" && (
                                                <Badge className="bg-red-500/20 text-red-500 border-red-500/30 text-xs ml-auto">Error</Badge>
                                            )}
                                        </h4>

                                        {selectedPhoto.aiStatus === "running" && (
                                            <div className="flex flex-col items-center py-4 text-center">
                                                <div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-2" />
                                                <p className="text-sm text-muted-foreground">Running density estimation...</p>
                                                <p className="text-xs text-muted-foreground/70">CSRNet/VGG16 on HuggingFace</p>
                                            </div>
                                        )}

                                        {selectedPhoto.aiStatus === "none" && (
                                            <div className="flex flex-col items-center py-4 text-center">
                                                <p className="text-sm text-muted-foreground">AI analysis not started</p>
                                                <Button size="sm" variant="outline" className="mt-2 text-xs" onClick={() => runAI(selectedPhoto.id)}>
                                                    <Bot className="h-3 w-3 mr-1" />Run AI
                                                </Button>
                                            </div>
                                        )}

                                        {selectedPhoto.aiStatus === "error" && (
                                            <div className="flex flex-col items-center py-4 text-center">
                                                <AlertTriangle className="h-6 w-6 text-red-400 mb-2" />
                                                <p className="text-sm text-muted-foreground">Analysis failed</p>
                                                <Button size="sm" variant="outline" className="mt-2 text-xs" onClick={() => runAI(selectedPhoto.id)}>Retry</Button>
                                            </div>
                                        )}

                                        {selectedPhoto.aiStatus === "done" && (
                                            <div className="space-y-3">
                                                {selectedPhoto.aiVisualization && (
                                                    <div className="rounded-lg overflow-hidden border border-blue-500/20">
                                                        <p className="text-xs text-muted-foreground px-2 py-1 bg-blue-500/10">Density Heatmap</p>
                                                        <img src={selectedPhoto.aiVisualization} alt="AI density heatmap" className="w-full object-contain" />
                                                    </div>
                                                )}
                                                <div className="grid grid-cols-2 gap-2">
                                                    <div className="p-2.5 rounded-lg bg-blue-500/10 text-center">
                                                        <p className="text-xs text-muted-foreground"><Bot className="h-3 w-3 inline mr-1" />Birds</p>
                                                        <p className="text-lg font-bold text-blue-400">{selectedPhoto.aiBirdCount?.split(" ")[0] || "—"}</p>
                                                        {selectedPhoto.aiBirdCount?.includes("+/-") && (
                                                            <p className="text-[10px] text-muted-foreground">{selectedPhoto.aiBirdCount.substring(selectedPhoto.aiBirdCount.indexOf("+/-"))}</p>
                                                        )}
                                                    </div>
                                                    <div className="p-2.5 rounded-lg bg-blue-500/10 text-center">
                                                        <p className="text-xs text-muted-foreground"><Bot className="h-3 w-3 inline mr-1" />Nests</p>
                                                        <p className="text-lg font-bold text-blue-400">{selectedPhoto.aiNestCount?.split(" ")[0] || "—"}</p>
                                                        {selectedPhoto.aiNestCount?.includes("+/-") && (
                                                            <p className="text-[10px] text-muted-foreground">{selectedPhoto.aiNestCount.substring(selectedPhoto.aiNestCount.indexOf("+/-"))}</p>
                                                        )}
                                                    </div>
                                                </div>
                                                {selectedPhoto.aiModelInfo && (
                                                    <p className="text-[10px] text-muted-foreground/60 text-center">{selectedPhoto.aiModelInfo}</p>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Right: Details + Review */}
                                <div className="space-y-4">
                                    {selectedPhoto.submittedBy && (
                                        <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center text-white text-sm font-medium shrink-0">
                                                {selectedPhoto.submittedBy.name.split(" ").map((n) => n[0]).join("")}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="font-medium text-sm">{selectedPhoto.submittedBy.name}</p>
                                                <p className="text-xs text-muted-foreground">{selectedPhoto.submittedBy.email}</p>
                                            </div>
                                        </div>
                                    )}

                                    <div className="grid grid-cols-2 gap-2 text-sm">
                                        <div className="p-2.5 rounded-lg bg-muted/30">
                                            <p className="text-[10px] text-muted-foreground flex items-center gap-1"><Bird className="h-3 w-3" />Species</p>
                                            <p className="font-medium text-sm mt-0.5">{selectedPhoto.species || <span className="text-muted-foreground italic">Unknown</span>}</p>
                                        </div>
                                        <div className="p-2.5 rounded-lg bg-muted/30">
                                            <p className="text-[10px] text-muted-foreground flex items-center gap-1"><MapPin className="h-3 w-3" />Location</p>
                                            <p className="font-medium text-sm mt-0.5">{selectedPhoto.location || <span className="text-muted-foreground italic">None</span>}</p>
                                        </div>
                                    </div>

                                    <div className="p-2.5 rounded-lg bg-muted/30">
                                        <p className="text-[10px] text-muted-foreground flex items-center gap-1"><Calendar className="h-3 w-3" />Submitted</p>
                                        <p className="font-medium text-sm mt-0.5">{selectedPhoto.submittedAt.toLocaleString()}</p>
                                    </div>

                                    {selectedPhoto.notes && (
                                        <div className="p-2.5 rounded-lg bg-muted/30">
                                            <p className="text-[10px] text-muted-foreground mb-0.5">Notes</p>
                                            <p className="text-sm italic">"{selectedPhoto.notes}"</p>
                                        </div>
                                    )}

                                    <div className="p-2.5 rounded-lg bg-gradient-to-br from-amber-500/10 to-yellow-500/10 border border-amber-500/30">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm flex items-center gap-1.5"><Sparkles className="h-3.5 w-3.5 text-amber-500" />Credits on Approval</span>
                                            <span className="text-lg font-bold text-amber-500">+10</span>
                                        </div>
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-xs font-medium">Review Notes (Optional)</label>
                                        <Textarea
                                            placeholder="Add feedback for the contributor..."
                                            value={reviewNotes}
                                            onChange={(e) => setReviewNotes(e.target.value)}
                                            rows={2}
                                            className="text-sm"
                                        />
                                    </div>
                                </div>
                            </div>

                            <DialogFooter className="gap-2">
                                <Button variant="outline" size="sm" onClick={() => setReviewDialogOpen(false)}>Cancel</Button>
                                <Button variant="destructive" size="sm" onClick={handleReject}>
                                    <XCircle className="h-3.5 w-3.5 mr-1.5" />Reject
                                </Button>
                                <Button size="sm" className="bg-green-500 hover:bg-green-600" onClick={handleApprove}>
                                    <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />Approve (+10 credits)
                                </Button>
                            </DialogFooter>
                        </>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );

    if (embedded) return content;

    return (
        <div className="min-h-screen bg-background">
            <AdminHeader />
            <main className="container mx-auto px-4 lg:px-8 pt-12 pb-12">
                {content}
            </main>
        </div>
    );
}
