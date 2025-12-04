import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { LogOut, Plus } from "lucide-react";
import { toast } from "sonner";
import KnowledgePostCard from "@/components/KnowledgePostCard";
import CreatePostDialog from "@/components/CreatePostDialog";
import PostDetailModal from "@/components/PostDetailModal";
import ThemeToggle from "@/components/ThemeToggle";
import ActiveUsers from "@/components/ActiveUsers";
import CommunitySidebar from "@/components/CommunitySidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";

interface KnowledgePost {
  id: string;
  title: string;
  content: string;
  technical_area: string;
  created_at: string;
  author_id: string;
  community_id: string | null;
  profiles: {
    full_name: string;
  };
}

interface PostStats {
  likesCount: number;
  commentsCount: number;
  isLiked: boolean;
}

const Feed = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [posts, setPosts] = useState<KnowledgePost[]>([]);
  const [postStats, setPostStats] = useState<Record<string, PostStats>>({});
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState<KnowledgePost | null>(null);
  const [selectedCommunity, setSelectedCommunity] = useState<string | null>(null);

  useEffect(() => {
    checkUser();
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      if (!session?.user) {
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const updateLastActive = useCallback(async () => {
    if (!user) return;
    await supabase.rpc("update_user_last_active");
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchPosts();
      updateLastActive();
      
      const interval = setInterval(updateLastActive, 2 * 60 * 1000);
      return () => clearInterval(interval);
    }
  }, [user, updateLastActive, selectedCommunity]);

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setUser(session?.user ?? null);
    if (!session?.user) {
      navigate("/auth");
    }
    setLoading(false);
  };

  const fetchPosts = async () => {
    let query = supabase
      .from("knowledge_posts")
      .select(`
        *,
        profiles (
          full_name
        )
      `)
      .order("created_at", { ascending: false });

    if (selectedCommunity) {
      query = query.eq("community_id", selectedCommunity);
    }

    const { data, error } = await query;

    if (error) {
      toast.error("Failed to load posts");
      console.error(error);
    } else {
      setPosts(data || []);
      if (data && user) {
        fetchPostStats(data.map(p => p.id));
      }
    }
  };

  const fetchPostStats = async (postIds: string[]) => {
    if (!user) return;

    const stats: Record<string, PostStats> = {};

    for (const postId of postIds) {
      const { count: likesCount } = await supabase
        .from("post_likes")
        .select("*", { count: "exact", head: true })
        .eq("post_id", postId);

      const { count: commentsCount } = await supabase
        .from("post_comments")
        .select("*", { count: "exact", head: true })
        .eq("post_id", postId);

      const { data: likeData } = await supabase
        .from("post_likes")
        .select("id")
        .eq("post_id", postId)
        .eq("user_id", user.id)
        .maybeSingle();

      stats[postId] = {
        likesCount: likesCount || 0,
        commentsCount: commentsCount || 0,
        isLiked: !!likeData,
      };
    }

    setPostStats(stats);
  };

  const handleLike = async (postId: string) => {
    if (!user) return;

    const currentStats = postStats[postId] || { likesCount: 0, commentsCount: 0, isLiked: false };

    if (currentStats.isLiked) {
      await supabase
        .from("post_likes")
        .delete()
        .eq("post_id", postId)
        .eq("user_id", user.id);

      setPostStats({
        ...postStats,
        [postId]: {
          ...currentStats,
          isLiked: false,
          likesCount: currentStats.likesCount - 1,
        },
      });
    } else {
      await supabase.from("post_likes").insert({
        post_id: postId,
        user_id: user.id,
      });

      setPostStats({
        ...postStats,
        [postId]: {
          ...currentStats,
          isLiked: true,
          likesCount: currentStats.likesCount + 1,
        },
      });
    }
  };

  const handleDelete = async (postId: string) => {
    if (!confirm("Are you sure you want to delete this post?")) return;
    
    const { error } = await supabase
      .from("knowledge_posts")
      .delete()
      .eq("id", postId);

    if (error) {
      toast.error("Failed to delete post");
      console.error(error);
    } else {
      toast.success("Post deleted successfully");
      fetchPosts();
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
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
          userId={user?.id || ""}
        />
        
        <div className="flex-1 flex flex-col">
          <header className="border-b border-border bg-card sticky top-0 z-10 shadow-sm">
            <div className="px-4 py-4 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <SidebarTrigger className="mr-2" />
                <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                  <svg className="h-6 w-6 text-primary-foreground" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2L8 8h3v4H8l4 6 4-6h-3V8h3L12 2zm-1 14v6h2v-6h-2z" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">BRISTLECONE</h1>
                  <p className="text-sm text-muted-foreground">Knowledge Hub</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
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
            <div className="mb-6">
              <ActiveUsers />
            </div>
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
                posts.map((post) => {
                  const stats = postStats[post.id] || { likesCount: 0, commentsCount: 0, isLiked: false };
                  return (
                    <KnowledgePostCard 
                      key={post.id} 
                      post={post}
                      currentUserId={user?.id}
                      likesCount={stats.likesCount}
                      commentsCount={stats.commentsCount}
                      isLiked={stats.isLiked}
                      onLike={() => handleLike(post.id)}
                      onClick={() => setSelectedPost(post)}
                      onDelete={() => handleDelete(post.id)}
                    />
                  );
                })
              )}
            </div>
          </main>
        </div>

        <CreatePostDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          onPostCreated={fetchPosts}
          userId={user?.id || ""}
          preselectedCommunity={selectedCommunity}
        />

        {selectedPost && (
          <PostDetailModal
            open={!!selectedPost}
            onOpenChange={(open) => !open && setSelectedPost(null)}
            post={selectedPost}
            userId={user?.id || ""}
            onUpdate={fetchPosts}
          />
        )}
      </div>
    </SidebarProvider>
  );
};

export default Feed;
