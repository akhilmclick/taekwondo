-- ============================================================
-- DojanHub — Seed Data (Indian Names)
-- Run AFTER 001_init.sql
-- Password for ALL test accounts: Dojang@123
-- ============================================================

DO $$
DECLARE
  -- Hashed password for "Dojang@123"
  pass text := crypt('Dojang@123', gen_salt('bf'));

  -- ── Auth / Profile UUIDs ──────────────────────────────────
  admin_id  uuid := 'a0000000-0000-0000-0000-000000000001';
  coach1_id uuid := 'a0000000-0000-0000-0000-000000000002';
  coach2_id uuid := 'a0000000-0000-0000-0000-000000000003';
  s1_id     uuid := 'a0000000-0000-0000-0000-000000000004';
  s2_id     uuid := 'a0000000-0000-0000-0000-000000000005';
  s3_id     uuid := 'a0000000-0000-0000-0000-000000000006';
  s4_id     uuid := 'a0000000-0000-0000-0000-000000000007';
  s5_id     uuid := 'a0000000-0000-0000-0000-000000000008';
  s6_id     uuid := 'a0000000-0000-0000-0000-000000000009';
  s7_id     uuid := 'a0000000-0000-0000-0000-000000000010';
  s8_id     uuid := 'a0000000-0000-0000-0000-000000000011';
  s9_id     uuid := 'a0000000-0000-0000-0000-000000000012';
  s10_id    uuid := 'a0000000-0000-0000-0000-000000000013';

  -- ── Coaches table record UUIDs ────────────────────────────
  c1_rec uuid := 'b0000000-0000-0000-0000-000000000001';
  c2_rec uuid := 'b0000000-0000-0000-0000-000000000002';

  -- ── Batch UUIDs ───────────────────────────────────────────
  batch1 uuid := 'c0000000-0000-0000-0000-000000000001'; -- Morning Beginners
  batch2 uuid := 'c0000000-0000-0000-0000-000000000002'; -- Evening Intermediate
  batch3 uuid := 'c0000000-0000-0000-0000-000000000003'; -- Advanced Warriors

  -- ── Student record UUIDs ──────────────────────────────────
  st1  uuid := 'd0000000-0000-0000-0000-000000000001';
  st2  uuid := 'd0000000-0000-0000-0000-000000000002';
  st3  uuid := 'd0000000-0000-0000-0000-000000000003';
  st4  uuid := 'd0000000-0000-0000-0000-000000000004';
  st5  uuid := 'd0000000-0000-0000-0000-000000000005';
  st6  uuid := 'd0000000-0000-0000-0000-000000000006';
  st7  uuid := 'd0000000-0000-0000-0000-000000000007';
  st8  uuid := 'd0000000-0000-0000-0000-000000000008';
  st9  uuid := 'd0000000-0000-0000-0000-000000000009';
  st10 uuid := 'd0000000-0000-0000-0000-000000000010';

BEGIN

