import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Heart, MessageCircle, Trash2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface KnowledgePostCardProps {
  post: {
    id: string;
    title: string;
    content: string;
    technical_area: string;
    created_at: string;
    author_id: string;
    community_id?: string | null;
    profiles: {
      full_name: string;
    };
  };
  currentUserId?: string;
  likesCount?: number;
  commentsCount?: number;
  isLiked?: boolean;
  onLike?: () => void;
  onClick?: () => void;
  onDelete?: () => void;
}

const KnowledgePostCard = ({ 
  post, 
  currentUserId,
  likesCount = 0, 
  commentsCount = 0,
  isLiked = false,
  onLike,
  onClick,
  onDelete
}: KnowledgePostCardProps) => {
  const isOwner = currentUserId === post.author_id;
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
                {post.profiles.full_name}
              </span>
              <span>•</span>
              <span>
                {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
              </span>
            </div>
          </div>
          <Badge 
            variant="secondary" 
            className="bg-info/10 text-info border-info/20 hover:bg-info/20 transition-colors"
          >
            {post.technical_area}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-foreground whitespace-pre-wrap line-clamp-3">
          {post.content}
        </p>
        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-3">
            <Button
              variant={isLiked ? "default" : "ghost"}
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onLike?.();
              }}
              className={`gap-2 ${isLiked ? '' : 'hover:text-primary'}`}
            >
              <Heart className={`h-4 w-4 ${isLiked ? "fill-current" : ""}`} />
              <span>{likesCount}</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="gap-2 hover:text-info"
            >
              <MessageCircle className="h-4 w-4" />
              <span>{commentsCount}</span>
            </Button>
          </div>
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
