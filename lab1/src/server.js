import express from "express";
import products from "./data/products.js";

// app
let app = express();

// settings
app.set("host", "localhost");
app.set("port", 3000);
app.set("view engine", "pug");
app.set("views", "./src/views");

// middleware
app.use(express.static("./src/public"));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// handler for root
app.get("/", (req, res) => {
  res.redirect("/products");
});

// handler for listing/searching products
app.get("/products", (req, res) => {
  try {
    let input = {
      name: req.query.name?.trim() ?? "",
      inStock: "inStock" in req.query,
    };

    let results = products.filter(
      (product) =>
        (!input.inStock || product.stock > 0) &&
        (!input.name ||
          product.name.toLowerCase().includes(input.name.toLowerCase().trim()))
    );

    res.status(200).format({
      "application/json": () => res.json(results),
      "text/html": () => res.render("products/index", { products: results }),
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});

// handler for adding a product
app.post("/products", (req, res) => {
  try {
    let input = {
      name: req.body.name.trim(),
      price: Number(req.body.price),
      x: Number(req.body.x),
      y: Number(req.body.y),
      z: Number(req.body.z),
      stock: Number(req.body.stock),
    };

    // Validate input data
    if (!input.name || isNaN(input.price) || isNaN(input.x) || isNaN(input.y) || isNaN(input.z) || isNaN(input.stock || input.price<0)) {
      return res.status(400).send("Bad Request - Invalid data");
    }

    let product = {
      id: products.length
        ? Math.max(...products.map((product) => product.id)) + 1
        : 1,
      name: input.name,
      price: input.price,
      dimensions: {
        x: input.x,
        y: input.y,
        z: input.z,
      },
      stock: input.stock,
      reviews: [],
    };

    products.push(product);

    return res.status(201).format({
      "application/json": () => res.json(product),
      "text/html": () => res.redirect(303, "/products"),
    });
  } catch (error) {
    console.error(error);
    return res.status(500).send("Internal Server Error");
  }
});

// handler for listing reviews of a product
app.get("/products/:productId/reviews", (req, res) => {
  try {
    let input = {
      productId: Number(req.params.productId),
    };

    let product = products.find((product) => product.id === input.productId);

    if (!product) {
      let error = {
        type: "Not Found",
        message: "There is no product matching the given ID.",
      };

      return res.status(404).format({
        "application/json": () => res.json(error),
        "text/html": () => res.render("error", error),
      });
    }

    return res.status(200).format({
      "application/json": () => res.json(product.reviews),
      "text/html": () => {
        res.render("products/product/reviews/index", { product });
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).send("Internal Server Error");
  }
});

// handler for viewing a product
app.get("/products/:productId", (req, res) => {
  try {
    let input = {
      productId: Number(req.params.productId),
    };

    let product = products.find((product) => product.id === input.productId);

    if (!product) {
      let error = {
        type: "Not Found",
        message: "There is no product matching the given ID.",
      };

      return res.status(404).format({
        "application/json": () => res.json(error),
        "text/html": () => res.render("error", error),
      });
    }

    return res.status(200).format({
      "application/json": () => res.json(product),
      "text/html": () => res.render("products/product/index", { product }),
    });
  } catch (error) {
    console.error(error);
    return res.status(500).send("Internal Server Error");
  }
});

// handler for adding a review for a product (assumes valid input)
app.post("/products/:productId/reviews", (req, res) => {
  try {
    let input = {
      productId: Number(req.params.productId),
      review: {
        rating: Number(req.body.rating),
      },
    };

    let product = products.find((product) => product.id === input.productId);

    if (!product) {
      let error = {
        type: "Not Found",
        message: "There is no product matching the given ID.",
      };

      return res.status(404).format({
        "application/json": () => res.json(error),
        "text/html": () => res.render("error", error),
      });
    }

    let review = input.review;

    product.reviews.push(review);

    return res.redirect(303, `/products/${input.productId}/reviews`);
  } catch (error) {
    console.error(error);
    return res.status(500).send("Internal Server Error");
  }
});


// start server
app.listen(app.get("port"), () => {
  console.info(
    `Server listening at http://${app.get("host")}:${app.get("port")}`
  );
});
