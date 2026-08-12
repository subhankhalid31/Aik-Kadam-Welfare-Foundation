import type { Express } from "express";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import rateLimit from "express-rate-limit";
import { OAuth2Client } from "google-auth-library";
import { storage } from "./storage";
import { sendOtpEmail, sendNotificationEmail } from "./lib/email";
import { generateOtpCode, hashOtpCode, otpExpiresAt, isOtpExpired, MAX_ATTEMPTS } from "./lib/otp";
import { requireAuth, requireRole } from "./middleware/auth";
import { uploadImage, uploadReceipt, uploadedFileUrl, receiptUrl, receiptFilePath, verifyIsRealImage } from "./lib/upload";
import { streamVolunteerCertificate } from "./lib/certificate";
import {
  signupSchema,
  verifyOtpSchema,
  resendOtpSchema,
  loginSchema,
  volunteerApplySchema,
  updateVolunteerSchema,
  insertCaseSchema,
  updateCaseSchema,
  insertDonationSchema,
  insertRecurringDonationSchema,
  rejectWithReasonSchema,
  updateGalleryEventSchema,
  assignVolunteersSchema,
  changePasswordSchema,
  requestNameChangeSchema,
  banUserSchema,
  hideCaseSchema,
  updateTaglineSchema,
  toPublicUser,
} from "@shared/schema";

const RESEND_COOLDOWN_MS = 45_000;
const lastResendAt = new Map<string, number>();

// Brute-force protection on auth endpoints. Keyed by IP; a legitimate user
// mistyping their password a few times will never hit this, but scripted
// credential-stuffing attempts get locked out.
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many login attempts. Please wait a few minutes and try again." },
});

const passwordResetLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many requests. Please wait a few minutes and try again." },
});

const signupLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many signup attempts from this network. Please try again later." },
});

