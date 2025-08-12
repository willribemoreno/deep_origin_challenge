
describe("Get all products", () => {
  it("get products without using params (default)", () => {
    /**
     * Without a clear requirement, this test is a bit confusing.
     * I don't know which should be the default behavior with no params is passed to the API call.
     * The documentation says "By default you will get 30 items, use Limit and skip to paginate through all items.".
     * Does it mean that if no params are passed, the API should return 30 items? Or the API expects limit=0 and skip=0?
     * I'm considering it's a bug in the API based on the API description. Then, I'm considering it should, by default (without params),
     * return only 30 items without skip (limit=30, skip=0).
     */
    cy.getAllProducts().then((resp) => {
      expect(resp.status).to.eq(200);
      expect(resp.body.products).to.have.length(0);
      expect(resp.body.limit).to.eq(0);
      expect(resp.body.skip).to.be.null; // Should it really be null or undefined. Maybe a bug in the API? Shouldn't it return a default value?
      expect(resp.body.total).to.eq(194);
    });
  });

  it("gets products with limit=5 (simulates pagination)", () => {
    cy.getAllProducts(5, 5).then((resp) => {
      expect(resp.status).to.eq(200);
      expect(resp.body.products).to.have.length(5);
      expect(resp.body.limit).to.eq(5);
      expect(resp.body.skip).to.eq(5);
      expect(resp.body.total).to.eq(194);
    });
  });

  it("get products by setting limit and skip to 0 (all products)", () => {
    cy.getAllProducts(0, 0).then((resp) => {
      expect(resp.status).to.eq(200);
      expect(resp.body.products).to.have.length(194);
      expect(resp.body.limit).to.eq(194);
      expect(resp.body.skip).to.eq(0);
      expect(resp.body.total).to.eq(194);
    });
  });
});


describe("Get single product", () => {
  /**
   * You can also check the product values if there is any specific requirement. It's not covered here
   * as the focus is on the API call and response structure.
   */
  it("get single product", () => {
    cy.getProducts(1).then((resp) => {
      expect(resp.status).to.eq(200);
      expect(resp.body).to.have.keys("id", "title", "description", "category", "price", "discountPercentage", "rating", "stock",
        "tags", "brand", "sku", "weight", "dimensions", "warrantyInformation", "shippingInformation",
        "availabilityStatus", "reviews", "returnPolicy", "minimumOrderQuantity", "meta", "images", "thumbnail");
    });
  });
});

describe("Search products", () => {
  it("Search by phone", () => {
    cy.searchProduct("phone").then((resp) => {
      expect(resp.status).to.eq(200);
      expect(resp.body.products).to.have.length(23);
      expect(resp.body.limit).to.eq(23);
      expect(resp.body.skip).to.eq(0);
      expect(resp.body.total).to.eq(23);
    });
  });

  it("Search by phone with limit and skip set to 5", () => {
    cy.searchProduct("phone", 5, 5).then((resp) => {
      expect(resp.status).to.eq(200);
      expect(resp.body.products).to.have.length(5);
      expect(resp.body.limit).to.eq(5);
      expect(resp.body.skip).to.eq(5);
      expect(resp.body.total).to.eq(23);
    });
  });

  it("Search by phone with ONLY limit set to 5", () => {
    cy.searchProduct("phone", 5).then((resp) => {
      expect(resp.status).to.eq(200);
      expect(resp.body.products).to.have.length(5);
      expect(resp.body.limit).to.eq(5);
      expect(resp.body.skip).to.eq(0);
      expect(resp.body.total).to.eq(23);
    });
  });

  it("Search by phone with ONLY skip set to 5", () => {
    cy.searchProduct("phone", undefined, 5).then((resp) => {
      expect(resp.status).to.eq(200);
      expect(resp.body.products).to.have.length(18);
      expect(resp.body.limit).to.eq(18); // 23 total - 5 skipped
      expect(resp.body.skip).to.eq(5);
      expect(resp.body.total).to.eq(23);
    });
  });

  it("Search by phone using select strategy", () => {
    const expectedKeys = ["id", "title", "price", "description"];
    cy.filterByMultipleKeys(expectedKeys, 10, 5).then((resp) => {
      expect(resp.status).to.eq(200);
      expect(resp.body.products).to.have.length(10);
      expect(resp.body.limit).to.eq(10);
      expect(resp.body.skip).to.eq(5);
      expect(resp.body.total).to.eq(194);
      expect(resp.body).to.have.property("products").and.to.be.an("array");

      resp.body.products.forEach((product: Record<string, unknown>) => {
        expect(Object.keys(product)).to.have.members(expectedKeys);
        expect(Object.keys(product)).to.have.length(expectedKeys.length);
      });
    });
  });
});

describe("Sort products", () => {
  it("Sort by title with asc ordering", () => {
    cy.sortByNOrder("title", "asc").then((resp) => {
      expect(resp.status).to.eq(200);
      // expect(resp.body.products).to.have.ordered.members([1, 2])
      const values = resp.body.products.map((p) => p.title); // could be string or number

      // Normalize to comparable form
      const normalized = values.map(v =>
        typeof v === "string" ? v.toLowerCase() : v
      );

      const sorted = [...normalized].sort((a, b) => {
        if (typeof a === "string" && typeof b === "string") {
          return a.localeCompare(b);
        }
        return Number(a) - Number(b);
      });

      expect(normalized).to.have.ordered.members(sorted);
    });
  });
});

describe("Get all products categories", () => {
  const categoriesMembers = ["slug", "name", "url"]
  const allowedCategories = ["Beauty", "Fragrances", "Furniture", "Groceries", "Home Decoration", "Kitchen Accessories", "Laptops", "Mens Shirts", "Mens Shoes", "Mens Watches", "Mobile Accessories", "Motorcycle", "Skin Care", "Smartphones", "Sports Accessories", "Sunglasses", "Tablets", "Tops", "Vehicle", "Womens Bags", "Womens Dresses", "Womens Jewellery", "Womens Shoes", "Womens Watches"];
  it("Get all available product categories", () => {
    cy.getProductsCategories().then((resp) => {
      expect(resp.status).to.eq(200);
      resp.body.forEach((category: Record<string, unknown>) => {
        expect(Object.keys(category)).to.contain.members(categoriesMembers)
        expect(allowedCategories).to.include(category.name);
        // expect(Object.keys(category.name)).to.contain(allowedCategories);
      });
    });
  });
});

describe("Get products category list", () => {
  const allowedCategories = [
  "beauty",
  "fragrances",
  "furniture",
  "groceries",
  "home-decoration",
  "kitchen-accessories",
  "laptops",
  "mens-shirts",
  "mens-shoes",
  "mens-watches",
  "mobile-accessories",
  "motorcycle",
  "skin-care",
  "smartphones",
  "sports-accessories",
  "sunglasses",
  "tablets",
  "tops",
  "vehicle",
  "womens-bags",
  "womens-dresses",
  "womens-jewellery",
  "womens-shoes",
  "womens-watches"
];
  it("Get all available product categories", () => {
    cy.getAllProductsCategoryList().then((resp) => {
      expect(resp.status).to.eq(200);
      resp.body.forEach((name: string) => {
        expect(allowedCategories).to.include(name);
        // expect(Object.keys(category.name)).to.contain(allowedCategories);
      });
    });
  });
});
