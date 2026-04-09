const db = require("../config/db");
const OfferLetterModel = require("../models/offerLetterModel");
const { PDFDocument, rgb } = require("pdf-lib");
const fs = require("fs").promises;
const path = require("path");

class OfferLetterService {
  // Generate offer letter content from template
  static async generateLetterContent(templateId, employeeData, offerData) {
    let template;

    if (templateId) {
      const result = await db.query("SELECT content FROM offer_letter_templates WHERE id = $1", [
        templateId,
      ]);
      template = result.rows[0]?.content;
    } else {
      // Use default template
      const result = await db.query(
        "SELECT content FROM offer_letter_templates WHERE is_active = TRUE LIMIT 1"
      );
      template = result.rows[0]?.content;
    }

    if (!template) {
      throw new Error("Template not found");
    }

    // Replace placeholders
    let content = template;
    const replacements = {
      EMPLOYEE_NAME: employeeData.name || "",
      EMAIL: employeeData.email || "",
      POSITION: offerData.position || "",
      DEPARTMENT: offerData.department || "",
      SALARY: `₹${offerData.salary?.toLocaleString("en-IN") || "0"}`,
      OFFER_DATE: new Date(offerData.offer_date).toLocaleDateString("en-IN"),
      JOINING_DATE: new Date(offerData.joining_date).toLocaleDateString("en-IN"),
      COMPANY_NAME: process.env.COMPANY_NAME || "TechHub Inc.",
      COMPANY_ADDRESS: process.env.COMPANY_ADDRESS || "",
      PHONE: process.env.COMPANY_PHONE || "",
    };

    for (const [key, value] of Object.entries(replacements)) {
      const regex = new RegExp(`{{${key}}}`, "g");
      content = content.replace(regex, value);
    }

    return content;
  }

  // Get all templates
  static async getTemplates(onlyActive = true) {
    let query = "SELECT * FROM offer_letter_templates";
    if (onlyActive) {
      query += " WHERE is_active = TRUE";
    }
    query += " ORDER BY created_at DESC";

    const result = await db.query(query);
    return result.rows;
  }

  // Create new template
  static async createTemplate(name, content) {
    const query = `
      INSERT INTO offer_letter_templates (name, content, is_active)
      VALUES ($1, $2, TRUE)
      RETURNING *;
    `;

    const result = await db.query(query, [name, content]);
    return result.rows[0];
  }

  // Create offer letter
  static async createOfferLetter(offerData, userId) {
    const { employee_id, position, department, salary, offer_date, joining_date, template_id } =
      offerData;

    // Validate employee exists
    const empResult = await db.query("SELECT * FROM employees WHERE id = $1", [employee_id]);
    if (empResult.rows.length === 0) {
      throw new Error("Employee not found");
    }

    const employee = empResult.rows[0];

    // Generate letter content
    const letter_content = await this.generateLetterContent(template_id, employee, {
      position,
      department,
      salary,
      offer_date,
      joining_date,
    });

    // Create offer
    const offer = await OfferLetterModel.create({
      employee_id,
      position,
      department,
      salary,
      offer_date,
      joining_date,
      letter_content,
      template_id,
      created_by: userId,
    });

    return offer;
  }

