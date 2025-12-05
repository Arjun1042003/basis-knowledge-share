import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { api, Post } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { LogOut, Plus } from "lucide-react";
import { toast } from "sonner";
import KnowledgePostCard from "@/components/KnowledgePostCard";
import CreatePostDialog from "@/components/CreatePostDialog";
import PostDetailModal from "@/components/PostDetailModal";
import ThemeToggle from "@/components/ThemeToggle";
import CommunitySidebar from "@/components/CommunitySidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import bristleconeLogo from "@/assets/bristlecone-logo.png";

const Feed = () => {
  const navigate = useNavigate();
  const [userId, setUserId] = useState<number | null>(null);
  const [username, setUsername] = useState<string>("");
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [selectedCommunity, setSelectedCommunity] = useState<number | null>(null);
  const [communityRefreshTrigger, setCommunityRefreshTrigger] = useState(0);

  useEffect(() => {
    checkUser();
  }, []);

  const updateStatus = useCallback(async () => {
    if (!userId) return;
    try {
      await api.updateStatus("online");
    } catch (error) {
      console.error("Failed to update status:", error);
    }
  }, [userId]);

  useEffect(() => {
    if (userId) {
      fetchPosts();
      updateStatus();
      
      const interval = setInterval(updateStatus, 2 * 60 * 1000);
      return () => clearInterval(interval);
    }
  }, [userId, updateStatus, selectedCommunity]);

  const checkUser = () => {
    const storedUserId = localStorage.getItem("user_id");
    const storedUsername = localStorage.getItem("username");
    
    if (!storedUserId || !storedUsername) {
      navigate("/auth");
      return;
    }
    
    setUserId(Number(storedUserId));
    setUsername(storedUsername);
    setLoading(false);
  };

  const fetchPosts = async () => {
    try {
      const data = await api.getFeed();
      let filteredPosts = data;
      
      if (selectedCommunity !== null) {
        filteredPosts = data.filter(p => p.community_id === selectedCommunity);
      }
      
      setPosts(filteredPosts);
    } catch (error: any) {
      toast.error("Failed to load posts");
      console.error(error);
    }
  };

  const handleDelete = async (postId: number) => {
    if (!confirm("Are you sure you want to delete this post?")) return;
    
    try {
      await api.deletePost(postId);
      toast.success("Post deleted successfully");
      fetchPosts();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete post");
    }
  };

  const handleSignOut = async () => {
    try {
      await api.logout();
    } catch (error) {
      console.error("Logout error:", error);
    }
    localStorage.removeItem("user_id");
    localStorage.removeItem("username");
    toast.success("Signed out successfully");
    navigate("/auth");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <CommunitySidebar
          selectedCommunity={selectedCommunity}
          onSelectCommunity={setSelectedCommunity}
          refreshTrigger={communityRefreshTrigger}
        />
        
        <div className="flex-1 flex flex-col">
          <header className="border-b border-border bg-card sticky top-0 z-10 shadow-sm">
            <div className="px-4 py-4 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <SidebarTrigger className="mr-2" />
                <img 
                  src={bristleconeLogo} 
                  alt="Bristlecone Logo" 
                  className="h-12 w-12 object-contain dark:brightness-110 dark:contrast-125"
                />
                <div>
                  <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">BRISTLECONE</h1>
                  <p className="text-sm text-muted-foreground">Knowledge Hub</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <span className="text-sm text-muted-foreground">Welcome, {username}</span>
                <Button onClick={() => setDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Share Knowledge
                </Button>
                <ThemeToggle />
                <Button variant="outline" onClick={handleSignOut}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </Button>
              </div>
            </div>
          </header>

          <main className="flex-1 px-4 py-8 max-w-4xl mx-auto w-full">
            <div className="space-y-6 animate-fade-in">
              {posts.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground mb-4">
                    {selectedCommunity ? "No posts in this community yet" : "No knowledge posts yet"}
                  </p>
                  <Button onClick={() => setDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Be the first to share
                  </Button>
                </div>
              ) : (
                posts.map((post) => (
                  <KnowledgePostCard 
                    key={post.id} 
                    post={post}
                    currentUserId={userId}
                    onClick={() => setSelectedPost(post)}
                    onDelete={() => handleDelete(post.id)}
                  />
                ))
              )}
            </div>
          </main>
        </div>

        <CreatePostDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          onPostCreated={fetchPosts}
          preselectedCommunity={selectedCommunity}
          onCommunityCreated={() => setCommunityRefreshTrigger(prev => prev + 1)}
        />

        {selectedPost && (
          <PostDetailModal
            open={!!selectedPost}
            onOpenChange={(open) => !open && setSelectedPost(null)}
            post={selectedPost}
          />
        )}
      </div>
    </SidebarProvider>
  );
};

export default Feed;
