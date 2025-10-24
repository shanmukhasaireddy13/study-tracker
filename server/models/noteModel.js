import mongoose from 'mongoose';

const noteSchema = new mongoose.Schema({
    content: { type: String, required: true },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'user', required: true },
}, { timestamps: true });

const noteModel = mongoose.models.note || mongoose.model('note', noteSchema);
export default noteModel;




