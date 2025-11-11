import express from 'express';
import LawyerSurvey from '../models/LawyerSurvey.js';

const router = express.Router();

// @route   POST /api/lawyer-survey/submit
// @desc    Submit a new lawyer survey
// @access  Public
router.post('/submit', async (req, res) => {
  try {
    // Validate required fields
    const requiredFields = [
      'professional_status',
      'years_experience',
      'specializations',
      'languages',
      'written_consultations',
      'labor_cases',
      'family_cases',
      'monthly_compensation',
      'discount_acceptance',
      'current_consultation_price',
      'most_important',
      'interest_level'
    ];

    const missingFields = requiredFields.filter(field => !req.body[field]);
    
    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'الرجاء ملء جميع الحقول المطلوبة',
        missingFields
      });
    }

    // Check if email already exists (if provided)
    if (req.body.email) {
      const existingSurvey = await LawyerSurvey.findOne({ 
        email: req.body.email.toLowerCase() 
      });
      
      if (existingSurvey) {
        return res.status(409).json({
          success: false,
          message: 'تم استلام استبيان من هذا البريد الإلكتروني مسبقاً'
        });
      }
    }

    // Create new survey
    const survey = new LawyerSurvey({
      ...req.body,
      submittedAt: new Date(req.body.submittedAt) || new Date()
    });

    await survey.save();

    // Return success response
    res.status(201).json({
      success: true,
      message: 'تم استلام الاستبيان بنجاح',
      data: {
        id: survey._id,
        submittedAt: survey.submittedAt
      }
    });

  } catch (error) {
    console.error('Error submitting survey:', error);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'خطأ في البيانات المدخلة',
        errors
      });
    }

    // Handle other errors
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء حفظ البيانات. يرجى المحاولة مرة أخرى.'
    });
  }
});

// @route   GET /api/lawyer-survey/all
// @desc    Get all surveys (admin only - add authentication middleware)
// @access  Private
router.get('/all', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      status, 
      interest_level,
      sort = '-createdAt' 
    } = req.query;

    const query = {};
    
    // Add filters
    if (status) query.status = status;
    if (interest_level) query.interest_level = interest_level;

    const surveys = await LawyerSurvey.find(query)
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .select('-__v');

    const count = await LawyerSurvey.countDocuments(query);

    res.json({
      success: true,
      data: surveys,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      totalSurveys: count
    });

  } catch (error) {
    console.error('Error fetching surveys:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء جلب البيانات'
    });
  }
});

// @route   GET /api/lawyer-survey/:id
// @desc    Get single survey by ID
// @access  Private
router.get('/:id', async (req, res) => {
  try {
    const survey = await LawyerSurvey.findById(req.params.id).select('-__v');

    if (!survey) {
      return res.status(404).json({
        success: false,
        message: 'الاستبيان غير موجود'
      });
    }

    res.json({
      success: true,
      data: survey
    });

  } catch (error) {
    console.error('Error fetching survey:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء جلب البيانات'
    });
  }
});

// @route   PATCH /api/lawyer-survey/:id/status
// @desc    Update survey status
// @access  Private
router.patch('/:id/status', async (req, res) => {
  try {
    const { status, notes } = req.body;

    const validStatuses = ['pending', 'contacted', 'interested', 'not_interested', 'converted'];
    
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'حالة غير صالحة'
      });
    }

    const updateData = {};
    if (status) updateData.status = status;
    if (notes) updateData.notes = notes;

    const survey = await LawyerSurvey.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!survey) {
      return res.status(404).json({
        success: false,
        message: 'الاستبيان غير موجود'
      });
    }

    res.json({
      success: true,
      message: 'تم تحديث الحالة بنجاح',
      data: survey
    });

  } catch (error) {
    console.error('Error updating survey:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء التحديث'
    });
  }
});

