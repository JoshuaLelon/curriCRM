-- Fix URL column case sensitivity issue
ALTER TABLE public.sources RENAME COLUMN url TO url_temp;
ALTER TABLE public.sources RENAME COLUMN url_temp TO "URL";

-- Refresh schema cache
NOTIFY pgrst, 'reload schema'; 