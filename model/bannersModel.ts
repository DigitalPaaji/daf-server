import { Document,model,Schema } from "mongoose";


interface IBanner extends Document{
count:number;
desktop_Image:string;
mobile_Image:string;
status:Boolean;
}


const bannerSchema = new Schema<IBanner>({
count:{
    type:Number,
    unique:true,
    required:true
},
desktop_Image:{
    type:String,
    required:true,
},
mobile_Image:{
    type:String,
    required:true,
},

status:{
    type:Boolean,
    default:true
}
},{
timestamps:true
})

const Banners = model<IBanner>("banners",bannerSchema)

export default Banners