
-- roles
CREATE TYPE public.app_role AS ENUM ('user','admin');

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT '',
  email TEXT,
  resume_text TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own profile" ON public.profiles FOR ALL TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  role public.app_role NOT NULL,
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'name',''), NEW.email)
  ON CONFLICT (id) DO NOTHING;
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user') ON CONFLICT DO NOTHING;
  RETURN NEW;
END; $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE TABLE public.questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  text TEXT NOT NULL,
  category TEXT NOT NULL,
  difficulty TEXT NOT NULL DEFAULT 'medium',
  expected_concepts TEXT[] NOT NULL DEFAULT '{}',
  evaluation_criteria TEXT[] NOT NULL DEFAULT '{}',
  interview_type TEXT NOT NULL DEFAULT 'technical',
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.questions TO authenticated;
GRANT ALL ON public.questions TO service_role;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read questions" ON public.questions FOR SELECT TO authenticated USING (true);
CREATE POLICY "admin insert questions" ON public.questions FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "admin update questions" ON public.questions FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "admin delete questions" ON public.questions FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.interviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'MERN Stack Developer',
  experience_level TEXT NOT NULL DEFAULT 'fresher',
  interview_type TEXT NOT NULL DEFAULT 'technical',
  difficulty_mode TEXT NOT NULL DEFAULT 'adaptive',
  duration_minutes INT NOT NULL DEFAULT 20,
  mode TEXT NOT NULL DEFAULT 'interview',
  topic TEXT,
  status TEXT NOT NULL DEFAULT 'in_progress',
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.interviews TO authenticated;
GRANT ALL ON public.interviews TO service_role;
ALTER TABLE public.interviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own interviews" ON public.interviews FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.interview_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  interview_id UUID NOT NULL REFERENCES public.interviews(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  sender TEXT NOT NULL,
  message_text TEXT NOT NULL,
  question_category TEXT,
  difficulty_at_time TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.interview_messages TO authenticated;
GRANT ALL ON public.interview_messages TO service_role;
ALTER TABLE public.interview_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own messages" ON public.interview_messages FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX ON public.interview_messages (interview_id, created_at);

CREATE TABLE public.interview_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  interview_id UUID NOT NULL UNIQUE REFERENCES public.interviews(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  overall_score INT NOT NULL DEFAULT 0,
  category_scores JSONB NOT NULL DEFAULT '{}'::jsonb,
  strengths TEXT[] NOT NULL DEFAULT '{}',
  areas_to_improve TEXT[] NOT NULL DEFAULT '{}',
  recommended_topics TEXT[] NOT NULL DEFAULT '{}',
  ai_feedback_summary TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.interview_results TO authenticated;
GRANT ALL ON public.interview_results TO service_role;
ALTER TABLE public.interview_results ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own results" ON public.interview_results FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

INSERT INTO public.questions (text, category, difficulty, expected_concepts, evaluation_criteria, interview_type) VALUES
('Explain the difference between var, let and const in JavaScript.','JavaScript','easy','{"scope","hoisting","TDZ"}','{"correctness","clarity"}','technical'),
('What is the event loop and how does it handle async code?','JavaScript','medium','{"call stack","microtasks","macrotasks"}','{"depth","correctness"}','technical'),
('How does React reconciliation and the virtual DOM work?','React','medium','{"diffing","keys","fiber"}','{"depth","clarity"}','technical'),
('When would you use useMemo vs useCallback?','React','medium','{"memoization","referential equality"}','{"correctness","examples"}','technical'),
('How does middleware work in Express.js?','Node.js','easy','{"next()","order","error middleware"}','{"correctness"}','technical'),
('How would you implement authentication with JWT in a Node API?','Node.js','hard','{"signing","storage","refresh tokens","httpOnly cookies"}','{"security awareness","depth"}','technical'),
('How do you design indexes in MongoDB for a high-read collection?','MongoDB','hard','{"compound index","covered query","explain()"}','{"depth","tradeoffs"}','technical'),
('Explain embedding vs referencing in MongoDB schema design.','MongoDB','medium','{"denormalization","document size","joins"}','{"tradeoffs"}','technical'),
('Design a URL shortener. Walk me through the architecture.','System Design','hard','{"hashing","db choice","caching","scaling"}','{"structure","tradeoffs"}','technical'),
('Tell me about yourself and why this role.','HR','easy','{"clarity","relevance"}','{"communication","structure"}','hr'),
('Describe a conflict you had in a team and how you resolved it.','Behavioral','medium','{"STAR","ownership"}','{"structure","self-awareness"}','hr'),
('Walk me through the most challenging project you have built.','Behavioral','medium','{"architecture","tradeoffs","impact"}','{"depth","ownership"}','project');
