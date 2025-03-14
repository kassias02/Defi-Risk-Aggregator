// backend/controllers/taxController.js
const TaxService = require('../services/taxService');

class TaxController {
  async generateTaxReport(req, res) {
    try {
      const { userId } = req;
      const { startDate, endDate, format } = req.body;

      const report = await TaxService.generateTaxReport(userId, startDate, endDate);
      const exportedReport = await TaxService.exportTaxReport(report, format);

      res.setHeader('Content-Disposition', `attachment; filename="tax_report_${Date.now()}.${format || 'json'}"`);
      res.send(exportedReport);
    } catch (error) {
      console.error('Error generating tax report:', error);
      res.status(500).json({ error: 'Error generating tax report' });
    }
  }
}

module.exports = new TaxController();