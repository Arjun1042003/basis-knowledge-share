import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Plus } from "lucide-react";

interface Community {
  id: number;
  name: string;
}

interface CreatePostDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPostCreated: () => void;
  preselectedCommunity?: number | null;
  onCommunityCreated?: () => void;
}

const CreatePostDialog = ({
  open,
  onOpenChange,
  onPostCreated,
  preselectedCommunity,
  onCommunityCreated,
}: CreatePostDialogProps) => {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [communityId, setCommunityId] = useState<string>("");
  const [communities, setCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(false);
  const [showNewCommunity, setShowNewCommunity] = useState(false);
  const [newCommunityName, setNewCommunityName] = useState("");

  useEffect(() => {
    if (open) {
      fetchCommunities();
      if (preselectedCommunity) {
        setCommunityId(String(preselectedCommunity));
      }
    }
  }, [open, preselectedCommunity]);

  const fetchCommunities = async () => {
    try {
      const posts = await api.getFeed();
      const uniqueCommunities = new Map<number, string>();
      posts.forEach(post => {
        if (post.community_id && !uniqueCommunities.has(post.community_id)) {
          uniqueCommunities.set(post.community_id, `Community ${post.community_id}`);
        }
      });
      setCommunities(Array.from(uniqueCommunities.entries()).map(([id, name]) => ({ id, name })));
    } catch (error) {
      console.error("Error fetching communities:", error);
    }
  };

  const handleCreateCommunity = async () => {
    if (!newCommunityName.trim()) return;

    try {
      const result = await api.createCommunity(newCommunityName.trim());
      toast.success("Community created!");
      const newCommunity = { id: result.id, name: newCommunityName.trim() };
      setCommunities(prev => [...prev, newCommunity]);
      setCommunityId(String(result.id));
      setNewCommunityName("");
      setShowNewCommunity(false);
      onCommunityCreated?.();
    } catch (error: any) {
      toast.error(error.message || "Failed to create community");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!communityId) {
      toast.error("Please select or create a community");
      return;
    }

    setLoading(true);

    try {
      await api.createPost(title, content, Number(communityId));
      toast.success("Knowledge shared successfully!");
      setTitle("");
      setContent("");
      setCommunityId("");
      onOpenChange(false);
      onPostCreated();
    } catch (error: any) {
      toast.error(error.message || "Failed to create post");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Share Your Knowledge</DialogTitle>
          <DialogDescription>
            Contribute to BRISTLECONE by sharing your technical insights
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="community">Community</Label>
            {!showNewCommunity ? (
              <div className="flex gap-2">
                <Select value={communityId} onValueChange={setCommunityId}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Select a community or create new" />
                  </SelectTrigger>
                  <SelectContent>
                    {communities.map((community) => (
                      <SelectItem key={community.id} value={String(community.id)}>
                        {community.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowNewCommunity(true)}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  New
                </Button>
              </div>
            ) : (
              <div className="flex gap-2">
                <Input
                  placeholder="Enter new community name"
                  value={newCommunityName}
                  onChange={(e) => setNewCommunityName(e.target.value)}
                  className="flex-1"
                />
                <Button type="button" onClick={handleCreateCommunity}>
                  Create
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowNewCommunity(false)}
                >
                  Cancel
                </Button>
              </div>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              placeholder="e.g., Performance Optimization Tips"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="content">Content</Label>
            <Textarea
              id="content"
              placeholder="Share your technical knowledge, best practices, or solutions..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
              rows={8}
              className="resize-none"
            />
          </div>
          <div className="flex justify-end space-x-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Posting..." : "Share Knowledge"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreatePostDialog;
