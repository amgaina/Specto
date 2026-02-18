import { useState } from "react";
import { AdminHeader } from "@/components/layout/AdminHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
    Filter,
    Eye,
    ChevronLeft,
    ChevronRight,
    Award,
    Sparkles,
    AlertTriangle,
    Camera,
    ThumbsUp,
    ThumbsDown,
} from "lucide-react";

interface SubmittedPhoto {
    id: string;
    imageUrl: string;
    submittedBy: {
        name: string;
        email: string;
        totalCredits: number;
    };
    species: string | null;
    location: string | null;
    notes: string | null;
    submittedAt: Date;
    status: "pending" | "approved" | "rejected";
    baseCredits: number;
    bonusCredits: number;
    reviewNotes?: string;
    reviewedAt?: Date;
}

const MOCK_SUBMISSIONS: SubmittedPhoto[] = [
    {
        id: "1",
        imageUrl: "/image_1.png",
        submittedBy: { name: "Sarah Johnson", email: "sarah.j@email.com", totalCredits: 245 },
        species: "Brown Pelican",
        location: "Rabbit Island",
        notes: "Large group spotted near the shore during morning survey",
        submittedAt: new Date(Date.now() - 1800000),
        status: "pending",
        baseCredits: 5,
        bonusCredits: 5,
    },
    {
        id: "2",
        imageUrl: "/image_2.png",
        submittedBy: { name: "Michael Chen", email: "m.chen@email.com", totalCredits: 89 },
        species: "Great Egret",
        location: "Queen Bess Island",
        notes: "Nesting behavior observed",
        submittedAt: new Date(Date.now() - 3600000),
        status: "pending",
        baseCredits: 5,
        bonusCredits: 5,
    },
    {
        id: "3",
        imageUrl: "/image_3.png",
        submittedBy: { name: "Emily Rodriguez", email: "emily.r@email.com", totalCredits: 412 },
        species: null,
        location: "Mangrove Cay",
        notes: "Unknown species, needs identification",
        submittedAt: new Date(Date.now() - 7200000),
        status: "pending",
        baseCredits: 5,
        bonusCredits: 0,
    },
    {
        id: "4",
        imageUrl: "/image_4.png",
        submittedBy: { name: "James Wilson", email: "jwilson@email.com", totalCredits: 156 },
        species: "Royal Tern",
        location: null,
        notes: null,
        submittedAt: new Date(Date.now() - 10800000),
        status: "pending",
        baseCredits: 5,
        bonusCredits: 5,
    },
    {
        id: "5",
        imageUrl: "/image_5.png",
        submittedBy: { name: "Lisa Park", email: "lisa.park@email.com", totalCredits: 67 },
        species: "Roseate Spoonbill",
        location: "Wine Island",
        notes: "Beautiful pink coloring, feeding in shallow water",
        submittedAt: new Date(Date.now() - 14400000),
        status: "pending",
        baseCredits: 5,
        bonusCredits: 5,
    },
    {
        id: "6",
        imageUrl: "/image_6.png",
        submittedBy: { name: "Sarah Johnson", email: "sarah.j@email.com", totalCredits: 245 },
        species: "Laughing Gull",
        location: "Felicity Island",
        notes: null,
        submittedAt: new Date(Date.now() - 86400000),
        status: "approved",
        baseCredits: 5,
        bonusCredits: 5,
        reviewNotes: "Great quality photo!",
        reviewedAt: new Date(Date.now() - 43200000),
    },
    {
        id: "7",
        imageUrl: "/image_1.png",
        submittedBy: { name: "Tom Baker", email: "tbaker@email.com", totalCredits: 34 },
        species: null,
        location: null,
        notes: "Blurry image",
        submittedAt: new Date(Date.now() - 172800000),
        status: "rejected",
        baseCredits: 0,
        bonusCredits: 0,
        reviewNotes: "Image too blurry for identification. Please resubmit a clearer photo.",
        reviewedAt: new Date(Date.now() - 86400000),
    },
];

