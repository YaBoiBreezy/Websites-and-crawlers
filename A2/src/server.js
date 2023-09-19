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
app.set("x-powered-by", false);
app.set("view engine", "pug");
app.set("views", "./src/views");

// middleware
app.use(express.static("./src/public"));
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// handler for root
app.get("/", (req, res) => {
  return res.redirect("/products");
});

// handler for listing/searching products
app.get(
  "/products",
  middleware.validate(schema.ListProductsRequest),
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
        dimensionX: Number(req.body.dimensionX),
        dimensionY: Number(req.body.dimensionY),
        dimensionZ: Number(req.body.dimensionZ),
      };

      let product = await db.product.create({ data: input });

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
  middleware.validate(schema.ViewProductRequest),
  async (req, res, next) => {
    try {
      let input = {
        productId: Number(req.params.productId),
      };

      let product = await db.product.findUnique({
        where: { id: input.productId },
        include: {
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
  middleware.validate(schema.ListProductReviewsRequest),
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
  middleware.validate(schema.CreateProductReviewRequest),
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

// handler for listing/adding orders
app.get("/orders",
  middleware.validate(schema.ListOrdersRequest),
  async (req, res, next) => {
    try {

      const orders = await prisma.order.findMany({
        include: {
          customer: true, // Include the associated customer
          orderItems: {
            include: {
              product: true, // Include the associated product for each item
            },
          },
        },
      });

      return res.status(200).format({
        "application/json": () => {
          res.json(orders);
        },
        "text/html": () => {
          res.render("orders/index", { orders });
        },
      });
    } catch (error) {
      return next(error);
    }
  }
);


// handler for creating order
app.post('/orders', async (req, res, next) => {
  try {
    if (!req.body.name) {
      return res.status(400).json({ error: 'Customer name is missing' });
    }
    const customerName = String(req.body.name);

    let items;
    try {
      items = JSON.parse(req.body.items);
    } catch (error) {
      return res.status(400).json({ error: 'Invalid JSON format for items' });
    }

    let customer = await db.customer.findUnique({
      where: { name: customerName },
    });
  
    if (!customer) {
      return next(new errors.ResourceNotFoundError("c=Customer not found."));
    }

    //loop check stock and existence of each product, give good errors
    for (const productId in items) {
      const quantity = items[productId];
      const product = await prisma.product.findUnique({
        where: {
          id: parseInt(productId),
        },
      });
      if (!product) {
        throw new Error(`Product with ID ${productId} does not exist`);
      }
      if (product.stock < quantity) {
        throw new Error(`Insufficient stock for product with ID ${productId}`);
      }
    }



    //loop create order, reduce stocks =======================================================================================

    let order = await db.order.create({
      data: {
        customerId: input.customerId,
      },
    });

    return res.status(201).format({
      "application/json": () => {
        res.json(order);
      },
      "text/html": () => {
        res.redirect(303, `/orders`);
      },
    });

  } catch (error) {
    return next(error);
  }
})


// handler for getting a specific order
app.get('/orders/:orderId', async(req,res, next)=>{

  try {
    let input = {
      orderId: Number(req.params.orderId),
    };
  } catch (error) {
    return next(error);
  }

  let order = await db.order.findUnique({
    where: { id: input.productId },
    include: { customer: true },
    orderItems: {
      include: {
        product: true, // Include the associated product for each item
      },
    },
  });

  if (!order) {
    return next(new errors.ResourceNotFoundError("Product not found."));
  }

  
  return res.status(200).format({
    "application/json": () => {
      res.json({"order":order});
    },
    "text/html": () => {
      res.render("orders/index", { order });
    },
  })


})


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
