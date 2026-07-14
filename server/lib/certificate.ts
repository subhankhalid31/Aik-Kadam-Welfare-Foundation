import PDFDocument from "pdfkit";
import type { Response } from "express";

export function streamVolunteerCertificate(
  res: Response,
  data: {
    name: string;
    badgeId: string;
    hours: number;
    casesCompleted: number;
    joinedDate: Date;
    topProjects: string[];
    issuedDate: Date;
  },
) {
  const doc = new PDFDocument({ size: "A4", layout: "landscape", margin: 50 });

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="aik-kadam-service-certificate-${data.badgeId}.pdf"`);
  doc.pipe(res);

  const primary = "#0F4C3A";
  const accent = "#E8A33D";
  const ink = "#1C2521";
  const muted = "#6B7280";

  // Border
  doc.rect(20, 20, doc.page.width - 40, doc.page.height - 40).lineWidth(2).stroke(primary);
  doc.rect(28, 28, doc.page.width - 56, doc.page.height - 56).lineWidth(0.5).stroke(accent);

  doc
    .fillColor(primary)
    .fontSize(14)
    .font("Helvetica-Bold")
    .text("AIK KADAM", 0, 65, { align: "center", characterSpacing: 3 });

  doc
    .fillColor(ink)
    .fontSize(28)
    .font("Helvetica-Bold")
    .text("Volunteer Service Certificate", 0, 100, { align: "center" });

  doc
    .fillColor(muted)
    .fontSize(13)
    .font("Helvetica")
    .text("This certifies that", 0, 152, { align: "center" });

  doc
    .fillColor(primary)
    .fontSize(24)
    .font("Helvetica-Bold")
    .text(data.name, 0, 175, { align: "center" });

  doc
    .fillColor(ink)
    .fontSize(12)
    .font("Helvetica")
    .text(
      `has volunteered with Aik Kadam since ${data.joinedDate.toLocaleDateString("en-US", { month: "long", year: "numeric" })}, ` +
        `contributing ${data.hours} verified hours across ${data.casesCompleted} completed case(s).`,
      100,
      212,
      { align: "center", width: doc.page.width - 200 },
    );

  if (data.topProjects.length > 0) {
    doc
      .fillColor(muted)
      .fontSize(10)
      .font("Helvetica-Bold")
      .text("Major Projects", 0, 250, { align: "center" });
    doc
      .fillColor(ink)
      .fontSize(11)
      .font("Helvetica")
      .text(data.topProjects.join("   •   "), 100, 266, { align: "center", width: doc.page.width - 200 });
  }

  doc
    .fillColor(muted)
    .fontSize(11)
    .font("Helvetica")
    .text(`Verifiable Badge ID: ${data.badgeId}`, 0, doc.page.height - 118, { align: "center" });

  doc
    .fillColor(muted)
    .fontSize(10)
    .text(`Issued on ${data.issuedDate.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}`, 0, doc.page.height - 100, { align: "center" });

  doc
    .fillColor(muted)
    .fontSize(9)
    .text(`Verify this certificate at aikkadamwelfare.org/verify/${data.badgeId}`, 0, doc.page.height - 84, { align: "center" });

  doc.end();
}
