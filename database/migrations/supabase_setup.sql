-- Enable the pgvector extension to work with embedding vectors
create extension if not exists vector;

-- Create the match_labour_laws function for vector similarity search
create or replace function match_labour_laws (
  query_embedding vector(768),
  match_threshold float,
  match_count int
)
returns table (
  id bigint,
  content text,
  similarity float
)
language sql
as $$
  select
    labour_laws.id,
    labour_laws.content,
    1 - (labour_laws.embedding <=> query_embedding) as similarity
  from labour_laws
  where 1 - (labour_laws.embedding <=> query_embedding) > match_threshold
  order by labour_laws.embedding <=> query_embedding
  limit match_count;
$$;
