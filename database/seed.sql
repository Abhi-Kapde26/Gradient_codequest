-- Gradient CodeQuest Seed Data
-- Demo Event, Nodes, Teams, Players, Hints

-- 1. Admin & Demo User
INSERT INTO users (id, email, role, name)
VALUES 
    ('11111111-1111-1111-1111-111111111111', 'admin@codequest.org', 'admin', 'Super Admin'),
    ('22222222-2222-2222-2222-222222222222', 'lead@teamalpha.org', 'player', 'Alpha Leader')
ON CONFLICT (email) DO NOTHING;

-- 2. Demo Event
INSERT INTO events (id, title, description, status, created_by)
VALUES 
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Gradient CodeQuest 2026', 'Premier game-based competitive programming tournament', 'active', '11111111-1111-1111-1111-111111111111')
ON CONFLICT DO NOTHING;

-- 3. Game Nodes (Path: START -> QUEST -> TREASURE_HUNT -> FINISH)
INSERT INTO game_nodes (id, event_id, position, type, title, challenge_statement, points, expected_answer)
VALUES
    ('b0000001-0000-0000-0000-000000000001', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 1, 'START', 'Initialization Gate', 'Welcome contestants! To pass the Initialization Gate, decode the binary greeting: 01000111 01000011 01010001. Enter the decoded ASCII string.', 50, 'GCQ'),
    ('b0000002-0000-0000-0000-000000000002', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 2, 'QUEST', 'Algorithmic Ascent', 'Given an array of integers [3, 1, 4, 1, 5, 9, 2, 6, 5], find the length of the longest strictly increasing subsequence (LIS). Submit the number.', 100, '4'),
    ('b0000003-0000-0000-0000-000000000003', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 3, 'TREASURE_HUNT', 'Cryptic Cipher', 'Decrypt this Caesar cipher shifted by 7: "GRAVRAG PQA". What is the original text uppercase?', 150, 'GRADIENT CQ'),
    ('b0000004-0000-0000-0000-000000000004', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 4, 'FINISH', 'Grand Zenith', 'Final test: Compute the sum of all primes strictly below 30. Enter the integer sum.', 200, '129')
ON CONFLICT DO NOTHING;

-- 4. Node Hints with Debugging Tasks
INSERT INTO node_hints (id, node_id, hint_number, hint_text, debugging_task, debugging_answer)
VALUES
    ('c0000001-0000-0000-0000-000000000001', 'b0000002-0000-0000-0000-000000000002', 1, 
     'Hint: Consider subsequences like [1, 4, 5, 9] or [1, 2, 5, 6]. What is their length?', 
     'Debug task: Fix this JS bug: `const lis = [1,3,5]; lis.len;` What property returns array size?', 'length'),
    ('c0000002-0000-0000-0000-000000000002', 'b0000003-0000-0000-0000-000000000003', 1, 
     'Hint: Shift each character backwards by 13 or forwards by 13 (ROT13 variation).', 
     'Debug task: In Python, `ord("A")` is 65. What is `chr(66)`?', 'B')
ON CONFLICT DO NOTHING;

-- 5. Teams
INSERT INTO teams (id, event_id, name, access_code, score)
VALUES
    ('d0000001-0000-0000-0000-000000000001', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Binary Bandits', 'TEAM-ALPHA-101', 50),
    ('d0000002-0000-0000-0000-000000000002', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Quantum Questers', 'TEAM-BETA-202', 0),
    ('d0000003-0000-0000-0000-000000000003', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Cyber Cyphers', 'TEAM-GAMMA-303', 150)
ON CONFLICT DO NOTHING;

-- 6. Players with UG1-UG4 representation
INSERT INTO players (team_id, name, ug_year, email)
VALUES
    ('d0000001-0000-0000-0000-000000000001', 'Aarav Sharma', 'UG1', 'aarav@univ.edu'),
    ('d0000001-0000-0000-0000-000000000001', 'Ananya Patel', 'UG2', 'ananya@univ.edu'),
    ('d0000002-0000-0000-0000-000000000002', 'Rohan Verma', 'UG3', 'rohan@univ.edu'),
    ('d0000002-0000-0000-0000-000000000002', 'Sneha Reddy', 'UG4', 'sneha@univ.edu'),
    ('d0000003-0000-0000-0000-000000000003', 'Vikram Joshi', 'UG2', 'vikram@univ.edu'),
    ('d0000003-0000-0000-0000-000000000003', 'Divya Nair', 'UG4', 'divya@univ.edu')
ON CONFLICT DO NOTHING;

-- 7. Team Progress
INSERT INTO team_progress (team_id, current_node_id, current_position, is_completed)
VALUES
    ('d0000001-0000-0000-0000-000000000001', 'b0000002-0000-0000-0000-000000000002', 2, FALSE),
    ('d0000002-0000-0000-0000-000000000002', 'b0000001-0000-0000-0000-000000000001', 1, FALSE),
    ('d0000003-0000-0000-0000-000000000003', 'b0000003-0000-0000-0000-000000000003', 3, FALSE)
ON CONFLICT (team_id) DO UPDATE SET 
    current_node_id = EXCLUDED.current_node_id,
    current_position = EXCLUDED.current_position;
