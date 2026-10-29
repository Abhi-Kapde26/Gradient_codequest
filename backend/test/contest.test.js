import test from 'node:test';
import assert from 'node:assert/strict';
import { dbService, validateNodePath } from '../src/services/dbService.js';

test('1. Flexible Node Path Validation Logic (No Compulsory Nodes)', () => {
  // Path with only 1 QUEST node (No START, No FINISH) - should be fully VALID
  const singleQuest = [
    { position: 1, type: 'QUEST' }
  ];
  const res1 = validateNodePath(singleQuest);
  assert.equal(res1.valid, true);

  // Path without START and without FINISH (e.g. QUEST -> TREASURE_HUNT) - should be VALID
  const noStartNoFinish = [
    { position: 1, type: 'QUEST' },
    { position: 2, type: 'TREASURE_HUNT' }
  ];
  const res2 = validateNodePath(noStartNoFinish);
  assert.equal(res2.valid, true);

  // Path starting with TREASURE_HUNT and ending with START (any order admin chooses) - VALID
  const invertedTypes = [
    { position: 1, type: 'TREASURE_HUNT' },
    { position: 2, type: 'START' }
  ];
  const resInverted = validateNodePath(invertedTypes);
  assert.equal(resInverted.valid, true);

  // Duplicate positions - should be INVALID
  const duplicatePos = [
    { position: 1, type: 'QUEST' },
    { position: 1, type: 'TREASURE_HUNT' }
  ];
  const res3 = validateNodePath(duplicatePos);
  assert.equal(res3.valid, false);
  assert.match(res3.error, /unique/i);

  // Invalid node type - should be INVALID
  const invalidType = [
    { position: 1, type: 'UNKNOWN_TYPE' }
  ];
  const res4 = validateNodePath(invalidType);
  assert.equal(res4.valid, false);
  assert.match(res4.error, /Invalid node type/i);

  // Empty path (0 nodes) - should be VALID
  const emptyPath = [];
  const resEmpty = validateNodePath(emptyPath);
  assert.equal(resEmpty.valid, true);
});

test('2. Event Creation & Arbitrary Node Path Management', async () => {
  // Create an isolated tournament event
  const event = await dbService.createEvent({
    title: 'Custom Admin Contest ' + Date.now(),
    description: 'Testing arbitrary non-compulsory nodes'
  });
  assert.ok(event.id);

  // Add Level 1: TREASURE_HUNT (No compulsory START node!)
  const node1 = await dbService.addNode(event.id, {
    position: 1,
    type: 'TREASURE_HUNT',
    title: 'Diamond Enigma',
    challenge_statement: 'Solve riddle: What has keys but no locks?',
    points: 100,
    expected_answer: 'piano',
    hints: [
      {
        hint_text: 'Think of musical instruments with black and white keys.',
        debugging_task: 'Fix typo: `const a = "musick";` What is correct spelling?',
        debugging_answer: 'music'
      }
    ]
  });
  assert.equal(node1.type, 'TREASURE_HUNT');

  // Add Level 2: QUEST (No compulsory FINISH node!)
  const node2 = await dbService.addNode(event.id, {
    position: 2,
    type: 'QUEST',
    title: 'Final Quest Checkpoint',
    challenge_statement: 'Compute 12 * 12.',
    points: 150,
    expected_answer: '144'
  });
  assert.equal(node2.type, 'QUEST');

  // Verify path contains exactly the 2 admin-chosen nodes
  const path = await dbService.getEventPath(event.id);
  assert.equal(path.length, 2);
  assert.equal(path[0].type, 'TREASURE_HUNT');
  assert.equal(path[1].type, 'QUEST');

  // Store for subsequent tests
  globalThis.testEventId = event.id;
  globalThis.testNode1 = node1;
  globalThis.testNode2 = node2;
});

