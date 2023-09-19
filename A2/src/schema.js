import { z } from "zod";

let EmptyObject = z.object({}).strict();

let ID = z.coerce.number().int().positive();

let Price = z.coerce.number().nonnegative();

let Dimension = z.coerce.number().positive();

let Dimensions = z
  .object({ x: Dimension, y: Dimension, z: Dimension })
  .strict();

let Count = z.coerce.number().int().nonnegative();

let Name = z.string().trim().nonempty();

let Rating = z.coerce.number().int().min(0).max(10);

let NameQuery = Name.optional();

let InStockQuery = z.literal("on").optional();

export let CreateProductRequest = z.object({
  params: EmptyObject,
  query: EmptyObject,
  body: z
    .object({
      name: Name,
      price: Price,
      dimensions: Dimensions,
      stock: Count,
    })
    .strict(),
});

export let ViewProductSchema = z.object({
  params: z.object({ productId: ID }).strict(),
  query: EmptyObject,
  body: EmptyObject,
});

export let ListProductsSchema = z.object({
  params: EmptyObject,
  query: z
    .object({
      name: NameQuery,
      inStock: InStockQuery,
    })
    .strict(),
  body: EmptyObject,
});

export let CreateProductReviewSchema = z.object({
  params: z.object({ productId: ID }),
  query: EmptyObject,
  body: z.object({ rating: Rating }).strict(),
});

export let ListProductReviewsSchema = z.object({
  params: z.object({ productId: ID }).strict(),
  query: EmptyObject,
  body: EmptyObject,
});
