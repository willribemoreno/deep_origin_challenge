const ALLOWED_SORT_BY_KEYS = [
  "id", "title", "description", "category", "price", "discountPercentage",
  "rating", "stock", "tags", "brand", "sku", "weight", "dimensions",
  "warrantyInformation", "shippingInformation", "availabilityStatus",
  "reviews", "returnPolicy", "minimumOrderQuantity", "meta", "images", "thumbnail"
] as const;

type SortKeyType = typeof ALLOWED_SORT_BY_KEYS[number];

declare global {
  namespace Cypress {
    interface Chainable {
      /**
       * Login a user and store auth + refresh tokens in memory.
       * Returns { accessToken, refreshToken }.
       */
      loginUser(
        username: string,
        password: string,
        expiresInMins?: number
      ): Chainable<{ accessToken: string; refreshToken: string }>;

      /**
       * Get the current authenticated user profile.
       */
      getCurrentUser(): Chainable<any>;

      /**
       * Refresh the current auth session.
       * Optionally provide a refresh token; defaults to stored one.
       */
      refreshSession(
        refreshToken?: string,
        expiresInMins?: number
      ): Chainable<{ accessToken: string; refreshToken: string }>;

      /**
       * Get a single product by ID.
       * @param productId ID of the product to fetch
       * @param limit items per page
       * @param skip offset
       */
      getProducts(productId: number): Chainable<any>;

      /**
       * Get all products, paginated automatically
       * @param limit items per page
       * @param skip offset
       */
      getAllProducts(limit?: number, skip?: number): Chainable<any>;

      /**
       * Search for products with optional pagination.
       * @param q fields to select from the product
       * @param limit items per page
       * @param skip offset
       */
      searchProduct(q: string, limit?: number, skip?: number): Chainable<any>;

      /**
       * Filter the returned products keys based on the provided keys.
       * This is useful for selecting specific fields from the product.
       * @param select A string array of fields to select from the product
       * @param limit items per page
       * @param skip offset
       */
      filterByMultipleKeys(select: string[], limit?: number, skip?: number): Chainable<any>;

      /**
       * Sort and order the returned products based on the provided values.
       * @param sortBy The field to sort by (e.g., "title", "id")
       * @param order The order of sorting, either "asc" or "desc"
       */
      sortByNOrder(
        sortBy: SortKeyType,
        order: string
      ): Chainable<any>;

     /**
       * Asserts that an array of objects is sorted by the given key in the specified order.
       * Case-insensitive for strings; stable with `id` as a tie-breaker if present.
       */
      assertSortedByKey<T extends Record<string, any>>(
        array: T[],
        key: keyof T | string,
        order?: "asc" | "desc"
      ): Chainable<void>;

      /**
       * Get products categories with category information.
       */
      getProductsCategories(): Chainable<any>;

      /**
       * Get the list of all available categories.
       */
      getAllProductsCategoryList(): Chainable<any>;

      /**
       * Get the list of all available categories.
       * @param category The category to filter products by
       */
      getProductByCategory(category: string): Chainable<any>;

      /**
       * Validate data against a JSON schema (Ajv).
       * Fails the test with readable errors if invalid.
       */
      validateSchema(schema: object, data: unknown): Chainable<void>;
    }
  }
}

let accessToken: string | null = null;
let refreshToken: string | null = null;

Cypress.Commands.add("loginUser", (username, password, expiresInMins = 30) => {
  return cy
    .request({
      method: "POST",
      url: "/auth/login",
      headers: { "Content-Type": "application/json" },
      body: {
        username,
        password,
        expiresInMins
      }
    })
    .then((resp) => {
      expect(resp.status).to.eq(200);
      accessToken = resp.body.accessToken;
      refreshToken = resp.body.refreshToken;
      return { accessToken, refreshToken };
    });
});

