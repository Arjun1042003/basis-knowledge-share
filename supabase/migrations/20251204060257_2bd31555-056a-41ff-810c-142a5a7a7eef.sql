-- Create communities table
CREATE TABLE public.communities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.communities ENABLE ROW LEVEL SECURITY;

-- Policies for communities
CREATE POLICY "Communities viewable by all authenticated users"
ON public.communities FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can create communities"
ON public.communities FOR INSERT
WITH CHECK (auth.uid() = created_by);

-- Add community_id to knowledge_posts
ALTER TABLE public.knowledge_posts 
ADD COLUMN community_id UUID REFERENCES public.communities(id);

-- Create index for faster queries
CREATE INDEX idx_knowledge_posts_community ON public.knowledge_posts(community_id);