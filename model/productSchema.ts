import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IArrtibutes {
  itemtype:string;
  value:string;
}

export interface IVariant {
  sku?: string;
   _id: mongoose.Types.ObjectId;
 
  attributes?:IArrtibutes; 
  stock: number;
  mrp?: number;      
  basePrice?: number;  
  images?: string[];    
  isActive: boolean;   
      
}

export interface ISEO {
  metaTitle?: string;
  metaDescription?: string;
  keywords?: string[];

}

export interface IProduct extends Document {
  name: string;
  slug: string;
  description: string;
  shortDescription?: string;
  category: mongoose.Types.ObjectId; 
  tags?: string[];
  isFeatured: boolean;
  isNewArrived: boolean;
  isBestSaller: boolean;
  isActive: boolean;
  thumbnail: string;
  images: string[] | [ ];
  videoUrl?: string;
  variants: IVariant[];
  seo: ISEO;
  details:Map<string, string>;
  createdAt: Date;
  updatedAt: Date;
}

const VariantSchema = new Schema<IVariant>({
  
  sku: { type: String, trim: true, sparse: true },
  
  attributes: {
    itemtype:{
    type:String,
    },
    value:{
        type:String,
    }
  },

  stock: { type: Number, default: 0, min: 0 },
  mrp: { type: Number, min: 0 }, 
  basePrice: { type: Number, default: 0 },
  images: { type: [String], default: [] },
  isActive: { type: Boolean, default: true },
  
},{_id:true});

const ProductSchema: Schema<IProduct> = new Schema(
  {
       name: { 
      type: String, 
      required: [true, 'Product name is required'], 
      trim: true,
      index: true 
    },
    slug: { 
      type: String, 
      required: true, 
      unique: true, 
      lowercase: true 
    },
    description: { 
      type: String, 
      required: [true, 'Description is required'] 
    },
    shortDescription: { 
      type: String, 
      maxlength: 200 
    },

    category: { 
      type: Schema.Types.ObjectId, 
      ref: 'category', 
      required: true 
    },
    tags: [String],
    isFeatured: { type: Boolean, default: false },
    isNewArrived: { type: Boolean, default: false },
    isBestSaller: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    thumbnail:{
type: String, 
     required:true
    },
  images: {
    type: [String], 
    default: []     
  },    
    variants: [
      VariantSchema
    ],
    seo: {
      metaTitle: String,
      metaDescription: String,
      keywords: [String]
    },
     details: {
      type: Map,
      of: String,
      default: {}
    },


  },
  {
    timestamps: true 
  }
);

const Product: Model<IProduct> = mongoose.models.Product || mongoose.model<IProduct>('products', ProductSchema);

export default Product;