-- ══════════════════════════════════════════════════════════════
-- 1. AUTH USERS
-- ══════════════════════════════════════════════════════════════
INSERT INTO auth.users (
  id, instance_id, aud, role, email, encrypted_password,
  email_confirmed_at, created_at, updated_at,
  raw_app_meta_data, raw_user_meta_data, is_super_admin
) VALUES
  -- Admin
  (admin_id,  '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
   'admin@dojanhub.com',  pass, now(), now(), now(),
   '{"provider":"email","providers":["email"]}', '{"full_name":"Rajesh Kumar","role":"admin"}', false),

  -- Coaches
  (coach1_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
   'arjun@dojanhub.com',  pass, now(), now(), now(),
   '{"provider":"email","providers":["email"]}', '{"full_name":"Arjun Sharma","role":"coach"}', false),
  (coach2_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
   'priya@dojanhub.com',  pass, now(), now(), now(),
   '{"provider":"email","providers":["email"]}', '{"full_name":"Priya Nair","role":"coach"}', false),

  -- Students
  (s1_id,  '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
   'rohan@dojanhub.com',     pass, now(), now(), now(),
   '{"provider":"email","providers":["email"]}', '{"full_name":"Rohan Mehta","role":"student"}', false),
  (s2_id,  '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
   'ananya@dojanhub.com',    pass, now(), now(), now(),
   '{"provider":"email","providers":["email"]}', '{"full_name":"Ananya Patel","role":"student"}', false),
  (s3_id,  '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
   'kavya@dojanhub.com',     pass, now(), now(), now(),
   '{"provider":"email","providers":["email"]}', '{"full_name":"Kavya Reddy","role":"student"}', false),
  (s4_id,  '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
   'aditya@dojanhub.com',    pass, now(), now(), now(),
   '{"provider":"email","providers":["email"]}', '{"full_name":"Aditya Krishnan","role":"student"}', false),
  (s5_id,  '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
   'neha@dojanhub.com',      pass, now(), now(), now(),
   '{"provider":"email","providers":["email"]}', '{"full_name":"Neha Gupta","role":"student"}', false),
  (s6_id,  '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
   'aryan@dojanhub.com',     pass, now(), now(), now(),
   '{"provider":"email","providers":["email"]}', '{"full_name":"Aryan Joshi","role":"student"}', false),
  (s7_id,  '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
   'diya@dojanhub.com',      pass, now(), now(), now(),
   '{"provider":"email","providers":["email"]}', '{"full_name":"Diya Choudhary","role":"student"}', false),
  (s8_id,  '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
   'siddharth@dojanhub.com', pass, now(), now(), now(),
   '{"provider":"email","providers":["email"]}', '{"full_name":"Siddharth Rao","role":"student"}', false),
  (s9_id,  '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
   'meera@dojanhub.com',     pass, now(), now(), now(),
   '{"provider":"email","providers":["email"]}', '{"full_name":"Meera Iyer","role":"student"}', false),
  (s10_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
   'karthik@dojanhub.com',   pass, now(), now(), now(),
   '{"provider":"email","providers":["email"]}', '{"full_name":"Karthik Nair","role":"student"}', false)
ON CONFLICT (id) DO NOTHING;

-- ══════════════════════════════════════════════════════════════
-- 2. UPDATE PROFILES (trigger already created the rows)
-- ══════════════════════════════════════════════════════════════
UPDATE public.profiles SET phone = '9845001234' WHERE id = admin_id;
UPDATE public.profiles SET phone = '9812345001' WHERE id = coach1_id;
UPDATE public.profiles SET phone = '9812345002' WHERE id = coach2_id;
UPDATE public.profiles SET phone = '9900000001' WHERE id = s1_id;
UPDATE public.profiles SET phone = '9900000002' WHERE id = s2_id;
UPDATE public.profiles SET phone = '9900000003' WHERE id = s3_id;
UPDATE public.profiles SET phone = '9900000004' WHERE id = s4_id;
UPDATE public.profiles SET phone = '9900000005' WHERE id = s5_id;
UPDATE public.profiles SET phone = '9900000006' WHERE id = s6_id;
UPDATE public.profiles SET phone = '9900000007' WHERE id = s7_id;
UPDATE public.profiles SET phone = '9900000008' WHERE id = s8_id;
UPDATE public.profiles SET phone = '9900000009' WHERE id = s9_id;
UPDATE public.profiles SET phone = '9900000010' WHERE id = s10_id;

-- ══════════════════════════════════════════════════════════════
-- 3. COACHES
-- ══════════════════════════════════════════════════════════════
INSERT INTO public.coaches (id, profile_id, specialization, certified_since, dan_level) VALUES
  (c1_rec, coach1_id, 'Kyorugi & Poomsae', '2015-03-10', 4),
  (c2_rec, coach2_id, 'Poomsae & Beginner Training', '2019-07-22', 2)
ON CONFLICT (id) DO NOTHING;

-- ══════════════════════════════════════════════════════════════
-- 4. BATCHES
-- ══════════════════════════════════════════════════════════════
INSERT INTO public.batches (id, name, coach_id, level, max_capacity) VALUES
  (batch1, 'Morning Beginners',    c2_rec, 'Beginner',     20),
  (batch2, 'Evening Intermediate', c2_rec, 'Intermediate', 18),
  (batch3, 'Advanced Warriors',    c1_rec, 'Advanced',     12)
