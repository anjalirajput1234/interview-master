CREATE TABLE public.avatars (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  short_description text NOT NULL DEFAULT '',
  thumbnail_url text,
  personality_prompt text NOT NULL DEFAULT '',
  voice_style text NOT NULL DEFAULT 'neutral',
  accent_color text NOT NULL DEFAULT 'primary',
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.avatars TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.avatars TO authenticated;
GRANT ALL ON public.avatars TO service_role;

ALTER TABLE public.avatars ENABLE ROW LEVEL SECURITY;

CREATE POLICY "read active avatars" ON public.avatars
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "admin insert avatars" ON public.avatars
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admin update avatars" ON public.avatars
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admin delete avatars" ON public.avatars
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.set_updated_at() FROM PUBLIC, anon, authenticated;

CREATE TRIGGER update_avatars_updated_at
  BEFORE UPDATE ON public.avatars
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.avatars (name, short_description, personality_prompt, voice_style, accent_color, sort_order) VALUES
('Priya', 'Friendly HR interviewer — warm and encouraging', 'You are Priya, a friendly HR interviewer. Your tone is warm, encouraging and conversational. You put the candidate at ease, acknowledge good answers explicitly, and ask gentle follow-ups about motivation, teamwork and culture fit before moving on.', 'warm-female', 'primary', 1),
('Rahul', 'Senior Technical Lead — direct and detail-focused', 'You are Rahul, a senior technical lead. Your tone is direct, precise and detail-focused. You probe implementation details, ask "why" and "what happens if" follow-ups, and politely push back on hand-wavy answers without being rude.', 'deep-male', 'accent', 2),
('Amit', 'Startup Founder — fast-paced and practical', 'You are Amit, a startup founder interviewing for a small team. Your tone is fast-paced, pragmatic and outcome-driven. You care about shipping, ownership and trade-offs, keep questions short, and quickly move to the next topic once you have what you need.', 'bright-male', 'success', 3),
('Neha', 'Calm and structured — methodical questioning', 'You are Neha, a calm and highly structured interviewer. You ask one clear question at a time, give the candidate space, and work methodically through fundamentals before depth. Your feedback cues are measured and neutral.', 'calm-female', 'warning', 4);

ALTER TABLE public.interviews
  ADD COLUMN avatar_id uuid REFERENCES public.avatars(id),
  ADD COLUMN language text NOT NULL DEFAULT 'en';