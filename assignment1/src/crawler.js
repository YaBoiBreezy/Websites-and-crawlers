/*import Crawler from "crawler";
import { PrismaClient } from "@prisma/client";

let db = new PrismaClient();
let batchSize = 5;
let crawler0 = createCrawler(db, batchSize, 0);
let crawler1 = createCrawler(db, batchSize, 1);
let seedUrl0 =
  "https://people.scs.carleton.ca/~davidmckenney/fruitgraph/N-0.html";
let seedUrl1 = "https://books.toscrape.com/index.html";

try {
  // await db.page.create({ data: { url: seedUrl0, web: 0 } });
  // await crawlBatch(db, crawler0, batchSize, seedUrl0);

  await db.page.create({ data: { url: seedUrl1, web: 1 } });
  await crawlBatch(db, crawler1, batchSize, seedUrl1);
} catch (error) {
  console.log(error);
} finally {
  await db.$disconnect();
}*/
import Crawler from "crawler";
import { PrismaClient } from "@prisma/client";

let db = new PrismaClient();
let batchSize = 5;
let crawler0 = createCrawler(db, batchSize, 0);
let crawler1 = createCrawler(db, batchSize, 1);
let seedUrl0 =
  "https://people.scs.carleton.ca/~davidmckenney/fruitgraph/N-0.html";
let seedUrl1 = "https://books.toscrape.com/index.html";
let firstCrawlComplete = false;

try {
  crawler0.on("drain", async () => {
    setTimeout(async () => {
      if (firstCrawlComplete) {
        await db.page.create({ data: { url: seedUrl1, web: 1 } });
        await crawlBatch(db, crawler1, batchSize, seedUrl1);
      }
    }, 100); //delay before checking the flag so drain can do its thing
  });

  await db.page.create({ data: { url: seedUrl0, web: 0 } });
  await crawlBatch(db, crawler0, batchSize, seedUrl0);
} catch (error) {
  console.log(error);
} finally {
  await db.$disconnect();
}

function createCrawler(db, batchSize, webIndex) {
  let crawler = new Crawler({
    maxConnections: batchSize,
    callback: async (error, res, done) => {
      let pageUrl = res.options.uri;

      if (error) {
        console.error(error);
        done();
        return;
      }

      console.log(`Crawling ${pageUrl}`);

      let links = new Set();

      res.$("a").each((_, link) => {
        let targetUrl = new URL(res.$(link).attr("href"), pageUrl).href;

        links.add(targetUrl);
      });

      await db.crawl.create({
        data: {
          pageId: res.options.pageId,
          title: res.$("title").text(),
          content: res.body,
        },
      });

      for (let link of links) {
        let targetPage;

        if (link.includes(".zip") || link.startsWith("mailto:")) {
          continue;
        }
        try {
          targetPage = await db.page.create({
            data: { url: link, web: webIndex },
          });
        } catch (error) {
          if (error.code === "P2002") {
            targetPage = await db.page.findFirst({
              where: { url: link },
            });
          }
        }

        let existingLink = await db.link.findFirst({
          where: {
            sourceId: res.options.pageId,
            targetId: targetPage.id,
          },
        });

        if (!existingLink) {
          await db.link.create({
            data: {
              sourceId: res.options.pageId,
              targetId: targetPage.id,
            },
          });
        }
      }

      done();
    },
  });

  crawler.on("drain", async () => {
    let remaining = await db.page.count({
      where: {
        crawls: { none: {} },
      },
    });

    if (remaining > 0) {
      crawlBatch(db, crawler, crawler.options.maxConnections);
    } else {
      console.log("Done a crawl");
      if (!firstCrawlComplete) {
        firstCrawlComplete = true;
        console.log("first crawl is complete");
      } else {
        await db.$disconnect();
      }
    }
  });

  return crawler;
}

async function crawlBatch(db, crawler, size) {
  let batch = await db.page.findMany({
    take: size,
    where: {
      crawls: { none: {} },
    },
  });

  for (let page of batch) {
    crawler.queue({
      uri: page.url,
      pageId: page.id,
    });
  }
}