ON CONFLICT (id) DO NOTHING;

-- ══════════════════════════════════════════════════════════════
-- 5. STUDENTS
-- ══════════════════════════════════════════════════════════════
INSERT INTO public.students (
  id, profile_id, dob, gender, blood_group,
  parent_name, parent_phone, address, emergency_contact,
  join_date, belt_level, belt_rank_number, poomsae_grade,
  last_grading_date, next_grading_date, batch_id, status
) VALUES
  -- Morning Beginners (batch1)
  (st1,  s1_id,  '2012-04-15', 'Male',   'B+',  'Suresh Mehta',      '9845100001', '14 MG Road, Bengaluru',        '9845100099', '2023-06-01', 'Blue',   0, 'Taegeuk 4', '2024-06-15', '2025-01-15', batch1, 'active'),
  (st2,  s2_id,  '2013-09-22', 'Female', 'O+',  'Rekha Patel',       '9845100002', '22 Koramangala, Bengaluru',    '9845100098', '2023-08-10', 'Green',  0, 'Taegeuk 3', '2024-08-20', '2025-02-20', batch1, 'active'),
  (st4,  s4_id,  '2015-01-30', 'Male',   'A+',  'Mohan Krishnan',    '9845100004', '5 Indiranagar, Bengaluru',     '9845100096', '2024-01-15', 'White',  0, 'Taegeuk 1', NULL,         '2025-03-01', batch1, 'active'),
  (st9,  s9_id,  '2014-07-18', 'Female', 'AB+', 'Lakshmi Iyer',      '9845100009', '9 Jayanagar, Bengaluru',       '9845100091', '2023-11-05', 'Yellow', 0, 'Taegeuk 2', '2024-11-10', '2025-04-10', batch1, 'active'),

  -- Evening Intermediate (batch2)
  (st3,  s3_id,  '2011-05-03', 'Female', 'B-',  'Venkat Reddy',      '9845100003', '7 Banjara Hills, Hyderabad',   '9845100097', '2022-03-20', 'Yellow', 0, 'Taegeuk 2', '2024-03-25', '2025-01-25', batch2, 'active'),
  (st5,  s5_id,  '2012-12-11', 'Female', 'O-',  'Ramesh Gupta',      '9845100005', '33 Lajpat Nagar, Delhi',       '9845100095', '2022-09-01', 'Blue',   0, 'Taegeuk 4', '2024-09-05', '2025-03-05', batch2, 'active'),
  (st7,  s7_id,  '2013-03-25', 'Female', 'A-',  'Deepak Choudhary',  '9845100007', '18 Salt Lake, Kolkata',         '9845100093', '2023-02-14', 'Green',  0, 'Taegeuk 3', '2024-02-20', '2025-02-28', batch2, 'active'),

  -- Advanced Warriors (batch3)
  (st6,  s6_id,  '2008-08-19', 'Male',   'A+',  'Manoj Joshi',       '9845100006', '2 Andheri West, Mumbai',       '9845100094', '2020-01-10', 'Black',  1, 'Koryo',     '2023-12-01', '2026-12-01', batch3, 'active'),
  (st8,  s8_id,  '2009-06-07', 'Male',   'B+',  'Srinivas Rao',      '9845100008', '45 Jubilee Hills, Hyderabad',  '9845100092', '2021-05-20', 'Red',    0, 'Taegeuk 6', '2024-05-25', '2024-12-25', batch3, 'active'),
  (st10, s10_id, '2010-10-14', 'Male',   'O+',  'Gopalan Nair',      '9845100010', '11 Palarivattom, Kochi',       '9845100090', '2021-03-08', 'Red',    0, 'Taegeuk 5', '2024-04-01', '2025-01-01', batch3, 'inactive')
ON CONFLICT (id) DO NOTHING;

