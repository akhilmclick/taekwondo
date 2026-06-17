import { supabase } from './supabase'

// ─── INSTITUTE ────────────────────────────────────────────────
export async function getMyInstitute() {
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile }  = await supabase.from('profiles').select('institute_id').eq('id', user.id).single()
  if (!profile?.institute_id) return null
  const { data } = await supabase.from('institutes').select('*').eq('id', profile.institute_id).single()
  return data
}

export async function updateInstitute(id, updates) {
  const { data, error } = await supabase.from('institutes').update(updates).eq('id', id).select().single()
  if (error) throw error
  return data
}

// ─── DASHBOARD STATS ─────────────────────────────────────────
export async function getDashboardStats(instituteId) {
  const today      = new Date().toISOString().split('T')[0]
  const now        = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
  const monthEnd   = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0]

  const [studentsRes, attendanceRes, feesRes, batchesRes] = await Promise.all([
    supabase.from('students').select('id', { count: 'exact' }).eq('status', 'active').eq('institute_id', instituteId),
    supabase.from('attendance_logs').select('status').eq('date', today).eq('institute_id', instituteId),
    supabase.from('payments').select('id', { count: 'exact' })
      .in('status', ['unpaid', 'overdue'])
      .gte('due_date', monthStart).lte('due_date', monthEnd)
      .eq('institute_id', instituteId),
    supabase.from('batches').select('id', { count: 'exact' }).eq('institute_id', instituteId),
  ])

  const totalStudents       = studentsRes.count || 0
  const todayAttendance     = attendanceRes.data?.filter(r => r.status === 'present').length || 0
  const todayAttendancePct  = totalStudents > 0 ? Math.round((todayAttendance / totalStudents) * 100) : 0

  return {
    totalStudents,
    todayAttendancePct,
    feesDue:       feesRes.count || 0,
    activeBatches: batchesRes.count || 0,
  }
}

// ─── RECENT ACTIVITY ─────────────────────────────────────────
export async function getRecentActivity(instituteId) {
  const [attRes, payRes] = await Promise.all([
    supabase.from('attendance_logs')
      .select('id, status, date, created_at, students(profiles(full_name))')
      .eq('institute_id', instituteId)
      .order('created_at', { ascending: false }).limit(5),
    supabase.from('payments')
      .select('id, amount, status, created_at, students(profiles(full_name))')
      .eq('institute_id', instituteId)
      .order('created_at', { ascending: false }).limit(5),
  ])

  const attendance = (attRes.data || []).map(r => ({
    type: 'attendance', id: r.id,
    name: r.students?.profiles?.full_name || 'Unknown',
    detail: r.status, date: r.created_at,
  }))
  const payments = (payRes.data || []).map(r => ({
    type: 'payment', id: r.id,
    name: r.students?.profiles?.full_name || 'Unknown',
    detail: `₹${r.amount} — ${r.status}`, date: r.created_at,
  }))

  return [...attendance, ...payments]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 8)
}

// ─── STUDENTS ────────────────────────────────────────────────
export async function getStudents({ search = '', status = '', belt = '', batchId = '', instituteId } = {}) {
  let query = supabase
    .from('students')
    .select(`id, belt_level, belt_rank_number, status, join_date, batch_id, institute_id,
             profiles(full_name, avatar_url),
             batches(name),
             payments(status, due_date)`)
    .order('created_at', { ascending: false })

  if (instituteId) query = query.eq('institute_id', instituteId)
  if (status)      query = query.eq('status', status)
  if (belt)        query = query.eq('belt_level', belt)
  if (batchId)     query = query.eq('batch_id', batchId)

  const { data, error } = await query
  if (error) throw error

  let result = data || []
  if (search) {
    const s = search.toLowerCase()
    result = result.filter(st => st.profiles?.full_name?.toLowerCase().includes(s))
  }
  return result
}

export async function getStudentProfile(studentId) {
  const { data, error } = await supabase
    .from('students')
    .select(`*, profiles(full_name, phone, avatar_url),
             batches(name, level, coaches(dan_level, profiles(full_name))),
             payments(id, amount, due_date, paid_date, status, payment_mode, notes, created_at),
             belt_history(id, previous_belt, new_belt, grading_date, remarks, coaches(profiles(full_name))),
             attendance_logs(id, date, status)`)
    .eq('id', studentId).single()
  if (error) throw error
  return data
}

export async function getMyStudentProfile(profileId) {
  const { data, error } = await supabase
    .from('students')
    .select(`*, profiles(full_name, phone, avatar_url),
             batches(name, level, schedule:schedules(day_of_week, start_time, end_time, location),
                     coaches(dan_level, profiles(full_name))),
             payments(id, amount, due_date, paid_date, status, payment_mode, notes, created_at),
             belt_history(id, previous_belt, new_belt, grading_date, remarks, coaches(profiles(full_name))),
             attendance_logs(id, date, status)`)
    .eq('profile_id', profileId).single()
  if (error) throw error
  return data
}

export async function createStudent(studentData) {
  const { data, error } = await supabase.from('students').insert(studentData).select().single()
  if (error) throw error
  return data
}

export async function updateStudent(id, updates) {
  const { data, error } = await supabase.from('students').update(updates).eq('id', id).select().single()
  if (error) throw error
  return data
}

