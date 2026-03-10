-- ============================================================
-- Seed data for testing /api/admin/users
-- Run this AFTER the schema has been created.
-- ============================================================

-- ======================== USERS =============================
-- 5 test users (password = bcrypt hash of 'Password@123')
INSERT INTO "user" (id, email, password, name, "isVerified", "createdAt", "updatedAt") VALUES
  ('a0000000-0000-0000-0000-000000000001', 'nguyen.van.a@example.com',  '$2b$10$dummyHashForTestingPurposesOnly000000000000000001', 'Nguyen Van A',  true,  NOW() - INTERVAL '60 days', NOW() - INTERVAL '1 day'),
  ('a0000000-0000-0000-0000-000000000002', 'tran.thi.b@example.com',    '$2b$10$dummyHashForTestingPurposesOnly000000000000000002', 'Tran Thi B',    true,  NOW() - INTERVAL '50 days', NOW() - INTERVAL '2 days'),
  ('a0000000-0000-0000-0000-000000000003', 'le.van.c@example.com',      '$2b$10$dummyHashForTestingPurposesOnly000000000000000003', 'Le Van C',      true,  NOW() - INTERVAL '40 days', NOW() - INTERVAL '3 days'),
  ('a0000000-0000-0000-0000-000000000004', 'pham.thi.d@example.com',    '$2b$10$dummyHashForTestingPurposesOnly000000000000000004', 'Pham Thi D',    false, NOW() - INTERVAL '30 days', NOW() - INTERVAL '5 days'),
  ('a0000000-0000-0000-0000-000000000005', 'hoang.van.e@example.com',   '$2b$10$dummyHashForTestingPurposesOnly000000000000000005', 'Hoang Van E',   true,  NOW() - INTERVAL '20 days', NOW() - INTERVAL '1 day');

