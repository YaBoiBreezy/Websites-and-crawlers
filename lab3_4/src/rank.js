import { PrismaClient } from "@prisma/client";

let db = new PrismaClient();

try {
  let pages = await db.page.findMany();

  let links = await db.link.findMany();
  let linkMap = new Map();
  for (let link of links) {
    if (!linkMap.has(link.sourceId)) {
      linkMap.set(link.sourceId, new Set());
    }
    linkMap.get(link.sourceId).add(link.targetId);
  }

  let size = pages.length;

  let matrix = new Array(size);
  for (let i = 0; i < size; i++) {
    matrix[i] = new Array(size);
    for (let j = 0; j < size; j++) {
      matrix[i][j] = linkMap.get(pages[i].id)?.has(pages[j].id) ? 1 : 0;
    }
  }

  for (let row of matrix) {
    let sum = row.reduce((sum, value) => sum + value, 0);
    for (let j = 0; j < size; j++) {
      row[j] = sum > 0 ? row[j] / sum : 1 / size;
    }
  }

  let alpha = 0.1;
  for (let i = 0; i < size; i++) {
    for (let j = 0; j < size; j++) {
      matrix[i][j] *= 1 - alpha;
      matrix[i][j] += alpha / size;
    }
  }

  let delta = 1e-4;
  let ranks = Array.from({ length: size }, () => 1 / size);
  while (true) {
    let newRanks = Array.from({ length: size }, () => 0);
    for (let i = 0; i < size; i++) {
      for (let j = 0; j < size; j++) {
        newRanks[i] += ranks[j] * matrix[j][i];
      }
    }
    let diff = 0;
    for (let i = 0; i < size; i++) {
      diff += Math.pow(newRanks[i] - ranks[i], 2); //euclidean distance
    }
    diff = Math.sqrt(diff);
    ranks = newRanks;
    if (diff < delta) {
      break;
    }
  }

  let results = new Array(size);
  for (let i = 0; i < size; i++) {
    results[i] = {
      url: pages[i].url,
      rank: Number(ranks[i].toFixed(11)),
    };
  }
  results.sort((a, b) => b.rank - a.rank);

  console.log(results.slice(0, 25));
} catch (error) {
  console.error(error);
} finally {
  await db.$disconnect();
}