export default function AdminReview() {
    const [submissions, setSubmissions] = useState<SubmittedPhoto[]>(MOCK_SUBMISSIONS);
    const [selectedPhoto, setSelectedPhoto] = useState<SubmittedPhoto | null>(null);
    const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
    const [reviewNotes, setReviewNotes] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const [filterStatus, setFilterStatus] = useState<string>("all");

    const pendingCount = submissions.filter((s) => s.status === "pending").length;
    const approvedCount = submissions.filter((s) => s.status === "approved").length;
    const rejectedCount = submissions.filter((s) => s.status === "rejected").length;

    const filteredSubmissions = submissions.filter((s) => {
        const matchesSearch =
            s.submittedBy.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            s.species?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            s.location?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = filterStatus === "all" || s.status === filterStatus;
        return matchesSearch && matchesStatus;
    });

    const openReview = (photo: SubmittedPhoto) => {
        setSelectedPhoto(photo);
        setReviewNotes("");
        setReviewDialogOpen(true);
    };

    const handleApprove = () => {
        if (!selectedPhoto) return;
        setSubmissions((prev) =>
            prev.map((s) =>
                s.id === selectedPhoto.id
                    ? {
                        ...s,
                        status: "approved" as const,
                        reviewNotes: reviewNotes || "Approved",
                        reviewedAt: new Date(),
                    }
                    : s
            )
        );
        setReviewDialogOpen(false);
        setSelectedPhoto(null);
    };

    const handleReject = () => {
        if (!selectedPhoto) return;
        setSubmissions((prev) =>
            prev.map((s) =>
                s.id === selectedPhoto.id
                    ? {
                        ...s,
                        status: "rejected" as const,
                        baseCredits: 0,
                        bonusCredits: 0,
                        reviewNotes: reviewNotes || "Rejected",
                        reviewedAt: new Date(),
                    }
                    : s
            )
        );
        setReviewDialogOpen(false);
        setSelectedPhoto(null);
    };

    const getStatusBadge = (status: SubmittedPhoto["status"]) => {
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

    return (
        <div className="min-h-screen bg-background">
            <AdminHeader />

            <main className="container mx-auto px-4 lg:px-8 pt-24 pb-12">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-pink-600">
                            <Camera className="h-5 w-5 text-white" />
                        </div>
                        <h1 className="text-2xl font-bold">Photo Review</h1>
                    </div>
                    <p className="text-muted-foreground">
                        Review and approve citizen scientist photo submissions
                    </p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                    <Card className="glass-card border-amber-500/30">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-3xl font-bold text-amber-500">{pendingCount}</p>
                                    <p className="text-sm text-muted-foreground">Pending Review</p>
                                </div>
                                <Clock className="h-8 w-8 text-amber-500/50" />
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="glass-card border-green-500/30">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-3xl font-bold text-green-500">{approvedCount}</p>
                                    <p className="text-sm text-muted-foreground">Approved</p>
                                </div>
                                <CheckCircle2 className="h-8 w-8 text-green-500/50" />
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="glass-card border-red-500/30">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-3xl font-bold text-red-500">{rejectedCount}</p>
                                    <p className="text-sm text-muted-foreground">Rejected</p>
                                </div>
                                <XCircle className="h-8 w-8 text-red-500/50" />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Filters */}
                <Card className="glass-card mb-6">
                    <CardContent className="p-4">
                        <div className="flex flex-wrap items-center gap-4">
                            <div className="relative flex-1 min-w-[200px]">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search by name, species, or location..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-9"
                                />
                            </div>
                            <Select value={filterStatus} onValueChange={setFilterStatus}>
                                <SelectTrigger className="w-[160px]">
                                    <Filter className="h-4 w-4 mr-2" />
                                    <SelectValue placeholder="Filter status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Status</SelectItem>
                                    <SelectItem value="pending">Pending</SelectItem>
                                    <SelectItem value="approved">Approved</SelectItem>
                                    <SelectItem value="rejected">Rejected</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </CardContent>
                </Card>

                {/* Photo Grid */}
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredSubmissions.map((photo) => (
                        <Card
                            key={photo.id}
                            className={`glass-card overflow-hidden group hover:shadow-lg transition-all ${photo.status === "pending" ? "ring-2 ring-amber-500/30" : ""
                                }`}
                        >
                            {/* Image */}
                            <div className="relative aspect-[4/3] overflow-hidden">
                                <img
                                    src={photo.imageUrl}
                                    alt={photo.species || "Wildlife photo"}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                />
                                <div className="absolute top-3 left-3">
                                    {getStatusBadge(photo.status)}
                                </div>
                                {photo.status === "pending" && (
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
                                {/* Credits Display */}
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
                                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gradient-to-r from-amber-500/20 to-yellow-500/20 border border-amber-500/30">
                                        <Star className="h-3.5 w-3.5 text-amber-500" />
                                        <span className="text-sm font-semibold text-amber-500">
                                            {photo.baseCredits + photo.bonusCredits}
                                        </span>
                                        {photo.bonusCredits > 0 && (
                                            <span className="text-xs text-amber-500/70">
                                                ({photo.baseCredits}+{photo.bonusCredits})
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Submitter Info */}
                                <div className="flex items-center gap-3 mb-3 p-2.5 rounded-lg bg-muted/30">
                                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center text-white text-sm font-medium">
                                        {photo.submittedBy.name.split(" ").map((n) => n[0]).join("")}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-sm truncate">{photo.submittedBy.name}</p>
                                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                            <span className="flex items-center gap-1">
                                                <Award className="h-3 w-3" />
                                                {photo.submittedBy.totalCredits} credits
                                            </span>
                                        </div>
                                    </div>
                                </div>

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
                                {photo.status === "pending" && (
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
                                {photo.status !== "pending" && photo.reviewNotes && (
                                    <div
                                        className={`mt-3 p-2 rounded-lg text-xs ${photo.status === "approved"
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

                {filteredSubmissions.length === 0 && (
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
            </main>

            {/* Review Dialog */}
            <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
                <DialogContent className="max-w-3xl">
                    {selectedPhoto && (
                        <>
                            <DialogHeader>
                                <DialogTitle className="flex items-center gap-2">
                                    <Camera className="h-5 w-5" />
                                    Review Photo Submission
                                </DialogTitle>
                                <DialogDescription>
                                    Review and approve or reject this citizen scientist contribution
                                </DialogDescription>
                            </DialogHeader>

                            <div className="grid md:grid-cols-2 gap-6 py-4">
                                {/* Image */}
                                <div className="space-y-4">
                                    <div className="aspect-[4/3] rounded-xl overflow-hidden bg-muted">
                                        <img
                                            src={selectedPhoto.imageUrl}
                                            alt={selectedPhoto.species || "Wildlife photo"}
                                            className="w-full h-full object-cover"
                                        />
                                    </div>

                                    {/* Credit Breakdown */}
                                    <div className="p-4 rounded-xl bg-gradient-to-br from-amber-500/10 to-yellow-500/10 border border-amber-500/30">
                                        <h4 className="font-semibold flex items-center gap-2 mb-3">
                                            <Sparkles className="h-4 w-4 text-amber-500" />
                                            Credit Breakdown
                                        </h4>
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="text-muted-foreground">Base Upload Credit</span>
                                                <span className="font-medium">+{selectedPhoto.baseCredits}</span>
                                            </div>
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="text-muted-foreground">Species Identification Bonus</span>
                                                <span className={`font-medium ${selectedPhoto.bonusCredits > 0 ? "text-green-500" : "text-muted-foreground"}`}>
                                                    {selectedPhoto.bonusCredits > 0 ? `+${selectedPhoto.bonusCredits}` : "—"}
                                                </span>
                                            </div>
                                            <div className="border-t border-amber-500/30 pt-2 mt-2">
                                                <div className="flex items-center justify-between">
                                                    <span className="font-semibold">Total Credits</span>
                                                    <span className="text-xl font-bold text-amber-500">
                                                        {selectedPhoto.baseCredits + selectedPhoto.bonusCredits}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Details */}
                                <div className="space-y-4">
                                    {/* Submitter */}
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
                                                <Badge variant="outline" className="mt-1 text-xs">
                                                    <Award className="h-3 w-3 mr-1" />
                                                    {selectedPhoto.submittedBy.totalCredits} total credits
                                                </Badge>
                                            </div>
                                        </div>
                                    </div>

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
                                    Approve (+{selectedPhoto.baseCredits + selectedPhoto.bonusCredits} credits)
                                </Button>
                            </DialogFooter>
                        </>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
