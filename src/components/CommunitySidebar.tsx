import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
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
  id: string;
  name: string;
  created_by: string;
  created_at: string;
}

interface CommunitySidebarProps {
  selectedCommunity: string | null;
  onSelectCommunity: (communityId: string | null) => void;
  userId: string;
}

const CommunitySidebar = ({ selectedCommunity, onSelectCommunity, userId }: CommunitySidebarProps) => {
  const [communities, setCommunities] = useState<Community[]>([]);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newCommunityName, setNewCommunityName] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchCommunities();
  }, []);

  const fetchCommunities = async () => {
    const { data, error } = await supabase
      .from("communities")
      .select("*")
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching communities:", error);
    } else {
      setCommunities(data || []);
    }
  };

  const handleCreateCommunity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommunityName.trim()) return;

    setLoading(true);
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
      console.error(error);
    } else {
      toast.success("Community created!");
      setNewCommunityName("");
      setCreateDialogOpen(false);
      fetchCommunities();
      if (data) {
        onSelectCommunity(data.id);
      }
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
                placeholder="e.g., SAP HANA Experts"
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
