import mongoose from 'mongoose';

const surveySchema = new mongoose.Schema({
    // Section 0: Demographics
    surveySource: {
        type: String,
        required: true
    },
    surveySourceOther: {
        type: String,
        default: null
    },
    nationality: {
        type: String,
        required: true
    },
    residenceYears: {
        type: String,
        required: true
    },
    age: {
        type: String,
        required: true
    },
    income: {
        type: String,
        required: true
    },

    // Section 1: Legal Issues
    legalIssues: {
        type: String,
        required: true,
        enum: ['Yes', 'No', 'نعم', 'لا', 'Oo', 'Hindi', 'ہاں', 'نہیں', 'হ্যাঁ', 'না', 'Ya', 'Tidak', '是', '否', 'Haa', 'Maya', 'हाँ', 'नहीं']
    },
    mainBarrier: {
        type: String,
        required: true
    },

    // Section 2: Decision & Giveaway
    quickDecision: {
        type: String,
        required: true
    },
    giveawayInterest: {
        type: String,
        required: true
    },
    email: {
        type: String,
        default: null,
        validate: {
            validator: function (v) {
                return !v || /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(v);
            },
            message: props => `${props.value} is not a valid email!`
        }
    },
    phone: {
        type: String,
        default: null
    },

    // New Legal Tech Services Questions
    legalTechServices: {
        type: String,
        required: false
    },
    legalTechServiceName: {
        type: String,
        default: null
    },
    legalTechConsideration: {
        type: String,
        default: null
    },

    // Metadata
    language: {
        type: String,
        default: 'en'
    },
    submittedAt: {
        type: Date,
        default: Date.now
    },
    ipAddress: {
        type: String,
        default: null
    }
}, {
    timestamps: true
});

// Indexes for better query performance
surveySchema.index({ nationality: 1 });
surveySchema.index({ submittedAt: -1 });
surveySchema.index({ legalIssues: 1 });

const Survey = mongoose.model('Survey', surveySchema);

export default Survey;