import { sql } from "drizzle-orm";
import { pgTable, text, varchar, boolean, integer, timestamp, pgEnum, uniqueIndex } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// ─── Enums ────────────────────────────────────────────────────────────────

export const userRoleEnum = pgEnum("user_role", ["donor", "volunteer", "admin"]);

export const volunteerStatusEnum = pgEnum("volunteer_status", [
  "none",
  "pending",
  "approved",
  "rejected",
  "alumni",
]);

export const otpPurposeEnum = pgEnum("otp_purpose", ["signup", "login", "reset_password"]);

export const caseStatusEnum = pgEnum("case_status", [
  "pending_review",
  "ongoing",
  "completed",
  "rejected",
]);

export const donationStatusEnum = pgEnum("donation_status", ["pending", "confirmed", "rejected"]);
export const donationMethodEnum = pgEnum("donation_method", ["bank_transfer", "jazzcash", "easypaisa", "cash"]);

// ─── Users ────────────────────────────────────────────────────────────────

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  // Not marked .unique() here — Postgres unique constraints are
  // case-sensitive, which would let "John@x.com" and "john@x.com" both
  // exist as separate accounts. The real, case-insensitive uniqueness
  // guarantee is the lower(email) index below instead.
  email: text("email").notNull(),
  passwordHash: text("password_hash").notNull(),

  role: userRoleEnum("role").notNull().default("donor"),
  isVerified: boolean("is_verified").notNull().default(false),
  avatarUrl: text("avatar_url"),

  volunteerStatus: volunteerStatusEnum("volunteer_status").notNull().default("none"),
  badgeId: varchar("badge_id").unique(),
  city: text("city"),
  totalHoursContributed: integer("total_hours_contributed").notNull().default(0),
  totalCasesCompleted: integer("total_cases_completed").notNull().default(0),
  // Short public one-liner shown on the volunteer's card (e.g. "Passionate about food security in rural Sindh.")
  volunteerMotto: text("volunteer_motto"),
  // Longer answer from the application form — admin-only, never shown publicly
  volunteerMotivation: text("volunteer_motivation"),
  volunteerPhone: text("volunteer_phone"),
  volunteerRejectionReason: text("volunteer_rejection_reason"),
  volunteerCategory: text("volunteer_category"), // e.g. "Medical Assistant", "Food Drive"
  volunteerApprovedAt: timestamp("volunteer_approved_at"),
  volunteerServedUntil: text("volunteer_served_until"), // free text, e.g. "2024" or a specific date — set by admin when service ends
  pendingNameChange: text("pending_name_change"), // requested new name, awaiting admin approval
  isBanned: boolean("is_banned").notNull().default(false),
  banReason: text("ban_reason"),

  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => [
  uniqueIndex("users_email_lower_unique_idx").on(sql`lower(${table.email})`),
]);

// ─── Banned emails (persists even if the user account is later deleted) ───

export const bannedEmails = pgTable("banned_emails", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  reason: text("reason"),
  bannedAt: timestamp("banned_at").notNull().defaultNow(),
});

export type BannedEmail = typeof bannedEmails.$inferSelect;

// ─── Site settings (admin-editable, singleton row) ───────────────────────
// (moved below the `cases` table since it references cases.id)

export const insertUserSchema = createInsertSchema(users)
  .pick({ name: true, email: true })
  .extend({
    password: z.string().min(8, "Password must be at least 8 characters"),
  });

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type PublicUser = Omit<User, "passwordHash">;

export function toPublicUser(user: User): PublicUser {
  const { passwordHash, ...publicUser } = user;
  return publicUser;
}

// ─── OTP codes ────────────────────────────────────────────────────────────

export const otpCodes = pgTable("otp_codes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull(),
  codeHash: text("code_hash").notNull(),
  purpose: otpPurposeEnum("purpose").notNull(),
  attempts: integer("attempts").notNull().default(0),
  consumed: boolean("consumed").notNull().default(false),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type OtpCode = typeof otpCodes.$inferSelect;

// ─── Cases (submitted by users, become ongoing projects once approved) ────

export const cases = pgTable("cases", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description").notNull(),
  location: text("location").notNull(), // derived display string, e.g. "Lahore, Punjab"
  city: text("city"),
  province: text("province"),
  contactPhone: text("contact_phone"),
  amountNeeded: integer("amount_needed").notNull(),
  amountCollected: integer("amount_collected").notNull().default(0),
  imageUrl: text("image_url"), // legacy single-image field, kept for back-compat (mirrors images[0])
  images: text("images").array().notNull().default(sql`'{}'::text[]`), // up to 5 images
  status: caseStatusEnum("status").notNull().default("pending_review"),
  rejectionReason: text("rejection_reason"),
  category: text("category"), // e.g. "Medical", "Food Drive", "Education"

  submittedById: varchar("submitted_by_id").notNull().references(() => users.id),
  hoursContributed: integer("hours_contributed").notNull().default(0),

  // Hidden cases: kept in the system (still visible to admin) but pulled
  // from every public listing. Independent of `status` so a completed
  // project can be hidden without losing its completed-project data.
  isHidden: boolean("is_hidden").notNull().default(false),
  hiddenReason: text("hidden_reason"),
  hiddenAt: timestamp("hidden_at"),

  createdAt: timestamp("created_at").notNull().defaultNow(),
  approvedAt: timestamp("approved_at"),
  completedAt: timestamp("completed_at"),
});

