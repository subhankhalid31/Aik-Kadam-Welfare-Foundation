import { eq, and, or, ilike, desc, sql, inArray } from "drizzle-orm";
import { db } from "./db";
import {
  users,
  otpCodes,
  cases,
  caseVolunteers,
  caseVolunteerRequests,
  galleryEvents,
  successStories,
  blogs,
  donations,
  recurringDonations,
  bannedEmails,
  siteSettings,
  inboxMessages,
  inboxThreadMessages,
  type User,
  type OtpCode,
  type Case,
  type InsertCase,
  type GalleryEvent,
  type SuccessStory,
  type Blog,
  type Donation,
  type RecurringDonation,
  type CaseVolunteerRequest,
  type InboxMessage,
  type InboxThreadMessage,
  PLATFORM_FEE_RATE,
} from "@shared/schema";

// Emails are matched case-insensitively everywhere and always stored
// lowercased on write. Without this, "John@x.com" at signup vs "john@x.com"
// at login (extremely common on mobile — the keyboard auto-capitalizes the
// first letter) would silently fail to match and look like a wrong password.
function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export const storage = {
  // ─── Users ──────────────────────────────────────────────────────────────
  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(sql`lower(${users.email}) = ${normalizeEmail(email)}`)
      .orderBy(users.createdAt)
      .limit(1);
    return user;
  },

  async getUserById(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  },

  async createUser(data: { name: string; email: string; passwordHash: string }): Promise<User> {
    const [user] = await db
      .insert(users)
      .values({ ...data, email: normalizeEmail(data.email) })
      .returning();
    return user;
  },

  async markUserVerified(email: string): Promise<void> {
    await db
      .update(users)
      .set({ isVerified: true })
      .where(sql`lower(${users.email}) = ${normalizeEmail(email)}`);
  },

  async updateAvatar(userId: string, avatarUrl: string): Promise<void> {
    await db.update(users).set({ avatarUrl }).where(eq(users.id, userId));
  },

  async updatePhone(userId: string, phone: string): Promise<void> {
    await db.update(users).set({ volunteerPhone: phone }).where(eq(users.id, userId));
  },

  async applyToVolunteer(userId: string, data: { city: string; phone: string; motto: string; motivation: string; category: string }): Promise<void> {
    await db
      .update(users)
      .set({
        volunteerStatus: "pending",
        city: data.city,
        volunteerPhone: data.phone,
        volunteerMotto: data.motto,
        volunteerMotivation: data.motivation,
        volunteerCategory: data.category,
        volunteerRejectionReason: null,
      })
      .where(eq(users.id, userId));
  },

  async listVolunteerApplications(status: "pending" | "approved" | "rejected") {
    return db.select().from(users).where(eq(users.volunteerStatus, status));
  },

  // For CSV export — every user who's ever applied to volunteer, any status.
  async listVolunteersForExport(status: "pending" | "approved" | "rejected" | "all", dateRange?: { from?: string; to?: string }) {
    const conditions = [];
    if (status === "all") {
      conditions.push(
        or(
          eq(users.volunteerStatus, "pending"),
          eq(users.volunteerStatus, "approved"),
          eq(users.volunteerStatus, "rejected"),
        ),
      );
    } else {
      conditions.push(eq(users.volunteerStatus, status));
    }
    if (dateRange?.from) conditions.push(sql`${users.createdAt} >= ${new Date(dateRange.from)}`);
    if (dateRange?.to) conditions.push(sql`${users.createdAt} <= ${new Date(dateRange.to)}`);
    return db.select().from(users).where(and(...conditions)).orderBy(desc(users.createdAt));
  },

  // "All Volunteers" — includes both currently-active and alumni (past)
  // volunteers, so admins can see full history in one list.
  async listApprovedVolunteers() {
    return db
      .select()
      .from(users)
      .where(or(eq(users.volunteerStatus, "approved"), eq(users.volunteerStatus, "alumni")))
      .orderBy(desc(users.totalHoursContributed));
  },

  // "Top Projects" for a volunteer's public card — ranked by the hours they
  // logged on that specific case, then by how much the case raised. This is
  // real, derived data (not admin-typed), and reflects contribution, not recency.
  async getTopCaseTitlesForVolunteer(volunteerId: string, limit = 3): Promise<string[]> {
    const rows = await db
      .select({ title: cases.title, hours: cases.hoursContributed, amount: cases.amountCollected })
      .from(caseVolunteers)
      .innerJoin(cases, eq(caseVolunteers.caseId, cases.id))
      .where(and(eq(caseVolunteers.volunteerId, volunteerId), eq(cases.status, "completed")))
      .orderBy(desc(cases.hoursContributed), desc(cases.amountCollected))
      .limit(limit);
    return rows.map((r) => r.title);
  },

  async listApprovedVolunteersBrief() {
    const list = await db
      .select()
      .from(users)
      .where(or(eq(users.volunteerStatus, "approved"), eq(users.volunteerStatus, "alumni")))
      .orderBy(desc(users.totalHoursContributed));
    return list.map((v) => ({
      id: v.id,
      name: v.name,
      email: v.email,
      badgeId: v.badgeId,
      city: v.city,
      volunteerStatus: v.volunteerStatus,
      volunteerServedUntil: v.volunteerServedUntil,
    }));
  },

  async approveVolunteer(userId: string, badgeId: string): Promise<User> {
    const [updated] = await db
      .update(users)
      .set({ volunteerStatus: "approved", role: "volunteer", badgeId, volunteerApprovedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    return updated;
  },

  async rejectVolunteer(userId: string, reason?: string): Promise<User> {
    const [updated] = await db
      .update(users)
      .set({ volunteerStatus: "rejected", volunteerRejectionReason: reason || null })
      .where(eq(users.id, userId))
      .returning();
    return updated;
  },

  async updateVolunteerAdmin(
    userId: string,
    data: Partial<{ city: string; motto: string; motivation: string; category: string; totalHoursContributed: number; totalCasesCompleted: number; servedUntil: string; status: "approved" | "alumni" }>,
  ): Promise<User> {
    const patch: Record<string, unknown> = {};
    if (data.city !== undefined) patch.city = data.city;
    if (data.motto !== undefined) patch.volunteerMotto = data.motto;
    if (data.motivation !== undefined) patch.volunteerMotivation = data.motivation;
    if (data.category !== undefined) patch.volunteerCategory = data.category;
    if (data.totalHoursContributed !== undefined) patch.totalHoursContributed = data.totalHoursContributed;
    if (data.totalCasesCompleted !== undefined) patch.totalCasesCompleted = data.totalCasesCompleted;
    if (data.servedUntil !== undefined) patch.volunteerServedUntil = data.servedUntil;
    if (data.status !== undefined) {
      patch.volunteerStatus = data.status;
      // Moving back to "active" clears any stale served-until date.
      if (data.status === "approved") patch.volunteerServedUntil = null;
    }

    const [updated] = await db.update(users).set(patch).where(eq(users.id, userId)).returning();
    return updated;
  },

  // ─── Bans ───────────────────────────────────────────────────────────────
  // Bans are recorded in two places: the user row (for quick display in the
  // admin list) AND a standalone banned_emails table that survives even if
  // the account is later deleted — this is what stops a banned person from
  // simply signing up again with the same email.
  async banUserByEmail(email: string, reason?: string): Promise<void> {
    const normalized = normalizeEmail(email);
    await db.update(users).set({ isBanned: true, banReason: reason || null }).where(sql`lower(${users.email}) = ${normalized}`);
    try {
      await db
        .insert(bannedEmails)
        .values({ email: normalized, reason: reason || null })
        .onConflictDoUpdate({ target: bannedEmails.email, set: { reason: reason || null } });
    } catch (err) {
      // If the banned_emails table doesn't exist yet (migration not run),
      // the ban still takes effect via users.is_banned — just won't survive
      // account deletion until `npm run db:push` is run.
      console.error("banUserByEmail: could not persist to banned_emails (has `npm run db:push` been run?)", err);
    }
  },

  async unbanUser(userId: string): Promise<void> {
    const user = await this.getUserById(userId);
    await db.update(users).set({ isBanned: false, banReason: null }).where(eq(users.id, userId));
    if (user) {
      try {
        await db.delete(bannedEmails).where(sql`lower(${bannedEmails.email}) = ${normalizeEmail(user.email)}`);
      } catch (err) {
        console.error("unbanUser: could not clear banned_emails", err);
      }
    }
  },

  async isEmailBanned(email: string): Promise<boolean> {
    const normalized = normalizeEmail(email);
    try {
      const [row] = await db.select().from(bannedEmails).where(sql`lower(${bannedEmails.email}) = ${normalized}`);
      if (row) return true;
    } catch (err) {
      console.error("isEmailBanned: banned_emails table unavailable (has `npm run db:push` been run?)", err);
    }
    const user = await this.getUserByEmail(email);
    return user?.isBanned ?? false;
  },

  // ─── Delete user (defaulters) ────────────────────────────────────────────
  // Hard-deletes a user. Refuses if they have donations or submitted cases
  // on record (those are financial/audit history and shouldn't vanish) —
  // ban them instead in that case. Safe for volunteers/donors with no
  // activity tied to them yet.
  async deleteUser(userId: string): Promise<{ ok: true } | { ok: false; reason: string }> {
    const [donationCount] = await db.select({ count: sql<number>`count(*)::int` }).from(donations).where(eq(donations.userId, userId));
    if ((donationCount?.count ?? 0) > 0) {
      return { ok: false, reason: "This user has donation records on file. Ban them instead of deleting, to keep the financial history intact." };
    }
    const [caseCount] = await db.select({ count: sql<number>`count(*)::int` }).from(cases).where(eq(cases.submittedById, userId));
    if ((caseCount?.count ?? 0) > 0) {
      return { ok: false, reason: "This user has submitted cases on file. Ban them instead of deleting, to keep those records intact." };
    }
    await db.delete(caseVolunteers).where(eq(caseVolunteers.volunteerId, userId));
    await db.delete(caseVolunteerRequests).where(eq(caseVolunteerRequests.volunteerId, userId));
    await db.delete(users).where(eq(users.id, userId));
    return { ok: true };
  },

  // ─── All users (admin directory) ─────────────────────────────────────────
  async listAllUsers(search?: string) {
    if (search && search.trim()) {
      const term = `%${search.trim()}%`;
      return db.select().from(users).where(or(ilike(users.name, term), ilike(users.email, term))).orderBy(desc(users.createdAt));
    }
    return db.select().from(users).orderBy(desc(users.createdAt));
  },

  // ─── Name change requests ────────────────────────────────────────────────
  async requestNameChange(userId: string, newName: string): Promise<void> {
    await db.update(users).set({ pendingNameChange: newName }).where(eq(users.id, userId));
  },

  async listPendingNameChanges() {
    return db.select().from(users).where(sql`${users.pendingNameChange} IS NOT NULL`);
  },

  async approveNameChange(userId: string): Promise<User> {
    const user = await this.getUserById(userId);
    if (!user || !user.pendingNameChange) throw new Error("No pending name change");
    const [updated] = await db
      .update(users)
      .set({ name: user.pendingNameChange, pendingNameChange: null })
      .where(eq(users.id, userId))
      .returning();
    return updated;
  },

  async rejectNameChange(userId: string): Promise<void> {
    await db.update(users).set({ pendingNameChange: null }).where(eq(users.id, userId));
  },

  // ─── Password change ──────────────────────────────────────────────────────
  async updatePasswordHash(userId: string, passwordHash: string): Promise<void> {
    await db.update(users).set({ passwordHash }).where(eq(users.id, userId));
  },

  // ─── OTP codes ──────────────────────────────────────────────────────────
  async createOtp(data: { email: string; codeHash: string; purpose: "signup" | "login" | "reset_password"; expiresAt: Date }): Promise<OtpCode> {
    const [otp] = await db.insert(otpCodes).values({ ...data, email: normalizeEmail(data.email) }).returning();
    return otp;
  },

  async getLatestOtp(email: string, purpose: string): Promise<OtpCode | undefined> {
    const [otp] = await db
      .select()
      .from(otpCodes)
      .where(and(sql`lower(${otpCodes.email}) = ${normalizeEmail(email)}`, eq(otpCodes.purpose, purpose as any), eq(otpCodes.consumed, false)))
      .orderBy(desc(otpCodes.createdAt))
      .limit(1);
    return otp;
  },

  async consumeOtp(id: string): Promise<void> {
    await db.update(otpCodes).set({ consumed: true }).where(eq(otpCodes.id, id));
  },

  async incrementOtpAttempts(id: string): Promise<void> {
    await db
      .update(otpCodes)
      .set({ attempts: (await this.getOtpById(id))!.attempts + 1 })
      .where(eq(otpCodes.id, id));
  },

  async getOtpById(id: string): Promise<OtpCode | undefined> {
    const [otp] = await db.select().from(otpCodes).where(eq(otpCodes.id, id));
    return otp;
  },

  // ─── Cases ──────────────────────────────────────────────────────────────
  async createCase(userId: string, data: InsertCase & { images?: string[] }): Promise<Case> {
    const images = data.images ?? [];
    const location = `${data.city}, ${data.province}`;
    const [c] = await db
      .insert(cases)
      .values({ ...data, location, images, imageUrl: images[0], submittedById: userId })
      .returning();
    return c;
  },

  // Powers the "2 cases per day" limit — counts a user's submissions since
  // midnight today (server time).
  async countCasesSubmittedToday(userId: string): Promise<number> {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const rows = await db
      .select()
      .from(cases)
      .where(and(eq(cases.submittedById, userId), sql`${cases.createdAt} >= ${startOfDay}`));
    return rows.length;
  },

  async getCaseById(caseId: string): Promise<Case | undefined> {
    const [c] = await db.select().from(cases).where(eq(cases.id, caseId));
    return c;
  },

  // Distinct confirmed donors for a case — powers the "N donors" line on case cards.
  async countDonorsForCase(caseId: string): Promise<number> {
    const [row] = await db
      .select({ donorCount: sql<number>`count(distinct ${donations.userId})` })
      .from(donations)
      .where(and(eq(donations.caseId, caseId), eq(donations.status, "confirmed")));
    return Number(row?.donorCount ?? 0);
  },

  // Batched donor-count lookup for a list of cases (avoids N+1 queries).
  async countDonorsForCases(caseIds: string[]): Promise<Record<string, number>> {
    if (caseIds.length === 0) return {};
    const rows = await db
      .select({ caseId: donations.caseId, donorCount: sql<number>`count(distinct ${donations.userId})` })
      .from(donations)
      .where(and(inArray(donations.caseId, caseIds), eq(donations.status, "confirmed")))
      .groupBy(donations.caseId);
    const map: Record<string, number> = {};
    for (const row of rows) map[row.caseId] = Number(row.donorCount);
    return map;
  },

  // By default excludes hidden cases (public + normal admin tabs). Pass
  // includeHidden: true only for the admin's "Hidden Cases" tab.
  async listCasesByStatus(
    status: "pending_review" | "ongoing" | "completed" | "rejected",
    dateRange?: { from?: string; to?: string },
    includeHidden = false,
  ) {
    const conditions = [eq(cases.status, status)];
    if (!includeHidden) conditions.push(eq(cases.isHidden, false));
    if (dateRange?.from) conditions.push(sql`${cases.createdAt} >= ${new Date(dateRange.from)}`);
    if (dateRange?.to) conditions.push(sql`${cases.createdAt} <= ${new Date(dateRange.to)}`);
    return db.select().from(cases).where(and(...conditions)).orderBy(desc(cases.createdAt));
  },

  // ─── Hidden cases (admin-only visibility) ────────────────────────────────
  async hideCase(caseId: string, reason: string): Promise<Case> {
    const [updated] = await db
      .update(cases)
      .set({ isHidden: true, hiddenReason: reason, hiddenAt: new Date() })
      .where(eq(cases.id, caseId))
      .returning();
    return updated;
  },

  async unhideCase(caseId: string): Promise<Case> {
    const [updated] = await db
      .update(cases)
      .set({ isHidden: false, hiddenReason: null, hiddenAt: null })
      .where(eq(cases.id, caseId))
      .returning();
    return updated;
  },

  async listHiddenCases(search?: string, dateRange?: { from?: string; to?: string }) {
    const conditions = [eq(cases.isHidden, true)];
    if (search && search.trim()) {
      conditions.push(or(ilike(cases.title, `%${search.trim()}%`), ilike(cases.location, `%${search.trim()}%`))!);
    }
    if (dateRange?.from) conditions.push(sql`${cases.hiddenAt} >= ${new Date(dateRange.from)}`);
    if (dateRange?.to) conditions.push(sql`${cases.hiddenAt} <= ${new Date(dateRange.to)}`);
    return db.select().from(cases).where(and(...conditions)).orderBy(desc(cases.hiddenAt));
  },

  // For CSV export — every case regardless of status, or filtered to one.
  async listCasesForExport(status: "pending_review" | "ongoing" | "completed" | "rejected" | "all", dateRange?: { from?: string; to?: string }) {
    const conditions = [];
    if (status !== "all") conditions.push(eq(cases.status, status));
    if (dateRange?.from) conditions.push(sql`${cases.createdAt} >= ${new Date(dateRange.from)}`);
    if (dateRange?.to) conditions.push(sql`${cases.createdAt} <= ${new Date(dateRange.to)}`);
    if (conditions.length === 0) return db.select().from(cases).orderBy(desc(cases.createdAt));
    return db.select().from(cases).where(and(...conditions)).orderBy(desc(cases.createdAt));
  },

  async listCasesBySubmitter(userId: string) {
    return db.select().from(cases).where(eq(cases.submittedById, userId)).orderBy(desc(cases.createdAt));
  },

  // Full history for a volunteer's own account page — every case they've
  // ever been assigned to, any status, not just currently ongoing ones.
  async listCasesByAssignedVolunteer(userId: string) {
    const rows = await db
      .select({ case: cases })
      .from(caseVolunteers)
      .innerJoin(cases, eq(caseVolunteers.caseId, cases.id))
      .where(eq(caseVolunteers.volunteerId, userId))
      .orderBy(desc(cases.createdAt));
    return rows.map((r) => r.case);
  },

  async getCaseVolunteers(caseId: string) {
    const rows = await db
      .select({ id: users.id, name: users.name, badgeId: users.badgeId })
      .from(caseVolunteers)
      .innerJoin(users, eq(caseVolunteers.volunteerId, users.id))
      .where(eq(caseVolunteers.caseId, caseId));
    return rows;
  },

  async isVolunteerOnCase(caseId: string, volunteerId: string): Promise<boolean> {
    const rows = await db
      .select()
      .from(caseVolunteers)
      .where(and(eq(caseVolunteers.caseId, caseId), eq(caseVolunteers.volunteerId, volunteerId)));
    return rows.length > 0;
  },

  // ─── Case volunteer requests (join / leave a case, admin-reviewed) ──────

  async getMyPendingCaseRequest(caseId: string, volunteerId: string): Promise<CaseVolunteerRequest | undefined> {
    const [row] = await db
      .select()
      .from(caseVolunteerRequests)
      .where(and(eq(caseVolunteerRequests.caseId, caseId), eq(caseVolunteerRequests.volunteerId, volunteerId), eq(caseVolunteerRequests.status, "pending")));
    return row;
  },

  async createCaseVolunteerRequest(caseId: string, volunteerId: string, type: "assignment" | "removal", reason?: string): Promise<CaseVolunteerRequest> {
    const [row] = await db.insert(caseVolunteerRequests).values({ caseId, volunteerId, type, reason }).returning();
    return row;
  },

  async listPendingCaseVolunteerRequests() {
    const rows = await db
      .select({
        request: caseVolunteerRequests,
        caseTitle: cases.title,
        volunteerName: users.name,
        volunteerEmail: users.email,
        volunteerBadgeId: users.badgeId,
      })
      .from(caseVolunteerRequests)
      .innerJoin(cases, eq(caseVolunteerRequests.caseId, cases.id))
      .innerJoin(users, eq(caseVolunteerRequests.volunteerId, users.id))
      .where(and(eq(caseVolunteerRequests.status, "pending"), eq(cases.status, "ongoing")))
      .orderBy(desc(caseVolunteerRequests.createdAt));
    return rows;
  },

  async getCaseVolunteerRequestById(id: string): Promise<CaseVolunteerRequest | undefined> {
    const [row] = await db.select().from(caseVolunteerRequests).where(eq(caseVolunteerRequests.id, id));
    return row;
  },

  async resolveCaseVolunteerRequest(id: string, approve: boolean): Promise<CaseVolunteerRequest> {
    const request = await this.getCaseVolunteerRequestById(id);
    if (!request) throw new Error("Request not found");

    const [updated] = await db
      .update(caseVolunteerRequests)
      .set({ status: approve ? "approved" : "rejected" })
      .where(eq(caseVolunteerRequests.id, id))
      .returning();

    if (approve) {
      if (request.type === "assignment") {
        const already = await this.isVolunteerOnCase(request.caseId, request.volunteerId);
        if (!already) {
          await db.insert(caseVolunteers).values({ caseId: request.caseId, volunteerId: request.volunteerId });
        }
      } else {
        await db
          .delete(caseVolunteers)
          .where(and(eq(caseVolunteers.caseId, request.caseId), eq(caseVolunteers.volunteerId, request.volunteerId)));
      }
    }

    return updated;
  },

  async approveCase(caseId: string): Promise<Case> {
    const [updated] = await db.update(cases).set({ status: "ongoing", approvedAt: new Date() }).where(eq(cases.id, caseId)).returning();
    return updated;
  },

  async deleteCase(caseId: string): Promise<void> {
    await db.delete(caseVolunteers).where(eq(caseVolunteers.caseId, caseId));
    await db.delete(cases).where(eq(cases.id, caseId));
  },

  async rejectCase(caseId: string, reason?: string): Promise<Case> {
    const [updated] = await db
      .update(cases)
      .set({ status: "rejected", rejectionReason: reason || null })
      .where(eq(cases.id, caseId))
      .returning();
    return updated;
  },

  // Moves a rejected case back to Pending Cases for another look.
  async restoreCase(caseId: string): Promise<Case> {
    const [updated] = await db
      .update(cases)
      .set({ status: "pending_review", rejectionReason: null })
      .where(eq(cases.id, caseId))
      .returning();
    return updated;
  },

  // Replaces the full set of volunteers assigned to a case — the admin UI
  // sends a checklist of volunteer IDs, and this makes that the new truth
  // (removes anyone unchecked, adds anyone newly checked).
  async setCaseVolunteers(caseId: string, volunteerIds: string[]): Promise<void> {
    await db.delete(caseVolunteers).where(eq(caseVolunteers.caseId, caseId));
    if (volunteerIds.length > 0) {
      await db.insert(caseVolunteers).values(volunteerIds.map((volunteerId) => ({ caseId, volunteerId })));
    }
  },

  async updateCollectedAmount(caseId: string, amount: number): Promise<void> {
    await db.update(cases).set({ amountCollected: amount }).where(eq(cases.id, caseId));
  },

  async updateCaseAdmin(
    caseId: string,
    data: Partial<{ title: string; description: string; city: string; province: string; contactPhone: string; amountNeeded: number; imageUrl: string | null; images: string[]; category: string }>,
  ): Promise<Case> {
    const patch: Record<string, unknown> = { ...data };
    if (data.city || data.province) {
      const existing = await this.getCaseById(caseId);
      const city = data.city ?? existing?.city ?? "";
      const province = data.province ?? existing?.province ?? "";
      patch.location = `${city}, ${province}`;
    }
    const [updated] = await db.update(cases).set(patch).where(eq(cases.id, caseId)).returning();
    return updated;
  },

  async completeCase(caseId: string, hoursContributed: number): Promise<Case> {
    const [c] = await db
      .update(cases)
      .set({ status: "completed", completedAt: new Date(), hoursContributed })
      .where(eq(cases.id, caseId))
      .returning();

    // Credit every volunteer assigned to this case — not just one — with
    // the hours and a completed-case count.
    const assigned = await this.getCaseVolunteers(caseId);
    for (const v of assigned) {
      const volunteer = await this.getUserById(v.id);
      if (volunteer) {
        await db
          .update(users)
          .set({
            totalCasesCompleted: volunteer.totalCasesCompleted + 1,
            totalHoursContributed: volunteer.totalHoursContributed + hoursContributed,
          })
          .where(eq(users.id, volunteer.id));
      }
    }

    // Auto-create a Gallery entry from the completed case so donors see it
    // without the admin re-typing everything — admin can edit it afterward.
    await this.createGalleryEvent({
      title: c.title,
      description: c.description,
      location: c.location,
      eventDate: new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" }),
      images: c.images?.length ? c.images : c.imageUrl ? [c.imageUrl] : [],
      funds: `PKR ${c.amountCollected.toLocaleString()}`,
      sourceCaseId: c.id,
    });

    return c;
  },

  // ─── Gallery events (admin-curated) ──────────────────────────────────────
  async createGalleryEvent(data: {
    title: string;
    description: string;
    location: string;
    eventDate: string;
    images: string[];
    families?: string;
    items?: string;
    funds?: string;
    sourceCaseId?: string;
  }): Promise<GalleryEvent> {
    const [event] = await db.insert(galleryEvents).values(data).returning();
    return event;
  },

  // Excludes gallery posts whose underlying case was later hidden by an
  // admin — hiding a case should pull it from every public view, including
  // the curated "Completed Projects" gallery.
  async listGalleryEvents(): Promise<GalleryEvent[]> {
    return db
      .select()
      .from(galleryEvents)
      .where(
        sql`${galleryEvents.sourceCaseId} IS NULL OR ${galleryEvents.sourceCaseId} NOT IN (SELECT ${cases.id} FROM ${cases} WHERE ${cases.isHidden} = true)`,
      )
      .orderBy(desc(galleryEvents.createdAt));
  },

  async getGalleryEventById(id: string): Promise<GalleryEvent | undefined> {
    const [event] = await db.select().from(galleryEvents).where(eq(galleryEvents.id, id));
    return event;
  },

  async updateGalleryEvent(
    id: string,
    data: Partial<{ title: string; description: string; location: string; eventDate: string; families: string; items: string; funds: string; images: string[] }>,
  ): Promise<GalleryEvent> {
    const [updated] = await db.update(galleryEvents).set(data).where(eq(galleryEvents.id, id)).returning();
    return updated;
  },

  async deleteGalleryEvent(id: string): Promise<void> {
    await db.delete(galleryEvents).where(eq(galleryEvents.id, id));
  },

  // ─── Success stories (admin-curated) ─────────────────────────────────────
  async createSuccessStory(data: {
    name: string;
    title: string;
    storyDate: string;
    quote: string;
    beforeImage: string;
    afterImage: string;
  }): Promise<SuccessStory> {
    const [story] = await db.insert(successStories).values(data).returning();
    return story;
  },

  async listSuccessStories(): Promise<SuccessStory[]> {
    return db.select().from(successStories).orderBy(desc(successStories.createdAt));
  },

  async updateSuccessStory(
    id: string,
    data: Partial<{ name: string; title: string; storyDate: string; quote: string; beforeImage: string; afterImage: string }>,
  ): Promise<SuccessStory> {
    const [updated] = await db.update(successStories).set(data).where(eq(successStories.id, id)).returning();
    return updated;
  },

  async deleteSuccessStory(id: string): Promise<void> {
    await db.delete(successStories).where(eq(successStories.id, id));
  },

  // ─── Blogs ─────────────────────────────────────────────────────────────

  // Turns "Why Winter Aid Matters More Than Ever!" into "why-winter-aid-
  // matters-more-than-ever", then appends -2/-3/... if that slug is already
  // taken (by another live OR bin post — a restored post reusing a slug
  // that's meanwhile been taken by a new post would otherwise collide).
  async generateUniqueBlogSlug(title: string, excludeId?: string): Promise<string> {
    const base =
      title
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 80) || "post";

    let slug = base;
    let suffix = 2;
    for (;;) {
      const conflictConditions = excludeId
        ? and(eq(blogs.slug, slug), sql`${blogs.id} != ${excludeId}`)
        : eq(blogs.slug, slug);
      const [existing] = await db.select({ id: blogs.id }).from(blogs).where(conflictConditions).limit(1);
      if (!existing) return slug;
      slug = `${base}-${suffix}`;
      suffix += 1;
    }
  },

  async createBlog(
    authorId: string,
    data: { title: string; excerpt: string; content: string; coverImage: string; status: "draft" | "published" },
  ): Promise<Blog> {
    const slug = await this.generateUniqueBlogSlug(data.title);
    const [blog] = await db
      .insert(blogs)
      .values({ ...data, slug, authorId })
      .returning();
    return blog;
  },

  async updateBlog(
    id: string,
    data: Partial<{ title: string; excerpt: string; content: string; coverImage: string; status: "draft" | "published" }>,
  ): Promise<Blog | undefined> {
    const patch: Record<string, unknown> = { ...data, updatedAt: new Date() };
    // Re-slugging on every title edit would break any link already shared
    // to the old slug, so the slug is only ever (re)computed once, at
    // creation — editing the title later never changes the URL.
    const [updated] = await db.update(blogs).set(patch).where(eq(blogs.id, id)).returning();
    return updated;
  },

  async getBlogById(id: string): Promise<Blog | undefined> {
    const [blog] = await db.select().from(blogs).where(eq(blogs.id, id));
    return blog;
  },

  // Public reads only ever see published, non-deleted posts — a draft or a
  // soft-deleted post is never reachable by guessing its slug.
  async getPublishedBlogBySlug(slug: string): Promise<Blog | undefined> {
    const [blog] = await db
      .select()
      .from(blogs)
      .where(and(eq(blogs.slug, slug), eq(blogs.status, "published"), sql`${blogs.deletedAt} is null`));
    return blog;
  },

  async listPublishedBlogs(limit?: number): Promise<Blog[]> {
    const query = db
      .select()
      .from(blogs)
      .where(and(eq(blogs.status, "published"), sql`${blogs.deletedAt} is null`))
      .orderBy(desc(blogs.createdAt));
    if (limit) return query.limit(limit);
    return query;
  },

  // Bin items older than 30 days are gone for good — this runs (cheaply;
  // it's a no-op once nothing qualifies) every time the admin bin is
  // opened, rather than needing a separate cron job wired up.
  async purgeExpiredBlogBin(): Promise<void> {
    const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    await db.delete(blogs).where(sql`${blogs.deletedAt} is not null and ${blogs.deletedAt} < ${cutoff}`);
  },

  async listAdminBlogs(view: "active" | "bin", search?: string): Promise<Blog[]> {
    if (view === "bin") await this.purgeExpiredBlogBin();

    const conditions = [view === "bin" ? sql`${blogs.deletedAt} is not null` : sql`${blogs.deletedAt} is null`];
    if (search && search.trim()) {
      conditions.push(ilike(blogs.title, `%${search.trim()}%`));
    }
    return db
      .select()
      .from(blogs)
      .where(and(...conditions))
      .orderBy(desc(blogs.createdAt));
  },

  // Moves a live post to the Bin — recoverable for 30 days via
  // restoreBlog, then auto-purged by purgeExpiredBlogBin.
  async softDeleteBlog(id: string): Promise<void> {
    await db.update(blogs).set({ deletedAt: new Date() }).where(eq(blogs.id, id));
  },

  async restoreBlog(id: string): Promise<void> {
    await db.update(blogs).set({ deletedAt: null }).where(eq(blogs.id, id));
  },

  // Immediate, permanent removal — only ever called from within the Bin
  // view, never from the main list, so this is always a deliberate
  // "empty the trash" action rather than accidental.
  async permanentlyDeleteBlog(id: string): Promise<void> {
    await db.delete(blogs).where(eq(blogs.id, id));
  },

  // ─── Donations (manual-confirm) ──────────────────────────────────────────
  async createDonation(
    userId: string,
    data: { caseId: string; amount: number; tipAmount?: number; method: string; senderAccount: string; receiptImage: string; referenceNote?: string; recurringDonationId?: string },
  ): Promise<Donation> {
    const [donation] = await db
      .insert(donations)
      .values({
        userId,
        caseId: data.caseId,
        recurringDonationId: data.recurringDonationId,
        amount: data.amount,
        tipAmount: data.tipAmount ?? 0,
        method: data.method as any,
        senderAccount: data.senderAccount,
        receiptImage: data.receiptImage,
        referenceNote: data.referenceNote,
      })
      .returning();
    return donation;
  },

  async countRecentPendingDonations(userId: string, sinceHours: number): Promise<number> {
    const since = new Date(Date.now() - sinceHours * 60 * 60 * 1000);
    const rows = await db
      .select()
      .from(donations)
      .where(and(eq(donations.userId, userId), sql`${donations.createdAt} > ${since}`));
    return rows.length;
  },

  // Auto-reject donations that have sat pending for too long with no admin action —
  // keeps the admin queue clean instead of accumulating stale, unconfirmed claims forever.
  async expireStalePendingDonations(olderThanDays = 7): Promise<void> {
    const cutoff = new Date(Date.now() - olderThanDays * 24 * 60 * 60 * 1000);
    await db
      .update(donations)
      .set({ status: "rejected", rejectionReason: `Automatically expired, not confirmed within ${olderThanDays} days.` })
      .where(and(eq(donations.status, "pending"), sql`${donations.createdAt} < ${cutoff}`));
  },

  async listDonationsByUser(userId: string) {
    return db
      .select({ donation: donations, caseTitle: cases.title })
      .from(donations)
      .innerJoin(cases, eq(donations.caseId, cases.id))
      .where(eq(donations.userId, userId))
      .orderBy(desc(donations.createdAt));
  },

  async listDonationsByStatus(status: "pending" | "confirmed" | "rejected") {
    return db
      .select({ donation: donations, caseTitle: cases.title, donorName: users.name, donorEmail: users.email })
      .from(donations)
      .innerJoin(cases, eq(donations.caseId, cases.id))
      .innerJoin(users, eq(donations.userId, users.id))
      .where(eq(donations.status, status))
      .orderBy(desc(donations.createdAt));
  },

  // Powers the admin Donations tab: filter by status (or "all"), and free-text
  // search across sender account/phone, donor name/email, and case title —
  // this is what lets an admin cross-check a JazzCash statement number directly.
  async listDonationsFiltered(filter: { status?: "pending" | "confirmed" | "rejected" | "all"; search?: string; from?: string; to?: string; recurringDonationId?: string }) {
    const conditions = [];
    if (filter.status && filter.status !== "all") {
      conditions.push(eq(donations.status, filter.status));
    }
    if (filter.recurringDonationId) conditions.push(eq(donations.recurringDonationId, filter.recurringDonationId));
    if (filter.from) conditions.push(sql`${donations.createdAt} >= ${new Date(filter.from)}`);
    if (filter.to) conditions.push(sql`${donations.createdAt} <= ${new Date(filter.to)}`);
    if (filter.search && filter.search.trim()) {
      const term = `%${filter.search.trim()}%`;
      conditions.push(
        or(
          ilike(donations.senderAccount, term),
          ilike(users.name, term),
          ilike(users.email, term),
          ilike(cases.title, term),
        ),
      );
    }

    const query = db
      .select({ donation: donations, caseTitle: cases.title, donorName: users.name, donorEmail: users.email })
      .from(donations)
      .innerJoin(cases, eq(donations.caseId, cases.id))
      .innerJoin(users, eq(donations.userId, users.id))
      .orderBy(desc(donations.createdAt));

    if (conditions.length > 0) {
      return query.where(and(...conditions));
    }
    return query;
  },

  // Powers the admin "By Case" donations view: every case (searchable by
  // title/location/city/category) with how much it's collected so far and
  // how many confirmed donations back that number, so an admin can scan
  // for a case without opening each one.
  async getCasesWithDonationTotals(search?: string) {
    const conditions = [];
    if (search && search.trim()) {
      const term = `%${search.trim()}%`;
      conditions.push(
        or(
          ilike(cases.title, term),
          ilike(cases.location, term),
          ilike(cases.city, term),
          ilike(cases.category, term),
        ),
      );
    }

    const query = db
      .select({
        id: cases.id,
        title: cases.title,
        location: cases.location,
        category: cases.category,
        status: cases.status,
        imageUrl: cases.imageUrl,
        amountNeeded: cases.amountNeeded,
        amountCollected: cases.amountCollected,
        createdAt: cases.createdAt,
        donationCount: sql<number>`(select count(*)::int from ${donations} where ${donations.caseId} = ${cases.id} and ${donations.status} = 'confirmed')`,
      })
      .from(cases)
      .orderBy(desc(cases.amountCollected));

    if (conditions.length > 0) {
      return query.where(and(...conditions));
    }
    return query;
  },

  // Powers the admin case-detail drill-in: the case itself plus every
  // donation ever submitted against it (any status, newest first), so the
  // admin can see the full history — not just what's currently confirmed.
  async getCaseDonationDetail(caseId: string) {
    const caseRow = await this.getCaseById(caseId);
    if (!caseRow) return undefined;

    const rows = await db
      .select({ donation: donations, donorName: users.name, donorEmail: users.email })
      .from(donations)
      .innerJoin(users, eq(donations.userId, users.id))
      .where(eq(donations.caseId, caseId))
      .orderBy(desc(donations.createdAt));

    return { case: caseRow, donations: rows };
  },

  async deleteDonation(id: string): Promise<void> {
    await db.delete(donations).where(eq(donations.id, id));
  },

  async getDonationById(id: string): Promise<Donation | undefined> {
    const [d] = await db.select().from(donations).where(eq(donations.id, id));
    return d;
  },

  // Used by GET /api/receipts/:filename to check ownership before streaming
  // a receipt file back — never trust the filename alone as authorization.
  async getDonationByReceiptFilename(filename: string): Promise<Donation | undefined> {
    const [d] = await db.select().from(donations).where(eq(donations.receiptImage, `/api/receipts/${filename}`));
    return d;
  },

  async confirmDonation(donationId: string): Promise<Donation> {
    const donation = await this.getDonationById(donationId);
    if (!donation) throw new Error("Donation not found");
    if (donation.status === "confirmed") return donation; // already confirmed — avoid double-counting the amount

    // Platform fee is computed and locked in right here, once, off the
    // donation's own `amount` — never off the tip (the tip is already a
    // gift to the platform, not something the platform takes a cut of).
    // Storing the fee/net split on the row itself (rather than
    // recomputing PLATFORM_FEE_RATE * amount whenever it's displayed)
    // means this donation's numbers stay correct forever even if the fee
    // rate is changed for future donations later.
    const platformFeeAmount = Math.round(donation.amount * PLATFORM_FEE_RATE);
    const netCaseAmount = donation.amount - platformFeeAmount;

    // Gate the transition itself on `status = 'pending'` (not just the
    // earlier read) and check how many rows it actually touched — that's
    // what makes this safe against two concurrent confirm calls for the
    // same donation (a double-click, two admin tabs, etc.) racing each
    // other. Without it, both requests can pass the read-time check above
    // before either write lands, and each would separately credit the
    // case's amountCollected — double-counting the same donation.
    const [updated] = await db
      .update(donations)
      .set({ status: "confirmed", confirmedAt: new Date(), rejectionReason: null, platformFeeAmount, netCaseAmount })
      .where(and(eq(donations.id, donationId), eq(donations.status, "pending")))
      .returning();
    if (!updated) {
      // Someone else already confirmed (or rejected) it between our read
      // and write — return the current row rather than silently no-op'ing
      // or throwing, so the caller still gets something sensible back.
      const current = await this.getDonationById(donationId);
      if (!current) throw new Error("Donation not found");
      return current;
    }

    // Only the net amount (after the platform fee) lands on the case's
    // collected total and progress bar — the tip never does, it's tracked
    // separately as platform support (see getCaseDonationDetail). Atomic
    // increment (amountCollected = amountCollected + x in the same
    // statement) rather than read-then-write, for the same reason as
    // above — two confirms landing at once would otherwise both compute
    // their new total from the same stale starting value.
    await db
      .update(cases)
      .set({ amountCollected: sql`${cases.amountCollected} + ${netCaseAmount}` })
      .where(eq(cases.id, donation.caseId));

    if (donation.recurringDonationId) {
      await db
        .update(recurringDonations)
        .set({ lastDonationDate: updated.confirmedAt })
        .where(eq(recurringDonations.id, donation.recurringDonationId));
    }

    return updated;
  },

  async rejectDonation(donationId: string, reason?: string): Promise<Donation> {
    const donation = await this.getDonationById(donationId);
    if (!donation) throw new Error("Donation not found");

    // Same atomic-gate pattern as confirmDonation/revertDonationToPending.
    // Without checking the FROM state here too, rejecting a donation that
    // was already "confirmed" would flip it to "rejected" without ever
    // decrementing amountCollected — permanently inflating the case's
    // total by money that's no longer actually counted as verified. The
    // current admin UI only ever calls reject on pending rows, but the
    // API shouldn't depend on that staying true.
    const [updated] = await db
      .update(donations)
      .set({ status: "rejected", rejectionReason: reason || null })
      .where(and(eq(donations.id, donationId), sql`${donations.status} != 'rejected'`))
      .returning();

    if (!updated) {
      const current = await this.getDonationById(donationId);
      if (!current) throw new Error("Donation not found");
      return current;
    }

    if (donation.status === "confirmed") {
      // Reverse exactly what confirmDonation credited — the stored
      // netCaseAmount, not the raw amount, since that (minus the fee) is
      // what actually landed on the case's total in the first place.
      await db
        .update(cases)
        .set({ amountCollected: sql`GREATEST(0, ${cases.amountCollected} - ${donation.netCaseAmount ?? donation.amount})` })
        .where(eq(cases.id, donation.caseId));
    }

    return updated;
  },

  // ─── Recurring donations (monthly pledge — see shared/schema.ts) ───────

  async createRecurringDonation(
    userId: string,
    data: { caseId: string; amount: number; method: string },
  ): Promise<RecurringDonation> {
    const nextDueDate = new Date();
    nextDueDate.setMonth(nextDueDate.getMonth() + 1);
    const [pledge] = await db
      .insert(recurringDonations)
      .values({ userId, caseId: data.caseId, amount: data.amount, method: data.method as any, nextDueDate })
      .returning();
    return pledge;
  },

  async getRecurringDonationById(id: string): Promise<RecurringDonation | undefined> {
    const [r] = await db.select().from(recurringDonations).where(eq(recurringDonations.id, id));
    return r;
  },

  // Does an ACTIVE pledge for this exact case already exist for this donor?
  // Prevents accidentally stacking duplicate monthly commitments.
  async findActiveRecurringDonation(userId: string, caseId: string): Promise<RecurringDonation | undefined> {
    const [r] = await db
      .select()
      .from(recurringDonations)
      .where(and(eq(recurringDonations.userId, userId), eq(recurringDonations.caseId, caseId), eq(recurringDonations.status, "active")));
    return r;
  },

  async listMyRecurringDonations(userId: string) {
    return db
      .select({ pledge: recurringDonations, caseTitle: cases.title })
      .from(recurringDonations)
      .innerJoin(cases, eq(recurringDonations.caseId, cases.id))
      .where(eq(recurringDonations.userId, userId))
      .orderBy(desc(recurringDonations.createdAt));
  },

  async listAllRecurringDonations() {
    return db
      .select({ pledge: recurringDonations, caseTitle: cases.title, donorName: users.name, donorEmail: users.email })
      .from(recurringDonations)
      .innerJoin(cases, eq(recurringDonations.caseId, cases.id))
      .innerJoin(users, eq(recurringDonations.userId, users.id))
      .orderBy(desc(recurringDonations.createdAt));
  },

  // All three mutations require the caller to pass the acting user's id, and
  // only ever affect a row that belongs to that user — never trust an id
  // from the client alone to mean "this is yours to change".
  async setRecurringDonationStatus(
    id: string,
    userId: string,
    status: "active" | "paused" | "cancelled",
  ): Promise<RecurringDonation | undefined> {
    const [updated] = await db
      .update(recurringDonations)
      .set({ status, cancelledAt: status === "cancelled" ? new Date() : null })
      .where(and(eq(recurringDonations.id, id), eq(recurringDonations.userId, userId)))
      .returning();
    return updated;
  },

  // Pledges whose next monthly reminder is due — used by the reminder job.
  async listDueRecurringDonations(): Promise<RecurringDonation[]> {
    const now = new Date();
    return db
      .select()
      .from(recurringDonations)
      .where(and(eq(recurringDonations.status, "active"), sql`${recurringDonations.nextDueDate} <= ${now}`));
  },

  // Advances a pledge to next month after its reminder goes out, so the same
  // due date can't fire the reminder twice.
  async advanceRecurringDonation(id: string): Promise<void> {
    const pledge = await this.getRecurringDonationById(id);
    if (!pledge) return;
    const next = new Date(pledge.nextDueDate);
    next.setMonth(next.getMonth() + 1);
    await db
      .update(recurringDonations)
      .set({ nextDueDate: next, lastReminderSentAt: new Date() })
      .where(eq(recurringDonations.id, id));
  },

  // Undo an accidental confirm or reject, putting the donation back to "pending"
  // for the admin to act on again. If it was confirmed, the amount already
  // added to the case's collected total is subtracted back out first.
  async revertDonationToPending(donationId: string): Promise<Donation> {
    const donation = await this.getDonationById(donationId);
    if (!donation) throw new Error("Donation not found");

    // Same atomic-gate pattern as confirmDonation: only decrement, and
    // only transition the row, if it's still actually "confirmed" at the
    // moment this UPDATE runs — not just at the read above — so two
    // concurrent reverts (or a revert racing a confirm) can't each act on
    // a stale in-memory copy of the donation's status.
    const [updated] = await db
      .update(donations)
      .set({ status: "pending", rejectionReason: null, confirmedAt: null })
      .where(and(eq(donations.id, donationId), eq(donations.status, "confirmed")))
      .returning();

    if (!updated) {
      // Wasn't in "confirmed" state (already pending/rejected, or someone
      // else just reverted it) — nothing to undo financially either.
      const current = await this.getDonationById(donationId);
      if (!current) throw new Error("Donation not found");
      return current;
    }

    await db
      .update(cases)
      .set({ amountCollected: sql`GREATEST(0, ${cases.amountCollected} - ${donation.netCaseAmount ?? donation.amount})` })
      .where(eq(cases.id, donation.caseId));

    return updated;
  },

  // ─── Admin dashboard stats ────────────────────────────────────────────────
  async getAdminStats() {
    const [{ totalRaised }] = await db
      .select({ totalRaised: sql<number>`coalesce(sum(${donations.amount}), 0)` })
      .from(donations)
      .where(eq(donations.status, "confirmed"));

    // Sum of every tip a donor has added, across every case — tips never
    // belong to any single case's own total (see confirmDonation), so this
    // is the only place their grand total is rolled up.
    const [{ totalTips }] = await db
      .select({ totalTips: sql<number>`coalesce(sum(${donations.tipAmount}), 0)` })
      .from(donations)
      .where(eq(donations.status, "confirmed"));

    const [{ totalDonors }] = await db
      .select({ totalDonors: sql<number>`count(distinct ${donations.userId})` })
      .from(donations)
      .where(eq(donations.status, "confirmed"));

    const [{ activeCases }] = await db
      .select({ activeCases: sql<number>`count(*)` })
      .from(cases)
      .where(eq(cases.status, "ongoing"));

    const [{ pendingVolunteers }] = await db
      .select({ pendingVolunteers: sql<number>`count(*)` })
      .from(users)
      .where(eq(users.volunteerStatus, "pending"));

    const [{ pendingCases }] = await db
      .select({ pendingCases: sql<number>`count(*)` })
      .from(cases)
      .where(eq(cases.status, "pending_review"));

    const [{ pendingDonations }] = await db
      .select({ pendingDonations: sql<number>`count(*)` })
      .from(donations)
      .where(eq(donations.status, "pending"));

    return {
      totalRaised: Number(totalRaised),
      totalTips: Number(totalTips),
      totalDonors: Number(totalDonors),
      activeCases: Number(activeCases),
      pendingApprovals: Number(pendingVolunteers) + Number(pendingCases) + Number(pendingDonations),
    };
  },

  // Daily activity summary for the admin — what got done today.
  async getDailySummary(date: Date = new Date()) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const [{ volunteersApproved }] = await db
      .select({ volunteersApproved: sql<number>`count(*)` })
      .from(users)
      .where(and(sql`${users.volunteerApprovedAt} >= ${startOfDay}`, sql`${users.volunteerApprovedAt} <= ${endOfDay}`));

    const [{ casesApproved }] = await db
      .select({ casesApproved: sql<number>`count(*)` })
      .from(cases)
      .where(and(sql`${cases.approvedAt} >= ${startOfDay}`, sql`${cases.approvedAt} <= ${endOfDay}`));

    const [{ casesCompleted }] = await db
      .select({ casesCompleted: sql<number>`count(*)` })
      .from(cases)
      .where(and(sql`${cases.completedAt} >= ${startOfDay}`, sql`${cases.completedAt} <= ${endOfDay}`));

    const [{ donationsConfirmed, fundsConfirmedToday }] = await db
      .select({
        donationsConfirmed: sql<number>`count(*)`,
        fundsConfirmedToday: sql<number>`coalesce(sum(${donations.amount}), 0)`,
      })
      .from(donations)
      .where(and(eq(donations.status, "confirmed"), sql`${donations.confirmedAt} >= ${startOfDay}`, sql`${donations.confirmedAt} <= ${endOfDay}`));

    const [{ newSignups }] = await db
      .select({ newSignups: sql<number>`count(*)` })
      .from(users)
      .where(and(sql`${users.createdAt} >= ${startOfDay}`, sql`${users.createdAt} <= ${endOfDay}`));

    return {
      date: startOfDay.toISOString().slice(0, 10),
      volunteersApproved: Number(volunteersApproved),
      casesApproved: Number(casesApproved),
      casesCompleted: Number(casesCompleted),
      donationsConfirmed: Number(donationsConfirmed),
      fundsConfirmedToday: Number(fundsConfirmedToday),
      newSignups: Number(newSignups),
    };
  },

  // ─── Site settings (singleton row — homepage tagline banner) ─────────────
  async getSiteSettings(): Promise<{ tagline: string | null; taglineCase: { id: string; title: string } | null }> {
    const [row] = await db.select().from(siteSettings).limit(1);
    if (!row?.taglineCaseId) return { tagline: row?.tagline ?? null, taglineCase: null };
    const linkedCase = await this.getCaseById(row.taglineCaseId);
    // Don't link to a case that's no longer ongoing (completed/hidden/etc.) — the banner just shows plain text then.
    const taglineCase = linkedCase && linkedCase.status === "ongoing" && !linkedCase.isHidden
      ? { id: linkedCase.id, title: linkedCase.title }
      : null;
    return { tagline: row?.tagline ?? null, taglineCase };
  },

  async updateTagline(tagline: string, taglineCaseId?: string | null): Promise<void> {
    const [row] = await db.select().from(siteSettings).limit(1);
    if (row) {
      await db.update(siteSettings).set({ tagline, taglineCaseId: taglineCaseId ?? null, updatedAt: new Date() }).where(eq(siteSettings.id, row.id));
    } else {
      await db.insert(siteSettings).values({ tagline, taglineCaseId: taglineCaseId ?? null });
    }
  },

  // ─── Inbox (contact form + partnership inquiries) ────────────────────────
  async createInboxMessage(data: {
    type: "contact" | "partnership";
    name: string;
    email: string;
    organization?: string;
    message: string;
  }): Promise<InboxMessage> {
    const [row] = await db.insert(inboxMessages).values(data).returning();
    return row;
  },

  async listInboxMessages(type?: "contact" | "partnership"): Promise<InboxMessage[]> {
    const query = db.select().from(inboxMessages).orderBy(desc(inboxMessages.createdAt));
    if (type) return query.where(eq(inboxMessages.type, type));
    return query;
  },

  async getInboxMessageById(id: string): Promise<InboxMessage | undefined> {
    const [row] = await db.select().from(inboxMessages).where(eq(inboxMessages.id, id));
    return row;
  },

  // Opening a message for the first time flips it from unread -> read, but
  // never overwrites "replied" back down to "read".
  async markInboxMessageRead(id: string): Promise<void> {
    await db
      .update(inboxMessages)
      .set({ status: "read" })
      .where(and(eq(inboxMessages.id, id), eq(inboxMessages.status, "unread")));
  },

  async replyToInboxMessage(id: string, replyText: string, repliedBy: string): Promise<InboxMessage | undefined> {
    const [row] = await db
      .update(inboxMessages)
      .set({ status: "replied", replyText, repliedAt: new Date(), repliedBy })
      .where(eq(inboxMessages.id, id))
      .returning();
    return row;
  },

  // A brand-new conversation the admin starts from the inbox (not a reply
  // to an inbound form submission). Stored the same way so it shows up in
  // the same list and can be threaded/resolved identically; `type` is
  // "contact" so it lands in that tab — there's no separate visitor form
  // that originated it.
  async createComposedInboxMessage(data: { name: string; email: string; message: string }): Promise<InboxMessage> {
    const [row] = await db
      .insert(inboxMessages)
      .values({ type: "contact", name: data.name, email: data.email, message: data.message, status: "replied" })
      .returning();
    return row;
  },

  async addThreadMessage(data: {
    inboxMessageId: string;
    direction: "outbound" | "inbound";
    body: string;
    authorName?: string;
    resendEmailId?: string;
  }): Promise<InboxThreadMessage> {
    const [row] = await db.insert(inboxThreadMessages).values(data).returning();
    return row;
  },

  async listThreadMessages(inboxMessageId: string): Promise<InboxThreadMessage[]> {
    return db
      .select()
      .from(inboxThreadMessages)
      .where(eq(inboxThreadMessages.inboxMessageId, inboxMessageId))
      .orderBy(inboxThreadMessages.createdAt);
  },

  // Resend retries webhook delivery on timeout, so the same inbound email
  // can arrive twice — skip it if we've already stored this exact email id.
  async threadMessageExistsForResendId(resendEmailId: string): Promise<boolean> {
    const [row] = await db.select({ id: inboxThreadMessages.id }).from(inboxThreadMessages).where(eq(inboxThreadMessages.resendEmailId, resendEmailId));
    return !!row;
  },

  async setInboxMessageResolved(id: string, resolved: boolean): Promise<InboxMessage | undefined> {
    const [row] = await db.update(inboxMessages).set({ resolved }).where(eq(inboxMessages.id, id)).returning();
    return row;
  },

  async countUnreadInboxMessages(): Promise<{ contact: number; partnership: number }> {
    const rows = await db
      .select({ type: inboxMessages.type, count: sql<number>`count(*)` })
      .from(inboxMessages)
      .where(eq(inboxMessages.status, "unread"))
      .groupBy(inboxMessages.type);
    const result = { contact: 0, partnership: 0 };
    for (const r of rows) result[r.type] = Number(r.count);
    return result;
  },
};
