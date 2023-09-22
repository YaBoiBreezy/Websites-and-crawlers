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
  return res.redirect("/personal");
});

// Define a shared route handler
function sharedRootGet(req, res) {
  try {
    const endpoint = req.params.endpoint; //'fruits' or 'personal'
    let input = {
      q: req.query.name ? req.query.name.trim() : "",
      boost: req.query.boost === "True",
      limit: req.query.limit ? parseInt(req.query.limit, 10) : 10,
    };
    if (input.limit < 1 || input.limit > 50) {
      return next(
        new errors.BusinessRuleViolationError(
          `limit ${input.limit} not within bounds [1,50]`
        )
      );
    }

    let pages = 0; //search the db ======================================

    return res.status(200).format({
      "application/json": () => {
        res.json(pages);
      },
      "text/html": () => {
        res.render("pages/index", { pages, endpoint }); //use endpoint for generating links and title
      },
    });
  } catch (error) {
    return next(error);
  }
}

// Define a shared route handler
function sharedSpecificGet(req, res) {
  try {
    const endpoint = req.params.endpoint; // 'fruits' or 'personal'
    const pageId = req.params.id;

    page = 1; //get specific page from db ================================

    if (!page) {
      return next(
        new errors.ResourceNotFoundError(
          `record of page ${pageId} from scan of ${endpoint} not found`
        )
      );
    }

    return res.status(200).format({
      "application/json": () => {
        res.json(page);
      },
      "text/html": () => {
        res.render("pages/page/index", { page, endpoint }); //use endpoint for generating title
      },
    });
  } catch (error) {
    return next(error);
  }
}

// Define routes
app.get("/:endpoint", sharedRootGet);
app.get("/:endpoint/:id", sharedSpecificGet);

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
