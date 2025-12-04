import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
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
  id: string;
  name: string;
}

interface CreatePostDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPostCreated: () => void;
  userId: string;
  preselectedCommunity?: string | null;
  onCommunityCreated?: () => void;
}

const CreatePostDialog = ({
  open,
  onOpenChange,
  onPostCreated,
  userId,
  preselectedCommunity,
  onCommunityCreated,
}: CreatePostDialogProps) => {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [technicalArea, setTechnicalArea] = useState("");
  const [communityId, setCommunityId] = useState<string>("");
  const [communities, setCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(false);
  const [showNewCommunity, setShowNewCommunity] = useState(false);
  const [newCommunityName, setNewCommunityName] = useState("");

  useEffect(() => {
    if (open) {
      fetchCommunities();
      if (preselectedCommunity) {
        setCommunityId(preselectedCommunity);
      }
    }
  }, [open, preselectedCommunity]);

  const fetchCommunities = async () => {
    const { data, error } = await supabase
      .from("communities")
      .select("id, name")
      .order("name", { ascending: true });

    if (!error && data) {
      setCommunities(data);
    }
  };

  const handleCreateCommunity = async () => {
    if (!newCommunityName.trim()) return;

    const { data, error } = await supabase
      .from("communities")
      .insert({
        name: newCommunityName.trim(),
        created_by: userId,
      })
      .select()
      .single();

    if (error) {
      toast.error("Failed to create community");
    } else if (data) {
      toast.success("Community created!");
      setCommunityId(data.id);
      setNewCommunityName("");
      setShowNewCommunity(false);
      fetchCommunities();
      onCommunityCreated?.();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!communityId) {
      toast.error("Please select a community");
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.from("knowledge_posts").insert({
        author_id: userId,
        title,
        content,
        technical_area: technicalArea,
        community_id: communityId,
      });

      if (error) throw error;

      toast.success("Knowledge shared successfully!");
      setTitle("");
      setContent("");
      setTechnicalArea("");
      setCommunityId("");
      onOpenChange(false);
      onPostCreated();
    } catch (error: any) {
      toast.error(error.message);
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
                    <SelectValue placeholder="Select a community" />
                  </SelectTrigger>
                  <SelectContent>
                    {communities.map((community) => (
                      <SelectItem key={community.id} value={community.id}>
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
              placeholder="e.g., SAP HANA Performance Optimization Tips"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="technicalArea">Technical Area</Label>
            <Input
              id="technicalArea"
              placeholder="e.g., HANA, ABAP, Fiori, S/4HANA"
              value={technicalArea}
              onChange={(e) => setTechnicalArea(e.target.value)}
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
