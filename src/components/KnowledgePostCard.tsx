import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";

interface KnowledgePostCardProps {
  post: {
    id: string;
    title: string;
    content: string;
    technical_area: string;
    created_at: string;
    profiles: {
      full_name: string;
    };
  };
}

const KnowledgePostCard = ({ post }: KnowledgePostCardProps) => {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <CardTitle className="text-xl mb-2">{post.title}</CardTitle>
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
          <Badge variant="secondary">{post.technical_area}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-foreground whitespace-pre-wrap">{post.content}</p>
      </CardContent>
    </Card>
  );
};

export default KnowledgePostCard;
