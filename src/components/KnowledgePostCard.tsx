import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Post } from "@/lib/api";

interface KnowledgePostCardProps {
  post: Post;
  currentUserId?: number | null;
  onClick?: () => void;
  onDelete?: () => void;
}

const KnowledgePostCard = ({ 
  post, 
  currentUserId,
  onClick,
  onDelete
}: KnowledgePostCardProps) => {
  const isOwner = currentUserId === post.user_id;
  
  return (
    <Card 
      className="hover:shadow-lg transition-all duration-300 cursor-pointer group border-border/50 hover:border-primary/30"
      style={{ 
        background: 'var(--gradient-card)',
        boxShadow: 'var(--shadow-elegant)'
      }}
      onClick={onClick}
    >
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <CardTitle className="text-xl mb-2 group-hover:text-primary transition-colors">
              {post.title}
            </CardTitle>
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <span className="font-medium text-foreground">
                {post.username}
              </span>
              <span>•</span>
              <span>
                {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
              </span>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-foreground whitespace-pre-wrap line-clamp-3">
          {post.content}
        </p>
        <div className="flex items-center justify-end pt-2">
          {isOwner && (
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onDelete?.();
              }}
              className="gap-2 text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default KnowledgePostCard;
