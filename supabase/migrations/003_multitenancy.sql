-- ============================================================
-- DojanHub — Migration 003: Multi-Tenancy (Institutes)
-- Run in Supabase SQL Editor AFTER 001_init.sql and 002_seed.sql
-- This script is IDEMPOTENT — safe to run multiple times
-- ============================================================

-- ─── 1. INSTITUTES TABLE ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.institutes (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  code        text UNIQUE NOT NULL,           -- 6-char invite code, e.g. "TKD001"
  owner_id    uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  phone       text,
  address     text,
  email       text,
  logo_url    text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.institutes ENABLE ROW LEVEL SECURITY;

-- ─── 2. ADD institute_id TO ALL TABLES ───────────────────────
ALTER TABLE public.profiles       ADD COLUMN IF NOT EXISTS institute_id uuid REFERENCES public.institutes(id);
ALTER TABLE public.coaches        ADD COLUMN IF NOT EXISTS institute_id uuid REFERENCES public.institutes(id);
ALTER TABLE public.batches        ADD COLUMN IF NOT EXISTS institute_id uuid REFERENCES public.institutes(id);
ALTER TABLE public.students       ADD COLUMN IF NOT EXISTS institute_id uuid REFERENCES public.institutes(id);
ALTER TABLE public.schedules      ADD COLUMN IF NOT EXISTS institute_id uuid REFERENCES public.institutes(id);
ALTER TABLE public.payments       ADD COLUMN IF NOT EXISTS institute_id uuid REFERENCES public.institutes(id);
ALTER TABLE public.attendance_logs ADD COLUMN IF NOT EXISTS institute_id uuid REFERENCES public.institutes(id);
ALTER TABLE public.belt_history   ADD COLUMN IF NOT EXISTS institute_id uuid REFERENCES public.institutes(id);

-- ─── 3. HELPER FUNCTIONS ─────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_my_institute_id()
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT institute_id FROM public.profiles WHERE id = auth.uid();
$$;

-- ─── 4. UPDATE handle_new_user TRIGGER ───────────────────────
-- Now stores institute_id from signup metadata (for student signups)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_institute_id uuid;
BEGIN
  BEGIN
    v_institute_id := (NEW.raw_user_meta_data->>'institute_id')::uuid;
  EXCEPTION WHEN others THEN
    v_institute_id := NULL;
  END;

  INSERT INTO public.profiles (id, full_name, role, institute_id)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'student'),
    v_institute_id
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ─── 5. MIGRATE EXISTING SEED DATA ───────────────────────────
DO $$
DECLARE
  demo_institute_id uuid;
  admin_profile_id  uuid := 'a0000000-0000-0000-0000-000000000001';
BEGIN
  IF EXISTS (SELECT 1 FROM public.profiles WHERE id = admin_profile_id) THEN
    INSERT INTO public.institutes (id, name, code, owner_id, email)
    VALUES (
      'e0000000-0000-0000-0000-000000000001',
      'DojanHub Academy',
      'DJH001',
      admin_profile_id,
      'admin@dojanhub.com'
    )
    ON CONFLICT (id) DO NOTHING;

    demo_institute_id := 'e0000000-0000-0000-0000-000000000001';

    UPDATE public.profiles       SET institute_id = demo_institute_id WHERE institute_id IS NULL;
    UPDATE public.coaches        SET institute_id = demo_institute_id WHERE institute_id IS NULL;
    UPDATE public.batches        SET institute_id = demo_institute_id WHERE institute_id IS NULL;
    UPDATE public.students       SET institute_id = demo_institute_id WHERE institute_id IS NULL;
    UPDATE public.schedules      SET institute_id = demo_institute_id WHERE institute_id IS NULL;
    UPDATE public.payments       SET institute_id = demo_institute_id WHERE institute_id IS NULL;
    UPDATE public.attendance_logs SET institute_id = demo_institute_id WHERE institute_id IS NULL;
    UPDATE public.belt_history   SET institute_id = demo_institute_id WHERE institute_id IS NULL;

    RAISE NOTICE 'Seed data migrated to institute DJH001';
  ELSE
    RAISE NOTICE 'No seed data found — skipping backfill';
  END IF;
END $$;

-- ─── 6. RLS POLICIES (UPDATED FOR MULTI-TENANCY) ─────────────
-- Drop ALL old policies first — this makes the script fully idempotent

-- ── Institutes ──
DROP POLICY IF EXISTS "Owner reads own institute"   ON public.institutes;
DROP POLICY IF EXISTS "Owner updates own institute" ON public.institutes;
DROP POLICY IF EXISTS "Anyone inserts institute"    ON public.institutes;

CREATE POLICY "Owner reads own institute" ON public.institutes
  FOR SELECT USING (id = get_my_institute_id());
CREATE POLICY "Owner updates own institute" ON public.institutes
  FOR UPDATE USING (owner_id = auth.uid());
CREATE POLICY "Anyone inserts institute" ON public.institutes
  FOR INSERT WITH CHECK (true);

-- ── Profiles ──
DROP POLICY IF EXISTS "Admin full access profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users read own profile"     ON public.profiles;
DROP POLICY IF EXISTS "Users update own profile"   ON public.profiles;

CREATE POLICY "Admin full access profiles" ON public.profiles
  FOR ALL USING (
    get_my_role() = 'admin' AND institute_id = get_my_institute_id()
  );
CREATE POLICY "Users read own profile" ON public.profiles
  FOR SELECT USING (id = auth.uid());
CREATE POLICY "Users update own profile" ON public.profiles
  FOR UPDATE USING (id = auth.uid());