export function registerRoutes(app: Express) {
  // ─── Auth ─────────────────────────────────────────────────────────────

  app.post("/api/auth/signup", signupLimiter, async (req, res) => {
    const parsed = signupSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: parsed.error.errors[0]?.message ?? "Invalid input" });
    }
    const { name, email, password } = parsed.data;

    if (await storage.isEmailBanned(email)) {
      return res.status(403).json({ message: "This email address is not permitted to create an account. If you believe this is a mistake, please contact us." });
    }

    const existing = await storage.getUserByEmail(email);
    if (existing) {
      return res.status(409).json({ message: "An account with this email already exists" });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    await storage.createUser({ name, email, passwordHash });

    const code = generateOtpCode();
    await storage.createOtp({ email, codeHash: hashOtpCode(code), purpose: "signup", expiresAt: otpExpiresAt() });
    await sendOtpEmail(email, code, "signup");

    res.status(201).json({ message: "Account created. Check your email for a verification code." });
  });

  app.post("/api/auth/verify-otp", async (req, res) => {
    const parsed = verifyOtpSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Invalid input" });
    const { email, code, purpose } = parsed.data;

    const otp = await storage.getLatestOtp(email, purpose);
    if (!otp) return res.status(400).json({ message: "No pending verification for this email" });
    if (isOtpExpired(otp.expiresAt)) return res.status(400).json({ message: "Code expired. Request a new one." });
    if (otp.attempts >= MAX_ATTEMPTS) return res.status(429).json({ message: "Too many attempts. Request a new code." });
    if (otp.codeHash !== hashOtpCode(code)) {
      await storage.incrementOtpAttempts(otp.id);
      return res.status(400).json({ message: "Incorrect code" });
    }

    if (await storage.isEmailBanned(email)) {
      return res.status(403).json({ message: "This account has been suspended by the platform. If you believe this is a mistake, please contact us." });
    }

    await storage.consumeOtp(otp.id);
    await storage.markUserVerified(email);

    const user = await storage.getUserByEmail(email);
    if (!user) return res.status(500).json({ message: "Something went wrong" });

    req.session.userId = user.id;
    res.json({ user: toPublicUser(user) });
  });

  app.post("/api/auth/resend-otp", async (req, res) => {
    const parsed = resendOtpSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Invalid input" });
    const { email, purpose } = parsed.data;

    const last = lastResendAt.get(email) ?? 0;
    if (Date.now() - last < RESEND_COOLDOWN_MS) {
      return res.status(429).json({ message: "Please wait before requesting another code" });
    }
    lastResendAt.set(email, Date.now());

    const code = generateOtpCode();
    await storage.createOtp({ email, codeHash: hashOtpCode(code), purpose, expiresAt: otpExpiresAt() });
    await sendOtpEmail(email, code, purpose);

    res.json({ message: "A new code has been sent" });
  });

  app.post("/api/auth/login", loginLimiter, async (req, res) => {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Invalid input" });
    const { email, password } = parsed.data;

    const user = await storage.getUserByEmail(email);
    if (!user) return res.status(401).json({ message: "Incorrect email or password" });

    if (user.isBanned) {
      return res.status(403).json({ message: "This account has been suspended by the platform. If you believe this is a mistake, please contact us." });
    }

    const validPassword = await bcrypt.compare(password, user.passwordHash);
    if (!validPassword) return res.status(401).json({ message: "Incorrect email or password" });

    if (!user.isVerified) {
      const code = generateOtpCode();
      await storage.createOtp({ email, codeHash: hashOtpCode(code), purpose: "signup", expiresAt: otpExpiresAt() });
      await sendOtpEmail(email, code, "signup");
      return res.status(403).json({ message: "Please verify your email first. A new code has been sent.", needsVerification: true });
    }

    req.session.userId = user.id;
    res.json({ user: toPublicUser(user) });
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy(() => res.json({ message: "Logged out" }));
  });

  app.post("/api/auth/google", loginLimiter, async (req, res) => {
    const { credential } = req.body;
    if (!credential || typeof credential !== "string") {
      return res.status(400).json({ message: "Missing Google credential" });
    }
    if (!process.env.GOOGLE_CLIENT_ID) {
      console.error("GOOGLE_CLIENT_ID is not set — Google Sign-In cannot verify tokens.");
      return res.status(500).json({ message: "Google Sign-In isn't configured on this server yet." });
    }

    let payload;
    try {
      const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
      const ticket = await client.verifyIdToken({ idToken: credential, audience: process.env.GOOGLE_CLIENT_ID });
      payload = ticket.getPayload();
    } catch {
      return res.status(401).json({ message: "Invalid Google sign-in. Please try again." });
    }

    if (!payload?.email) {
      return res.status(401).json({ message: "Invalid Google sign-in. Please try again." });
    }
    const email = payload.email;
    const name = payload.name || email.split("@")[0];

    if (await storage.isEmailBanned(email)) {
      return res.status(403).json({ message: "This email address is not permitted to create an account. If you believe this is a mistake, please contact us." });
    }

    let user = await storage.getUserByEmail(email);
    if (!user) {
      // Google has already verified this email, so the account is created
      // pre-verified — no OTP step needed. The random password hash is a
      // placeholder the user can never guess; they can still set a real
      // password later via "Forgot password" if they want email+password login too.
      const randomPassword = crypto.randomBytes(32).toString("hex");
      const passwordHash = await bcrypt.hash(randomPassword, 10);
      await storage.createUser({ name, email, passwordHash });
      await storage.markUserVerified(email);
      user = await storage.getUserByEmail(email);
    } else if (user.isBanned) {
      return res.status(403).json({ message: "This account has been suspended by the platform. If you believe this is a mistake, please contact us." });
    } else if (!user.isVerified) {
      await storage.markUserVerified(email);
      user = await storage.getUserByEmail(email);
    }

    if (!user) return res.status(500).json({ message: "Something went wrong" });

    req.session.userId = user.id;
    res.json({ user: toPublicUser(user) });
  });

  app.post("/api/auth/forgot-password", passwordResetLimiter, async (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email is required" });
    const user = await storage.getUserByEmail(email);
    // Always respond success even if no account exists — don't leak which emails are registered.
    if (user && !user.isBanned) {
      const code = generateOtpCode();
      await storage.createOtp({ email, codeHash: hashOtpCode(code), purpose: "reset_password", expiresAt: otpExpiresAt() });
      await sendOtpEmail(email, code, "reset_password");
    }
    res.json({ message: "If an account exists for that email, a reset code has been sent." });
  });

  app.post("/api/auth/reset-password", passwordResetLimiter, async (req, res) => {
    const { email, code, newPassword } = req.body;
    if (!email || !code || !newPassword || newPassword.length < 8) {
      return res.status(400).json({ message: "Email, code, and a password of at least 8 characters are required" });
    }
    const otp = await storage.getLatestOtp(email, "reset_password");
    if (!otp) return res.status(400).json({ message: "No pending reset request for this email" });
    if (isOtpExpired(otp.expiresAt)) return res.status(400).json({ message: "Code expired. Request a new one." });
    if (otp.attempts >= MAX_ATTEMPTS) return res.status(429).json({ message: "Too many attempts. Request a new code." });
    if (otp.codeHash !== hashOtpCode(code)) {
      await storage.incrementOtpAttempts(otp.id);
      return res.status(400).json({ message: "Incorrect code" });
    }
    await storage.consumeOtp(otp.id);

    const user = await storage.getUserByEmail(email);
    if (!user) return res.status(400).json({ message: "Account not found" });
    const passwordHash = await bcrypt.hash(newPassword, 10);
    await storage.updatePasswordHash(user.id, passwordHash);

    res.json({ message: "Password reset. You can now log in with your new password." });
  });

  app.get("/api/auth/me", async (req, res) => {
    if (!req.session.userId) return res.json({ user: null });
    const user = await storage.getUserById(req.session.userId);
    res.json({ user: user ? toPublicUser(user) : null });
  });

  // ─── Account ──────────────────────────────────────────────────────────

  app.post("/api/account/avatar", requireAuth, uploadImage.single("avatar"), verifyIsRealImage, async (req, res) => {
    if (!req.file) return res.status(400).json({ message: "No image uploaded" });
    const user = (req as any).user;
    const url = uploadedFileUrl(req.file.filename);
    await storage.updateAvatar(user.id, url);
    res.json({ avatarUrl: url });
  });

  app.post("/api/account/change-password", requireAuth, async (req, res) => {
    const parsed = changePasswordSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: parsed.error.errors[0]?.message ?? "Invalid input" });
    }
    const user = (req as any).user;
    const valid = await bcrypt.compare(parsed.data.currentPassword, user.passwordHash);
    if (!valid) return res.status(400).json({ message: "Current password is incorrect" });

    const newHash = await bcrypt.hash(parsed.data.newPassword, 10);
    await storage.updatePasswordHash(user.id, newHash);
    res.json({ message: "Password updated" });
  });

  app.post("/api/account/request-name-change", requireAuth, async (req, res) => {
    const parsed = requestNameChangeSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: "A new name is required" });
    }
    const user = (req as any).user;
    await storage.requestNameChange(user.id, parsed.data.newName);
    res.json({ message: "Name change request submitted for admin approval" });
  });

  app.get("/api/account/my-cases", requireAuth, async (req, res) => {
    const user = (req as any).user;
    res.json({ cases: await storage.listCasesBySubmitter(user.id) });
  });

  app.get("/api/account/assigned-cases", requireAuth, async (req, res) => {
    const user = (req as any).user;
    res.json({ cases: await storage.listCasesByAssignedVolunteer(user.id) });
  });

  app.get("/api/account/my-donations", requireAuth, async (req, res) => {
    const user = (req as any).user;
    const rows = await storage.listDonationsByUser(user.id);
    res.json({ donations: rows.map((r) => ({ ...r.donation, caseTitle: r.caseTitle })) });
  });

  app.get("/api/account/my-recurring-donations", requireAuth, async (req, res) => {
    const user = (req as any).user;
    const rows = await storage.listMyRecurringDonations(user.id);
    res.json({ pledges: rows.map((r) => ({ ...r.pledge, caseTitle: r.caseTitle })) });
  });

  app.post("/api/recurring-donations", requireAuth, async (req, res) => {
    const parsed = insertRecurringDonationSchema.safeParse({
      caseId: req.body.caseId,
      amount: Number(req.body.amount),
      method: req.body.method,
    });
    if (!parsed.success) {
      return res.status(400).json({ message: parsed.error.errors[0]?.message ?? "Invalid input" });
    }

    const c = await storage.getCaseById(parsed.data.caseId);
    if (!c || c.status !== "ongoing" || c.isHidden) {
      return res.status(400).json({ message: "This case isn't accepting donations right now" });
    }

    const user = (req as any).user;
    const existing = await storage.findActiveRecurringDonation(user.id, parsed.data.caseId);
    if (existing) {
      return res.status(409).json({ message: "You already have an active monthly pledge for this case" });
    }

    const pledge = await storage.createRecurringDonation(user.id, parsed.data);
    res.status(201).json({ pledge, message: "Your monthly pledge is set up. We'll email you a reminder each month." });
  });

  app.post("/api/recurring-donations/:id/pause", requireAuth, async (req, res) => {
    const user = (req as any).user;
    const updated = await storage.setRecurringDonationStatus(String(req.params.id), user.id, "paused");
    if (!updated) return res.status(404).json({ message: "Pledge not found" });
    res.json({ pledge: updated, message: "Pledge paused" });
  });

  app.post("/api/recurring-donations/:id/resume", requireAuth, async (req, res) => {
    const user = (req as any).user;
    const updated = await storage.setRecurringDonationStatus(String(req.params.id), user.id, "active");
    if (!updated) return res.status(404).json({ message: "Pledge not found" });
    res.json({ pledge: updated, message: "Pledge resumed" });
  });

  app.post("/api/recurring-donations/:id/cancel", requireAuth, async (req, res) => {
    const user = (req as any).user;
    const updated = await storage.setRecurringDonationStatus(String(req.params.id), user.id, "cancelled");
    if (!updated) return res.status(404).json({ message: "Pledge not found" });
    res.json({ pledge: updated, message: "Pledge cancelled" });
  });

  app.get("/api/account/certificate", requireAuth, async (req, res) => {
    const user = (req as any).user;
    if (user.volunteerStatus !== "approved" || !user.badgeId) {
      return res.status(403).json({ message: "Only approved volunteers can download a Volunteer Service Certificate" });
    }
    if (user.totalHoursContributed < 30) {
      return res.status(403).json({
        message: `Certificates unlock at 30 verified volunteer hours. You're at ${user.totalHoursContributed}, keep going!`,
      });
    }
    const topProjects = await storage.getTopCaseTitlesForVolunteer(user.id, 5);
    streamVolunteerCertificate(res, {
      name: user.name,
      badgeId: user.badgeId,
      hours: user.totalHoursContributed,
      casesCompleted: user.totalCasesCompleted,
      joinedDate: user.createdAt,
      topProjects,
      issuedDate: new Date(),
    });
  });

  app.patch("/api/account/phone", requireAuth, async (req, res) => {
    const { phone } = req.body;
    if (!phone || String(phone).length < 7) {
      return res.status(400).json({ message: "A valid phone number is required" });
    }
    const user = (req as any).user;
    await storage.updatePhone(user.id, phone);
    res.json({ message: "Phone number updated" });
  });

  // ─── Public badge verification ─────────────────────────────────────────

  app.get("/api/verify/:badgeId", async (req, res) => {
    const list = await storage.listApprovedVolunteers();
    const v = list.find((u) => u.badgeId === req.params.badgeId);
    if (!v) return res.status(404).json({ message: "No volunteer found with that Badge ID" });
    res.json({
      name: v.name,
      badgeId: v.badgeId,
      city: v.city,
      hours: v.totalHoursContributed,
      casesCompleted: v.totalCasesCompleted,
      joined: v.createdAt,
      servedUntil: v.volunteerServedUntil,
      topProjects: await storage.getTopCaseTitlesForVolunteer(v.id, 5),
    });
  });

  // ─── Volunteer application ───────────────────────────────────────────

  app.get("/api/volunteers", async (_req, res) => {
    const list = await storage.listApprovedVolunteers();
    const publicList = await Promise.all(
      list.map(async (v) => ({
        badgeId: v.badgeId,
        name: v.name,
        city: v.city,
        avatarUrl: v.avatarUrl,
        motto: v.volunteerMotto,
        category: v.volunteerCategory,
        hours: v.totalHoursContributed,
        casesCompleted: v.totalCasesCompleted,
        projects: await storage.getTopCaseTitlesForVolunteer(v.id),
        joined: v.createdAt,
        servedUntil: v.volunteerServedUntil,
      })),
    );
    res.json({ volunteers: publicList });
  });

  app.post("/api/volunteers/apply", requireAuth, async (req, res) => {
    const parsed = volunteerApplySchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: parsed.error.errors[0]?.message ?? "Invalid input" });
    }
    const user = (req as any).user;
    await storage.applyToVolunteer(user.id, parsed.data);
    res.status(201).json({ message: "Application submitted for admin review" });
  });

  // ─── Cases ────────────────────────────────────────────────────────────

  app.post("/api/cases", requireAuth, uploadImage.array("images", 5), verifyIsRealImage, async (req, res) => {
    const user = (req as any).user;

    if (user.role !== "admin") {
      const submittedToday = await storage.countCasesSubmittedToday(user.id);
      if (submittedToday >= 2) {
        const resetAt = new Date();
        resetAt.setHours(24, 0, 0, 0);
        const hoursLeft = Math.ceil((resetAt.getTime() - Date.now()) / (60 * 60 * 1000));
        return res.status(429).json({
          message: `You've reached today's limit of 2 case submissions (${submittedToday}/2). This resets at midnight, about ${hoursLeft} hour(s) from now.`,
          limit: 2,
          used: submittedToday,
          resetsInHours: hoursLeft,
        });
      }
    }

    const parsed = insertCaseSchema.safeParse({
      title: req.body.title,
      description: req.body.description,
      city: req.body.city,
      province: req.body.province,
      contactPhone: req.body.contactPhone,
      amountNeeded: Number(req.body.amountNeeded),
      category: req.body.category || undefined,
    });
    if (!parsed.success) {
      return res.status(400).json({ message: parsed.error.errors[0]?.message ?? "Invalid input" });
    }
    const files = (req.files as Express.Multer.File[]) || [];
    const images = files.map((f) => uploadedFileUrl(f.filename));
    const created = await storage.createCase(user.id, { ...parsed.data, images });
    res.status(201).json({ case: created });
  });

  app.get("/api/cases/my-daily-limit", requireAuth, async (req, res) => {
    const user = (req as any).user;
    const used = await storage.countCasesSubmittedToday(user.id);
    const resetAt = new Date();
    resetAt.setHours(24, 0, 0, 0);
    const hoursLeft = Math.ceil((resetAt.getTime() - Date.now()) / (60 * 60 * 1000));
    if (user.role === "admin") {
      return res.json({ used, limit: null, unlimited: true, resetsInHours: hoursLeft });
    }
    res.json({ used, limit: 2, resetsInHours: hoursLeft });
  });

  app.get("/api/cases", async (req, res) => {
    const status = (req.query.status as string) || "ongoing";
    const list = await storage.listCasesByStatus(status as any);
    const donorCounts = await storage.countDonorsForCases(list.map((c) => c.id));
    res.json({ cases: list.map((c) => ({ ...c, donorCount: donorCounts[c.id] ?? 0 })) });
  });

  app.get("/api/cases/:id", async (req, res) => {
    const c = await storage.getCaseById(String(req.params.id));
    if (!c) return res.status(404).json({ message: "Case not found" });

    const requester = req.session.userId ? await storage.getUserById(req.session.userId) : undefined;
    if (c.isHidden && requester?.role !== "admin") {
      return res.status(404).json({ message: "Case not found" });
    }

    let isAssigned = false;
    let pendingRequestType: "assignment" | "removal" | null = null;

    if (req.session.userId) {
      isAssigned = await storage.isVolunteerOnCase(c.id, req.session.userId);
      const pending = await storage.getMyPendingCaseRequest(c.id, req.session.userId);
      pendingRequestType = pending?.type ?? null;
    }

    const donorCount = await storage.countDonorsForCase(c.id);
    const volunteers = await storage.getCaseVolunteers(c.id);
    const submitter = await storage.getUserById(c.submittedById);
    const submittedBy = submitter
      ? { name: submitter.role === "admin" ? "Aik Kadam" : submitter.name, isAdmin: submitter.role === "admin" }
      : { name: "Aik Kadam", isAdmin: true };

    res.json({
      case: { ...c, donorCount, volunteerCount: volunteers.length, submittedBy },
      isAssigned,
      pendingRequestType,
    });
  });

  app.post("/api/cases/:id/request-join", requireAuth, async (req, res) => {
    const user = (req as any).user;
    if (user.volunteerStatus !== "approved") {
      return res.status(403).json({ message: "Only approved volunteers can request to join a case" });
    }
    const caseId = String(req.params.id);
    const targetCase = await storage.getCaseById(caseId);
    if (!targetCase || targetCase.status !== "ongoing") {
      return res.status(400).json({ message: "This case is no longer accepting volunteer requests" });
    }
    const alreadyOn = await storage.isVolunteerOnCase(caseId, user.id);
    if (alreadyOn) return res.status(400).json({ message: "You're already assigned to this case" });
    const existing = await storage.getMyPendingCaseRequest(caseId, user.id);
    if (existing) return res.status(400).json({ message: "You already have a pending request for this case" });

    await storage.createCaseVolunteerRequest(caseId, user.id, "assignment");
    res.status(201).json({ message: "Request sent to admin for review" });
  });

  app.post("/api/cases/:id/request-withdraw", requireAuth, async (req, res) => {
    const user = (req as any).user;
    const caseId = String(req.params.id);
    const targetCase = await storage.getCaseById(caseId);
    if (!targetCase || targetCase.status !== "ongoing") {
      return res.status(400).json({ message: "This case is no longer accepting volunteer requests" });
    }
    const alreadyOn = await storage.isVolunteerOnCase(caseId, user.id);
    if (!alreadyOn) return res.status(400).json({ message: "You're not currently assigned to this case" });
    const existing = await storage.getMyPendingCaseRequest(caseId, user.id);
    if (existing) return res.status(400).json({ message: "You already have a pending request for this case" });

    const { reason } = req.body;
    await storage.createCaseVolunteerRequest(caseId, user.id, "removal", reason || undefined);
    res.status(201).json({ message: "Request sent to admin for review" });
  });

  // ─── Donations (manual-confirm) ──────────────────────────────────────

  app.post("/api/donations", requireAuth, uploadReceipt.single("receipt"), verifyIsRealImage, async (req, res) => {
    const parsed = insertDonationSchema.safeParse({
      caseId: req.body.caseId,
      amount: Number(req.body.amount),
      method: req.body.method,
      senderAccount: req.body.senderAccount,
      referenceNote: req.body.referenceNote || undefined,
      recurringDonationId: req.body.recurringDonationId || undefined,
    });
    if (!parsed.success) {
      return res.status(400).json({ message: parsed.error.errors[0]?.message ?? "Invalid input" });
    }
    if (!req.file) {
      return res.status(400).json({ message: "A receipt/screenshot of the payment is required" });
    }

    const user = (req as any).user;
    const recentPendingCount = await storage.countRecentPendingDonations(user.id, 24);
    if (recentPendingCount >= 3) {
      return res.status(429).json({ message: "You've submitted several pending donations recently. Please wait for those to be confirmed before submitting more." });
    }

    // Never trust the client's claim that a payment belongs to a given pledge —
    // confirm that pledge actually belongs to this user first.
    let recurringDonationId: string | undefined;
    if (parsed.data.recurringDonationId) {
      const pledge = await storage.getRecurringDonationById(parsed.data.recurringDonationId);
      if (pledge && pledge.userId === user.id) {
        recurringDonationId = pledge.id;
      }
    } else {
      // No pledge was explicitly attached (e.g. they forgot to re-check
      // "Monthly" this time) — if they already have an active pledge for
      // this same case, count this payment toward it automatically.
      const activePledge = await storage.findActiveRecurringDonation(user.id, parsed.data.caseId);
      if (activePledge) recurringDonationId = activePledge.id;
    }

    const donation = await storage.createDonation(user.id, {
      ...parsed.data,
      recurringDonationId,
      receiptImage: receiptUrl(req.file.filename),
    });
    res.status(201).json({ donation, message: "Thanks! An admin will confirm your donation once payment is verified." });
  });

  // Donation receipts are private — only the donor who submitted this one,
  // or an admin, may view it. The file itself lives outside the publicly
  // static-served uploads/ directory (see lib/upload.ts), so this route is
  // the only path to it.
  app.get("/api/receipts/:filename", requireAuth, async (req, res) => {
    const user = (req as any).user;
    const filename = String(req.params.filename);
    const donation = await storage.getDonationByReceiptFilename(filename);
    if (!donation) return res.status(404).json({ message: "Not found" });
    if (donation.userId !== user.id && user.role !== "admin") {
      return res.status(403).json({ message: "Not authorized to view this receipt" });
    }
    res.sendFile(receiptFilePath(filename), (err) => {
      if (err && !res.headersSent) res.status(404).json({ message: "Not found" });
    });
  });

  // ─── Contact form ─────────────────────────────────────────────────────

  app.post("/api/contact", async (req, res) => {
    const { name, email, message } = req.body;
    if (!name || !email || !message) {
      return res.status(400).json({ message: "Name, email, and message are required" });
    }
    const escapeHtml = (v: string) => String(v).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
    const contactEmail = process.env.CONTACT_EMAIL || "help@aikkadam.org";
    await sendNotificationEmail(
      contactEmail,
      `New contact form message from ${name}`,
      `<strong>From:</strong> ${escapeHtml(name)} (${escapeHtml(email)})<br/><br/>${escapeHtml(message).replace(/\n/g, "<br/>")}`,
    );
    res.json({ message: "Message sent" });
  });

  // ─── Public gallery & success stories ────────────────────────────────

  app.get("/api/gallery", async (_req, res) => {
    res.json({ events: await storage.listGalleryEvents() });
  });

  app.get("/api/gallery/:id", async (req, res) => {
    const event = await storage.getGalleryEventById(String(req.params.id));
    if (!event) return res.status(404).json({ message: "Project not found" });

    let sourceCase:
      | {
          amountNeeded: number;
          amountCollected: number;
          createdAt: Date;
          approvedAt: Date | null;
          completedAt: Date | null;
          donorCount: number;
          volunteerCount: number;
          submittedBy: { name: string; isAdmin: boolean };
        }
      | null = null;
    if (event.sourceCaseId) {
      const c = await storage.getCaseById(event.sourceCaseId);
      if (c && !c.isHidden) {
        const [donorCount, volunteers, submitter] = await Promise.all([
          storage.countDonorsForCase(c.id),
          storage.getCaseVolunteers(c.id),
          storage.getUserById(c.submittedById),
        ]);
        sourceCase = {
          amountNeeded: c.amountNeeded,
          amountCollected: c.amountCollected,
          createdAt: c.createdAt,
          approvedAt: c.approvedAt,
          completedAt: c.completedAt,
          donorCount,
          volunteerCount: volunteers.length,
          submittedBy: submitter
            ? { name: submitter.role === "admin" ? "Aik Kadam" : submitter.name, isAdmin: submitter.role === "admin" }
            : { name: "Aik Kadam", isAdmin: true },
        };
      }
    }

    res.json({ event, sourceCase });
  });

  app.get("/api/success-stories", async (_req, res) => {
    res.json({ stories: await storage.listSuccessStories() });
  });

  // ─── Admin ────────────────────────────────────────────────────────────

  app.get("/api/admin/stats", requireAuth, requireRole("admin"), async (_req, res) => {
    res.json(await storage.getAdminStats());
  });

  app.get("/api/admin/volunteers/export", requireAuth, requireRole("admin"), async (req, res) => {
    const status = (req.query.status as string) || "all";
    const from = req.query.from as string | undefined;
    const to = req.query.to as string | undefined;
    const list = await storage.listVolunteersForExport(status as any, { from, to });

    const header = ["Name", "Email", "Phone", "City", "Category", "Status", "Badge ID", "Hours", "Cases Completed", "Motto", "Served Until", "Applied On"];
    const escapeCsv = (v: string) => `"${(v ?? "").replace(/"/g, '""')}"`;
    const lines = [
      header.join(","),
      ...list.map((v) =>
        [
          v.name,
          v.email,
          v.volunteerPhone || "",
          v.city || "",
          v.volunteerCategory || "",
          v.volunteerStatus,
          v.badgeId || "",
          String(v.totalHoursContributed),
          String(v.totalCasesCompleted),
          v.volunteerMotto || "",
          v.volunteerServedUntil || "",
          new Date(v.createdAt).toISOString(),
        ]
          .map(escapeCsv)
          .join(","),
      ),
    ];

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="volunteers-${status}-${Date.now()}.csv"`);
    res.send(lines.join("\n"));
  });

  app.get("/api/admin/cases/export", requireAuth, requireRole("admin"), async (req, res) => {
    const status = (req.query.status as string) || "all";
    const from = req.query.from as string | undefined;
    const to = req.query.to as string | undefined;
    const list = await storage.listCasesForExport(status as any, { from, to });

    const header = ["Title", "Location", "Category", "Status", "Amount Needed", "Amount Collected", "Submitted On", "Completed On", "Rejection Reason"];
    const escapeCsv = (v: string) => `"${(v ?? "").replace(/"/g, '""')}"`;
    const lines = [
      header.join(","),
      ...list.map((c) =>
        [
          c.title,
          c.location,
          c.category || "",
          c.status,
          String(c.amountNeeded),
          String(c.amountCollected),
          new Date(c.createdAt).toISOString(),
          c.completedAt ? new Date(c.completedAt).toISOString() : "",
          c.rejectionReason || "",
        ]
          .map(escapeCsv)
          .join(","),
      ),
    ];

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="cases-${status}-${Date.now()}.csv"`);
    res.send(lines.join("\n"));
  });

  app.get("/api/admin/volunteers/pending", requireAuth, requireRole("admin"), async (_req, res) => {
    const pending = await storage.listVolunteerApplications("pending");
    res.json({ volunteers: pending.map(toPublicUser) });
  });

  app.get("/api/admin/volunteers/approved", requireAuth, requireRole("admin"), async (_req, res) => {
    res.json({ volunteers: await storage.listApprovedVolunteersBrief() });
  });

  app.post("/api/admin/volunteers/:id/approve", requireAuth, requireRole("admin"), async (req, res) => {
    const badgeId = `HH-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const volunteer = await storage.approveVolunteer(String(req.params.id), badgeId);
    await sendNotificationEmail(
      volunteer.email,
      "You're an approved Aik Kadam volunteer!",
      `Congratulations, ${volunteer.name}, your volunteer application has been approved. Your badge ID is <strong>${badgeId}</strong>. You can see your profile and track your hours at any time from your account page.`,
    );
    res.json({ message: "Volunteer approved", badgeId });
  });

  app.post("/api/admin/volunteers/:id/reject", requireAuth, requireRole("admin"), async (req, res) => {
    const parsed = rejectWithReasonSchema.safeParse(req.body);
    const reason = parsed.success ? parsed.data.reason : undefined;
    const volunteer = await storage.rejectVolunteer(String(req.params.id), reason);
    await sendNotificationEmail(
      volunteer.email,
      "Update on your Aik Kadam volunteer application",
      `Hi ${volunteer.name}, your volunteer application wasn't approved this time.${reason ? ` Reason: ${reason}` : ""} You're welcome to apply again in the future.`,
    );
    res.json({ message: "Volunteer application rejected" });
  });

  app.patch("/api/admin/volunteers/:id", requireAuth, requireRole("admin"), async (req, res) => {
    const parsed = updateVolunteerSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: parsed.error.errors[0]?.message ?? "Invalid input" });
    }
    const updated = await storage.updateVolunteerAdmin(String(req.params.id), parsed.data);
    res.json({ user: toPublicUser(updated) });
  });

  app.get("/api/admin/cases/pending", requireAuth, requireRole("admin"), async (req, res) => {
    const from = req.query.from as string | undefined;
    const to = req.query.to as string | undefined;
    const list = await storage.listCasesByStatus("pending_review", { from, to });
    const cases = await Promise.all(
      list.map(async (c) => {
        const submitter = await storage.getUserById(c.submittedById);
        return { ...c, submitterName: submitter?.name, submitterEmail: submitter?.email };
      }),
    );
    res.json({ cases });
  });

  app.post("/api/admin/cases/:id/approve", requireAuth, requireRole("admin"), async (req, res) => {
    const updated = await storage.approveCase(String(req.params.id));
    const submitter = await storage.getUserById(updated.submittedById);
    if (submitter) {
      await sendNotificationEmail(
        submitter.email,
        "Your case was approved",
        `Good news, ${submitter.name}, your case "${updated.title}" has been verified and is now live for donations.`,
      );
    }
    res.json({ message: "Case approved and now live" });
  });

  app.post("/api/admin/cases/:id/reject", requireAuth, requireRole("admin"), async (req, res) => {
    const parsed = rejectWithReasonSchema.safeParse(req.body);
    const reason = parsed.success ? parsed.data.reason : undefined;
    const updated = await storage.rejectCase(String(req.params.id), reason);
    const submitter = await storage.getUserById(updated.submittedById);
    if (submitter) {
      await sendNotificationEmail(
        submitter.email,
        "Update on your submitted case",
        `Hi ${submitter.name}, your case "${updated.title}" wasn't approved.${reason ? ` Reason: ${reason}` : ""} You're welcome to submit a revised case.`,
      );
    }
    res.json({ message: "Case rejected" });
  });

  app.get("/api/admin/cases/:id/volunteers", requireAuth, requireRole("admin"), async (req, res) => {
    res.json({ volunteers: await storage.getCaseVolunteers(String(req.params.id)) });
  });

  app.post("/api/admin/cases/:id/assign-volunteers", requireAuth, requireRole("admin"), async (req, res) => {
    const parsed = assignVolunteersSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: "Invalid input" });
    }
    const caseId = String(req.params.id);
    const c = await storage.getCaseById(caseId);
    await storage.setCaseVolunteers(caseId, parsed.data.volunteerIds);

    for (const volunteerId of parsed.data.volunteerIds) {
      const volunteer = await storage.getUserById(volunteerId);
      if (volunteer && c) {
        await sendNotificationEmail(
          volunteer.email,
          "You've been assigned a new case",
          `Hi ${volunteer.name}, you've been assigned to "${c.title}" in ${c.location}. Check your account page for details.`,
        );
      }
    }
    res.json({ message: "Volunteers assigned" });
  });

  app.post("/api/admin/cases/:id/update-collected", requireAuth, requireRole("admin"), async (req, res) => {
    const { amount } = req.body;
    await storage.updateCollectedAmount(String(req.params.id), Number(amount));
    res.json({ message: "Collected amount updated" });
  });

  app.patch("/api/admin/cases/:id", requireAuth, requireRole("admin"), uploadImage.array("images", 5), verifyIsRealImage, async (req, res) => {
    const parsed = updateCaseSchema.safeParse({
      title: req.body.title || undefined,
      description: req.body.description || undefined,
      city: req.body.city || undefined,
      province: req.body.province || undefined,
      contactPhone: req.body.contactPhone || undefined,
      amountNeeded: req.body.amountNeeded ? Number(req.body.amountNeeded) : undefined,
      category: req.body.category || undefined,
    });
    if (!parsed.success) {
      return res.status(400).json({ message: parsed.error.errors[0]?.message ?? "Invalid input" });
    }
    const files = (req.files as Express.Multer.File[]) || [];
    const images = files.length ? files.map((f) => uploadedFileUrl(f.filename)) : undefined;
    const updated = await storage.updateCaseAdmin(String(req.params.id), {
      ...parsed.data,
      ...(images ? { images, imageUrl: images[0] } : {}),
    });
    res.json({ case: updated });
  });

  app.post("/api/admin/cases/:id/complete", requireAuth, requireRole("admin"), async (req, res) => {
    const { hoursContributed } = req.body;
    const completed = await storage.completeCase(String(req.params.id), Number(hoursContributed) || 0);
    res.json({ message: "Case marked complete", case: completed });
  });

  app.get("/api/admin/cases/rejected", requireAuth, requireRole("admin"), async (req, res) => {
    const from = req.query.from as string | undefined;
    const to = req.query.to as string | undefined;
    res.json({ cases: await storage.listCasesByStatus("rejected", { from, to }) });
  });

  app.post("/api/admin/cases/:id/restore", requireAuth, requireRole("admin"), async (req, res) => {
    const updated = await storage.restoreCase(String(req.params.id));
    res.json({ message: "Case moved back to Pending Cases", case: updated });
  });

  // ─── Site settings (homepage tagline banner) ─────────────────────────────

  app.get("/api/site-settings", async (_req, res) => {
    res.json(await storage.getSiteSettings());
  });

  app.post("/api/admin/site-settings", requireAuth, requireRole("admin"), async (req, res) => {
    const parsed = updateTaglineSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: parsed.error.errors[0]?.message ?? "Invalid input" });
    await storage.updateTagline(parsed.data.tagline ?? "", parsed.data.taglineCaseId ?? null);
    res.json({ message: "Tagline updated" });
  });

  app.get("/api/admin/cases/hidden", requireAuth, requireRole("admin"), async (req, res) => {
    const search = req.query.search as string | undefined;
    const from = req.query.from as string | undefined;
    const to = req.query.to as string | undefined;
    res.json({ cases: await storage.listHiddenCases(search, { from, to }) });
  });

  app.post("/api/admin/cases/:id/hide", requireAuth, requireRole("admin"), async (req, res) => {
    const parsed = hideCaseSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: parsed.error.errors[0]?.message ?? "A reason is required" });
    const updated = await storage.hideCase(String(req.params.id), parsed.data.reason);
    res.json({ message: "Case hidden", case: updated });
  });

  app.post("/api/admin/cases/:id/unhide", requireAuth, requireRole("admin"), async (req, res) => {
    const updated = await storage.unhideCase(String(req.params.id));
    res.json({ message: "Case unhidden", case: updated });
  });

  // ─── Admin: Donations ─────────────────────────────────────────────────

  app.get("/api/admin/donations", requireAuth, requireRole("admin"), async (req, res) => {
    await storage.expireStalePendingDonations(7);
    const recurringDonationId = req.query.recurringDonationId as string | undefined;
    const status = (req.query.status as string) || (recurringDonationId ? "all" : "pending");
    const search = (req.query.search as string) || "";
    const from = req.query.from as string | undefined;
    const to = req.query.to as string | undefined;
    const rows = await storage.listDonationsFiltered({ status: status as any, search, from, to, recurringDonationId });
    res.json({ donations: rows.map((r) => ({ ...r.donation, caseTitle: r.caseTitle, donorName: r.donorName, donorEmail: r.donorEmail })) });
  });

  app.delete("/api/admin/donations/:id", requireAuth, requireRole("admin"), async (req, res) => {
    await storage.deleteDonation(String(req.params.id));
    res.json({ message: "Donation record deleted" });
  });

  app.get("/api/admin/donations/export", requireAuth, requireRole("admin"), async (req, res) => {
    const status = (req.query.status as string) || "all";
    const search = (req.query.search as string) || "";
    const from = req.query.from as string | undefined;
    const to = req.query.to as string | undefined;
    const rows = await storage.listDonationsFiltered({ status: status as any, search, from, to });

    const header = ["Date", "Donor Name", "Donor Email", "Case", "Amount (PKR)", "Method", "Sender Account", "Status", "Reference", "Rejection Reason"];
    const escapeCsv = (v: string) => `"${(v ?? "").replace(/"/g, '""')}"`;
    const lines = [
      header.join(","),
      ...rows.map((r) =>
        [
          new Date(r.donation.createdAt).toISOString(),
          r.donorName,
          r.donorEmail,
          r.caseTitle,
          String(r.donation.amount),
          r.donation.method,
          r.donation.senderAccount,
          r.donation.status,
          r.donation.referenceNote || "",
          r.donation.rejectionReason || "",
        ]
          .map(escapeCsv)
          .join(","),
      ),
    ];

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="donations-${status}-${Date.now()}.csv"`);
    res.send(lines.join("\n"));
  });

  app.post("/api/admin/donations/:id/confirm", requireAuth, requireRole("admin"), async (req, res) => {
    const donation = await storage.confirmDonation(String(req.params.id));
    const donor = await storage.getUserById(donation.userId);
    const c = await storage.getCaseById(donation.caseId);
    if (donor && c) {
      await sendNotificationEmail(
        donor.email,
        "Your donation was confirmed",
        `Thank you, ${donor.name}! Your donation of PKR ${donation.amount.toLocaleString()} to "${c.title}" has been confirmed. You can see it reflected in your donation history any time.`,
      );
    }
    res.json({ message: "Donation confirmed", donation });
  });

  app.post("/api/admin/donations/:id/reject", requireAuth, requireRole("admin"), async (req, res) => {
    const parsed = rejectWithReasonSchema.safeParse(req.body);
    const reason = parsed.success ? parsed.data.reason : undefined;
    const donation = await storage.rejectDonation(String(req.params.id), reason);
    const donor = await storage.getUserById(donation.userId);
    if (donor) {
      await sendNotificationEmail(
        donor.email,
        "Update on your donation",
        `Hi ${donor.name}, we couldn't confirm your recent donation.${reason ? ` Reason: ${reason}` : ""} Please contact us if you believe this is a mistake.`,
      );
    }
    res.json({ message: "Donation rejected" });
  });

  app.post("/api/admin/donations/:id/revert", requireAuth, requireRole("admin"), async (req, res) => {
    const donation = await storage.revertDonationToPending(String(req.params.id));
    res.json({ message: "Donation moved back to pending for re-review", donation });
  });

  // ─── Admin: Recurring donations ────────────────────────────────────────

  app.get("/api/admin/recurring-donations", requireAuth, requireRole("admin"), async (_req, res) => {
    const rows = await storage.listAllRecurringDonations();
    res.json({ pledges: rows.map((r) => ({ ...r.pledge, caseTitle: r.caseTitle, donorName: r.donorName, donorEmail: r.donorEmail })) });
  });

  app.post("/api/admin/recurring-donations/:id/cancel", requireAuth, requireRole("admin"), async (req, res) => {
    const pledge = await storage.getRecurringDonationById(String(req.params.id));
    if (!pledge) return res.status(404).json({ message: "Pledge not found" });
    const updated = await storage.setRecurringDonationStatus(pledge.id, pledge.userId, "cancelled");
    res.json({ message: "Pledge cancelled", pledge: updated });
  });

  // Sends the monthly "your pledge is due" reminder email for every pledge
  // that's reached its due date, then advances it to next month. No payment
  // is ever charged automatically — this only nudges the donor to go send
  // it manually and confirm it the same way a one-time donation works.
  //
  // Call this once a day from an external scheduler (e.g. a cron job or a
  // scheduled GitHub Action) that sends the CRON_SECRET header. Set
  // CRON_SECRET in the environment before relying on this in production —
  // if it's unset, the endpoint refuses every request.
  app.post("/api/cron/recurring-reminders", async (req, res) => {
    const cronSecret = process.env.CRON_SECRET;
    const providedSecret = req.header("x-cron-secret");
    if (!cronSecret || providedSecret !== cronSecret) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const due = await storage.listDueRecurringDonations();
    let sent = 0;
    for (const pledge of due) {
      const donor = await storage.getUserById(pledge.userId);
      const c = await storage.getCaseById(pledge.caseId);
      if (donor && c) {
        await sendNotificationEmail(
          donor.email,
          "Your monthly Aik Kadam pledge is due",
          `Hi ${donor.name}, this is your monthly reminder for your PKR ${pledge.amount.toLocaleString()} pledge to "${c.title}". Please send the payment using your usual method and confirm it on the Donate page, the same way you did last time. You can pause or cancel this pledge any time from My Donations.`,
        );
        sent++;
      }
      await storage.advanceRecurringDonation(pledge.id);
    }
    res.json({ message: `Sent ${sent} reminder(s)`, count: sent });
  });

  // ─── Admin: Gallery ───────────────────────────────────────────────────

  app.post(
    "/api/admin/gallery",
    requireAuth,
    requireRole("admin"),
    uploadImage.array("images", 5),
    verifyIsRealImage,
    async (req, res) => {
      const files = (req.files as Express.Multer.File[]) || [];
      if (files.length === 0) {
        return res.status(400).json({ message: "At least one image is required" });
      }
      const { title, description, location, eventDate, families, items, funds } = req.body;
      if (!title || !description || !location || !eventDate) {
        return res.status(400).json({ message: "Title, description, location, and date are required" });
      }
      const event = await storage.createGalleryEvent({
        title,
        description,
        location,
        eventDate,
        images: files.map((f) => uploadedFileUrl(f.filename)),
        families,
        items,
        funds,
      });
      res.status(201).json({ event });
    },
  );

  app.patch(
    "/api/admin/gallery/:id",
    requireAuth,
    requireRole("admin"),
    uploadImage.array("images", 5),
    verifyIsRealImage,
    async (req, res) => {
      const parsed = updateGalleryEventSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: parsed.error.errors[0]?.message ?? "Invalid input" });
      }
      const files = (req.files as Express.Multer.File[]) || [];
      const patch: Record<string, unknown> = { ...parsed.data };
      if (files.length > 0) {
        patch.images = files.map((f) => uploadedFileUrl(f.filename));
      }
      const updated = await storage.updateGalleryEvent(String(req.params.id), patch);
      res.json({ event: updated });
    },
  );

  app.delete("/api/admin/gallery/:id", requireAuth, requireRole("admin"), async (req, res) => {
    await storage.deleteGalleryEvent(String(req.params.id));
    res.json({ message: "Gallery event deleted" });
  });

  // ─── Admin: Success Stories ───────────────────────────────────────────

  app.post(
    "/api/admin/success-stories",
    requireAuth,
    requireRole("admin"),
    uploadImage.fields([
      { name: "before", maxCount: 1 },
      { name: "after", maxCount: 1 },
    ]),
    verifyIsRealImage,
    async (req, res) => {
      const files = req.files as { before?: Express.Multer.File[]; after?: Express.Multer.File[] };
      const before = files.before?.[0];
      const after = files.after?.[0];
      if (!before || !after) {
        return res.status(400).json({ message: "Both a before and after image are required" });
      }
      const { name, title, storyDate, quote } = req.body;
      if (!name || !title || !storyDate || !quote) {
        return res.status(400).json({ message: "Name, title, date, and quote are required" });
      }
      const story = await storage.createSuccessStory({
        name,
        title,
        storyDate,
        quote,
        beforeImage: uploadedFileUrl(before.filename),
        afterImage: uploadedFileUrl(after.filename),
      });
      res.status(201).json({ story });
    },
  );

  app.patch(
    "/api/admin/success-stories/:id",
    requireAuth,
    requireRole("admin"),
    uploadImage.fields([
      { name: "before", maxCount: 1 },
      { name: "after", maxCount: 1 },
    ]),
    verifyIsRealImage,
    async (req, res) => {
      const files = req.files as { before?: Express.Multer.File[]; after?: Express.Multer.File[] };
      const patch: Record<string, unknown> = {};
      if (req.body.name) patch.name = req.body.name;
      if (req.body.title) patch.title = req.body.title;
      if (req.body.storyDate) patch.storyDate = req.body.storyDate;
      if (req.body.quote) patch.quote = req.body.quote;
      if (files.before?.[0]) patch.beforeImage = uploadedFileUrl(files.before[0].filename);
      if (files.after?.[0]) patch.afterImage = uploadedFileUrl(files.after[0].filename);
      const updated = await storage.updateSuccessStory(String(req.params.id), patch);
      res.json({ story: updated });
    },
  );

  app.delete("/api/admin/success-stories/:id", requireAuth, requireRole("admin"), async (req, res) => {
    await storage.deleteSuccessStory(String(req.params.id));
    res.json({ message: "Success story deleted" });
  });

  // ─── Admin: Cases (delete) ────────────────────────────────────────────

  app.delete("/api/admin/cases/:id", requireAuth, requireRole("admin"), async (req, res) => {
    await storage.deleteCase(String(req.params.id));
    res.json({ message: "Case deleted" });
  });

  // ─── Admin: All users, bans ───────────────────────────────────────────

  app.get("/api/admin/users", requireAuth, requireRole("admin"), async (req, res) => {
    const search = req.query.search as string | undefined;
    const list = await storage.listAllUsers(search);
    res.json({ users: list.map(toPublicUser) });
  });

  app.post("/api/admin/users/:id/ban", requireAuth, requireRole("admin"), async (req, res) => {
    const parsed = banUserSchema.safeParse(req.body);
    const reason = parsed.success ? parsed.data.reason : undefined;
    const user = await storage.getUserById(String(req.params.id));
    if (!user) return res.status(404).json({ message: "User not found" });
    await storage.banUserByEmail(user.email, reason);
    res.json({ message: "User banned" });
  });

  app.post("/api/admin/users/:id/unban", requireAuth, requireRole("admin"), async (req, res) => {
    await storage.unbanUser(String(req.params.id));
    res.json({ message: "User unbanned" });
  });

  app.delete("/api/admin/users/:id", requireAuth, requireRole("admin"), async (req, res) => {
    const result = await storage.deleteUser(String(req.params.id));
    if (!result.ok) return res.status(409).json({ message: result.reason });
    res.json({ message: "User deleted" });
  });

  // ─── Admin: Name change requests ──────────────────────────────────────

  app.get("/api/admin/name-change-requests", requireAuth, requireRole("admin"), async (_req, res) => {
    const list = await storage.listPendingNameChanges();
    res.json({ requests: list.map(toPublicUser) });
  });

  app.post("/api/admin/name-change-requests/:id/approve", requireAuth, requireRole("admin"), async (req, res) => {
    const updated = await storage.approveNameChange(String(req.params.id));
    await sendNotificationEmail(
      updated.email,
      "Your name has been updated",
      `Hi ${updated.name}, your name change request has been approved and your account now reflects it. If this wasn't you, please contact us right away.`,
    );
    res.json({ message: "Name updated", user: toPublicUser(updated) });
  });

  app.post("/api/admin/name-change-requests/:id/reject", requireAuth, requireRole("admin"), async (req, res) => {
    await storage.rejectNameChange(String(req.params.id));
    res.json({ message: "Name change request rejected" });
  });

  // ─── Admin: Case volunteer requests (join / withdraw) ─────────────────

  app.get("/api/admin/case-volunteer-requests", requireAuth, requireRole("admin"), async (_req, res) => {
    const rows = await storage.listPendingCaseVolunteerRequests();
    res.json({
      requests: rows.map((r) => ({
        id: r.request.id,
        type: r.request.type,
        reason: r.request.reason,
        createdAt: r.request.createdAt,
        caseId: r.request.caseId,
        caseTitle: r.caseTitle,
        volunteerName: r.volunteerName,
        volunteerEmail: r.volunteerEmail,
        volunteerBadgeId: r.volunteerBadgeId,
      })),
    });
  });

  app.post("/api/admin/case-volunteer-requests/:id/approve", requireAuth, requireRole("admin"), async (req, res) => {
    const request = await storage.getCaseVolunteerRequestById(String(req.params.id));
    if (!request) return res.status(404).json({ message: "Request not found" });

    const updated = await storage.resolveCaseVolunteerRequest(request.id, true);
    const volunteer = await storage.getUserById(request.volunteerId);
    const c = await storage.getCaseById(request.caseId);
    if (volunteer && c) {
      const message =
        request.type === "assignment"
          ? `Good news, ${volunteer.name}, your request to join "${c.title}" has been approved. You're now assigned to this case.`
          : `Hi ${volunteer.name}, your request to step down from "${c.title}" has been approved. You're no longer assigned to this case.`;
      await sendNotificationEmail(volunteer.email, request.type === "assignment" ? "You've joined a case" : "You've been removed from a case", message);
    }
    res.json({ message: "Request approved", request: updated });
  });

  app.post("/api/admin/case-volunteer-requests/:id/reject", requireAuth, requireRole("admin"), async (req, res) => {
    const request = await storage.getCaseVolunteerRequestById(String(req.params.id));
    if (!request) return res.status(404).json({ message: "Request not found" });

    const updated = await storage.resolveCaseVolunteerRequest(request.id, false);
    const volunteer = await storage.getUserById(request.volunteerId);
    const c = await storage.getCaseById(request.caseId);
    if (volunteer && c) {
      const message =
        request.type === "assignment"
          ? `Hi ${volunteer.name}, your request to join "${c.title}" wasn't approved this time.`
          : `Hi ${volunteer.name}, your request to step down from "${c.title}" wasn't approved, you're still assigned to this case. Contact us if you have concerns.`;
      await sendNotificationEmail(volunteer.email, "Update on your case request", message);
    }
    res.json({ message: "Request rejected", request: updated });
  });

  // ─── Admin: Daily activity summary ────────────────────────────────────

  app.get("/api/admin/daily-summary", requireAuth, requireRole("admin"), async (req, res) => {
    const dateParam = req.query.date as string | undefined;
    const summary = await storage.getDailySummary(dateParam ? new Date(dateParam) : new Date());
    res.json(summary);
  });

  app.get("/api/admin/daily-summary/export", requireAuth, requireRole("admin"), async (req, res) => {
    const dateParam = req.query.date as string | undefined;
    const summary = await storage.getDailySummary(dateParam ? new Date(dateParam) : new Date());
    const header = ["Date", "Volunteers Approved", "Cases Approved", "Cases Completed", "Donations Confirmed", "Funds Confirmed (PKR)", "New Signups"];
    const row = [summary.date, summary.volunteersApproved, summary.casesApproved, summary.casesCompleted, summary.donationsConfirmed, summary.fundsConfirmedToday, summary.newSignups];
    const lines = [header.join(","), row.join(",")];
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="daily-summary-${summary.date}.csv"`);
    res.send(lines.join("\n"));
  });

  // ─── Partner with us ──────────────────────────────────────────────────

  app.post("/api/partner", async (req, res) => {
    const { organization, name, email, message } = req.body;
    if (!organization || !name || !email || !message) {
      return res.status(400).json({ message: "Organization, name, email, and message are required" });
    }
    const escapeHtml = (v: string) => String(v).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
    const contactEmail = process.env.CONTACT_EMAIL || "help@aikkadam.org";
    await sendNotificationEmail(
      contactEmail,
      `New partnership inquiry from ${organization}`,
      `<strong>Organization:</strong> ${escapeHtml(organization)}<br/><strong>Contact:</strong> ${escapeHtml(name)} (${escapeHtml(email)})<br/><br/>${escapeHtml(message).replace(/\n/g, "<br/>")}`,
    );
    res.json({ message: "Partnership inquiry sent" });
  });
}
