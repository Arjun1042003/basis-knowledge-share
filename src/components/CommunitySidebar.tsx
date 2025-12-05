import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Users, Plus, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface Community {
  id: number;
  name: string;
}

interface CommunitySidebarProps {
  selectedCommunity: number | null;
  onSelectCommunity: (communityId: number | null) => void;
  refreshTrigger?: number;
}

const CommunitySidebar = ({ selectedCommunity, onSelectCommunity, refreshTrigger }: CommunitySidebarProps) => {
  const [communities, setCommunities] = useState<Community[]>([]);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newCommunityName, setNewCommunityName] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchCommunities();
  }, [refreshTrigger]);

  const fetchCommunities = async () => {
    // The Flask API doesn't have a GET /communities endpoint
    // Communities come from the feed posts' community_id
    // For now, we'll extract unique communities from posts
    try {
      const posts = await api.getFeed();
      const uniqueCommunities = new Map<number, string>();
      posts.forEach(post => {
        if (post.community_id && !uniqueCommunities.has(post.community_id)) {
          // We don't have community names from the feed, so we'll use IDs
          uniqueCommunities.set(post.community_id, `Community ${post.community_id}`);
        }
      });
      setCommunities(Array.from(uniqueCommunities.entries()).map(([id, name]) => ({ id, name })));
    } catch (error) {
      console.error("Error fetching communities:", error);
    }
  };

  const handleCreateCommunity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommunityName.trim()) return;

    setLoading(true);
    try {
      const result = await api.createCommunity(newCommunityName.trim());
      toast.success("Community created!");
      setNewCommunityName("");
      setCreateDialogOpen(false);
      setCommunities(prev => [...prev, { id: result.id, name: newCommunityName.trim() }]);
      onSelectCommunity(result.id);
    } catch (error: any) {
      toast.error(error.message || "Failed to create community");
    }
    setLoading(false);
  };

  return (
    <>
      <Sidebar className="border-r border-border">
        <SidebarHeader className="p-4 border-b border-border">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-foreground">Communities</h2>
            <SidebarTrigger />
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Browse</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    onClick={() => onSelectCommunity(null)}
                    isActive={selectedCommunity === null}
                    className="w-full"
                  >
                    <Home className="h-4 w-4 mr-2" />
                    <span>All Posts</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          <SidebarGroup>
            <SidebarGroupLabel className="flex items-center justify-between">
              <span>My Communities</span>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={() => setCreateDialogOpen(true)}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {communities.length === 0 ? (
                  <div className="px-3 py-2 text-sm text-muted-foreground">
                    No communities yet
                  </div>
                ) : (
                  communities.map((community) => (
                    <SidebarMenuItem key={community.id}>
                      <SidebarMenuButton
                        onClick={() => onSelectCommunity(community.id)}
                        isActive={selectedCommunity === community.id}
                        className="w-full"
                      >
                        <Users className="h-4 w-4 mr-2" />
                        <span>{community.name}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))
                )}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>

      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Community</DialogTitle>
            <DialogDescription>
              Create a community to organize knowledge sharing
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateCommunity} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="communityName">Community Name</Label>
              <Input
                id="communityName"
                placeholder="e.g., Tech Experts"
                value={newCommunityName}
                onChange={(e) => setNewCommunityName(e.target.value)}
                required
              />
            </div>
            <div className="flex justify-end space-x-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setCreateDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Creating..." : "Create Community"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default CommunitySidebar;
