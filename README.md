## Install
On your terminal, run
``` bash
npm ci
```

## Run your tests via CLI
``` bash
npx cypress run --browser edge --headed --spec cypress/e2e/api/products.cy.ts
```
You can change the browser to your prefered one

## Considerations
* A few corner case were not covered in order to not take too much time on it. I am assuming that the goal of this task is to check the technical qualification, therefore, I'm not spending too much time on covering many different cases and corner cases.
* I'm not running the tests for all endpoint as it would take a considerable time.
* Contract test can be added on the test coverage, but, by the same reasons already explained, I'm not covering it here.

## Tested API DOC
[dummyjson](https://dummyjson.com/docs/products)