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

function makeIndex(webIndex) {
  var index = elasticlunr(function () {
    this.addField("title");
    this.addField("body");
    this.setRef("id");
  });

  return db.page
    .findMany({
      where: {
        web: webIndex,
      },
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

let index0;
let index1;
Promise.all([makeIndex(0), makeIndex(1)])
  .then(([indexWeb0, indexWeb1]) => {
    index0 = indexWeb0;
    index1 = indexWeb1;
    console.log("indexes made");
  })
  .catch((error) => {
    console.error(error);
  });

// handler for fruits
app.get(
  "/fruits",
  middleware.validate(schema.ListPagesRequest),
  async (req, res, next) => {
    try {
      let input = {
        query: req.query.name ? req.query.name.trim() : "",
        limit: req.query.limit ? parseInt(req.query.limit, 10) : 10,
        boost: req.query.boost ? req.query.boost.trim() : "false",
      };

      if (input.limit < 1 || input.limit > 50) {
        return next(new errors.BusinessRuleViolationError("invalid limit"));
      }

      console.log(input.query + " " + input.limit);

      let rankedPages = index0.search(input.query, {
        fields: {
          title: {},
          body: {},
        },
      });

      if (input.boost == "on") {
        console.log("boosting");
        for (let i = 0; i < rankedPages.length; i++) {
          let page = rankedPages[i];
          let dbPage = await db.page.findUnique({
            where: { id: parseInt(page.ref) },
            select: {
              rank: true,
            },
          });
          if (dbPage) {
            rankedPages[i].score *= dbPage.rank;
          } else {
            console.log("page not found");
          }
        }
      }

      const topPages = [];
      //gets top 10 pages
      const promises = rankedPages.slice(0, input.limit).map(async (page) => {
        const id = page.ref;
        const score = parseFloat(page.score);
        const dbPage = await db.page.findUnique({
          where: { id: parseInt(id) },
          include: { crawls: true },
        });
        const title = dbPage.crawls[dbPage.crawls.length - 1].title;
        const url = dbPage.url;
        const name = "Alexander Breeze, Mohajer Farhadpur, Benjamin Cyiza";
        const pr = dbPage.rank;
        topPages.push({ id, url, title, score, name, pr });
      });

      Promise.all(promises).then(() => {
        res.status(200).format({
          "application/json": () => {
            res.json(topPages);
          },
          "text/html": () => {
            res.render("fruits", { topPages });
          },
        });
      });
    } catch (error) {
      return next(error);
    }
  }
);

// handler for personal
app.get(
  "/personal",
  middleware.validate(schema.ListPagesRequest),
  async (req, res, next) => {
    try {
      let input = {
        query: req.query.name ? req.query.name.trim() : "",
        limit: req.query.limit ? parseInt(req.query.limit, 10) : 10,
        boost: req.query.boost ? req.query.boost.trim() : "false",
      };

      if (input.limit < 1 || input.limit > 50) {
        return next(new errors.BusinessRuleViolationError("invalid limit"));
      }

      console.log(input.query + " " + input.limit);

      let rankedPages = index1.search(input.query, {
        fields: {
          title: {},
          body: {},
        },
      });

      if (input.boost == "on") {
        for (let i = 0; i < rankedPages.length; i++) {
          let page = rankedPages[i];
          let dbPage = await db.page.findUnique({
            where: { id: parseInt(page.ref) },
            select: {
              rank: true,
            },
          });
          if (dbPage) {
            page.score *= dbPage.rank;
          }
        }
      }

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
        const name = "Alexander Breeze, Mohajer Farhadpur, Benjamin Cyiza";
        const pr = dbPage.rank;
        topPages.push({ id, url, title, score, name, pr });
      });

      Promise.all(promises).then(() => {
        res.status(200).format({
          "application/json": () => {
            res.json(topPages);
          },
          "text/html": () => {
            res.render("personal", { topPages });
          },
        });
      });
    } catch (error) {
      return next(error);
    }
  }
);

// handler for viewing a specific url
app.get(
  "/page/:pageId",
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

      console.log(page);
      console.log(page.crawls.length);
      console.log(page.crawls[page.crawls.length - 1]);
      console.log(page.crawls[page.crawls.length - 1].content);
      let content = page.crawls[page.crawls.length - 1].content;
      const wordFreq = {};
      const words = content.toLowerCase().split(/\W+/);
      for (const word of words) {
        if (word) {
          if (wordFreq[word]) {
            wordFreq[word]++;
          } else {
            wordFreq[word] = 1;
          }
        }
      }
      const wordFreqArray = Object.entries(wordFreq).map(([word, freq]) => ({
        word,
        freq,
      }));
      wordFreqArray.sort((a, b) => b.freq - a.freq);
      page.wordFreq = wordFreqArray;

      return res.status(200).format({
        "application/json": () => {
          res.json(page);
        },
        "text/html": () => {
          res.render("page", { page });
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
