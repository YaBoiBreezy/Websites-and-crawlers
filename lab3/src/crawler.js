import Crawler from "crawler";
import { PrismaClient } from "@prisma/client";

let db = new PrismaClient();
let batchSize = 5;
let crawler = createCrawler(db, batchSize);
let seedUrl =
  "https://people.scs.carleton.ca/~davidmckenney/fruitgraph/N-0.html";

try {
  await db.page.create({ data: { url: seedUrl } });
  await crawlBatch(db, crawler, batchSize, seedUrl);
} catch (error) {
  console.log(error);
} finally {
  await db.$disconnect();
}

function createCrawler(db, batchSize) {
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
          content: res.body,
        },
      });

      for (let link of links) {
        let targetPage;

        try {
          targetPage = await db.page.create({
            data: { url: link },
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
      console.log("Done.");
      await db.$disconnect();
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