// @route   GET /api/lawyer-survey/analytics/summary
// @desc    Get survey analytics and statistics
// @access  Private
router.get('/analytics/summary', async (req, res) => {
  try {
    const analytics = await LawyerSurvey.getAnalytics();
    
    // Get highly interested lawyers
    const highlyInterested = await LawyerSurvey.find({
      interest_level: {
        $in: ['مهتم جداً - أريد التفاصيل فوراً', 'مهتم - أريد معرفة المزيد']
      }
    }).countDocuments();

    // Get lawyers with contact info
    const withContactInfo = await LawyerSurvey.find({
      $or: [
        { email: { $exists: true, $ne: '' } },
        { mobile: { $exists: true, $ne: '' } }
      ]
    }).countDocuments();

    // Top value lawyers
    const topValueLawyers = await LawyerSurvey.find()
      .sort({ value_score: -1 })
      .limit(10)
      .select('name email mobile professional_status value_score total_monthly_capacity interest_level');

    res.json({
      success: true,
      data: {
        ...analytics,
        highlyInterested,
        withContactInfo,
        topValueLawyers
      }
    });

  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء جلب الإحصائيات'
    });
  }
});

// @route   GET /api/lawyer-survey/export/csv
// @desc    Export surveys to CSV
// @access  Private
router.get('/export/csv', async (req, res) => {
  try {
    const surveys = await LawyerSurvey.find().select('-__v -notes').lean();

    // Simple CSV generation
    const headers = [
      'ID',
      'التاريخ',
      'الوضع المهني',
      'سنوات الخبرة',
      'التخصصات',
      'اللغات',
      'الاستشارات الكتابية',
      'القضايا العمالية',
      'القضايا الأسرية',
      'المقابل الشهري',
      'الخصم المقبول',
      'السعر الحالي',
      'الأهم',
      'التحدي الأكبر',
      'مستوى الاهتمام',
      'الاسم',
      'الجوال',
      'البريد الإلكتروني',
      'المدينة',
      'الحالة'
    ];

    const csvRows = [headers.join(',')];

    surveys.forEach(survey => {
      const row = [
        survey._id,
        new Date(survey.createdAt).toLocaleDateString('ar-SA'),
        survey.professional_status,
        survey.years_experience,
        survey.specializations.join('; '),
        survey.languages.join('; '),
        survey.written_consultations,
        survey.labor_cases,
        survey.family_cases,
        survey.monthly_compensation,
        survey.discount_acceptance,
        survey.current_consultation_price,
        survey.most_important,
        survey.biggest_challenge || '',
        survey.interest_level,
        survey.name || '',
        survey.mobile || '',
        survey.email || '',
        survey.city || '',
        survey.status
      ];
      csvRows.push(row.map(cell => `"${cell}"`).join(','));
    });

    const csv = csvRows.join('\n');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename=lawyer-surveys.csv');
    res.send('\ufeff' + csv); // UTF-8 BOM for Excel

  } catch (error) {
    console.error('Error exporting CSV:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء التصدير'
    });
  }
});

// @route   DELETE /api/lawyer-survey/:id
// @desc    Delete a survey (admin only)
// @access  Private
router.delete('/:id', async (req, res) => {
  try {
    const survey = await LawyerSurvey.findByIdAndDelete(req.params.id);

    if (!survey) {
      return res.status(404).json({
        success: false,
        message: 'الاستبيان غير موجود'
      });
    }

    res.json({
      success: true,
      message: 'تم حذف الاستبيان بنجاح'
    });

  } catch (error) {
    console.error('Error deleting survey:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء الحذف'
    });
  }
});

// @route   GET /api/lawyer-survey/search
// @desc    Search surveys by criteria
// @access  Private
router.get('/search', async (req, res) => {
  try {
    const { 
      name, 
      email, 
      mobile, 
      city,
      minCompensation,
      maxCompensation,
      minCapacity
    } = req.query;

    const query = {};

    if (name) query.name = { $regex: name, $options: 'i' };
    if (email) query.email = { $regex: email, $options: 'i' };
    if (mobile) query.mobile = { $regex: mobile };
    if (city) query.city = { $regex: city, $options: 'i' };
    
    if (minCompensation || maxCompensation) {
      query.monthly_compensation = {};
      if (minCompensation) query.monthly_compensation.$gte = parseInt(minCompensation);
      if (maxCompensation) query.monthly_compensation.$lte = parseInt(maxCompensation);
    }

    if (minCapacity) {
      query.total_monthly_capacity = { $gte: parseInt(minCapacity) };
    }

    const surveys = await LawyerSurvey.find(query)
      .sort({ value_score: -1 })
      .limit(50);

    res.json({
      success: true,
      count: surveys.length,
      data: surveys
    });

  } catch (error) {
    console.error('Error searching surveys:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء البحث'
    });
  }
});

export default router;