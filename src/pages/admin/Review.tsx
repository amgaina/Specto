import { useState, useEffect } from "react";
import { usePipeline, type LabeledImage } from "@/context/PipelineContext";
import { AdminHeader } from "@/components/layout/AdminHeader";
import { Card, CardContent } from "@/components/ui/card";
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
    Star,
    MapPin,
    Calendar,
    User,
    Bird,
    Search,
    Eye,
    Award,
    Sparkles,
    AlertTriangle,
    Camera,
    ThumbsUp,
    ThumbsDown,
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
            (s.location || "").toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = filterStatus === "all" || s.reviewStatus === filterStatus;
        return matchesSearch && matchesStatus;
    });

    const selectedPhoto = images.find((i) => i.id === reviewImageId) || null;

    const openReview = (photo: LabeledImage) => {
        setReviewImageId(photo.id);
        setReviewNotes("");
        setReviewDialogOpen(true);
        // Trigger AI analysis if not already done
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

    const getStatusBadge = (status: LabeledImage["reviewStatus"]) => {
        switch (status) {
            case "approved":
                return (
                    <Badge className="bg-green-500/20 text-green-500 border-green-500/30 gap-1">
                        <CheckCircle2 className="h-3 w-3" />
                        Approved
                    </Badge>
                );
            case "rejected":
                return (
                    <Badge className="bg-red-500/20 text-red-500 border-red-500/30 gap-1">
                        <XCircle className="h-3 w-3" />
                        Rejected
                    </Badge>
                );
            default:
                return (
                    <Badge className="bg-amber-500/20 text-amber-500 border-amber-500/30 gap-1">
                        <Clock className="h-3 w-3" />
                        Pending
                    </Badge>
                );
        }
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

                {/* Compact stats + filters bar */}
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
                                    className="pl-7 h-8 w-40 text-xs"
                                />
                        </div>
                        <Select value={filterStatus} onValueChange={setFilterStatus}>
                            <SelectTrigger className="w-[120px] h-8 text-xs">
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

                {/* Photo Grid */}
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredImages.map((photo) => (
                        <Card
                            key={photo.id}
                            className={`glass-card overflow-hidden group hover:shadow-lg transition-all ${photo.reviewStatus === "pending" ? "ring-2 ring-amber-500/30" : ""
                                }`}
                        >
                            {/* Image */}
                            <div className="relative aspect-[4/3] overflow-hidden">
                                <img
                                    src={photo.imageUrl}
                                    alt={photo.species || "Wildlife photo"}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                />
                                <div className="absolute top-3 left-3 flex items-center gap-2">
                                    {getStatusBadge(photo.reviewStatus)}
                                    {photo.aiStatus === "done" && (
                                        <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 gap-1">
                                            <Bot className="h-3 w-3" />
                                            AI
                                        </Badge>
                                    )}
                                </div>
                                {photo.reviewStatus === "pending" && (
                                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                                        <Button
                                            size="sm"
                                            className="bg-green-500 hover:bg-green-600"
                                            onClick={() => openReview(photo)}
                                        >
                                            <ThumbsUp className="h-4 w-4 mr-1" />
                                            Approve
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="destructive"
                                            onClick={() => openReview(photo)}
                                        >
                                            <ThumbsDown className="h-4 w-4 mr-1" />
                                            Reject
                                        </Button>
                                    </div>
                                )}
                            </div>

                            {/* Content */}
                            <CardContent className="p-4">
                                {/* Species + AI counts */}
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                        {photo.species ? (
                                            <Badge variant="secondary" className="gap-1">
                                                <Bird className="h-3 w-3" />
                                                {photo.species}
                                            </Badge>
                                        ) : (
                                            <Badge variant="outline" className="gap-1 text-muted-foreground">
                                                <AlertTriangle className="h-3 w-3" />
                                                Unidentified
                                            </Badge>
                                        )}
                                    </div>
                                    {photo.aiStatus === "done" && photo.aiBirdCount && (
                                        <Badge variant="outline" className="gap-1 text-blue-400 border-blue-500/30 text-xs">
                                            <Bot className="h-3 w-3" />
                                            {photo.aiBirdCount.split(" ")[0]} birds
                                        </Badge>
                                    )}
                                </div>

                                {/* Submitter Info */}
                                {photo.submittedBy && (
                                    <div className="flex items-center gap-3 mb-3 p-2.5 rounded-lg bg-muted/30">
                                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center text-white text-sm font-medium">
                                            {photo.submittedBy.name.split(" ").map((n) => n[0]).join("")}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-sm truncate">{photo.submittedBy.name}</p>
                                            <p className="text-xs text-muted-foreground">{photo.submittedBy.email}</p>
                                        </div>
                                    </div>
                                )}

                                {/* Location & Time */}
                                <div className="flex items-center justify-between text-xs text-muted-foreground">
                                    <span className="flex items-center gap-1">
                                        {photo.location ? (
                                            <>
                                                <MapPin className="h-3 w-3" />
                                                {photo.location}
                                            </>
                                        ) : (
                                            <span className="text-muted-foreground/50">No location</span>
                                        )}
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <Clock className="h-3 w-3" />
                                        {formatTimeAgo(photo.submittedAt)}
                                    </span>
                                </div>

                                {/* Notes Preview */}
                                {photo.notes && (
                                    <p className="mt-3 text-xs text-muted-foreground line-clamp-2 italic">
                                        "{photo.notes}"
                                    </p>
                                )}

                                {/* Review Button for Pending */}
                                {photo.reviewStatus === "pending" && (
                                    <Button
                                        className="w-full mt-4"
                                        variant="outline"
                                        onClick={() => openReview(photo)}
                                    >
                                        <Eye className="h-4 w-4 mr-2" />
                                        Review Photo
                                    </Button>
                                )}

                                {/* Review Notes for Reviewed */}
                                {photo.reviewStatus !== "pending" && photo.reviewNotes && (
                                    <div
                                        className={`mt-3 p-2 rounded-lg text-xs ${photo.reviewStatus === "approved"
                                            ? "bg-green-500/10 text-green-600"
                                            : "bg-red-500/10 text-red-500"
                                            }`}
                                    >
                                        <p className="font-medium mb-0.5">Review Note:</p>
                                        <p>{photo.reviewNotes}</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {filteredImages.length === 0 && (
                    <div className="text-center py-16">
                        <Camera className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
                        <h3 className="text-lg font-semibold mb-2">No photos found</h3>
                        <p className="text-muted-foreground">
                            {searchQuery || filterStatus !== "all"
                                ? "Try adjusting your search or filters"
                                : "No photo submissions yet"}
                        </p>
                    </div>
                )}

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
                                    {/* Original image */}
                                    <div className="aspect-[4/3] rounded-xl overflow-hidden bg-muted relative">
                                        <img
                                            src={selectedPhoto.imageUrl}
                                            alt={selectedPhoto.species || "Wildlife photo"}
                                            className="w-full h-full object-cover"
                                        />
                                    </div>

                                    {/* AI Analysis Panel */}
                                    <div className="p-4 rounded-xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/30">
                                        <h4 className="font-semibold flex items-center gap-2 mb-3">
                                            <Bot className="h-4 w-4 text-blue-400" />
                                            AI Analysis
                                            {selectedPhoto.aiStatus === "running" && (
                                                <Loader2 className="h-4 w-4 animate-spin text-blue-400" />
                                            )}
                                            {selectedPhoto.aiStatus === "done" && (
                                                <Badge className="bg-green-500/20 text-green-500 border-green-500/30 text-xs ml-auto">
                                                    Complete
                                                </Badge>
                                            )}
                                            {selectedPhoto.aiStatus === "error" && (
                                                <Badge className="bg-red-500/20 text-red-500 border-red-500/30 text-xs ml-auto">
                                                    Error
                                                </Badge>
                                            )}
                                        </h4>

                                        {selectedPhoto.aiStatus === "running" && (
                                            <div className="flex flex-col items-center py-6 text-center">
                                                <div className="w-12 h-12 border-3 border-blue-500 border-t-transparent rounded-full animate-spin mb-3" />
                                                <p className="text-sm text-muted-foreground">Running density estimation model...</p>
                                                <p className="text-xs text-muted-foreground/70 mt-1">CSRNet/VGG16 on HuggingFace</p>
                                            </div>
                                        )}

                                        {selectedPhoto.aiStatus === "none" && (
                                            <div className="flex flex-col items-center py-6 text-center">
                                                <p className="text-sm text-muted-foreground">AI analysis not started</p>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="mt-2"
                                                    onClick={() => runAI(selectedPhoto.id)}
                                                >
                                                    <Bot className="h-3 w-3 mr-1" />
                                                    Run AI Analysis
                                                </Button>
                                            </div>
                                        )}

                                        {selectedPhoto.aiStatus === "error" && (
                                            <div className="flex flex-col items-center py-4 text-center">
                                                <AlertTriangle className="h-8 w-8 text-red-400 mb-2" />
                                                <p className="text-sm text-muted-foreground">Analysis failed</p>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="mt-2"
                                                    onClick={() => runAI(selectedPhoto.id)}
                                                >
                                                    Retry
                                                </Button>
                                            </div>
                                        )}

                                        {selectedPhoto.aiStatus === "done" && (
                                            <div className="space-y-3">
                                                {/* Density heatmap */}
                                                {selectedPhoto.aiVisualization && (
                                                    <div className="rounded-lg overflow-hidden border border-blue-500/20">
                                                        <p className="text-xs text-muted-foreground px-2 py-1 bg-blue-500/10">Density Heatmap</p>
                                                        <img
                                                            src={selectedPhoto.aiVisualization}
                                                            alt="AI density heatmap"
                                                            className="w-full object-contain"
                                                        />
                                                    </div>
                                                )}

                                                {/* AI Counts */}
                                                <div className="grid grid-cols-2 gap-2">
                                                    <div className="p-3 rounded-lg bg-blue-500/10 text-center">
                                                        <p className="text-xs text-muted-foreground mb-1">
                                                            <Bot className="h-3 w-3 inline mr-1" />Bird Count
                                                        </p>
                                                        <p className="text-lg font-bold text-blue-400">
                                                            {selectedPhoto.aiBirdCount?.split(" ")[0] || "—"}
                                                        </p>
                                                        {selectedPhoto.aiBirdCount && selectedPhoto.aiBirdCount.includes("+/-") && (
                                                            <p className="text-xs text-muted-foreground">
                                                                {selectedPhoto.aiBirdCount.substring(selectedPhoto.aiBirdCount.indexOf("+/-"))}
                                                            </p>
                                                        )}
                                                    </div>
                                                    <div className="p-3 rounded-lg bg-blue-500/10 text-center">
                                                        <p className="text-xs text-muted-foreground mb-1">
                                                            <Bot className="h-3 w-3 inline mr-1" />Nest Count
                                                        </p>
                                                        <p className="text-lg font-bold text-blue-400">
                                                            {selectedPhoto.aiNestCount?.split(" ")[0] || "—"}
                                                        </p>
                                                        {selectedPhoto.aiNestCount && selectedPhoto.aiNestCount.includes("+/-") && (
                                                            <p className="text-xs text-muted-foreground">
                                                                {selectedPhoto.aiNestCount.substring(selectedPhoto.aiNestCount.indexOf("+/-"))}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>

                                                {selectedPhoto.aiModelInfo && (
                                                    <p className="text-xs text-muted-foreground/60 text-center">
                                                        {selectedPhoto.aiModelInfo}
                                                    </p>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Right: Details + Review */}
                                <div className="space-y-4">
                                    {/* Submitter */}
                                    {selectedPhoto.submittedBy && (
                                        <div className="p-4 rounded-xl bg-muted/30">
                                            <h4 className="font-semibold flex items-center gap-2 mb-3">
                                                <User className="h-4 w-4" />
                                                Submitted By
                                            </h4>
                                            <div className="flex items-center gap-3">
                                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center text-white font-medium">
                                                    {selectedPhoto.submittedBy.name.split(" ").map((n) => n[0]).join("")}
                                                </div>
                                                <div>
                                                    <p className="font-medium">{selectedPhoto.submittedBy.name}</p>
                                                    <p className="text-sm text-muted-foreground">{selectedPhoto.submittedBy.email}</p>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Photo Details */}
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                                            <Bird className="h-5 w-5 text-primary" />
                                            <div>
                                                <p className="text-xs text-muted-foreground">Species</p>
                                                <p className="font-medium">
                                                    {selectedPhoto.species || (
                                                        <span className="text-muted-foreground italic">Not identified</span>
                                                    )}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                                            <MapPin className="h-5 w-5 text-green-500" />
                                            <div>
                                                <p className="text-xs text-muted-foreground">Location</p>
                                                <p className="font-medium">
                                                    {selectedPhoto.location || (
                                                        <span className="text-muted-foreground italic">Not specified</span>
                                                    )}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                                            <Calendar className="h-5 w-5 text-blue-500" />
                                            <div>
                                                <p className="text-xs text-muted-foreground">Submitted</p>
                                                <p className="font-medium">
                                                    {selectedPhoto.submittedAt.toLocaleString()}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Notes */}
                                    {selectedPhoto.notes && (
                                        <div className="p-3 rounded-lg bg-muted/30">
                                            <p className="text-xs text-muted-foreground mb-1">Contributor Notes</p>
                                            <p className="text-sm italic">"{selectedPhoto.notes}"</p>
                                        </div>
                                    )}

                                    {/* Credit Info */}
                                    <div className="p-3 rounded-xl bg-gradient-to-br from-amber-500/10 to-yellow-500/10 border border-amber-500/30">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm flex items-center gap-2">
                                                <Sparkles className="h-4 w-4 text-amber-500" />
                                                Credits on Approval
                                            </span>
                                            <span className="text-lg font-bold text-amber-500">+10</span>
                                        </div>
                                    </div>

                                    {/* Review Notes Input */}
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Review Notes (Optional)</label>
                                        <Textarea
                                            placeholder="Add feedback for the contributor..."
                                            value={reviewNotes}
                                            onChange={(e) => setReviewNotes(e.target.value)}
                                            rows={3}
                                        />
                                    </div>
                                </div>
                            </div>

                            <DialogFooter className="gap-2">
                                <Button variant="outline" onClick={() => setReviewDialogOpen(false)}>
                                    Cancel
                                </Button>
                                <Button variant="destructive" onClick={handleReject}>
                                    <XCircle className="h-4 w-4 mr-2" />
                                    Reject
                                </Button>
                                <Button className="bg-green-500 hover:bg-green-600" onClick={handleApprove}>
                                    <CheckCircle2 className="h-4 w-4 mr-2" />
                                    Approve (+10 credits)
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
