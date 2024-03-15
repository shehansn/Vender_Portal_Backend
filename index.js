const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const dotenv = require("dotenv").config();
const multer = require('multer');
const path = require('path');
const app = express();
app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.static('public'));

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

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const FILE_TYPE_MAP = {
  'image/png': 'png',
  'image/jpeg': 'jpeg',
  'image/jpg': 'jpg'
};

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const isValid = FILE_TYPE_MAP[file.mimetype];
    let uploadError = new Error('invalid image type');

    if (isValid) {
      uploadError = null;
    }
    cb(uploadError, 'public/images');
  },
  filename: function (req, file, cb) {
    const fileName = file.originalname.split(/[\s.]/).slice(0, -1).join('-');//.replace(' ','-')
    const extension = FILE_TYPE_MAP[file.mimetype];
    cb(null, `${fileName}-${Date.now()}.${extension}`);
  }
});

const upload = multer({ storage: storage });

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
  images: [{
    type: String
  }]
});
const productModel = mongoose.model("product", schemaProduct)

//fav product section
const schemaFavProduct = mongoose.Schema({
  id: String,
});
const favProductModel = mongoose.model("favProducts", schemaFavProduct)


//save product api with images array
app.post('/upload', upload.array('images'), async (req, res) => {
  try {
    const { sku, productName, quantity, productDescription } = req.body;
    const images = req.files.map(file => file.path.replace(/^public\//, ''));

    const product = new productModel({ sku, productName, quantity, productDescription, images });
    const savedProduct = await product.save();

    const id = savedProduct._id;

    console.log("id: " + id)
    res.send({ message: 'Product created successfully' });
  } catch (error) {
    console.error(error);
    res.send({ message: 'Internal server error' });
  }
});


// //save product api
// app.post("/addNewProduct", async (req, res) => {
//   console.log(req.body)
//   const data = await productModel(req.body)
//   const datasave = await data.save()
//   if (!datasave)
//     res.send({ message: "Product Adding Failed" })

//   res.send({ message: "Product Added successfully" })
// })

//edit product api
app.put("/editProduct/:prodId", upload.array('images'), async (req, res) => {
  // console.log(req.body)

  const { sku, productName, quantity, productDescription } = req.body;
  const images = req.files.map(file => file.path);
  console.log(sku, productName, quantity, productDescription)

  // const product = new productModel({ sku, productName, quantity, productDescription, images });
  // const savedProduct = await product.save();

  const product = await productModel.findByIdAndUpdate(
    req.params.prodId,
    {
      sku: sku,
      productName: productName,
      quantity: quantity,
      productDescription: productDescription,
      image: images,
    },
    { new: true }
  )
  console.log(product)
  if (!product)
    res.send({ message: "Update Failed" })

  res.send({ message: "Updated successfully" })
})

//add to favourite api
app.post("/addToFav/:prodId", async (req, res) => {
  const productId = await favProductModel.findOne({ id: req.params.prodId });

  if (!productId) {

    const data = await favProductModel({ id: req.params.prodId })
    const datasave = await data.save()
    if (!datasave)
      res.send({ message: "Product Adding Failed" })

    res.send({ message: "Product Added To Favourite successfully" })
  } else {
    const dataSave = await favProductModel.findOneAndRemove({ id: req.params.prodId });
    if (!dataSave)
      res.send({ message: "Product Removing Failed" })

    res.send({ message: "Product Removed From Favourite successfully" })

  }

})

//deleet from favourite api
app.post("/removeFromFav/:prodId", async (req, res) => {
  const productId = await favProductModel.findById(req.params.prodId);

  if (!productId) {

    const data = await favProductModel(req.params.prodId)
    const datasave = await data.save()
    if (!datasave)
      res.send({ message: "Product Adding Failed" })

    res.send({ message: "Product Added To Favourite successfully" })
  } else {
    const dataSave = await favProductModel.findByIdAndRemove(req.params.prodId);
    if (!dataSave)
      res.send({ message: "Product Removing Failed" })

    res.send({ message: "Product Removed From Favourite successfully" })

  }

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

//get all fav products api
app.get("/favProducts", async (req, res) => {
  const data = await favProductModel.find({})
  res.send(JSON.stringify(data))
})
//server is ruuning
app.listen(PORT, () => console.log("server is running at port : " + PORT));
