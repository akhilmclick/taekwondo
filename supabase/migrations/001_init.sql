-- ============================================================
-- DojanHub — Supabase Database Migration
-- Run this in Supabase SQL Editor (Project > SQL Editor > New query)
-- ============================================================

-- ─── PROFILES ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.profiles (
  id          uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name   text NOT NULL DEFAULT '',
  phone       text,
  role        text NOT NULL DEFAULT 'student' CHECK (role IN ('admin','coach','student')),
  avatar_url  text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- Automatically create a profile row when a new auth user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''), COALESCE(NEW.raw_user_meta_data->>'role', 'student'));
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ─── COACHES ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.coaches (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id       uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  specialization   text,
  certified_since  date,
  dan_level        integer DEFAULT 1,
  created_at       timestamptz NOT NULL DEFAULT now()
);

-- ─── BATCHES ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.batches (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name          text NOT NULL,
  coach_id      uuid REFERENCES public.coaches(id) ON DELETE SET NULL,
  level         text CHECK (level IN ('Beginner','Intermediate','Advanced')),
  max_capacity  integer DEFAULT 30,
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- ─── STUDENTS ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.students (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id          uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  dob                 date,
  gender              text,
  blood_group         text,
  parent_name         text,
  parent_phone        text,
  address             text,
  emergency_contact   text,
  join_date           date DEFAULT CURRENT_DATE,
  belt_level          text DEFAULT 'White' CHECK (belt_level IN ('White','Yellow','Green','Blue','Red','Black')),
  belt_rank_number    integer DEFAULT 0,
  poomsae_grade       text,
  last_grading_date   date,
  next_grading_date   date,
  medical_notes       text,
  batch_id            uuid REFERENCES public.batches(id) ON DELETE SET NULL,
  status              text DEFAULT 'active' CHECK (status IN ('active','inactive','on_leave')),
  created_at          timestamptz NOT NULL DEFAULT now()
);

-- ─── SCHEDULES ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.schedules (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id     uuid NOT NULL REFERENCES public.batches(id) ON DELETE CASCADE,
  day_of_week  text NOT NULL CHECK (day_of_week IN ('Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday')),
  start_time   time NOT NULL,
  end_time     time NOT NULL,
  location     text DEFAULT 'Main Dojang'
);

-- ─── ATTENDANCE LOGS ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.attendance_logs (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id  uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  batch_id    uuid NOT NULL REFERENCES public.batches(id) ON DELETE CASCADE,
  date        date NOT NULL DEFAULT CURRENT_DATE,
  status      text NOT NULL CHECK (status IN ('present','absent','late')),
  marked_by   uuid REFERENCES public.profiles(id),
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE(student_id, date)
);

-- ─── PAYMENTS ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.payments (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id    uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  amount        numeric(10,2) NOT NULL DEFAULT 0,
  due_date      date NOT NULL,
  paid_date     date,
  status        text DEFAULT 'unpaid' CHECK (status IN ('paid','unpaid','partial','overdue')),
  payment_mode  text CHECK (payment_mode IN ('cash','upi','bank_transfer')),
  notes         text,
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- ─── BELT HISTORY ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.belt_history (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id     uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  previous_belt  text,
  new_belt       text NOT NULL,
  grading_date   date NOT NULL DEFAULT CURRENT_DATE,
  graded_by      uuid REFERENCES public.coaches(id),
  remarks        text
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE public.profiles       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coaches        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.batches        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedules      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.belt_history   ENABLE ROW LEVEL SECURITY;

-- Helper: get current user role
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS text LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

-- Helper: get coach id for current user
CREATE OR REPLACE FUNCTION public.get_my_coach_id()
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT id FROM public.coaches WHERE profile_id = auth.uid();
$$;

-- Helper: get student id for current user
CREATE OR REPLACE FUNCTION public.get_my_student_id()
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT id FROM public.students WHERE profile_id = auth.uid();
$$;

-- ─── PROFILES POLICIES ──────────────────────────────────────
CREATE POLICY "Admin full access profiles" ON public.profiles
  FOR ALL USING (get_my_role() = 'admin');

CREATE POLICY "Users read own profile" ON public.profiles
  FOR SELECT USING (id = auth.uid());

CREATE POLICY "Users update own profile" ON public.profiles
  FOR UPDATE USING (id = auth.uid());

-- ─── COACHES POLICIES ───────────────────────────────────────
CREATE POLICY "Admin full access coaches" ON public.coaches
  FOR ALL USING (get_my_role() = 'admin');

CREATE POLICY "Coach reads own record" ON public.coaches
  FOR SELECT USING (profile_id = auth.uid());

CREATE POLICY "Anyone can read coaches" ON public.coaches
  FOR SELECT USING (true);

-- ─── BATCHES POLICIES ───────────────────────────────────────
CREATE POLICY "Admin full access batches" ON public.batches
  FOR ALL USING (get_my_role() = 'admin');

CREATE POLICY "Anyone reads batches" ON public.batches
  FOR SELECT USING (true);

-- ─── STUDENTS POLICIES ──────────────────────────────────────
CREATE POLICY "Admin full access students" ON public.students
  FOR ALL USING (get_my_role() = 'admin');

CREATE POLICY "Coach reads students in their batches" ON public.students
  FOR SELECT USING (
    get_my_role() = 'coach' AND
    batch_id IN (SELECT id FROM public.batches WHERE coach_id = get_my_coach_id())
  );

CREATE POLICY "Student reads own record" ON public.students
  FOR SELECT USING (profile_id = auth.uid());

-- ─── SCHEDULES POLICIES ─────────────────────────────────────
CREATE POLICY "Admin full access schedules" ON public.schedules
  FOR ALL USING (get_my_role() = 'admin');

CREATE POLICY "Coach reads own batch schedules" ON public.schedules
  FOR SELECT USING (
    get_my_role() = 'coach' AND
    batch_id IN (SELECT id FROM public.batches WHERE coach_id = get_my_coach_id())
  );

CREATE POLICY "Student reads own schedule" ON public.schedules
  FOR SELECT USING (
    batch_id IN (SELECT batch_id FROM public.students WHERE profile_id = auth.uid())
  );

-- ─── ATTENDANCE POLICIES ────────────────────────────────────
CREATE POLICY "Admin full access attendance" ON public.attendance_logs
  FOR ALL USING (get_my_role() = 'admin');

CREATE POLICY "Coach insert/read attendance for their batches" ON public.attendance_logs
  FOR ALL USING (
    get_my_role() = 'coach' AND
    batch_id IN (SELECT id FROM public.batches WHERE coach_id = get_my_coach_id())
  );

CREATE POLICY "Student reads own attendance" ON public.attendance_logs
  FOR SELECT USING (student_id = get_my_student_id());

-- ─── PAYMENTS POLICIES ──────────────────────────────────────
CREATE POLICY "Admin full access payments" ON public.payments
  FOR ALL USING (get_my_role() = 'admin');

CREATE POLICY "Student reads own payments" ON public.payments
  FOR SELECT USING (student_id = get_my_student_id());

-- ─── BELT HISTORY POLICIES ──────────────────────────────────
CREATE POLICY "Admin full access belt_history" ON public.belt_history
  FOR ALL USING (get_my_role() = 'admin');

CREATE POLICY "Coach reads belt history for their students" ON public.belt_history
  FOR SELECT USING (
    get_my_role() = 'coach' AND
    student_id IN (
      SELECT s.id FROM public.students s
      JOIN public.batches b ON s.batch_id = b.id
      WHERE b.coach_id = get_my_coach_id()
    )
  );

CREATE POLICY "Student reads own belt history" ON public.belt_history
  FOR SELECT USING (student_id = get_my_student_id());

-- ============================================================
-- SEED DATA (optional — uncomment to populate with demo data)
-- ============================================================

-- Demo admin user must be created via Supabase Auth dashboard first,
-- then update their profile role to 'admin':
-- UPDATE public.profiles SET role = 'admin', full_name = 'Master Admin' WHERE id = '<user-uuid>';