Cypress.Commands.add("getCurrentUser", () => {
  if (!accessToken) {
    throw new Error("No access token — call cy.loginUser() first");
  }
  return cy
    .request({
      method: "GET",
      url: "/auth/me",
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    })
    .then((resp) => {
      expect(resp.status).to.eq(200);
      return resp.body;
    });
});

Cypress.Commands.add(
  "refreshSession",
  (providedRefreshToken?: string, expiresInMins = 30) => {
    const tokenToUse = providedRefreshToken || refreshToken;
    if (!tokenToUse) {
      throw new Error("No refresh token — call cy.loginUser() first");
    }
    return cy
      .request({
        method: "POST",
        url: "/auth/refresh",
        headers: { "Content-Type": "application/json" },
        body: {
          refreshToken: tokenToUse,
          expiresInMins
        }
      })
      .then((resp) => {
        expect(resp.status).to.eq(200);
        accessToken = resp.body.accessToken;
        refreshToken = resp.body.refreshToken;
        return { accessToken, refreshToken };
      });
  }
);

Cypress.Commands.add("getProducts", (productId) => {
  return cy.request({
    method: "GET",
    url: `/products/${productId}`,
  });
});

Cypress.Commands.add("getAllProducts", (limit, skip) => {
  return cy
    .request({
      method: "GET",
      url: "/products",
      qs: { limit, skip }
    });
});

Cypress.Commands.add("searchProduct", (q, limit, skip) => {
  const qs = {
    q,
    ...(limit != null && { limit }),
    ...(skip != null && { skip })
  };
  return cy
    .request({
      method: "GET",
      url: "/products/search",
      qs
    });
});

Cypress.Commands.add("filterByMultipleKeys", (select, limit, skip) => {
  const qs = {
    select,
    ...(limit != null && { limit }),
    ...(skip != null && { skip }),

  };
  return cy
    .request({
      method: "GET",
      url: "/products",
      qs
    });
});

Cypress.Commands.add("sortByNOrder", (sortBy, order) => {
  return cy
    .request({
      method: "GET",
      url: "/products",
      qs: { sortBy, order }
    });
});

Cypress.Commands.add(
  "assertSortedByKey",
  (array, key, order: "asc" | "desc" = "asc") => {
    const { orderBy, isEqual } = Cypress._;

    // Normalize the primary key for comparison
    const norm = (v: unknown) => {
      if (v == null) return "";                 // null/undefined => empty string
      if (typeof v === "string") return v.toLocaleLowerCase(); // case-insensitive
      return v;                                 // numbers/booleans stay as-is
    };

    // Build iteratees: normalized primary key, then stable tie-breaker if present
    const iteratees: any[] = [
      (o: any) => norm(o[key as any]),
      (o: any) => (o.id ?? 0),
    ];
    const orders: Array<"asc" | "desc"> = [order, "asc"];

    const sorted = orderBy(array, iteratees, orders);

    try {
      expect(
        array,
        `Array should be sorted by '${String(key)}' in ${order} order (case-insensitive for strings)`
      ).to.deep.equal(sorted);
    } catch (err) {
      // Pinpoint the first mismatch for easier debugging
      const firstMismatchIndex = array.findIndex((item, i) => !isEqual(item, sorted[i]));
      if (firstMismatchIndex >= 0) {
        Cypress.log({
          name: "Unordered Item",
          message: `Break at index ${firstMismatchIndex} for key '${String(key)}'`,
          consoleProps: () => ({
            expected: sorted[firstMismatchIndex],
            actual: array[firstMismatchIndex],
            key: String(key),
            order,
          }),
        });
      }
      throw err;
    }
  }
);

Cypress.Commands.add("getProductsCategories", () => {
  return cy
    .request({
      method: "GET",
      url: "/products/categories",
    });
});

Cypress.Commands.add("getAllProductsCategoryList", () => {
  return cy
    .request({
      method: "GET",
      url: "/products/category-list",
    });
});

Cypress.Commands.add("getProductByCategory", () => {
  return cy
    .request({
      method: "GET",
      url: "/products/category/smartphones",
    });
});

export { };