-- ======================== PROFILES ==========================
INSERT INTO profiles (id, user_id, full_name, email, phone, career_path, employment_status, job_title, selfie_path, plan_generation_status, created_at, updated_at) VALUES
  ('c0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'Nguyen Van A', 'nguyen.van.a@example.com', '0901000001', 'Software Engineering', 'employed',   'Frontend Developer',  '/uploads/selfies/user1.jpg', 2, NOW() - INTERVAL '59 days', NOW()),
  ('c0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000002', 'Tran Thi B',   'tran.thi.b@example.com',   '0901000002', 'Data Science',         'employed',   'Data Analyst',        '/uploads/selfies/user2.jpg', 2, NOW() - INTERVAL '49 days', NOW()),
  ('c0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000003', 'Le Van C',     'le.van.c@example.com',     '0901000003', 'Marketing',            'unemployed', NULL,                  NULL,                         1, NOW() - INTERVAL '39 days', NOW()),
  ('c0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000004', 'Pham Thi D',   'pham.thi.d@example.com',   '0901000004', 'Finance',              'employed',   'Accountant',          '/uploads/selfies/user4.jpg', 0, NOW() - INTERVAL '29 days', NOW()),
  ('c0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000005', 'Hoang Van E',  'hoang.van.e@example.com',  '0901000005', 'Design',               'freelance',  'UI/UX Designer',      '/uploads/selfies/user5.jpg', 2, NOW() - INTERVAL '19 days', NOW());

-- ======================== ADMINS ============================
-- password = bcrypt hash of 'Admin@123'
INSERT INTO admins (id, email, password, name, role, is_active, created_at, updated_at) VALUES
  ('b0000000-0000-0000-0000-000000000001', 'master-dev@nuplans.com', '$2b$10$dummyHashForAdminTestingPurposesOnly00000001', 'Master Admin', 'master_admin', true, NOW() - INTERVAL '90 days', NOW()),
  ('b0000000-0000-0000-0000-000000000002', 'admin-dev@nuplans.com',  '$2b$10$dummyHashForAdminTestingPurposesOnly00000002', 'Regular Admin', 'admin',        true, NOW() - INTERVAL '60 days', NOW());

-- ================ ADMIN_USER_ASSIGNMENTS ====================
-- Master admin manages user 1, 2, 3
-- Regular admin manages user 3, 4, 5 (user 3 is shared)
INSERT INTO admin_user_assignments (admin_id, user_id, created_at, updated_at) VALUES
  ('b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', NOW() - INTERVAL '55 days', NOW()),
  ('b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000002', NOW() - INTERVAL '50 days', NOW()),
  ('b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000003', NOW() - INTERVAL '40 days', NOW()),
  ('b0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000003', NOW() - INTERVAL '38 days', NOW()),
  ('b0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000004', NOW() - INTERVAL '28 days', NOW()),
  ('b0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000005', NOW() - INTERVAL '18 days', NOW());

-- ======================== MILESTONES ========================
-- Various statuses: pending, under-review, completed
-- User 1: 2 completed, 1 under-review  (progress 100, 100, 60)
-- User 2: 1 completed, 1 pending       (progress 100, 20)
-- User 3: 1 under-review               (progress 50)
-- User 4: 0 milestones
-- User 5: 1 completed, 1 under-review  (progress 100, 80)
INSERT INTO milestones (user_id, name, category, priority, description, start_date, deadline, progress, status, evidence_submitted, created_at, updated_at) VALUES
  ('a0000000-0000-0000-0000-000000000001', 'Build Portfolio Website',      'Technical',  'optional',   'Create a personal portfolio site',       NOW() - INTERVAL '50 days', NOW() + INTERVAL '10 days',  100, 'approved',    true,  NOW() - INTERVAL '50 days', NOW() - INTERVAL '5 days'),
  ('a0000000-0000-0000-0000-000000000001', 'Complete React Course',        'Learning',   'mandatory', 'Finish the advanced React course',       NOW() - INTERVAL '40 days', NOW() + INTERVAL '20 days',  100, 'approved',    true,  NOW() - INTERVAL '40 days', NOW() - INTERVAL '3 days'),
  ('a0000000-0000-0000-0000-000000000001', 'Deploy App to Production',     'Technical',  'optional',   'Deploy the first version to production',  NOW() - INTERVAL '10 days', NOW() + INTERVAL '30 days',   60, 'under-review', true,  NOW() - INTERVAL '10 days', NOW() - INTERVAL '1 day'),

  ('a0000000-0000-0000-0000-000000000002', 'Data Analysis Certificate',    'Learning',   'optional',   'Get Google Data Analytics cert',          NOW() - INTERVAL '45 days', NOW() + INTERVAL '15 days',  100, 'approved',    true,  NOW() - INTERVAL '45 days', NOW() - INTERVAL '10 days'),
  ('a0000000-0000-0000-0000-000000000002', 'Python Machine Learning',      'Technical',  'mandatory', 'Complete ML fundamentals project',        NOW() - INTERVAL '20 days', NOW() + INTERVAL '40 days',   20, 'pending',      false, NOW() - INTERVAL '20 days', NOW() - INTERVAL '2 days'),

  ('a0000000-0000-0000-0000-000000000003', 'Social Media Marketing Plan',  'Marketing',  'optional',   'Create a full social media strategy',     NOW() - INTERVAL '30 days', NOW() + INTERVAL '15 days',   50, 'under-review', true,  NOW() - INTERVAL '30 days', NOW() - INTERVAL '4 days'),

  ('a0000000-0000-0000-0000-000000000005', 'UI Design System',            'Design',     'optional',   'Build a reusable design system in Figma', NOW() - INTERVAL '15 days', NOW() + INTERVAL '25 days',  100, 'approved',    true,  NOW() - INTERVAL '15 days', NOW() - INTERVAL '2 days'),
  ('a0000000-0000-0000-0000-000000000005', 'Mobile App Prototype',        'Design',     'mandatory', 'Create mobile app wireframes & prototype',NOW() - INTERVAL '10 days', NOW() + INTERVAL '35 days',   80, 'under-review', true,  NOW() - INTERVAL '10 days', NOW() - INTERVAL '1 day');

-- ===================== DAILY ACTIONS ========================
-- status: 0 = in-progress, 1 = submitted
-- User 1: 3 daily actions (1 completed+approved, 1 submitted, 1 in-progress)
-- User 2: 2 daily actions (1 completed+approved, 1 in-progress)
-- User 3: 1 daily action  (1 submitted)
-- User 4: 2 daily actions (2 in-progress)
-- User 5: 2 daily actions (1 completed+approved, 1 submitted)
INSERT INTO daily_actions (user_id, title, description, priority, category, action_date, completed, status, evidence_path, approved_at, created_at, weekly_plan_id) VALUES
  ('a0000000-0000-0000-0000-000000000001', 'Review pull requests',         'Review 3 PRs from team',              'high',   'Technical', CURRENT_DATE - 5, true,  1, '/uploads/evidence/da1.jpg', NOW() - INTERVAL '4 days', NOW() - INTERVAL '5 days', 20),
  ('a0000000-0000-0000-0000-000000000001', 'Write unit tests',             'Add tests for auth module',           'medium', 'Technical', CURRENT_DATE - 2, false, 1, '/uploads/evidence/da2.jpg', NULL,                       NOW() - INTERVAL '2 days', 21),
  ('a0000000-0000-0000-0000-000000000001', 'Study TypeScript generics',    'Read advanced TS docs',               'low',    'Learning',  CURRENT_DATE,     false, 0, NULL,                        NULL,                       NOW(), 22),

  ('a0000000-0000-0000-0000-000000000002', 'Clean dataset',                'Remove duplicates and null rows',     'high',   'Technical', CURRENT_DATE - 3, true,  1, '/uploads/evidence/da4.jpg', NOW() - INTERVAL '2 days', NOW() - INTERVAL '3 days', 22),
  ('a0000000-0000-0000-0000-000000000002', 'Explore visualization tools',  'Try out Plotly and Seaborn',          'medium', 'Learning',  CURRENT_DATE,     false, 0, NULL,                        NULL,                       NOW(), 21),

  ('a0000000-0000-0000-0000-000000000003', 'Draft Instagram content plan', 'Plan posts for next 2 weeks',        'high',   'Marketing', CURRENT_DATE - 1, false, 1, '/uploads/evidence/da6.jpg', NULL,                       NOW() - INTERVAL '1 day', 22),

  ('a0000000-0000-0000-0000-000000000004', 'Update resume',                'Add recent work experience',          'medium', 'Career',    CURRENT_DATE - 2, false, 0, NULL,                        NULL,                       NOW() - INTERVAL '2 days', 21),
  ('a0000000-0000-0000-0000-000000000004', 'Practice interview questions', 'Mock interview prep',                 'high',   'Career',    CURRENT_DATE,     false, 0, NULL,                        NULL,                       NOW(), 20),

  ('a0000000-0000-0000-0000-000000000005', 'Create color palette',         'Define brand colors for project',     'high',   'Design',    CURRENT_DATE - 4, true,  1, '/uploads/evidence/da9.jpg', NOW() - INTERVAL '3 days', NOW() - INTERVAL '4 days', 22),
  ('a0000000-0000-0000-0000-000000000005', 'Wireframe dashboard page',     'Low-fidelity wireframe for admin UI', 'medium', 'Design',    CURRENT_DATE - 1, false, 1, '/uploads/evidence/da10.jpg',NULL,                       NOW() - INTERVAL '1 day', 20);

-- =================== USER SUBMISSIONS =======================
-- Tracks submissions for last-activity. Links to milestone/daily_action reference IDs.
-- We use reference_id pointing to the milestone or daily_action id.
-- Since ids are auto-generated, we use a subquery approach or just use known sequential IDs.
-- Assuming milestones get IDs 1-8 and daily_actions get IDs 1-10 based on insert order above.

-- User 1: recent submissions
INSERT INTO user_submissions (user_id, submission_type, reference_id, evidence_path, status, reviewed_by, reviewed_at, review_note, submitted_at, created_at, updated_at) VALUES
  ('a0000000-0000-0000-0000-000000000001', 'milestone',     1, '/uploads/evidence/ms1.jpg',  'approved',  'b0000000-0000-0000-0000-000000000001', NOW() - INTERVAL '6 days',  'Looks great!',          NOW() - INTERVAL '8 days',  NOW() - INTERVAL '8 days',  NOW() - INTERVAL '6 days'),
  ('a0000000-0000-0000-0000-000000000001', 'milestone',     2, '/uploads/evidence/ms2.jpg',  'approved',  'b0000000-0000-0000-0000-000000000001', NOW() - INTERVAL '4 days',  'Well done',             NOW() - INTERVAL '5 days',  NOW() - INTERVAL '5 days',  NOW() - INTERVAL '4 days'),
  ('a0000000-0000-0000-0000-000000000001', 'milestone',     3, '/uploads/evidence/ms3.jpg',  'submitted', NULL,                                   NULL,                        NULL,                    NOW() - INTERVAL '1 day',   NOW() - INTERVAL '1 day',   NOW() - INTERVAL '1 day'),
  ('a0000000-0000-0000-0000-000000000001', 'daily_action',  1, '/uploads/evidence/da1.jpg',  'approved',  'b0000000-0000-0000-0000-000000000001', NOW() - INTERVAL '4 days',  'Confirmed',             NOW() - INTERVAL '5 days',  NOW() - INTERVAL '5 days',  NOW() - INTERVAL '4 days'),
  ('a0000000-0000-0000-0000-000000000001', 'daily_action',  2, '/uploads/evidence/da2.jpg',  'submitted', NULL,                                   NULL,                        NULL,                    NOW() - INTERVAL '2 days',  NOW() - INTERVAL '2 days',  NOW() - INTERVAL '2 days'),

-- User 2: some submissions
  ('a0000000-0000-0000-0000-000000000002', 'milestone',     4, '/uploads/evidence/ms4.jpg',  'approved',  'b0000000-0000-0000-0000-000000000001', NOW() - INTERVAL '11 days', 'Certificate verified',  NOW() - INTERVAL '12 days', NOW() - INTERVAL '12 days', NOW() - INTERVAL '11 days'),
  ('a0000000-0000-0000-0000-000000000002', 'daily_action',  4, '/uploads/evidence/da4.jpg',  'approved',  'b0000000-0000-0000-0000-000000000001', NOW() - INTERVAL '2 days',  'Good work',             NOW() - INTERVAL '3 days',  NOW() - INTERVAL '3 days',  NOW() - INTERVAL '2 days'),

-- User 3: one pending submission
  ('a0000000-0000-0000-0000-000000000003', 'milestone',     6, '/uploads/evidence/ms6.jpg',  'submitted', NULL,                                   NULL,                        NULL,                    NOW() - INTERVAL '4 days',  NOW() - INTERVAL '4 days',  NOW() - INTERVAL '4 days'),
  ('a0000000-0000-0000-0000-000000000003', 'daily_action',  6, '/uploads/evidence/da6.jpg',  'submitted', NULL,                                   NULL,                        NULL,                    NOW() - INTERVAL '1 day',   NOW() - INTERVAL '1 day',   NOW() - INTERVAL '1 day'),

-- User 5: active user
  ('a0000000-0000-0000-0000-000000000005', 'milestone',     7, '/uploads/evidence/ms7.jpg',  'approved',  'b0000000-0000-0000-0000-000000000002', NOW() - INTERVAL '3 days',  'Design system approved', NOW() - INTERVAL '4 days',  NOW() - INTERVAL '4 days',  NOW() - INTERVAL '3 days'),
  ('a0000000-0000-0000-0000-000000000005', 'milestone',     8, '/uploads/evidence/ms8.jpg',  'submitted', NULL,                                   NULL,                        NULL,                    NOW() - INTERVAL '1 day',   NOW() - INTERVAL '1 day',   NOW() - INTERVAL '1 day'),
  ('a0000000-0000-0000-0000-000000000005', 'daily_action',  9, '/uploads/evidence/da9.jpg',  'approved',  'b0000000-0000-0000-0000-000000000002', NOW() - INTERVAL '3 days',  'OK',                    NOW() - INTERVAL '4 days',  NOW() - INTERVAL '4 days',  NOW() - INTERVAL '3 days'),
  ('a0000000-0000-0000-0000-000000000005', 'daily_action', 10, '/uploads/evidence/da10.jpg', 'submitted', NULL,                                   NULL,                        NULL,                    NOW() - INTERVAL '1 day',   NOW() - INTERVAL '1 day',   NOW() - INTERVAL '1 day');

-- User 4: no submissions (inactive user — will have no lastActivity)

-- ==================== USER AT RISKS =========================
-- User 3: medium risk (active)
-- User 4: high risk (active)
-- User 1: low risk was resolved
INSERT INTO user_at_risks (user_id, reasons, status, risk_level, resolved_by, resolved_at, created_at, updated_at) VALUES
  ('a0000000-0000-0000-0000-000000000003', '["No milestone progress for 2 weeks", "Low engagement"]',  'active',   'medium', NULL,                                   NULL,                       NOW() - INTERVAL '10 days', NOW() - INTERVAL '10 days'),
  ('a0000000-0000-0000-0000-000000000004', '["Account not verified", "No milestones created", "No daily actions completed"]', 'active', 'high', NULL, NULL, NOW() - INTERVAL '15 days', NOW() - INTERVAL '15 days'),
  ('a0000000-0000-0000-0000-000000000001', '["Missed 3 daily actions"]', 'resolved', 'low', 'b0000000-0000-0000-0000-000000000001', NOW() - INTERVAL '20 days', NOW() - INTERVAL '30 days', NOW() - INTERVAL '20 days');

-- ============================================================
-- Summary of expected API results:
-- ============================================================
--
-- GET /api/admin/users (master admin b000...01):
--   Returns users 1, 2, 3 with enrichment:
--     User 1: pendingTasks=1(ms under-review)+1(da submitted)=2, completedTasks=2(ms)+1(da)=3, progress=avg(100,100,60)=87, riskLevel=none(resolved), lastActivity=1 day ago
--     User 2: pendingTasks=0, completedTasks=1(ms)+1(da)=2, progress=avg(100,20)=60, riskLevel=none, lastActivity=3 days ago
--     User 3: pendingTasks=1(ms under-review)+1(da submitted)=2, completedTasks=0, progress=50, riskLevel=medium, lastActivity=1 day ago
--
-- GET /api/admin/users (regular admin b000...02):
--   Returns users 3, 4, 5 with enrichment:
--     User 3: same as above
--     User 4: pendingTasks=0, completedTasks=0, progress=undefined, riskLevel=high, lastActivity=undefined (no submissions)
--     User 5: pendingTasks=1(ms under-review)+1(da submitted)=2, completedTasks=1(ms)+1(da)=2, progress=avg(100,80)=90, riskLevel=none, lastActivity=1 day ago
--
-- GET /api/admin/users/all (master admin):
--   Returns all 5 users with assignedAdminIds
