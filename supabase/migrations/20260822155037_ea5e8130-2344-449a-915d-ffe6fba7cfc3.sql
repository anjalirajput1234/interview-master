
ALTER TABLE public.profiles ADD COLUMN preferred_avatar_persona TEXT NOT NULL DEFAULT 'aria';
ALTER TABLE public.interviews ADD COLUMN avatar_persona TEXT NOT NULL DEFAULT 'aria';