-- ══════════════════════════════════════════════════════════════
-- 6. SCHEDULES
-- ══════════════════════════════════════════════════════════════
INSERT INTO public.schedules (id, batch_id, day_of_week, start_time, end_time, location) VALUES
  (gen_random_uuid(), batch1, 'Monday',    '07:00', '08:00', 'Main Dojang'),
  (gen_random_uuid(), batch1, 'Wednesday', '07:00', '08:00', 'Main Dojang'),
  (gen_random_uuid(), batch1, 'Friday',    '07:00', '08:00', 'Main Dojang'),
  (gen_random_uuid(), batch1, 'Saturday',  '08:00', '09:30', 'Main Dojang'),

  (gen_random_uuid(), batch2, 'Monday',    '18:00', '19:30', 'Training Hall B'),
  (gen_random_uuid(), batch2, 'Wednesday', '18:00', '19:30', 'Training Hall B'),
  (gen_random_uuid(), batch2, 'Friday',    '18:00', '19:30', 'Training Hall B'),

  (gen_random_uuid(), batch3, 'Tuesday',   '06:30', '08:30', 'Main Dojang'),
  (gen_random_uuid(), batch3, 'Thursday',  '06:30', '08:30', 'Main Dojang'),
  (gen_random_uuid(), batch3, 'Saturday',  '06:00', '08:00', 'Competition Arena')
ON CONFLICT DO NOTHING;

-- ══════════════════════════════════════════════════════════════
-- 7. ATTENDANCE LOGS — last 30 days
-- ══════════════════════════════════════════════════════════════
INSERT INTO public.attendance_logs (id, student_id, batch_id, date, status, marked_by)
SELECT
  gen_random_uuid(),
  s.student_id,
  s.batch_id,
  CURRENT_DATE - (n || ' days')::interval,
  CASE WHEN random() < 0.75 THEN 'present'
       WHEN random() < 0.88 THEN 'absent'
       ELSE 'late' END,
  admin_id
FROM
  (VALUES
    (st1,  batch1),(st2,  batch1),(st4,  batch1),(st9,  batch1),
    (st3,  batch2),(st5,  batch2),(st7,  batch2),
    (st6,  batch3),(st8,  batch3)
  ) AS s(student_id, batch_id),
  generate_series(0, 29) AS n
ON CONFLICT (student_id, date) DO NOTHING;

-- ══════════════════════════════════════════════════════════════
-- 8. PAYMENTS — current month + last 2 months
-- ══════════════════════════════════════════════════════════════
INSERT INTO public.payments (id, student_id, amount, due_date, paid_date, status, payment_mode, notes)
SELECT
  gen_random_uuid(),
  s.student_id,
  s.amount,
  -- Due on the 5th of each month
  (date_trunc('month', CURRENT_DATE) - (m || ' months')::interval + interval '4 days')::date,
  -- Paid date (random for past months, null for unpaid current)
  CASE
    WHEN m > 0 AND random() > 0.15 THEN
      (date_trunc('month', CURRENT_DATE) - (m || ' months')::interval + interval '4 days' + (random()*10)::int * interval '1 day')::date
    WHEN m = 0 AND random() > 0.4 THEN
      (date_trunc('month', CURRENT_DATE) + interval '4 days' + (random()*3)::int * interval '1 day')::date
    ELSE NULL
  END,
  CASE
    WHEN m > 0 AND random() > 0.15 THEN 'paid'
    WHEN m = 0 AND random() > 0.4  THEN 'paid'
    WHEN m > 0 THEN 'overdue'
    ELSE 'unpaid'
  END,
  CASE WHEN random() < 0.5 THEN 'upi' WHEN random() < 0.8 THEN 'cash' ELSE 'bank_transfer' END,
  NULL
FROM
  (VALUES
    (st1,  1200), (st2,  1200), (st4,  1200), (st9,  1200),
    (st3,  1500), (st5,  1500), (st7,  1500),
    (st6,  2000), (st8,  2000)
  ) AS s(student_id, amount),
  generate_series(0, 2) AS m
ON CONFLICT DO NOTHING;