  // Generate PDF for offer letter
  static async generatePDF(offerId) {
    const offer = await OfferLetterModel.getById(offerId);

    if (!offer) {
      throw new Error("Offer letter not found");
    }

    try {
      // Create PDF document
      const pdfDoc = await PDFDocument.create();
      const page = pdfDoc.addPage([612, 792]); // Letter size

      const { width, height } = page.getSize();
      const fontSize = 11;
      const margin = 50;

      // Add header with company name
      page.drawText(process.env.COMPANY_NAME || "TechHub Inc.", {
        x: margin,
        y: height - margin,
        size: 16,
        color: rgb(0.2, 0.4, 0.8),
      });

      // Add date
      page.drawText(`Date: ${new Date().toLocaleDateString("en-IN")}`, {
        x: margin,
        y: height - margin - 40,
        size: 10,
        color: rgb(0, 0, 0),
      });

      // Add letter content with text wrapping
      const contentY = height - margin - 80;
      const lines = this.wrapText(offer.letter_content, 80);

      let yPosition = contentY;
      for (const line of lines) {
        page.drawText(line, {
          x: margin,
          y: yPosition,
          size: fontSize,
          color: rgb(0, 0, 0),
        });
        yPosition -= fontSize + 2;

        if (yPosition < margin + 20) {
          break; // Prevent text overflow
        }
      }

      // Add footer
      page.drawText("Authorized Signature: ___________________", {
        x: margin,
        y: margin + 40,
        size: 9,
        color: rgb(0, 0, 0),
      });

      page.drawText("Employee Signature: ___________________", {
        x: margin,
        y: margin + 10,
        size: 9,
        color: rgb(0, 0, 0),
      });

      // Save PDF
      const pdfDir = path.join(__dirname, "../../uploads/offer-letters");
      await fs.mkdir(pdfDir, { recursive: true });

      const fileName = `offer_${offerId}_${Date.now()}.pdf`;
      const filePath = path.join(pdfDir, fileName);

      const pdfBytes = await pdfDoc.save();
      await fs.writeFile(filePath, pdfBytes);

      // Update offer with PDF path
      const relativePath = `uploads/offer-letters/${fileName}`;
      await OfferLetterModel.update(offerId, { pdf_path: relativePath });

      return { fileName, relativePath, pdfBytes };
    } catch (error) {
      throw new Error(`PDF generation failed: ${error.message}`);
    }
  }

  // Helper function to wrap text
  static wrapText(text, charsPerLine) {
    const words = text.split(" ");
    const lines = [];
    let currentLine = "";

    for (const word of words) {
      if ((currentLine + word).length > charsPerLine) {
        if (currentLine) lines.push(currentLine.trim());
        currentLine = word;
      } else {
        currentLine += (currentLine ? " " : "") + word;
      }
    }

    if (currentLine) lines.push(currentLine.trim());
    return lines;
  }

  // Send offer email (mock implementation - integrate with email service)
  static async sendOfferEmail(offerId, userId) {
    const offer = await OfferLetterModel.getById(offerId);

    if (!offer) {
      throw new Error("Offer letter not found");
    }

    // Update status to SENT
    await OfferLetterModel.updateStatus(offerId, "SENT", userId, "Offer email sent");

    // TODO: Integrate with email service (SendGrid, Nodemailer, etc.)
    // For now, we'll just log it
    console.log(`Email sent to ${offer.email} with offer letter`);

    // Create notification
    const notification = await db.query(
      `INSERT INTO notifications (user_id, message, type, read)
       SELECT e.user_id, $1, $2, FALSE
       FROM employees e
       WHERE e.id = $3
       RETURNING *;`,
      [`You have received an offer letter for position ${offer.position}`, "OFFER_LETTER", offer.employee_id]
    );

    return {
      status: "sent",
      recipient: offer.email,
      message: `Offer letter sent successfully`,
    };
  }

  // Employee accepts offer
  static async acceptOffer(offerId, userId) {
    // Verify employee owns this offer
    const offer = await OfferLetterModel.getById(offerId);

    if (!offer) {
      throw new Error("Offer letter not found");
    }

    if (offer.status !== "SENT") {
      throw new Error("Only sent offers can be accepted");
    }

    // Update status
    await OfferLetterModel.updateStatus(offerId, "ACCEPTED", userId, "Offer accepted by employee");

    // TODO: Auto-confirm employment in employee records

    return { status: "accepted", message: "Offer accepted successfully" };
  }

  // Employee rejects offer
  static async rejectOffer(offerId, userId, reason = null) {
    const offer = await OfferLetterModel.getById(offerId);

    if (!offer) {
      throw new Error("Offer letter not found");
    }

    if (offer.status !== "SENT") {
      throw new Error("Only sent offers can be rejected");
    }

    await OfferLetterModel.updateStatus(offerId, "REJECTED", userId, reason || "Offer rejected");

    return { status: "rejected", message: "Offer rejected" };
  }

  // List all offer letters (admin)
  static async listOffers(page = 1, limit = 10, filters = {}) {
    const result = await OfferLetterModel.getAll(page, limit, filters);
    return {
      data: result.offers,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: result.total,
      },
    };
  }

  // Get employee's offers
  static async getEmployeeOffers(employeeId, page = 1, limit = 10) {
    const result = await OfferLetterModel.getByEmployeeId(employeeId, page, limit);
    return {
      data: result.offers,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: result.total,
      },
    };
  }
}

module.exports = OfferLetterService;
