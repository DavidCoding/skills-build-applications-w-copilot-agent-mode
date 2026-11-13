import mongoose from 'mongoose';
import { Activity, Team, User, Workout } from '../models/index.js';

export async function listActivities() {
  return Activity.find().lean();
}

export async function createActivity(input: unknown) {
  const payload = input && typeof input === 'object' ? input as Record<string, unknown> : {};
  const { userId, teamId, type, minutes } = payload;

  if (!userId || !teamId || !type || minutes === undefined || minutes === null || Number(minutes) <= 0) {
    throw Object.assign(new Error('userId, teamId, type, and minutes are required'), { status: 400 });
  }

  if (!mongoose.isValidObjectId(String(userId)) || !mongoose.isValidObjectId(String(teamId))) {
    throw Object.assign(new Error('userId and teamId must be valid Mongo object IDs'), { status: 400 });
  }

  const [user, team] = await Promise.all([
    User.findById(userId),
    Team.findById(teamId),
  ]);

  if (!user || !team) {
    throw Object.assign(new Error('Referenced user or team was not found'), { status: 400 });
  }

  const trimmedType = String(type).trim();
  const minutesValue = Number(minutes);

  if (!trimmedType || !Number.isFinite(minutesValue) || minutesValue <= 0) {
    throw Object.assign(new Error('type and minutes must be valid'), { status: 400 });
  }

  const activity = await Activity.create({
    user: user._id,
    team: team._id,
    type: trimmedType,
    minutes: minutesValue,
    points: minutesValue,
    occurredAt: new Date(),
  });

  return activity.toObject();
}

export async function listTeams() {
  return Team.find().lean();
}

export async function createTeam(input: unknown) {
  const payload = input && typeof input === 'object' ? input as Record<string, unknown> : {};
  const { name, mascot, members } = payload;

  if (!name || typeof name !== 'string' || !name.trim()) {
    throw Object.assign(new Error('Team name is required'), { status: 400 });
  }
  if (!mascot || typeof mascot !== 'string' || !mascot.trim()) {
    throw Object.assign(new Error('Team mascot is required'), { status: 400 });
  }

  const normalizedMembers = Array.isArray(members) ? members : [];
  const memberIds = normalizedMembers.map((member) => String(member)).filter(Boolean);
  for (const memberId of memberIds) {
    if (!mongoose.isValidObjectId(memberId)) {
      throw Object.assign(new Error('Team members must be valid Mongo object IDs'), { status: 400 });
    }
  }

  const team = await Team.create({
    name: String(name).trim(),
    mascot: String(mascot).trim(),
    members: memberIds.map((memberId) => new mongoose.Types.ObjectId(memberId)),
  });

  return team.toObject();
}

export async function getLeaderboard() {
  const teams = await Team.find().populate('members').lean();
  const totals = await Activity.aggregate([
    {
      $group: {
        _id: '$team',
        totalPoints: { $sum: '$points' },
      },
    },
  ]);

  const totalsByTeam = new Map<string, number>(
    totals.map((entry) => [String(entry._id), Number(entry.totalPoints) || 0]),
  );

  const leaderboard = teams
    .map((team) => ({
      teamName: team.name,
      totalPoints: totalsByTeam.get(String(team._id)) ?? 0,
    }))
    .sort((left, right) => right.totalPoints - left.totalPoints)
    .map((entry, index) => ({
      ...entry,
      rank: index + 1,
    }));

  return leaderboard;
}

export async function suggestWorkouts(userEmail: string) {
  const email = decodeURIComponent(userEmail).trim();
  if (!email) {
    throw Object.assign(new Error('User email is required'), { status: 400 });
  }

  const user = await User.findOne({ email: new RegExp(`^${email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }).lean();
  if (!user) {
    throw Object.assign(new Error('User not found'), { status: 404 });
  }

  const recentActivity = await Activity.find({ user: user._id }).sort({ occurredAt: -1 }).limit(5).lean();
  const preferredFocus = (user.fitnessGoal as string | undefined)?.trim() || recentActivity[0]?.type || 'endurance';

  const workoutCandidates = await Workout.find({
    focus: new RegExp(`^${preferredFocus.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i'),
  }).sort({ minutes: 1 }).lean();

  const fallbackCandidates = await Workout.find().sort({ minutes: 1 }).lean();
  const matches = workoutCandidates.length > 0 ? workoutCandidates : fallbackCandidates;

  if (matches.length === 0) {
    throw Object.assign(new Error('No workout suggestions available'), { status: 404 });
  }

  const recentType = recentActivity[0]?.type ? String(recentActivity[0].type) : 'activity';
  const suggestions = matches.map((workout) => ({
    ...workout,
    reason: `Based on your recent ${recentType} activity and ${preferredFocus} goal, this workout fits your current pattern.`,
  }));

  return suggestions;
}

export { User };
