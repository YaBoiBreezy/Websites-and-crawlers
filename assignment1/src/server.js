import express from "express";
import { PrismaClient } from "@prisma/client";
import * as middleware from "./middleware.js";
import * as schema from "./schema.js";
import * as errors from "./errors.js";
import elasticlunr from "elasticlunr";

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

console.log(`There are ${await db.page.count()} pages in the db`);


function makeIndex() {
  var index = elasticlunr(function () {
    this.addField("title");
    this.addField("body");
    this.setRef("id");
  });

  return db.page
    .findMany({
      include: {
        crawls: true,
      },
    })
    .then((pages) => {
      const promises = pages.map(async (page) => {
        if (page.crawls.length > 0) {
          await index.addDoc({
            id: page.id,
            title: page.crawls[page.crawls.length - 1].title,
            body: page.crawls[page.crawls.length - 1].content,
          });
        }
      });

      return Promise.all(promises).then(() => index);
    });
}

let index;
makeIndex()
  .then((i) => {
    index = i;
    //console.log(index.documentStore); //long, all docs in index
    console.log("index made");
  })
  .catch((error) => {
    console.error(error);
  });

// handler for root
app.get(
  "/",
  middleware.validate(schema.ListPagesRequest),
  async (req, res, next) => {
    try {
      let input = {
        query: req.query.name ? req.query.name.trim() : "", 
        limit: req.query.limit ? parseInt(req.query.limit, 10) : 10,
      };
      console.log(input.query+" "+input.limit);

      let rankedPages = index.search(input.query, {
        fields: {
          title: {},
          body: {},
        },
      });

      const topPages = [];
      //gets top 10 pages
      const promises = rankedPages.slice(0, input.limit).map(async (page) => {
        const id = page.ref;
        const score = parseFloat(page.score) * 10; //make score 0-10 to look nicer
        const dbPage = await db.page.findUnique({
          where: { id: parseInt(id) },
          include: { crawls: true },
        });
        const title = dbPage.crawls[dbPage.crawls.length - 1].title;
        const url = dbPage.url;
        topPages.push({ id, url, title, score });
      });

      Promise.all(promises).then(() => {
        console.log(topPages);

        res.status(200).format({
          "application/json": () => {
            res.json(topPages);
          },
          "text/html": () => {
            res.render("index", { topPages });
          },
        });
      });
    } catch (error) {
      return next(error);
    }
  }
);

// handler for listing top 10 pages by incoming links
app.get("/popular", async (req, res, next) => {
  try {
    const topPages = await db.page.findMany({
      include: {
        incomingLinks: {
          include: {
            source: true,
          },
        },
      },
      orderBy: {
        incomingLinks: {
          _count: "desc",
        },
      },
      take: 10,
    });

    return res.status(200).format({
      "application/json": () => {
        res.json(topPages);
      },
      "text/html": () => {
        res.render("popular/index", { topPages });
      },
    });
  } catch (error) {
    return next(error);
  }
});

// handler for viewing a specific url
app.get(
  "/popular/:pageId",
  middleware.validate(schema.ViewPageRequest),
  async (req, res, next) => {
    try {
      let input = {
        pageId: Number(req.params.pageId),
      };

      let page = await db.page.findUnique({
        where: { id: input.pageId },
        include: {
          incomingLinks: {
            include: {
              source: true,
            },            
          },
          outgoingLinks: {
            include: {
              source: true,
            },
          },
        },
      });

      if (!page) {
        return next(new errors.ResourceNotFoundError("Page not found."));
      }

      return res.status(200).format({
        "application/json": () => {
          res.json(page);
        },
        "text/html": () => {
          res.render("popular/page/index", { page });
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
