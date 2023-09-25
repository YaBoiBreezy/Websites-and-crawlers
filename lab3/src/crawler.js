//Required module (install via NPM - npm install crawler)
import Crawler from "crawler";
import { PrismaClient } from "@prisma/client";


// database
let db = new PrismaClient();

const c = new Crawler({
  maxConnections: 10, //use this for parallel, rateLimit for individual
  //rateLimit: 1000,

  // This will be called for each crawled page
  callback: function (error, res, done) {
    if (error) {
      console.log(error);
    } else {
      let $ = res.$; //get cheerio data, see cheerio docs for info
      let links = $("a"); //get all links from page
      const url = res.request.uri.href;

      $(links).each(async function (i, link) {
        const absoluteLink = new URL($(link).attr("href"), url).href;

        try {
          // Use the Prisma client to find a page record by its URL
          const page = await db.page.findUnique({
            where: {
              url: absoluteLink,
            },
            select: {
              url: true,
              visitedAt: true,
            },
          });

          if (!page) {
            console.log(page.url );

            // console.log('\t'+$(link).text() + ':  ' + $(link).attr('href'));

            //creating new page record
            try {
                const newPage = db.page.create({
                data: {
                    url: absoluteLink,
                },
                });

                console.log("New Page Created:", newPage.url);
            } catch (error) {
                console.error("Error adding page record:", error);
            }
            c.queue(absoluteLink);
          } 
        } catch (error) {
          console.error("Error retrieving page record:", error);
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
