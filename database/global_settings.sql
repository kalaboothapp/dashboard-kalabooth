-- Enable Realtime for the table first
begin;
  drop publication if exists supabase_realtime;
  create publication supabase_realtime;
commit;

-- Create the Global Settings Table
CREATE TABLE public.global_settings (
    id int8 PRIMARY KEY,
    active_theme text DEFAULT 'default'::text,
    audio_url text,
    announcement_url text,
    primary_color text DEFAULT '#ba1c16',
    secondary_color text DEFAULT '#face10',
    bg_image_url text,
    home_background_url text,
    filler_image_url text,
    updated_at timestamptz DEFAULT now()
);

-- Insert the default configuration row
INSERT INTO public.global_settings (id, active_theme, audio_url)
VALUES (1, 'default', '')
ON CONFLICT (id) DO NOTHING;

-- Enable Realtime for global_settings so connected clients can listen to changes
ALTER PUBLICATION supabase_realtime ADD TABLE public.global_settings;

-- Set up Row Level Security (RLS)
ALTER TABLE public.global_settings ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read the settings
CREATE POLICY "Enable read access for all users" ON public.global_settings
    AS PERMISSIVE FOR SELECT
    TO public
    USING (true);

-- Allow admins (authenticated users) to update settings
CREATE POLICY "Enable update for authenticated users only" ON public.global_settings
    AS PERMISSIVE FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Allow admins to insert if the row doesn't exist
CREATE POLICY "Enable insert for authenticated users only" ON public.global_settings
    AS PERMISSIVE FOR INSERT
    TO authenticated
    WITH CHECK (true);