test('3. Team Registration with UG1-UG4 Players', async () => {
  const eventId = globalThis.testEventId;
  const uniqueCode = 'TEST-' + Math.random().toString(36).substring(2, 8).toUpperCase();

  const team = await dbService.createTeam(eventId, {
    name: 'Hackers ' + uniqueCode,
    accessCode: uniqueCode,
    players: [
      { name: 'Dev 1', ug_year: 'UG1', email: 'dev1@test.com' },
      { name: 'Dev 2', ug_year: 'UG4', email: 'dev2@test.com' }
    ]
  });

  assert.ok(team.id);
  assert.equal(team.players.length, 2);
  assert.equal(team.players[0].ug_year, 'UG1');
  assert.equal(team.players[1].ug_year, 'UG4');

  // Verify access code lookup
  const found = await dbService.getTeamByAccessCode(uniqueCode);
  assert.ok(found);
  assert.equal(found.id, team.id);

  globalThis.testTeam = team;
  globalThis.testAccessCode = uniqueCode;
});

test('4. Team Current Node & Progression Integrity', async () => {
  const team = globalThis.testTeam;
  const currentNodeData = await dbService.getTeamCurrentNode(team.id);

  assert.ok(currentNodeData.node);
  assert.equal(currentNodeData.node.position, 1);
  assert.equal(currentNodeData.node.type, 'TREASURE_HUNT');
  // Expected answer should never be leaked to team view
  assert.equal(currentNodeData.node.expected_answer, undefined);
});

test('5. Submissions and Admin Review Flow', async () => {
  const team = globalThis.testTeam;
  
  // Submit an answer
  const submission = await dbService.submitAnswer(team.id, {
    content: 'piano'
  });
  assert.equal(submission.status, 'PENDING');

  // Review: Approve
  const reviewResult = await dbService.reviewSubmission(submission.id, {
    status: 'APPROVED',
    feedback: 'Spot on!',
    reviewedBy: 'Admin Judge'
  });

  assert.equal(reviewResult.submission.status, 'APPROVED');
  assert.equal(reviewResult.pointsAwarded, 100);
  assert.equal(reviewResult.advancedToPosition, 2); // Advanced to position 2 (QUEST)

  // Verify team score was updated and moved to node 2
  const updatedCurrentNode = await dbService.getTeamCurrentNode(team.id);
  assert.equal(updatedCurrentNode.team.score, 100);
  assert.equal(updatedCurrentNode.progress.current_position, 2);
});

test('6. Hint Debugging Task Verification', async () => {
  const team = globalThis.testTeam;
  const node1Id = globalThis.testNode1.id;

  // Test wrong debugging answer
  const wrongUnlock = await dbService.unlockHint(team.id, node1Id, 'wrong_answer');
  assert.equal(wrongUnlock.success, false);

  // Test correct debugging answer ('music')
  const correctUnlock = await dbService.unlockHint(team.id, node1Id, 'music');
  assert.equal(correctUnlock.success, true);
  assert.ok(correctUnlock.hint_text);
});

test('7. Leaderboard Ranking Updates', async () => {
  const eventId = globalThis.testEventId;

  const leaderboard = await dbService.getLeaderboard(eventId);
  assert.ok(leaderboard.length >= 1);
  assert.equal(leaderboard[0].rank, 1);
  assert.equal(leaderboard[0].score, 100);
  assert.equal(leaderboard[0].players.length, 2);
});

test('8. Admin Control: Advancing Team to Next Node & Awarding Points', async () => {
  const eventId = globalThis.testEventId;
  const uniqueCode = 'ADV-' + Math.random().toString(36).substring(2, 8).toUpperCase();

  // Create a fresh team at Level 1
  const team = await dbService.createTeam(eventId, {
    name: 'Advancers ' + uniqueCode,
    accessCode: uniqueCode,
    players: [{ name: 'Solo Player', ug_year: 'UG2', email: 'solo@test.com' }]
  });

  const initialNodeData = await dbService.getTeamCurrentNode(team.id);
  assert.equal(initialNodeData.progress.current_position, 1);
  assert.equal(initialNodeData.team.score, 0);

  // Admin clicks "Next" on the team (Level 1 -> Level 2)
  // Level 1 has 100 points
  const advanceResult = await dbService.advanceTeamNode(team.id, { awardPoints: true });
  assert.equal(advanceResult.success, true);
  assert.equal(advanceResult.previousPosition, 1);
  assert.equal(advanceResult.advancedToPosition, 2);
  assert.equal(advanceResult.pointsAwarded, 100);
  assert.equal(advanceResult.newScore, 100);
  assert.equal(advanceResult.isCompleted, false);

  // Verify Leaderboard immediately reflects updated position and score
  const updatedLeaderboard = await dbService.getLeaderboard(eventId);
  const foundInLeaderboard = updatedLeaderboard.find(t => t.id === team.id);
  assert.ok(foundInLeaderboard);
  assert.equal(foundInLeaderboard.current_position, 2);
  assert.equal(foundInLeaderboard.score, 100);

  // Admin clicks "Next" again (Level 2 has 150 points, final level) -> Completes tournament
  const advanceResult2 = await dbService.advanceTeamNode(team.id, { awardPoints: true });
  assert.equal(advanceResult2.success, true);
  assert.equal(advanceResult2.pointsAwarded, 150);
  assert.equal(advanceResult2.newScore, 250);
  assert.equal(advanceResult2.isCompleted, true);

  // Verify completion in leaderboard
  const finalLeaderboard = await dbService.getLeaderboard(eventId);
  const completedTeamInBoard = finalLeaderboard.find(t => t.id === team.id);
  assert.equal(completedTeamInBoard.is_completed, true);
  assert.equal(completedTeamInBoard.score, 250);
});

