import mongoose, { Schema, Document, Model } from "mongoose";

interface FullDescription {
  title?: string;
  des?: string;
}

export interface IBlog extends Document {
  title: string;
  slug: string;
  
  des: string;
  status: boolean;
  readingtime: number;
  thumbnail: string;
  fulldes: FullDescription[];
  createdAt: Date;
  updatedAt: Date;
}

const fullDescriptionSchema = new Schema<FullDescription>(
  {
    title: {
      type: String,
      trim: true,
      default: "",
    },

    des: {
      type: String,
      trim: true,
      default: "",
    },
  },
  {
    _id: false,
  }
);

const blogSchema = new Schema<IBlog>(
  {
    title: {
      type: String,
      required: [true, "Blog title is required"],
      trim: true,
      maxlength: [200, "Title cannot exceed 200 characters"],
    },
    slug: {
      type: String,
      required: [true, "Blog title is required"],
      trim: true,
      maxlength: [200, "Title cannot exceed 200 characters"],
      unique:true
    },

    des: {
      type: String,
      required: [true, "Blog description is required"],
      trim: true,
    },

    status: {
      type: Boolean,
      default: true,
    },

    readingtime: {
      type: Number,
      required: [true, "Reading time is required"],
      min: [1, "Reading time must be at least 1 minute"],
    },

    thumbnail: {
      type: String,
      required: [true, "Thumbnail is required"],
      trim: true,
    },

    fulldes: {
      type: [fullDescriptionSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

const Blog: Model<IBlog> =
  mongoose.models.Blog ||
  mongoose.model<IBlog>("Blog", blogSchema);

export default Blog;