export const siteSettings = pgTable("site_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tagline: text("tagline"), // shown in the top banner strip across the site
  taglineCaseId: varchar("tagline_case_id").references(() => cases.id), // optional: makes the banner a "Support Now" link to this case
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type SiteSettings = typeof siteSettings.$inferSelect;

export const updateTaglineSchema = z.object({
  tagline: z.string().max(160).optional(),
  taglineCaseId: z.string().nullable().optional(),
});

// Many-to-many: a case can have several assigned volunteers, and a
// volunteer can be assigned to many cases over time.
export const caseVolunteers = pgTable("case_volunteers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  caseId: varchar("case_id").notNull().references(() => cases.id),
  volunteerId: varchar("volunteer_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type CaseVolunteer = typeof caseVolunteers.$inferSelect;

export const caseRequestTypeEnum = pgEnum("case_request_type", ["assignment", "removal"]);
export const caseRequestStatusEnum = pgEnum("case_request_status", ["pending", "approved", "rejected"]);

// A volunteer asking to join a case ("assignment") or step down from one
// they're already on ("removal") — reviewed by admin before it takes effect.
export const caseVolunteerRequests = pgTable("case_volunteer_requests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  caseId: varchar("case_id").notNull().references(() => cases.id),
  volunteerId: varchar("volunteer_id").notNull().references(() => users.id),
  type: caseRequestTypeEnum("type").notNull(),
  reason: text("reason"),
  status: caseRequestStatusEnum("status").notNull().default("pending"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type CaseVolunteerRequest = typeof caseVolunteerRequests.$inferSelect;

export const caseVolunteerRequestSchema = z.object({
  reason: z.string().optional(),
});

export const CASE_CATEGORIES = ["Medical", "Food Drive", "Education", "Shelter", "Emergency Relief", "Other"] as const;

export const insertCaseSchema = createInsertSchema(cases).pick({
  title: true,
  description: true,
  amountNeeded: true,
}).extend({
  city: z.string().min(1, "Select a city"),
  province: z.string().min(1, "Select a province"),
  contactPhone: z.string().min(7, "Enter a valid phone number").max(20),
  category: z.enum(CASE_CATEGORIES).optional(),
});

export type InsertCase = z.infer<typeof insertCaseSchema>;
export type Case = typeof cases.$inferSelect;

export const updateCaseSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  city: z.string().min(1).optional(),
  province: z.string().min(1).optional(),
  contactPhone: z.string().min(7).max(20).optional(),
  amountNeeded: z.coerce.number().int().positive().optional(),
  category: z.enum(CASE_CATEGORIES).optional(),
  // URLs of previously-uploaded photos the admin chose to KEEP (i.e. didn't
  // delete in the image manager). Sent as a JSON-stringified array since
  // this rides alongside multipart file uploads in the same form. Newly
  // uploaded files (if any) are appended after these, not a full replace —
  // see the route handler.
  existingImages: z.array(z.string()).optional(),
});

// ─── Inbox (contact form + partnership inquiries, admin-manageable) ──────

export const inboxMessageTypeEnum = pgEnum("inbox_message_type", ["contact", "partnership"]);
// unread/read/replied track the ORIGINAL inbound message's lifecycle;
// resolved is a separate flag admins set manually once a conversation is
// done, independent of read state (a resolved thread can still be read).
export const inboxMessageStatusEnum = pgEnum("inbox_message_status", ["unread", "read", "replied"]);
export const inboxThreadDirectionEnum = pgEnum("inbox_thread_direction", ["outbound", "inbound"]);

export const inboxMessages = pgTable("inbox_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  type: inboxMessageTypeEnum("type").notNull(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  organization: text("organization"), // partnership inquiries only
  message: text("message").notNull(),
  status: inboxMessageStatusEnum("status").notNull().default("unread"),
  resolved: boolean("resolved").notNull().default(false),
  replyText: text("reply_text"),
  repliedAt: timestamp("replied_at"),
  repliedBy: text("replied_by"), // admin's name, for an internal record of who answered
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type InboxMessage = typeof inboxMessages.$inferSelect;

// Every reply after the original message — either the admin replying
// (outbound) or the visitor emailing back (inbound, captured via the
// Resend inbound webhook). Ordered by createdAt to render as a thread.
export const inboxThreadMessages = pgTable("inbox_thread_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  inboxMessageId: varchar("inbox_message_id").notNull().references(() => inboxMessages.id, { onDelete: "cascade" }),
  direction: inboxThreadDirectionEnum("direction").notNull(),
  body: text("body").notNull(),
  authorName: text("author_name"), // admin's name (outbound) or the visitor's name (inbound)
  resendEmailId: text("resend_email_id"), // Resend's own id for this specific email, for dedup on webhook retries
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type InboxThreadMessage = typeof inboxThreadMessages.$inferSelect;

export const inboxReplySchema = z.object({
  reply: z.string().min(1, "Reply message is required").max(5000),
});

export const inboxComposeSchema = z.object({
  to: z.string().email("Enter a valid email address"),
  name: z.string().min(1, "Recipient name is required").max(120),
  subject: z.string().min(1, "Subject is required").max(200),
  body: z.string().min(1, "Message is required").max(5000),
});

// ─── Gallery events (admin-curated, verified completed events) ───────────

export const galleryEvents = pgTable("gallery_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description").notNull(),
  location: text("location").notNull(),
  eventDate: text("event_date").notNull(), // free-text label, e.g. "December 2025"
  images: text("images").array().notNull().default(sql`'{}'::text[]`),
  families: text("families"),
  items: text("items"),
  funds: text("funds"),
  sourceCaseId: varchar("source_case_id"), // set when auto-created from a completed case
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type GalleryEvent = typeof galleryEvents.$inferSelect;

// ─── Success stories (admin-curated, individual before/after journeys) ───

export const successStories = pgTable("success_stories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  title: text("title").notNull(),
  storyDate: text("story_date").notNull(),
  quote: text("quote").notNull(),
  beforeImage: text("before_image").notNull(),
  afterImage: text("after_image").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type SuccessStory = typeof successStories.$inferSelect;

// ─── Platform fee ──────────────────────────────────────────────────────────
// The cut kept from every confirmed donation to cover payment verification,
// hosting, and the volunteers/staff who keep cases moving — the rest goes
// straight to the case. One constant, used on both the server (to actually
// compute what gets added to a case's total) and the client (to show the
// same number to donors and admins), so the two can never drift apart.
export const PLATFORM_FEE_RATE = 0.03;

// ─── Donations (manual-confirm: user submits, admin verifies receipt) ────

export const donations = pgTable("donations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  caseId: varchar("case_id").notNull().references(() => cases.id),
  // Set only when this specific payment is fulfilling a recurring pledge below —
  // lets a donor's monthly submissions roll up under one commitment.
  recurringDonationId: varchar("recurring_donation_id").references(() => recurringDonations.id),
  amount: integer("amount").notNull(),
  // Optional extra "support the platform" contribution the donor adds on
  // top of `amount` — goes entirely to the platform, never to the case,
  // and never has the platform fee taken off it (it *is* already a gift
  // to the platform). Kept as its own column, not folded into `amount`,
  // so the case's own progress bar is never affected by it.
  tipAmount: integer("tip_amount").notNull().default(0),
  method: donationMethodEnum("method").notNull(),
  senderAccount: text("sender_account").notNull(),
  receiptImage: text("receipt_image").notNull(),
  referenceNote: text("reference_note"),
  status: donationStatusEnum("status").notNull().default("pending"),
  rejectionReason: text("rejection_reason"),
  // Both set once, at the moment an admin confirms this donation — not
  // recomputed later — so the record stays an accurate receipt of what
  // actually happened even if PLATFORM_FEE_RATE is ever changed going
  // forward. `platformFeeAmount` is `amount * PLATFORM_FEE_RATE`
  // (rounded); `netCaseAmount` is what actually got added to the case's
  // collected total (`amount - platformFeeAmount`).
  platformFeeAmount: integer("platform_fee_amount"),
  netCaseAmount: integer("net_case_amount"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  confirmedAt: timestamp("confirmed_at"),
});

export type Donation = typeof donations.$inferSelect;

export const insertDonationSchema = z.object({
  caseId: z.string().min(1),
  amount: z.coerce.number().int().positive(),
  // Optional tip, defaults to 0 when the donor doesn't check the box.
  // Capped generously just to block obvious fat-finger/garbage input, not
  // to limit genuine generosity.
  tipAmount: z.coerce.number().int().min(0).max(10_000_000).optional().default(0),
  method: z.enum(["bank_transfer", "jazzcash", "easypaisa", "cash"]),
  senderAccount: z.string().min(4, "Enter the account/phone number the payment was sent from"),
  referenceNote: z.string().optional(),
  // Optional — links this payment to an existing pledge. Ownership of the
  // pledge is verified server-side against the authenticated user, never
  // trusted from the client alone.
  recurringDonationId: z.string().optional(),
});

export const rejectWithReasonSchema = z.object({
  reason: z.string().optional(),
});

// ─── Recurring donations (monthly giving pledge — no card data stored) ────
// This tracks the donor's *commitment* to give monthly. Actual payment for
// each month still goes through the same manual-confirm + receipt-upload
// flow as a one-time donation (see `donations` above), just tagged with
// this pledge's id. There is no automatic charging and no card/account
// numbers are ever stored — nothing here can move money on its own.

export const recurringDonationStatusEnum = pgEnum("recurring_donation_status", [
  "active",
  "paused",
  "cancelled",
]);

export const recurringDonations = pgTable("recurring_donations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  caseId: varchar("case_id").notNull().references(() => cases.id),
  amount: integer("amount").notNull(),
  method: donationMethodEnum("method").notNull(),
  status: recurringDonationStatusEnum("status").notNull().default("active"),
  nextDueDate: timestamp("next_due_date").notNull(),
  lastReminderSentAt: timestamp("last_reminder_sent_at"),
  // Set automatically whenever an admin confirms a donation linked to this
  // pledge — not user-editable, this is the real signal of "did they
  // actually pay", separate from nextDueDate which is just the reminder clock.
  lastDonationDate: timestamp("last_donation_date"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  cancelledAt: timestamp("cancelled_at"),
});

export type RecurringDonation = typeof recurringDonations.$inferSelect;

export const insertRecurringDonationSchema = z.object({
  caseId: z.string().min(1),
  amount: z.coerce.number().int().positive(),
  method: z.enum(["bank_transfer", "jazzcash", "easypaisa", "cash"]),
});

export const updateGalleryEventSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  location: z.string().min(1).optional(),
  eventDate: z.string().min(1).optional(),
  families: z.string().optional(),
  items: z.string().optional(),
  funds: z.string().optional(),
  // Same pattern as updateCaseSchema.existingImages — URLs of previously-
  // uploaded photos the admin kept, JSON-stringified alongside any new
  // file uploads in the same multipart form. See the route handler.
  existingImages: z.array(z.string()).optional(),
});

export const assignVolunteersSchema = z.object({
  volunteerIds: z.array(z.string()),
});

// ─── Auth request validation schemas ───────────────────────────────────────

export const signupSchema = insertUserSchema;

const otpPurposeZod = z.enum(["signup", "login", "reset_password"]);

export const verifyOtpSchema = z.object({
  email: z.string().email(),
  code: z.string().length(6),
  purpose: otpPurposeZod.default("signup"),
});

export const resendOtpSchema = z.object({
  email: z.string().email(),
  purpose: otpPurposeZod.default("signup"),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const VOLUNTEER_CATEGORIES = ["Medical Assistant", "Food Drive", "Education", "Logistics", "Fundraising", "Field Coordinator", "Other"] as const;

export const volunteerApplySchema = z.object({
  phone: z.string().min(7),
  city: z.string().min(1),
  motto: z.string().min(3).max(120),
  motivation: z.string().min(10),
  category: z.enum(VOLUNTEER_CATEGORIES),
});

export const updateVolunteerSchema = z.object({
  city: z.string().min(1).optional(),
  motto: z.string().min(3).max(120).optional(),
  motivation: z.string().min(1).optional(),
  category: z.enum(VOLUNTEER_CATEGORIES).optional(),
  totalHoursContributed: z.coerce.number().int().min(0).optional(),
  totalCasesCompleted: z.coerce.number().int().min(0).optional(),
  servedUntil: z.string().optional(),
  // "approved" = currently active volunteer, "alumni" = past volunteer.
  status: z.enum(["approved", "alumni"]).optional(),
});

export const hideCaseSchema = z.object({
  reason: z.string().min(1, "A reason is required so other admins know why this was hidden"),
});

export const banUserSchema = z.object({
  reason: z.string().optional(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8),
});

export const requestNameChangeSchema = z.object({
  newName: z.string().min(1),
});
