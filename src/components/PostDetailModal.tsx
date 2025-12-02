import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Heart, MessageCircle, Trash2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

interface Comment {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  profiles: {
    full_name: string;
  };
}

interface PostDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  post: {
    id: string;
    title: string;
    content: string;
    technical_area: string;
    created_at: string;
    author_id: string;
    profiles: {
      full_name: string;
    };
  };
  userId: string;
  onUpdate?: () => void;
}

const PostDetailModal = ({
  open,
  onOpenChange,
  post,
  userId,
  onUpdate,
}: PostDetailModalProps) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [likesCount, setLikesCount] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      fetchComments();
      fetchLikes();
    }
  }, [open, post.id]);

  const fetchComments = async () => {
    const { data, error } = await supabase
      .from("post_comments")
      .select(`
        *,
        profiles (
          full_name
        )
      `)
      .eq("post_id", post.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching comments:", error);
    } else {
      setComments(data || []);
    }
  };

  const fetchLikes = async () => {
    const { count } = await supabase
      .from("post_likes")
      .select("*", { count: "exact", head: true })
      .eq("post_id", post.id);

    setLikesCount(count || 0);

    const { data } = await supabase
      .from("post_likes")
      .select("id")
      .eq("post_id", post.id)
      .eq("user_id", userId)
      .maybeSingle();

    setIsLiked(!!data);
  };

  const handleLike = async () => {
    if (isLiked) {
      const { error } = await supabase
        .from("post_likes")
        .delete()
        .eq("post_id", post.id)
        .eq("user_id", userId);

      if (error) {
        toast.error("Failed to unlike post");
        return;
      }
      setIsLiked(false);
      setLikesCount((prev) => prev - 1);
    } else {
      const { error } = await supabase.from("post_likes").insert({
        post_id: post.id,
        user_id: userId,
      });

      if (error) {
        toast.error("Failed to like post");
        return;
      }
      setIsLiked(true);
      setLikesCount((prev) => prev + 1);
    }
    onUpdate?.();
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setLoading(true);
    const { error } = await supabase.from("post_comments").insert({
      post_id: post.id,
      user_id: userId,
      content: newComment,
    });

    if (error) {
      toast.error("Failed to add comment");
    } else {
      toast.success("Comment added");
      setNewComment("");
      fetchComments();
      onUpdate?.();
    }
    setLoading(false);
  };

  const handleDeleteComment = async (commentId: string) => {
    const { error } = await supabase
      .from("post_comments")
      .delete()
      .eq("id", commentId);

    if (error) {
      toast.error("Failed to delete comment");
    } else {
      toast.success("Comment deleted");
      fetchComments();
      onUpdate?.();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <DialogTitle className="text-2xl mb-3">{post.title}</DialogTitle>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <span className="font-medium text-foreground">
                  {post.profiles.full_name}
                </span>
                <span>•</span>
                <span>
                  {formatDistanceToNow(new Date(post.created_at), {
                    addSuffix: true,
                  })}
                </span>
              </div>
            </div>
            <Badge variant="secondary" className="bg-info/10 text-info border-info/20">
              {post.technical_area}
            </Badge>
          </div>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          <div>
            <p className="text-foreground whitespace-pre-wrap leading-relaxed">
              {post.content}
            </p>
          </div>

          <div className="flex items-center gap-4">
            <Button
              variant={isLiked ? "default" : "outline"}
              size="sm"
              onClick={handleLike}
              className="gap-2"
            >
              <Heart className={`h-4 w-4 ${isLiked ? "fill-current" : ""}`} />
              <span>{likesCount}</span>
            </Button>
            <div className="flex items-center gap-2 text-muted-foreground">
              <MessageCircle className="h-4 w-4" />
              <span className="text-sm">{comments.length} comments</span>
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Discussion</h3>
            
            <form onSubmit={handleAddComment} className="space-y-3">
              <Textarea
                placeholder="Add your comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                rows={3}
                className="resize-none"
              />
              <div className="flex justify-end">
                <Button type="submit" disabled={loading || !newComment.trim()}>
                  Post Comment
                </Button>
              </div>
            </form>

            <div className="space-y-4 mt-6">
              {comments.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No comments yet. Be the first to comment!
                </p>
              ) : (
                comments.map((comment) => (
                  <div
                    key={comment.id}
                    className="bg-muted/50 rounded-lg p-4 space-y-2"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">
                            {comment.profiles.full_name}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(comment.created_at), {
                              addSuffix: true,
                            })}
                          </span>
                        </div>
                        <p className="text-sm mt-2 whitespace-pre-wrap">
                          {comment.content}
                        </p>
                      </div>
                      {comment.user_id === userId && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteComment(comment.id)}
                          className="h-8 w-8"
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PostDetailModal;
