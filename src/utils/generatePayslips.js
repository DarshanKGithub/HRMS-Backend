const { PDFDocument, StandardFonts } = require("pdf-lib");

module.exports = async ({ name, month, base, deduction, net }) => {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

  page.drawText("PAYSLIP", { x: 200, y: 750, size: 20, font });
  page.drawText(`Name: ${name}`, { x: 50, y: 700, font });
  page.drawText(`Month: ${month}`, { x: 50, y: 670, font });
  page.drawText(`Base: ₹${base}`, { x: 50, y: 620, font });
  page.drawText(`Deduction: ₹${deduction}`, { x: 50, y: 590, font });
  page.drawText(`Net: ₹${net}`, { x: 50, y: 560, font });

  return await pdfDoc.save();
};