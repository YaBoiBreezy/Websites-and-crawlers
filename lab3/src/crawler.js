//Required module (install via NPM - npm install crawler)
import Crawler from "crawler";
import { PrismaClient } from "@prisma/client";

// database
let db = new PrismaClient();

let visite = new Set();
const c = new Crawler({
  maxConnections: 10, //use this for parallel, rateLimit for individual
  //rateLimit: 1000,

  // This will be called for each crawled page
  callback: async function (error, res, done) {
    if (error) {
      console.log(error);
    } else {
      let $ = res.$; //get cheerio data, see cheerio docs for info
      let links = $("a"); //get all links from page
      const url = res.request.uri.href;

      let page = await db.page.findUnique({
        where: {
          url: url,
        },
        select: {
          id: true,
          url: true,
          outgoing: true,
        },
      });

      if (!page) {
        page = await db.page.create({ data: { url: url } });
      }
      console.log(page.id + ": " + page.url);

      $(links).each(async function (i, link) {
        //Log out links
        //In real crawler, do processing, decide if they need to be added to queue
        //   console.log($(link).text() + ':  ' + $(link).attr('href'));
        const absoluteLink = new URL($(link).attr("href"), url).href;

        let newPage = await db.page.findUnique({
          where: {
            url: absoluteLink,
          },
          select: {
            id: true,
            url: true,
            outgoing: true,
          },
        });

        if (!newPage) {
          newPage = await db.page.create({
            data: { url: absoluteLink },
          });
        }
        newPage = await db.page.findUnique({
          where: {
            url: absoluteLink,
          },
          select: {
            id: true,
            url: true,
            outgoing: true,
          },
        });
        console.log("\t" + newPage.id + ": " + newPage.url);

        db.page.update({
          where: { id: page.id },
          data: { outgoing: newPage.id },
        });
        console.log(newPage);
        if (newPage.outgoing.length == 0) {
          //change this to check for the page contents
          c.queue(newPage.url);
        }
      });
    }
    done();
  },
});

//Perhaps a useful event
//Triggered when the queue becomes empty
//There are some other events, check crawler docs
c.on("drain", function () {
  console.log("Done.");
});

//Queue a URL, which starts the crawl
c.queue("https://people.scs.carleton.ca/~davidmckenney/fruitgraph/N-0.html");

async function findPage(url) {
  return await db.page.findUnique({
    where: {
      url: url,
    },
    select: {
      id: true,
      url: true,
    },
  });
}
