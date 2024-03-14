const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const dotenv = require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json({ limit: "10mb" }));

const PORT = process.env.PORT || 8080;

//mongodb connection
mongoose.set("strictQuery", false);
mongoose
  .connect(process.env.MONGODB_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    dbName: "VENDER_PORTAL_DB"
  })
  .then(() => console.log("Connect to Databse"))
  .catch((err) => console.log(err));


//api
app.get("/", (req, res) => {
  res.send("Server is running");
});

//product section
const schemaProduct = mongoose.Schema({
  sku: String,
  productName: String,
  quantity: String,
  productDescription: String,
  image: String,
  isFav:Boolean
});
const productModel = mongoose.model("product", schemaProduct)

//save product api
app.post("/addNewProduct", async (req, res) => {
  console.log(req.body)
  const data = await productModel(req.body)
  const datasave = await data.save()
  if (!datasave)
    res.send({ message: "Product Adding Failed" })

  res.send({ message: "Product Added successfully" })
})

//edit product api
app.put("/editProduct/:prodId", async (req, res) => {
  console.log(req.body)
  const product = await productModel.findByIdAndUpdate(
    req.params.prodId,
    {
      sku: req.body.sku,
      productName: req.body.productName,
      quantity: req.body.quantity,
      productDescription: req.body.productDescription,
      image: req.body.image,
      isFav:req.body.isFav
    },
    { new: true }
  )
  if (!product)
    res.send({ message: "Update Failed" })

  res.send({ message: "Updated successfully" })
})

//add to favourite api
app.post("/addToFav/:prodId", async (req, res) => {
  console.log(req.body)
  const product = await productModel.findByIdAndUpdate(
    req.params.prodId,
    {
      isFav:req.body.isFav
    },
    { new: true }
  )
  if (!product)
    res.send({ message: "Update Failed" })

  res.send({ message: "Updated successfully" })
})

//delete product api
app.delete("/deleteProd", async (req, res) => {
  console.log(req.body)

  try {
    const product = await productModel.findByIdAndDelete(req.body.prodId);
    if (!product) {
      return res.status(404).send({ message: "Product not found" });
    }
    res.send({ message: "Deleted successfully" });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send({ message: "Internal server error" });
  }

})

//get all products api
app.get("/product", async (req, res) => {
  const data = await productModel.find({})
  res.send(JSON.stringify(data))
})

//server is ruuning
app.listen(PORT, () => console.log("server is running at port : " + PORT));
