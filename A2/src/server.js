import express from "express";
import { PrismaClient } from "@prisma/client";
import * as middleware from "./middleware.js";
import * as schema from "./schema.js";
import * as errors from "./errors.js";

// database
let db = new PrismaClient();

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
  return res.redirect("/products");
});

// handler for listing/searching products
app.get(
  "/products",
  middleware.validate(schema.ListProductsSchema),
  async (req, res, next) => {
    try {
      let input = {
        name: req.query.name ? req.query.name.trim() : "",
        inStock: req.query.inStock === "on",
      };

      let products = await db.product.findMany({
        where: {
          name: { contains: input.name },
          stock: { gt: input.inStock ? 0 : -1 },
        },
        include: {
          dimensions: {
            select: { x: true, y: true, z: true },
          },
          _count: {
            select: { reviews: true },
          },
        },
      });

      return res.status(200).format({
        "application/json": () => {
          res.json(products);
        },
        "text/html": () => {
          res.render("products/index", { products });
        },
      });
    } catch (error) {
      return next(error);
    }
  }
);

// handler for adding a product
app.post(
  "/products",
  middleware.validate(schema.CreateProductRequest),
  async (req, res, next) => {
    try {
      let input = {
        name: req.body.name.trim(),
        price: Number(req.body.price),
        stock: Number(req.body.stock),
        dimensions: {
          x: Number(req.body.dimensions.x),
          y: Number(req.body.dimensions.x),
          z: Number(req.body.dimensions.x),
        },
      };

      let product = await db.product.create({
        data: {
          name: input.name,
          price: input.price,
          stock: input.stock,
          dimensions: { create: input.dimensions },
        },
      });

      return res.status(201).format({
        "application/json": () => {
          res.json(product);
        },
        "text/html": () => {
          res.redirect(303, "/products");
        },
      });
    } catch (error) {
      return next(error);
    }
  }
);

// handler for viewing a product
app.get(
  "/products/:productId",
  middleware.validate(schema.ViewProductSchema),
  async (req, res, next) => {
    try {
      let input = {
        productId: Number(req.params.productId),
      };

      let product = await db.product.findUnique({
        where: { id: input.productId },
        include: {
          dimensions: {
            select: { x: true, y: true, z: true },
          },
          _count: {
            select: { reviews: true },
          },
        },
      });

      if (!product) {
        return next(new errors.ResourceNotFoundError("Product not found."));
      }

      return res.status(200).format({
        "application/json": () => {
          res.json(product);
        },
        "text/html": () => {
          res.render("products/product/index", { product });
        },
      });
    } catch (error) {
      return next(error);
    }
  }
);

// handler for listing reviews of a product
app.get(
  "/products/:productId/reviews",
  middleware.validate(schema.ListProductReviewsSchema),
  async (req, res, next) => {
    try {
      let input = {
        productId: Number(req.params.productId),
      };

      let product = await db.product.findUnique({
        where: { id: input.productId },
        include: { reviews: true },
      });

      if (!product) {
        return next(new errors.ResourceNotFoundError("Product not found."));
      }

      return res.status(200).format({
        "application/json": () => {
          res.json(product.reviews);
        },
        "text/html": () => {
          res.render("products/product/reviews/index", { product });
        },
      });
    } catch (error) {
      return next(error);
    }
  }
);

// handler for adding a review for a product
app.post(
  "/products/:productId/reviews",
  middleware.validate(schema.CreateProductReviewSchema),
  async (req, res, next) => {
    try {
      let input = {
        productId: Number(req.params.productId),
        rating: Number(req.body.rating),
      };

      let product = await db.product.findUnique({
        where: { id: input.productId },
      });

      if (!product) {
        return next(new errors.ResourceNotFoundError("Product not found."));
      }

      let review = await db.review.create({
        data: {
          productId: input.productId,
          rating: input.rating,
        },
      });

      return res.status(201).format({
        "application/json": () => {
          res.json(review);
        },
        "text/html": () => {
          res.redirect(303, `/products/${input.productId}/reviews`);
        },
      });
    } catch (error) {
      return next(error);
    }
  }
);

// global error handler
app.use((error, req, res, next) => {
  console.error(error);

  let status = 500;

  if (error instanceof errors.InputValidationError) {
    status = 400;
  } else if (error instanceof errors.ResourceNotFoundError) {
    status = 404;
  } else if (error instanceof errors.BusinessRuleViolationError) {
    status = 409;
  }

  return res.status(status).format({
    "application/json": () => {
      return res.json({
        name: error.name,
        message: error.message,
      });
    },
    "text/html": () => {
      return res.render("error", {
        message: error.message,
      });
    },
  });
});

// start server
app.listen(app.get("port"), () => {
  console.info(
    `Server listening at http://${app.get("host")}:${app.get("port")}`
  );
});
