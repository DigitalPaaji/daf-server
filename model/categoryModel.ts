import mongoose, { Schema ,Document, model, Types } from "mongoose";


interface ICategory extends Document{
    name:string;
    slug:string;
    image:string;
    product:Types.ObjectId[];
}




const categorySchema = new Schema<ICategory>({
    name:{
        type:String,
        trim:true,
        required:true,
        unique:true,
    },
    slug:{
        type:String,
        trim:true,
        required:true,
        unique:true,
    },
    image:{
        type:String,
        required:true,
        unique:true,
    },

product:[
    {type:mongoose.Schema.Types.ObjectId,ref:"products"}
]

},{
    timestamps:true
})

const Category = model<ICategory>("category",categorySchema)
export default Category;
