import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Users } from "lucide-react";

interface ActiveUser {
  id: string;
  full_name: string;
  last_active: string;
}

const ActiveUsers = () => {
  const [activeUsers, setActiveUsers] = useState<ActiveUser[]>([]);

  useEffect(() => {
    fetchActiveUsers();
    
    // Refresh active users every 30 seconds
    const interval = setInterval(fetchActiveUsers, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchActiveUsers = async () => {
    // Get users active in the last 5 minutes
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    
    const { data, error } = await supabase
      .from("profiles")
      .select("id, full_name, last_active")
      .gte("last_active", fiveMinutesAgo)
      .order("last_active", { ascending: false })
      .limit(10);

    if (!error && data) {
      setActiveUsers(data);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  if (activeUsers.length === 0) return null;

  return (
    <div className="bg-card border border-border rounded-lg p-4 shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        <Users className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold text-foreground">Active Now</h3>
        <span className="bg-success/20 text-success text-xs px-2 py-0.5 rounded-full">
          {activeUsers.length}
        </span>
      </div>
      <div className="flex flex-wrap gap-2">
        {activeUsers.map((user) => (
          <div
            key={user.id}
            className="flex items-center gap-2 bg-muted/50 rounded-full px-3 py-1.5 transition-all hover:bg-muted"
          >
            <div className="relative">
              <Avatar className="h-6 w-6">
                <AvatarFallback className="bg-primary/10 text-primary text-xs">
                  {getInitials(user.full_name)}
                </AvatarFallback>
              </Avatar>
              <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-success border-2 border-card" />
            </div>
            <span className="text-xs font-medium text-foreground truncate max-w-[100px]">
              {user.full_name}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ActiveUsers;
