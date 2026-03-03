-- Add filename to the existing labour_laws table to track chunks by source file
ALTER TABLE public.labour_laws
ADD COLUMN filename text;

-- Create an index for faster filtering and deletion by filename
CREATE INDEX IF NOT EXISTS labour_laws_filename_idx ON public.labour_laws (filename);

-- Update the match_labour_laws RPC function to return the filename
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
  tool_id text,
  filename text
)
LANGUAGE sql
AS $$
  select
    labour_laws.id,
    labour_laws.content,
    1 - (labour_laws.embedding <=> query_embedding) as similarity,
    labour_laws.tool_id,
    labour_laws.filename
  from labour_laws
  where 1 - (labour_laws.embedding <=> query_embedding) > match_threshold
    and labour_laws.tool_id = p_tool_id
  order by labour_laws.embedding <=> query_embedding
  limit match_count;
$$;
