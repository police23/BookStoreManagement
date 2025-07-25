const DamageReportService = require('../services/DamageReportService');
const getAllDamageReports = async (req, res) => {
    try {
        const reports = await DamageReportService.getAllDamageReports();
        res.status(200).json(reports);
    } catch (error) {
        console.error("Error fetching damage reports:", error);
        res.status(500).json({ error: "Failed to fetch damage reports" });
    }
}
   
const createDamageReport = async (req, res) => {
    try {
        const report = req.body;
        const createdReport = await DamageReportService.createDamageReport(report);
        res.status(201).json(createdReport);
    } catch (error) {
        console.error("Error creating damage report:", error);
        res.status(500).json({ error: "Failed to create damage report" });
    }
}
const deleteDamageReport = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await DamageReportService.deleteDamageReport(id);
        res.status(200).json(result);
    } catch (error) {
        console.error("Error deleting damage report:", error);
        res.status(500).json({ error: "Failed to delete damage report" });
    }
}


module.exports = {
    getAllDamageReports,
    createDamageReport,
    deleteDamageReport
};
