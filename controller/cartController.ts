import type { Request, Response } from "express";
import Cart from "../model/cartModel";
import Product from "../model/productSchema"
import mongoose from "mongoose";
import User from "../model/userModel";


interface UserAuth extends Request{
    user : any
} 


export const addToCart=async(req:UserAuth,res:Response)=>{
try {
    const user = req.user;
     const {productid,variantid ,quantity} = req.body ;
    if (!productid || !quantity || quantity <= 0) {
      return res.status(400).json({ success:false, message: "Invalid data" });
    }   const product = await Product.findById(productid);
     if (!product || !product.isActive) {
      return res.status(404).json({  success:false,message: "Product not available" });
    }

    const productVariant = product.variants.find((item: any) => item._id.toString() === variantid.toString());

if(!productVariant){
  return 
}

    if (productVariant.stock < quantity) {
      return res.status(400).json({ success:false, message: "Insufficient stock" });
    }
    
    let cartItem  = await Cart.findOne({user:user._id,product:productid,productvarient:variantid.toString()});
    
  let addNew= false
     if(cartItem ){
        cartItem.quantity +=quantity;

    if( Number(cartItem.quantity) > Number(productVariant.stock) ){
 return res.status(400).json({  success:false,message: "Stock limit exceeded" });
    }

      cartItem.price = Number(productVariant.mrp);
      cartItem.total = Number(cartItem.quantity) * Number(cartItem.price);

      await cartItem.save();

     }
     
     else{
       cartItem = await Cart.create({
        user: user._id,
        product: productid,
        quantity,
        productvarient:variantid.toString(),
        price:Number( productVariant.mrp),
        total: Number(productVariant.mrp) * quantity,
      });

    await User.findByIdAndUpdate(user._id,{ $inc: { cartCount: 1 } });
   addNew=true


     }


  return res.status(200).json({
      message: "Product added to cart",
      addNew,
      success:true
    });

    
} catch (error) {

        return res.status(500).json({ success:false, message: "Server error" });

}
}



