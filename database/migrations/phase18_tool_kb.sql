-- Add tool_id to the existing labour_laws table to isolate knowledge bases per tool
ALTER TABLE public.labour_laws
ADD COLUMN tool_id text DEFAULT 'labour-audit';

-- Create an index for faster similarity searches filtered by tool
CREATE INDEX IF NOT EXISTS labour_laws_tool_id_idx ON public.labour_laws (tool_id);

-- Update the match_labour_laws RPC function to accept a tool_id parameter and filter by it
CREATE OR REPLACE FUNCTION match_labour_laws (
  query_embedding vector(768),
  match_threshold float,
  match_count int,
  p_tool_id text DEFAULT 'labour-audit'
)
RETURNS TABLE (
  id bigint,
  content text,
  similarity float,
  tool_id text
)
LANGUAGE sql
AS $$
  select
    labour_laws.id,
    labour_laws.content,
    1 - (labour_laws.embedding <=> query_embedding) as similarity,
    labour_laws.tool_id
  from labour_laws
  where 1 - (labour_laws.embedding <=> query_embedding) > match_threshold
    and labour_laws.tool_id = p_tool_id
  order by labour_laws.embedding <=> query_embedding
  limit match_count;
$$;