test('9. Admin Control: Bulk Advance & Start Game for Multiple Teams', async () => {
  const eventId = globalThis.testEventId;

  // Seed 2 fresh sample teams at Level 1
  const seedRes = await dbService.seedSampleTeams(eventId, 2);
  assert.ok(seedRes.teams.length >= 2);

  // Start game ensures all teams are active at Level 1
  const startRes = await dbService.startGame(eventId, { resetAll: false });
  assert.equal(startRes.success, true);
  assert.ok(startRes.totalTeams >= 2);

  // Bulk advance the 2 newly seeded teams
  const teamIdsToAdvance = seedRes.teams.map(t => t.id);
  
  const bulkRes = await dbService.bulkAdvanceTeams(teamIdsToAdvance, { awardPoints: true });
  assert.equal(bulkRes.success, true);
  assert.equal(bulkRes.advancedCount, 2);
});

test('10. Bulk Team Registration and 50 Teams Scalability Verification', async () => {
  const eventId = globalThis.testEventId;

  // Test bulk registration with custom team names
  const customNames = ['Cyber Dragons', 'Quantum Hackers', 'Binary Knights'];
  const bulkRegRes = await dbService.bulkCreateTeams(eventId, customNames);
  assert.equal(bulkRegRes.success, true);
  assert.equal(bulkRegRes.createdCount, 3);
  assert.ok(bulkRegRes.createdTeams[0].access_code);

  // Test seeding up to 50 teams
  const seed50Res = await dbService.seedSampleTeams(eventId, 15);
  assert.equal(seed50Res.success, true);
  assert.ok(seed50Res.teams.length >= 10);

  // Start game ensures all teams are initialized at Level 1
  const startRes = await dbService.startGame(eventId, { resetAll: false });
  assert.equal(startRes.success, true);

  // Verify full leaderboard contains all teams properly ranked
  const leaderboard = await dbService.getLeaderboard(eventId);
  assert.ok(leaderboard.length >= 15);
  assert.equal(leaderboard[0].rank, 1);
});

test('11. Delete Event and Associated Resources Cleanup', async () => {
  // Create a temporary event to delete
  const tempEvent = await dbService.createEvent({
    title: 'Temporary Test Tournament',
    description: 'To be deleted'
  });
  assert.ok(tempEvent.id);

  // Add a node and a team
  await dbService.addNode(tempEvent.id, {
    position: 1,
    type: 'START',
    title: 'Temporary Start',
    challenge_statement: 'Temp challenge',
    points: 50,
    expected_answer: 'ans'
  });

  const tempTeam = await dbService.createTeam(tempEvent.id, {
    name: 'Temporary Team ' + Math.random().toString(36).substring(2, 6),
    accessCode: 'TEMP-' + Math.random().toString(36).substring(2, 8).toUpperCase(),
    players: [{ name: 'Temp Player', ug_year: 'UG1' }]
  });
  assert.ok(tempTeam.id);

  // Delete the event
  const deleteRes = await dbService.deleteEvent(tempEvent.id);
  assert.equal(deleteRes.success, true);

  // Verify event no longer exists
  const fetchedEvent = await dbService.getEvent(tempEvent.id);
  assert.equal(fetchedEvent, null);
});