export const addIncrement = async (req: UserAuth, res: Response) => {
  try {
    const user = req.user;
    const { cartid } = req.params;

    const cart = await Cart.findOne({
      _id: cartid,
      user: user._id,
    }).populate("product");

    if (!cart) {
      return res.status(404).json({ message: "Cart item not found" });
    }

    const product = cart.product as any;

   
    if ( Number(cart?.quantity) + 1 > product.stock) {
      return res.status(400).json({ message: "Stock limit reached" });
    }

    cart.quantity  =  Number(cart?.quantity) + 1 ;
    cart.total = Number(cart.quantity) * Number(cart.price);

    await cart.save();

    return res.status(200).json({
      message: "Cart quantity updated successfully",
      success:true,
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};



export const cartDecrement = async (req: UserAuth, res: Response) => {
  try {
    const user = req.user;
    const { cartid } = req.params;

    const cart = await Cart.findOne({
      _id: cartid,
      user: user._id,
    });

    if (!cart) {
      return res.status(404).json({ message: "Cart item not found",success:false });
    }

  

    if (Number(cart.quantity) <= 1) {
      await Cart.deleteOne({ _id: cartid });
await User.findOneAndUpdate(
  { _id: user._id, cartCount: { $gt: 0 } },
  { $inc: { cartCount: -1 } },
  { new: true }
);
      return res.status(200).json({
        message: "Item removed from cart",
        success:true,
        
      });
    }

  
    cart.quantity =   Number(cart.quantity)  - 1;
    cart.total = Number(cart.quantity) * Number(cart.price);

    await cart.save();

    return res.status(200).json({
      message: "Quantity decreased",
      success:true,
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};



export const deleteCart = async (req: UserAuth, res: Response) => {
  try {
    const user = req.user;
    const { id } = req.params;

    const cart = await Cart.findOne({
      _id: id,
      user: user._id, // 🔥 ensure cart belongs to user
    });

    if (!cart) {
      return res.status(404).json({ message: "Cart item not found",success:false  });
    }

    await cart.deleteOne();


await User.findOneAndUpdate(
  { _id: user._id, cartCount: { $gt: 0 } },
  { $inc: { cartCount: -1 } },
  { new: true }
);

    return res.status(200).json({
      message: "Cart item removed successfully",
      success:true
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};



export const  getAllCartitem = async (req: UserAuth, res: Response) => {
  try {
    const user = req.user;

    const cartItems = await Cart.find({ user: user._id })
      .populate({path:"product",select:"category name thumbnail variants slug"})
      .sort({ createdAt: -1 });

 
   


    const grandTotal = cartItems.reduce(
      (acc, item : any) => acc +    (item?.price * item.quantity ),
      0
    );

    return res.status(200).json({
      success:true,
      message: "Cart fetched successfully",
      count: cartItems.length,
      grandTotal,
      cartItems,
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};



export const getCartProductsLocal = async (
  req: Request,
  res: Response,
) => {
  try {
    const { cart } = req.body;

    if (!Array.isArray(cart) || cart.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Cart is empty",
      });
    }

    // Validate incoming cart data
    for (const item of cart) {
      if (
        !mongoose.Types.ObjectId.isValid(item.productid) ||
        !mongoose.Types.ObjectId.isValid(item.variantid)
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid product or variant ID",
        });
      }

      if (!item.quantity || Number(item.quantity) < 1) {
        return res.status(400).json({
          success: false,
          message: "Quantity must be at least 1",
        });
      }
    }

    const productIds = [
      ...new Set(cart.map((item) => item.productid.toString())),
    ];

    const products = await Product.find({
      _id: { $in: productIds },
      isActive: true,
    }).select(
      "name slug thumbnail variants"
    );

    const cartProducts = [];
    const unavailableItems = [];

    for (const cartItem of cart) {
      const product = products.find(
        (item) =>
          item._id.toString() === cartItem.productid.toString()
      );

      if (!product) {
        unavailableItems.push({
          productid: cartItem.productid,
          variantid: cartItem.variantid,
          reason: "Product not found or inactive",
        });

        continue;
      }

      const variant = product.variants.find(
        (item: any) =>
          item._id.toString() === cartItem.variantid.toString()
      );

      if (!variant || variant.isActive === false) {
        unavailableItems.push({
          productid: cartItem.productid,
          variantid: cartItem.variantid,
          reason: "Variant not found or inactive",
        });

        continue;
      }

      const quantity = Number(cartItem.quantity);

      if (variant.stock < quantity) {
        unavailableItems.push({
          productid: cartItem.productid,
          variantid: cartItem.variantid,
          availableStock: variant.stock,
          requestedQuantity: quantity,
          reason: "Insufficient stock",
        });

        continue;
      }

      // Change this according to your variant schema
      const unitPrice =
        variant?.mrp;

      if (unitPrice === undefined || unitPrice === null) {
        unavailableItems.push({
          productid: cartItem.productid,
          variantid: cartItem.variantid,
          reason: "Variant price is unavailable",
        });

        continue;
      }

      cartProducts.push({
        productid: product._id,
        variantid: variant?._id,
        name: product.name,
        slug: product.slug,
        thumbnail: product.thumbnail,
        quantity,
        price: unitPrice,
        total: unitPrice * quantity,
        variant: {
          _id: variant?._id,
          sku: variant.sku,
          attributes: variant.attributes,
          stock: variant.stock,
          images: variant.images,
        },
      });
    }

    const subtotal = cartProducts.reduce(
      (sum, item) => sum + item.total,
      0
    );

    return res.status(200).json({
      success: true,
      cart: cartProducts,
      unavailableItems,
      totalItems: cartProducts.reduce(
        (sum, item) => sum + item.quantity,
        0
      ),
      subtotal,
    });
  } catch (error) {
   return  res.status(500).json({
success:false,
message:error
   })
  }
};

