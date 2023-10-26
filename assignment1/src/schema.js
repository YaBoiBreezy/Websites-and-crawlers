import { z } from "zod";

let EmptyObject = z.object({}).strict();

let ID = z.coerce.number().int().positive();

let Price = z.coerce.number().nonnegative();

let Dimension = z.coerce.number().positive();

let Count = z.coerce.number().int().nonnegative();

let Name = z.string().trim().nonempty();

let Rating = z.coerce.number().int().min(0).max(10);

let NameQuery = z.string().trim().optional();

let limit= z.string().trim().optional();

let InStockQuery = z.literal("on").optional();

export let CreateProductRequest = z.object({
  params: EmptyObject,
  query: EmptyObject,
  body: z
    .object({
      name: Name,
      price: Price,
      dimensionX: Dimension,
      dimensionY: Dimension,
      dimensionZ: Dimension,
      stock: Count,
    })
    .strict(),
});

export let ViewProductRequest = z.object({
  params: z.object({ productId: ID }).strict(),
  query: EmptyObject,
  body: EmptyObject,
});

export let ViewPageRequest = z.object({
  params: z.object({ pageId: ID }).strict(),
  query: EmptyObject,
  body: EmptyObject,
});

export let ListPagesRequest = z.object({
  params: EmptyObject,
  query: z.object({ name: NameQuery, limit: limit }).strict(),
  body: EmptyObject,
});

export let CreateProductReviewRequest = z.object({
  params: z.object({ productId: ID }),
  query: EmptyObject,
  body: z.object({ rating: Rating }).strict(),
});

export let ListProductReviewsRequest = z.object({
  params: z.object({ productId: ID }).strict(),
  query: EmptyObject,
  body: EmptyObject,
});

export let CreateOrderRequest = z.object({
  params: EmptyObject,
  query: EmptyObject,
  body: z
    .object({
      username: Name,
      orderItems: z.array(
        z.object({ productId: ID, quantity: Count }).strict()
      ),
    })
    .strict(),
});

export let ViewOrderRequest = z.object({
  params: z.object({ orderId: ID }).strict(),
  query: EmptyObject,
  body: EmptyObject,
});

export let ListOrdersRequest = z.object({
  params: EmptyObject,
  query: EmptyObject,
  body: EmptyObject,
});
