import mongoose from 'mongoose';

const studyEntrySchema = new mongoose.Schema({
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'user', required: true },
    subject: { type: mongoose.Schema.Types.ObjectId, ref: 'subject', required: true },
    lesson: { type: mongoose.Schema.Types.ObjectId, ref: 'lesson' }, // Reference to specific lesson
    date: { type: Date, required: true, default: Date.now },
    
    // Reading progress
    reading: {
        completed: { type: Boolean, default: false },
        notes: { type: String } // Any notes about the reading
    },
    
    // Grammar practice (for language subjects)
    grammar: {
        completed: { type: Boolean, default: false },
        topic: { type: String }, // Grammar topic practiced
        photos: [{ type: String }], // URLs to uploaded photos
        documents: [{ 
            path: { type: String },
            originalName: { type: String },
            type: { type: String },
            size: { type: Number }
        }], // Uploaded documents (PDFs, Word docs)
        notes: { type: String }
    },
    
    // Writing practice
    writing: {
        completed: { type: Boolean, default: false },
        type: { 
            type: String, 
            enum: ['questions', 'letters', 'essays', 'other'],
            default: 'questions'
        },
        topic: { type: String }, // Writing topic
        photos: [{ type: String }], // URLs to uploaded photos of written work
        documents: [{ 
            path: { type: String },
            originalName: { type: String },
            type: { type: String },
            size: { type: Number }
        }], // Uploaded documents (PDFs, Word docs)
        notes: { type: String }
    },
    
    // Math-specific fields (for math subjects)
    mathPractice: {
        completed: { type: Boolean, default: false },
        formulas: [{ type: String }], // Formulas practiced
        problemsSolved: { type: Number, default: 0 },
        photos: [{ type: String }], // Photos of solved problems
        documents: [{ 
            path: { type: String },
            originalName: { type: String },
            type: { type: String },
            size: { type: Number }
        }], // Uploaded documents (PDFs, Word docs)
        notes: { type: String }
    },
    
    // Science-specific fields (for science subjects)
    sciencePractice: {
        completed: { type: Boolean, default: false },
        diagrams: { type: Boolean, default: false }, // Whether diagrams were drawn
        questionsAnswered: { type: Number, default: 0 },
        photos: [{ type: String }], // Photos of diagrams/questions
        documents: [{ 
            path: { type: String },
            originalName: { type: String },
            type: { type: String },
            size: { type: Number }
        }], // Uploaded documents (PDFs, Word docs)
        notes: { type: String }
    },
    
    // Social Studies specific (for social subjects)
    socialPractice: {
        completed: { type: Boolean, default: false },
        questionsAnswered: { type: Number, default: 0 },
        photos: [{ type: String }], // Photos of answered questions
        documents: [{ 
            path: { type: String },
            originalName: { type: String },
            type: { type: String },
            size: { type: Number }
        }], // Uploaded documents (PDFs, Word docs)
        notes: { type: String }
    },
    
    // Overall assessment
    confidence: { 
        type: Number, 
        min: 1, 
        max: 5, 
        default: 3 
    }, // Self-assessment confidence level (1-5)
    
    totalTime: { type: Number, default: 0 }, // Total time spent in minutes
    isCompleted: { type: Boolean, default: true }
}, { timestamps: true });

// Index for efficient queries
studyEntrySchema.index({ student: 1, date: -1 });
studyEntrySchema.index({ student: 1, subject: 1, date: -1 });
studyEntrySchema.index({ student: 1, lesson: 1 });

const studyEntryModel = mongoose.models.studyEntry || mongoose.model('studyEntry', studyEntrySchema);
export default studyEntryModel;
