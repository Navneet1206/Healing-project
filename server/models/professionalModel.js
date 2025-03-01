import mongoose from 'mongoose';

const professionalSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    name: {
      type: String,
      required: true,
    },
    specialization: {
      type: String,
      required: true,
    },
    bio: {
      type: String,
      required: true,
    },
    hourlyRate: {
      type: Number,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const Professional = mongoose.model('Professional', professionalSchema);

export default Professional;