const OfferLetterService = require("../services/offerLetterService");
const OfferLetterModel = require("../models/offerLetterModel");
const db = require("../config/db");

exports.createOfferLetter = async (req, res, next) => {
  try {
    const { employee_id } = req.body;
    const userId = req.user.id;

    // Check if user is admin
    if (req.user.role !== "ADMIN") {
      const err = new Error("Only admins can create offer letters");
      err.status = 403;
      return next(err);
    }

    const offer = await OfferLetterService.createOfferLetter(req.body, userId);

    res.status(201).json({
      message: "Offer letter created successfully",
      data: offer,
    });
  } catch (error) {
    next(error);
  }
};

exports.listOffers = async (req, res, next) => {
  try {
    const { page, limit, status, employee_id } = req.query;

    if (req.user.role !== "ADMIN") {
      const err = new Error("Only admins can view all offers");
      err.status = 403;
      return next(err);
    }

    const result = await OfferLetterService.listOffers(page, limit, {
      status,
      employee_id,
    });

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

exports.getOffer = async (req, res, next) => {
  try {
    const { id } = req.params;
    const offer = await OfferLetterModel.getById(id);

    if (!offer) {
      const err = new Error("Offer letter not found");
      err.status = 404;
      return next(err);
    }

    // Check authorization: Admin or the employee
    if (req.user.role !== "ADMIN" && offer.employee_id !== req.user.employee_id) {
      const err = new Error("You do not have permission to view this offer");
      err.status = 403;
      return next(err);
    }

    // Get audit trail
    const auditTrail = await OfferLetterModel.getAuditTrail(id);

    res.status(200).json({
      data: offer,
      auditTrail,
    });
  } catch (error) {
    next(error);
  }
};

exports.updateOffer = async (req, res, next) => {
  try {
    const { id } = req.params;
    const offer = await OfferLetterModel.getById(id);

    if (!offer) {
      const err = new Error("Offer letter not found");
      err.status = 404;
      return next(err);
    }

    // Only DRAFT offers can be updated by admins
    if (offer.status !== "DRAFT") {
      const err = new Error("Only draft offers can be updated");
      err.status = 400;
      return next(err);
    }

    if (req.user.role !== "ADMIN") {
      const err = new Error("Only admins can update offers");
      err.status = 403;
      return next(err);
    }

    // If updating position/department/salary, regenerate letter content
    const updateData = { ...req.body };
    if (updateData.position || updateData.department || updateData.salary) {
      const empResult = await db.query("SELECT * FROM employees WHERE id = $1", [
        offer.employee_id,
      ]);
      const employee = empResult.rows[0];

      const newLetterContent = await OfferLetterService.generateLetterContent(null, employee, {
        position: updateData.position || offer.position,
        department: updateData.department || offer.department,
        salary: updateData.salary || offer.salary,
        offer_date: offer.offer_date,
        joining_date: offer.joining_date,
      });

      updateData.letter_content = newLetterContent;
    }

    const updatedOffer = await OfferLetterModel.update(id, updateData);

    res.status(200).json({
      message: "Offer letter updated successfully",
      data: updatedOffer,
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteOffer = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (req.user.role !== "ADMIN") {
      const err = new Error("Only admins can delete offers");
      err.status = 403;
      return next(err);
    }

    const deleted = await OfferLetterModel.delete(id);

    if (!deleted) {
      const err = new Error("Only draft offers can be deleted");
      err.status = 400;
      return next(err);
    }

    res.status(200).json({
      message: "Offer letter deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

exports.sendOffer = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    if (req.user.role !== "ADMIN") {
      const err = new Error("Only admins can send offers");
      err.status = 403;
      return next(err);
    }

    const offer = await OfferLetterModel.getById(id);

    if (!offer) {
      const err = new Error("Offer letter not found");
      err.status = 404;
      return next(err);
    }

    // Must be DRAFT to send
    if (offer.status !== "DRAFT") {
      const err = new Error("Only draft offers can be sent");
      err.status = 400;
      return next(err);
    }

    // Generate PDF if not exists
    if (!offer.pdf_path) {
      await OfferLetterService.generatePDF(id);
    }

    // Send email
    const result = await OfferLetterService.sendOfferEmail(id, userId);

    res.status(200).json({
      message: result.message,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

exports.generatePDF = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (req.user.role !== "ADMIN") {
      const err = new Error("Only admins can generate PDFs");
      err.status = 403;
      return next(err);
    }

    const result = await OfferLetterService.generatePDF(id);

    res.status(200).json({
      message: "PDF generated successfully",
      data: {
        fileName: result.fileName,
        path: result.relativePath,
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.downloadPDF = async (req, res, next) => {
  try {
    const { id } = req.params;
    const offer = await OfferLetterModel.getById(id);

    if (!offer) {
      const err = new Error("Offer letter not found");
      err.status = 404;
      return next(err);
    }

    if (!offer.pdf_path) {
      const err = new Error("PDF not generated yet");
      err.status = 400;
      return next(err);
    }

    const path = require("path");
    const filePath = path.join(__dirname, "../../", offer.pdf_path);

    res.download(filePath, `Offer_${id}.pdf`);
  } catch (error) {
    next(error);
  }
};

exports.acceptOffer = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Get employee_id for this user
    const empResult = await db.query("SELECT id FROM employees WHERE user_id = $1", [userId]);

    if (empResult.rows.length === 0) {
      const err = new Error("Employee record not found");
      err.status = 404;
      return next(err);
    }

    const employeeId = empResult.rows[0].id;
    const offer = await OfferLetterModel.getById(id);

    if (!offer) {
      const err = new Error("Offer letter not found");
      err.status = 404;
      return next(err);
    }

    if (offer.employee_id !== employeeId) {
      const err = new Error("You can only accept your own offers");
      err.status = 403;
      return next(err);
    }

    const result = await OfferLetterService.acceptOffer(id, userId);

    res.status(200).json({
      message: result.message,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

exports.rejectOffer = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const userId = req.user.id;

    // Get employee_id for this user
    const empResult = await db.query("SELECT id FROM employees WHERE user_id = $1", [userId]);

    if (empResult.rows.length === 0) {
      const err = new Error("Employee record not found");
      err.status = 404;
      return next(err);
    }

    const employeeId = empResult.rows[0].id;
    const offer = await OfferLetterModel.getById(id);

    if (!offer) {
      const err = new Error("Offer letter not found");
      err.status = 404;
      return next(err);
    }

    if (offer.employee_id !== employeeId) {
      const err = new Error("You can only reject your own offers");
      err.status = 403;
      return next(err);
    }

    const result = await OfferLetterService.rejectOffer(id, userId, reason);

    res.status(200).json({
      message: result.message,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

exports.getMyOffers = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { page, limit } = req.query;

    // Get employee_id for this user
    const empResult = await db.query("SELECT id FROM employees WHERE user_id = $1", [userId]);

    if (empResult.rows.length === 0) {
      const err = new Error("Employee record not found");
      err.status = 404;
      return next(err);
    }

    const employeeId = empResult.rows[0].id;
    const result = await OfferLetterService.getEmployeeOffers(employeeId, page, limit);

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

// Template management endpoints

exports.getTemplates = async (req, res, next) => {
  try {
    if (req.user.role !== "ADMIN") {
      const err = new Error("Only admins can view templates");
      err.status = 403;
      return next(err);
    }

    const templates = await OfferLetterService.getTemplates(false);

    res.status(200).json({
      data: templates,
    });
  } catch (error) {
    next(error);
  }
};

exports.createTemplate = async (req, res, next) => {
  try {
    const { name, content } = req.body;

    if (req.user.role !== "ADMIN") {
      const err = new Error("Only admins can create templates");
      err.status = 403;
      return next(err);
    }

    const template = await OfferLetterService.createTemplate(name, content);

    res.status(201).json({
      message: "Template created successfully",
      data: template,
    });
  } catch (error) {
    next(error);
  }
};

exports.getAuditTrail = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (req.user.role !== "ADMIN") {
      const err = new Error("Only admins can view audit trails");
      err.status = 403;
      return next(err);
    }

    const auditTrail = await OfferLetterModel.getAuditTrail(id);

    res.status(200).json({
      data: auditTrail,
    });
  } catch (error) {
    next(error);
  }
};
