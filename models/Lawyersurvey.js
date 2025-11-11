import mongoose from 'mongoose';

const lawyerSurveySchema = new mongoose.Schema({
  // Section 1: Basic Information
  professional_status: {
    type: String,
    required: true,
    enum: [
      'محامي مستقل (freelancer)',
      'شريك في مكتب محاماة (2-5 محامين)',
      'مكتب محاماة متوسط (6-15 محامي)',
      'شركة محاماة كبيرة (15+ محامي)',
      'محامي موظف وأبحث عن عمل إضافي'
    ]
  },
  
  years_experience: {
    type: String,
    required: true,
    enum: [
      '1-3 سنوات',
      '4-6 سنوات',
      '7-10 سنوات',
      'أكثر من 10 سنوات'
    ]
  },
  
  specializations: {
    type: [String],
    required: true,
    validate: {
      validator: function(v) {
        return v && v.length > 0;
      },
      message: 'يجب اختيار تخصص واحد على الأقل'
    }
  },
  
  specializations_other: {
    type: String,
    required: false
  },
  
  languages: {
    type: [String],
    required: true,
    validate: {
      validator: function(v) {
        return v && v.length > 0;
      },
      message: 'يجب اختيار لغة واحدة على الأقل'
    }
  },
  
  languages_other: {
    type: String,
    required: false
  },

  // Section 2: Capacity
  written_consultations: {
    type: Number,
    required: true,
    min: [0, 'العدد يجب أن يكون موجباً']
  },
  
  labor_cases: {
    type: Number,
    required: true,
    min: [0, 'العدد يجب أن يكون موجباً']
  },
  
  family_cases: {
    type: Number,
    required: true,
    min: [0, 'العدد يجب أن يكون موجباً']
  },

  // Section 3: Pricing
  monthly_compensation: {
    type: Number,
    required: true,
    min: [1, 'المبلغ يجب أن يكون أكبر من صفر']
  },
  
  discount_acceptance: {
    type: String,
    required: true,
    enum: [
      'نعم، أقبل خصم 10-15%',
      'نعم، أقبل خصم 20-25%',
      'نعم، أقبل خصم 30-35%',
      'لا، أريد السعر الكامل بدون خصم'
    ]
  },
  
  current_consultation_price: {
    type: String,
    required: true,
    enum: [
      '100-200 ر.س',
      '201-300 ر.س',
      '301-500 ر.س',
      '501-800 ر.س',
      'أكثر من 800 ر.س',
      'لا أقدم استشارات كتابية حالياً'
    ]
  },

  // Section 4: Preferences and Challenges
  most_important: {
    type: String,
    required: true,
    enum: [
      'ضمان الدخل الشهري الثابت',
      'عدد الطلبات المعقول (عدم الضغط)',
      'نوعية القضايا (تتوافق مع تخصصي)',
      'المرونة الكاملة في الوقت',
      'سهولة التعامل مع العملاء',
      'أخرى'
    ]
  },
  
  most_important_other: {
    type: String,
    required: false
  },
  
  biggest_challenge: {
    type: String,
    required: false,
    enum: [
      'صعوبة الحصول على عملاء جدد',
      'عدم انتظام الدخل الشهري',
      'صعوبة تحصيل المستحقات من العملاء',
      'عدم وضوح توقعات العملاء',
      'الوقت المهدر في التسويق والإعلانات',
      'أخرى',
      null
    ]
  },
  
  biggest_challenge_other: {
    type: String,
    required: false
  },

  // Section 5: Interest Level
  interest_level: {
    type: String,
    required: true,
    enum: [
      'مهتم جداً - أريد التفاصيل فوراً',
      'مهتم - أريد معرفة المزيد',
      'ربما - يعتمد على التفاصيل الأخرى',
      'غير مهتم حالياً'
    ]
  },
  
  questions_concerns: {
    type: String,
    required: false
  },

  // Section 6: Contact Information
  name: {
    type: String,
    required: false,
    trim: true
  },
  
  mobile: {
    type: String,
    required: false,
    validate: {
      validator: function(v) {
        if (!v) return true; // Optional field
        return /^(05|5)[0-9]{8}$/.test(v);
      },
      message: 'رقم الجوال غير صحيح'
    }
  },
  
  email: {
    type: String,
    required: false,
    trim: true,
    lowercase: true,
    validate: {
      validator: function(v) {
        if (!v) return true; // Optional field
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
      },
      message: 'البريد الإلكتروني غير صحيح'
    }
  },
  
  city: {
    type: String,
    required: false,
    trim: true
  },

  // Metadata
  submittedAt: {
    type: Date,
    required: true,
    default: Date.now
  },
  
  status: {
    type: String,
    enum: ['pending', 'contacted', 'interested', 'not_interested', 'converted'],
    default: 'pending'
  },
  
  notes: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },

  // Calculated fields for analytics
  total_monthly_capacity: {
    type: Number
  },
  
  value_score: {
    type: Number // Calculate based on capacity and pricing
  }

}, {
  timestamps: true, // Adds createdAt and updatedAt
  collection: 'lawyer_surveys'
});

// Pre-save middleware to calculate derived fields
lawyerSurveySchema.pre('save', function(next) {
  // Calculate total monthly capacity
  this.total_monthly_capacity = 
    this.written_consultations + 
    this.labor_cases + 
    this.family_cases;
  
  // Calculate value score (simple formula - can be improved)
  // Higher capacity and lower discount acceptance = higher score
  const discountMultiplier = {
    'نعم، أقبل خصم 10-15%': 0.9,
    'نعم، أقبل خصم 20-25%': 0.8,
    'نعم، أقبل خصم 30-35%': 0.7,
    'لا، أريد السعر الكامل بدون خصم': 1.0
  };
  
  this.value_score = this.total_monthly_capacity * 
    (this.monthly_compensation / 1000) * 
    (discountMultiplier[this.discount_acceptance] || 0.85);
  
  next();
});

// Indexes for efficient querying
lawyerSurveySchema.index({ email: 1 });
lawyerSurveySchema.index({ mobile: 1 });
lawyerSurveySchema.index({ interest_level: 1 });
lawyerSurveySchema.index({ professional_status: 1 });
lawyerSurveySchema.index({ status: 1 });
lawyerSurveySchema.index({ createdAt: -1 });
lawyerSurveySchema.index({ value_score: -1 });

// Static methods for analytics
lawyerSurveySchema.statics.getAnalytics = async function() {
  const total = await this.countDocuments();
  const byInterestLevel = await this.aggregate([
    { $group: { _id: '$interest_level', count: { $sum: 1 } } }
  ]);
  const byProfessionalStatus = await this.aggregate([
    { $group: { _id: '$professional_status', count: { $sum: 1 } } }
  ]);
  const avgCapacity = await this.aggregate([
    {
      $group: {
        _id: null,
        avgConsultations: { $avg: '$written_consultations' },
        avgLaborCases: { $avg: '$labor_cases' },
        avgFamilyCases: { $avg: '$family_cases' },
        avgCompensation: { $avg: '$monthly_compensation' }
      }
    }
  ]);

  return {
    total,
    byInterestLevel,
    byProfessionalStatus,
    avgCapacity: avgCapacity[0] || {}
  };
};

// Instance method to check if lawyer is highly interested
lawyerSurveySchema.methods.isHighlyInterested = function() {
  return this.interest_level === 'مهتم جداً - أريد التفاصيل فوراً' ||
         this.interest_level === 'مهتم - أريد معرفة المزيد';
};

const LawyerSurvey = mongoose.model('LawyerSurvey', lawyerSurveySchema);

export default LawyerSurvey;