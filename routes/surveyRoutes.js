import express from 'express';
import Survey from '../models/Survey.js';

const router = express.Router();

// POST endpoint to submit survey
router.post('/submit', async (req, res) => {
    try {
        const surveyData = req.body;

        // Add IP address from request (optional)
        surveyData.ipAddress = req.ip || req.connection.remoteAddress;

        // Create new survey document
        const newSurvey = new Survey(surveyData);

        // Save to MongoDB
        const savedSurvey = await newSurvey.save();

        res.status(201).json({
            success: true,
            message: 'Survey submitted successfully',
            data: {
                id: savedSurvey._id,
                submittedAt: savedSurvey.submittedAt
            }
        });
    } catch (error) {
        console.error('Error saving survey:', error);

        // Handle validation errors
        if (error.name === 'ValidationError') {
            return res.status(400).json({
                success: false,
                message: 'Validation error',
                errors: Object.values(error.errors).map(err => err.message)
            });
        }

        res.status(500).json({
            success: false,
            message: 'Error submitting survey',
            error: error.message
        });
    }
});

// GET endpoint to retrieve all surveys (optional - for admin)
router.get('/all', async (req, res) => {
    try {
        const { page = 1, limit = 50, nationality, language } = req.query;

        const filter = {};
        if (nationality) filter.nationality = nationality;
        if (language) filter.language = language;

        const surveys = await Survey.find(filter)
            .sort({ submittedAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .exec();

        const count = await Survey.countDocuments(filter);

        res.json({
            success: true,
            data: surveys,
            totalPages: Math.ceil(count / limit),
            currentPage: page,
            total: count
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error retrieving surveys',
            error: error.message
        });
    }
});

// GET endpoint to retrieve survey by ID (optional)
router.get('/:id', async (req, res) => {
    try {
        const survey = await Survey.findById(req.params.id);

        if (!survey) {
            return res.status(404).json({
                success: false,
                message: 'Survey not found'
            });
        }

        res.json({
            success: true,
            data: survey
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error retrieving survey',
            error: error.message
        });
    }
});

// GET analytics endpoint (optional)
router.get('/analytics/summary', async (req, res) => {
    try {
        const totalSurveys = await Survey.countDocuments();
        const legalIssuesYes = await Survey.countDocuments({ legalIssues: { $in: ['Yes', 'نعم', 'Oo', 'ہاں', 'হ্যাঁ', 'Ya', '是', 'Haa', 'हाँ'] } });
        const giveawayInterested = await Survey.countDocuments({ giveawayInterest: { $in: ['Yes, I would', 'نعم، أرغب', 'Oo', 'ہاں', 'হ্যাঁ', 'Ya', '是', 'Haa', 'हाँ'] } });

        const nationalityBreakdown = await Survey.aggregate([
            { $group: { _id: '$nationality', count: { $sum: 1 } } },
            { $sort: { count: -1 } }
        ]);

        res.json({
            success: true,
            analytics: {
                totalSurveys,
                legalIssuesYes,
                legalIssuesPercentage: ((legalIssuesYes / totalSurveys) * 100).toFixed(2),
                giveawayInterested,
                nationalityBreakdown
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error generating analytics',
            error: error.message
        });
    }
});

export default router;