-- ══════════════════════════════════════════════════════════════
-- 9. BELT HISTORY
-- ══════════════════════════════════════════════════════════════
INSERT INTO public.belt_history (id, student_id, previous_belt, new_belt, grading_date, graded_by, remarks) VALUES
  -- Rohan Mehta: White→Yellow→Green→Blue
  (gen_random_uuid(), st1, 'White',  'Yellow', '2023-09-10', c2_rec, 'Good kick accuracy'),
  (gen_random_uuid(), st1, 'Yellow', 'Green',  '2024-01-15', c2_rec, 'Excellent poomsae'),
  (gen_random_uuid(), st1, 'Green',  'Blue',   '2024-06-15', c1_rec, 'Strong sparring technique'),

  -- Ananya Patel: White→Yellow→Green
  (gen_random_uuid(), st2, 'White',  'Yellow', '2023-11-20', c2_rec, 'Consistent performance'),
  (gen_random_uuid(), st2, 'Yellow', 'Green',  '2024-08-20', c2_rec, 'Great improvement in forms'),

  -- Kavya Reddy: White→Yellow
  (gen_random_uuid(), st3, 'White',  'Yellow', '2024-03-25', c2_rec, 'Passed all techniques'),

  -- Meera Iyer: White→Yellow
  (gen_random_uuid(), st9, 'White',  'Yellow', '2024-11-10', c2_rec, 'Showed great discipline'),

  -- Neha Gupta: White→Yellow→Green→Blue
  (gen_random_uuid(), st5, 'White',  'Yellow', '2023-02-10', c2_rec, 'Fast learner'),
  (gen_random_uuid(), st5, 'Yellow', 'Green',  '2023-07-15', c2_rec, 'Good breaking technique'),
  (gen_random_uuid(), st5, 'Green',  'Blue',   '2024-09-05', c1_rec, 'Ready for intermediate'),

  -- Diya Choudhary: White→Yellow→Green
  (gen_random_uuid(), st7, 'White',  'Yellow', '2023-08-01', c2_rec, 'Quick reflexes'),
  (gen_random_uuid(), st7, 'Yellow', 'Green',  '2024-02-20', c2_rec, 'Solid foundation'),

  -- Aryan Joshi: Full progression to Black 1st Dan
  (gen_random_uuid(), st6, 'White',  'Yellow', '2020-06-01', c1_rec, 'Exceptional talent'),
  (gen_random_uuid(), st6, 'Yellow', 'Green',  '2020-12-15', c1_rec, 'Outstanding poomsae'),
  (gen_random_uuid(), st6, 'Green',  'Blue',   '2021-06-20', c1_rec, 'Advanced techniques mastered'),
  (gen_random_uuid(), st6, 'Blue',   'Red',    '2022-02-10', c1_rec, 'Competition-ready'),
  (gen_random_uuid(), st6, 'Red',    'Black',  '2023-12-01', c1_rec, 'Dan examination passed with distinction'),

  -- Siddharth Rao: White→Yellow→Green→Blue→Red
  (gen_random_uuid(), st8, 'White',  'Yellow', '2021-10-05', c1_rec, 'Strong basics'),
  (gen_random_uuid(), st8, 'Yellow', 'Green',  '2022-04-18', c1_rec, 'Good control'),
  (gen_random_uuid(), st8, 'Green',  'Blue',   '2022-11-30', c1_rec, 'Improved agility'),
  (gen_random_uuid(), st8, 'Blue',   'Red',    '2024-05-25', c1_rec, 'Excellent tournament record'),

  -- Karthik Nair: White→Yellow→Green→Blue→Red
  (gen_random_uuid(), st10, 'White',  'Yellow', '2021-07-14', c1_rec, 'Quick to learn'),
  (gen_random_uuid(), st10, 'Yellow', 'Green',  '2022-01-22', c1_rec, 'Consistent practice'),
  (gen_random_uuid(), st10, 'Green',  'Blue',   '2022-09-10', c1_rec, 'Great sparring'),
  (gen_random_uuid(), st10, 'Blue',   'Red',    '2024-04-01', c1_rec, 'Tournament silver medal')
ON CONFLICT DO NOTHING;

END $$;