// ─── BATCHES ─────────────────────────────────────────────────
export async function getBatches(instituteId) {
  let query = supabase.from('batches').select('*, coaches(id, dan_level, profiles(full_name))').order('name')
  if (instituteId) query = query.eq('institute_id', instituteId)
  const { data, error } = await query
  if (error) throw error
  return data || []
}

export async function createBatch(batchData) {
  const { data, error } = await supabase.from('batches').insert(batchData).select().single()
  if (error) throw error
  return data
}

// ─── ATTENDANCE ───────────────────────────────────────────────
export async function getBatchStudents(batchId) {
  const { data, error } = await supabase
    .from('students')
    .select('id, belt_level, belt_rank_number, profiles(full_name, avatar_url)')
    .eq('batch_id', batchId).eq('status', 'active')
  if (error) throw error
  return data || []
}

export async function getAttendanceForDate(batchId, date) {
  const { data, error } = await supabase
    .from('attendance_logs')
    .select('student_id, status')
    .eq('batch_id', batchId).eq('date', date)
  if (error) throw error
  return data || []
}

export async function submitAttendance(records) {
  const { data, error } = await supabase
    .from('attendance_logs')
    .upsert(records, { onConflict: 'student_id,date' })
    .select()
  if (error) throw error
  return data
}

// ─── PAYMENTS ────────────────────────────────────────────────
export async function getPayments({ month, year, instituteId } = {}) {
  const now        = new Date()
  const m          = month ?? now.getMonth() + 1
  const y          = year  ?? now.getFullYear()
  const monthStart = `${y}-${String(m).padStart(2, '0')}-01`
  const monthEnd   = new Date(y, m, 0).toISOString().split('T')[0]

  const { data: payments, error } = await supabase
    .from('payments')
    .select('id, student_id, amount, due_date, paid_date, status, payment_mode, notes, created_at, institute_id')
    .gte('due_date', monthStart).lte('due_date', monthEnd)
    .eq('institute_id', instituteId)
    .order('due_date')
  if (error) throw error
  if (!payments?.length) return []

  // Fetch student names separately to avoid FK cache issues
  const studentIds = [...new Set(payments.map(p => p.student_id).filter(Boolean))]
  const { data: students } = await supabase
    .from('students').select('id, profiles(full_name)').in('id', studentIds)

  const studentMap = {}
  ;(students || []).forEach(s => { studentMap[s.id] = s })

  return payments.map(p => ({ ...p, students: studentMap[p.student_id] || null }))
}

export async function upsertPayment(paymentData) {
  const { students, profiles, ...cleanData } = paymentData
  const { data, error } = await supabase
    .from('payments').upsert(cleanData)
    .select('id, student_id, amount, due_date, paid_date, status, payment_mode, notes')
    .single()
  if (error) throw error
  return data
}

// ─── SCHEDULES ───────────────────────────────────────────────
export async function getSchedules(instituteId) {
  let query = supabase
    .from('schedules')
    .select('*, batches(name, level, max_capacity, coach_id, coaches(profiles(full_name)))')
    .order('start_time')
  if (instituteId) query = query.eq('institute_id', instituteId)
  const { data, error } = await query
  if (error) throw error
  return data || []
}

export async function createSchedule(scheduleData) {
  const { data, error } = await supabase.from('schedules').insert(scheduleData).select().single()
  if (error) throw error
  return data
}

export async function deleteSchedule(id) {
  const { error } = await supabase.from('schedules').delete().eq('id', id)
  if (error) throw error
}

// ─── BELT HISTORY ────────────────────────────────────────────
export async function promoteBelt(studentId, previousBelt, newBelt, gradedBy, remarks) {
  const today = new Date().toISOString().split('T')[0]

  // Get the student's institute_id for the belt_history record
  const { data: student } = await supabase.from('students').select('institute_id').eq('id', studentId).single()

  const [histRes] = await Promise.all([
    supabase.from('belt_history').insert({
      student_id: studentId, previous_belt: previousBelt, new_belt: newBelt,
      grading_date: today, graded_by: gradedBy, remarks,
      institute_id: student?.institute_id,
    }),
    supabase.from('students').update({ belt_level: newBelt, last_grading_date: today }).eq('id', studentId),
  ])
  if (histRes.error) throw histRes.error
}

// ─── COACH ───────────────────────────────────────────────────
export async function getCoachByProfileId(profileId) {
  const { data, error } = await supabase
    .from('coaches')
    .select('*, profiles(full_name), batches(id, name, level, max_capacity)')
    .eq('profile_id', profileId).single()
  if (error) throw error
  return data
}

export async function getCoachTodayBatches(coachId) {
  const days  = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']
  const today = days[new Date().getDay()]
  const { data, error } = await supabase
    .from('schedules')
    .select('*, batches!inner(id, name, level, coach_id)')
    .eq('day_of_week', today)
    .eq('batches.coach_id', coachId)
  if (error) throw error
  return data || []
}

export async function getStudentCount(batchId) {
  const { count } = await supabase
    .from('students').select('id', { count: 'exact' })
    .eq('batch_id', batchId).eq('status', 'active')
  return count || 0
}