-- ── Coaches ──
DROP POLICY IF EXISTS "Admin full access coaches"          ON public.coaches;
DROP POLICY IF EXISTS "Coach reads own record"             ON public.coaches;
DROP POLICY IF EXISTS "Anyone can read coaches"            ON public.coaches;
DROP POLICY IF EXISTS "Student reads coaches in institute" ON public.coaches;

CREATE POLICY "Admin full access coaches" ON public.coaches
  FOR ALL USING (
    get_my_role() = 'admin' AND institute_id = get_my_institute_id()
  );
CREATE POLICY "Coach reads own record" ON public.coaches
  FOR SELECT USING (profile_id = auth.uid());
CREATE POLICY "Student reads coaches in institute" ON public.coaches
  FOR SELECT USING (institute_id = get_my_institute_id());

-- ── Batches ──
DROP POLICY IF EXISTS "Admin full access batches"              ON public.batches;
DROP POLICY IF EXISTS "Anyone reads batches"                   ON public.batches;
DROP POLICY IF EXISTS "Anyone reads batches in own institute"  ON public.batches;

CREATE POLICY "Admin full access batches" ON public.batches
  FOR ALL USING (
    get_my_role() = 'admin' AND institute_id = get_my_institute_id()
  );
CREATE POLICY "Anyone reads batches in own institute" ON public.batches
  FOR SELECT USING (institute_id = get_my_institute_id());

-- ── Students ──
DROP POLICY IF EXISTS "Admin full access students"            ON public.students;
DROP POLICY IF EXISTS "Coach reads students in their batches" ON public.students;
DROP POLICY IF EXISTS "Student reads own record"              ON public.students;
DROP POLICY IF EXISTS "Student updates own record"            ON public.students;

CREATE POLICY "Admin full access students" ON public.students
  FOR ALL USING (
    get_my_role() = 'admin' AND institute_id = get_my_institute_id()
  );
CREATE POLICY "Coach reads students in their batches" ON public.students
  FOR SELECT USING (
    get_my_role() = 'coach' AND
    institute_id = get_my_institute_id() AND
    batch_id IN (SELECT id FROM public.batches WHERE coach_id = get_my_coach_id())
  );
CREATE POLICY "Student reads own record" ON public.students
  FOR SELECT USING (profile_id = auth.uid());
CREATE POLICY "Student updates own record" ON public.students
  FOR UPDATE USING (profile_id = auth.uid());

-- ── Schedules ──
DROP POLICY IF EXISTS "Admin full access schedules"      ON public.schedules;
DROP POLICY IF EXISTS "Coach reads own batch schedules"  ON public.schedules;
DROP POLICY IF EXISTS "Student reads own schedule"       ON public.schedules;
DROP POLICY IF EXISTS "Institute members read schedules" ON public.schedules;

CREATE POLICY "Admin full access schedules" ON public.schedules
  FOR ALL USING (
    get_my_role() = 'admin' AND institute_id = get_my_institute_id()
  );
CREATE POLICY "Institute members read schedules" ON public.schedules
  FOR SELECT USING (institute_id = get_my_institute_id());

-- ── Attendance ──
DROP POLICY IF EXISTS "Admin full access attendance"                   ON public.attendance_logs;
DROP POLICY IF EXISTS "Coach insert/read attendance for their batches" ON public.attendance_logs;
DROP POLICY IF EXISTS "Coach manages attendance in their batches"      ON public.attendance_logs;
DROP POLICY IF EXISTS "Student reads own attendance"                   ON public.attendance_logs;

CREATE POLICY "Admin full access attendance" ON public.attendance_logs
  FOR ALL USING (
    get_my_role() = 'admin' AND institute_id = get_my_institute_id()
  );
CREATE POLICY "Coach manages attendance in their batches" ON public.attendance_logs
  FOR ALL USING (
    get_my_role() = 'coach' AND
    institute_id = get_my_institute_id() AND
    batch_id IN (SELECT id FROM public.batches WHERE coach_id = get_my_coach_id())
  );
CREATE POLICY "Student reads own attendance" ON public.attendance_logs
  FOR SELECT USING (student_id = get_my_student_id());

-- ── Payments ──
DROP POLICY IF EXISTS "Admin full access payments" ON public.payments;
DROP POLICY IF EXISTS "Student reads own payments" ON public.payments;

CREATE POLICY "Admin full access payments" ON public.payments
  FOR ALL USING (
    get_my_role() = 'admin' AND institute_id = get_my_institute_id()
  );
CREATE POLICY "Student reads own payments" ON public.payments
  FOR SELECT USING (student_id = get_my_student_id());

-- ── Belt History ──
DROP POLICY IF EXISTS "Admin full access belt_history"              ON public.belt_history;
DROP POLICY IF EXISTS "Coach reads belt history for their students" ON public.belt_history;
DROP POLICY IF EXISTS "Coach reads belt history in institute"       ON public.belt_history;
DROP POLICY IF EXISTS "Student reads own belt history"              ON public.belt_history;

CREATE POLICY "Admin full access belt_history" ON public.belt_history
  FOR ALL USING (
    get_my_role() = 'admin' AND institute_id = get_my_institute_id()
  );
CREATE POLICY "Coach reads belt history in institute" ON public.belt_history
  FOR SELECT USING (
    get_my_role() = 'coach' AND institute_id = get_my_institute_id()
  );
CREATE POLICY "Student reads own belt history" ON public.belt_history
  FOR SELECT USING (student_id = get_my_student_id());
