import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { LogOut, Plus } from "lucide-react";
import { toast } from "sonner";
import KnowledgePostCard from "@/components/KnowledgePostCard";
import CreatePostDialog from "@/components/CreatePostDialog";

interface KnowledgePost {
  id: string;
  title: string;
  content: string;
  technical_area: string;
  created_at: string;
  author_id: string;
  profiles: {
    full_name: string;
  };
}

const Feed = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [posts, setPosts] = useState<KnowledgePost[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);

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

  useEffect(() => {
    if (user) {
      fetchPosts();
    }
  }, [user]);

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setUser(session?.user ?? null);
    if (!session?.user) {
      navigate("/auth");
    }
    setLoading(false);
  };

  const fetchPosts = async () => {
    const { data, error } = await supabase
      .from("knowledge_posts")
      .select(`
        *,
        profiles (
          full_name
        )
      `)
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Failed to load posts");
      console.error(error);
    } else {
      setPosts(data || []);
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
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <svg
              className="h-10 w-20"
              viewBox="0 0 120 50"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <rect width="120" height="50" rx="4" fill="hsl(var(--primary))" />
              <text
                x="60"
                y="32"
                textAnchor="middle"
                fill="white"
                fontSize="24"
                fontWeight="bold"
                fontFamily="Arial, sans-serif"
              >
                SAP
              </text>
            </svg>
            <div>
              <h1 className="text-xl font-bold text-foreground">BASIS Community</h1>
              <p className="text-sm text-muted-foreground">Knowledge Hub</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Share Knowledge
            </Button>
            <Button variant="outline" onClick={handleSignOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="space-y-6">
          {posts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">No knowledge posts yet</p>
              <Button onClick={() => setDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Be the first to share
              </Button>
            </div>
          ) : (
            posts.map((post) => (
              <KnowledgePostCard key={post.id} post={post} />
            ))
          )}
        </div>
      </main>

      <CreatePostDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onPostCreated={fetchPosts}
        userId={user?.id || ""}
      />
    </div>
  );
};

export default Feed;
