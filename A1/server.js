const express = require('express');
const app = express();
const cors = require('cors');
app.use(cors());
const port = 3000
const products = require("./products.json") //import our json data
products.forEach(product => { product.reviews = []; }); //add review list to each one
const path = require('path');


app.use(express.json()) // body-parser middleware




function parseBool(str){
    if(str.toLowerCase() === "true"){
        return true;
    }
    else if(str.toLowerCase() === "false"){
        return false;
    }
    else{
        return null;
    }
}

function generateReviewsList(reviews) {
    let reviewsHTML = '';
    reviews.forEach(review => {
        reviewsHTML += `<li>Review: ${review}</li>`;
    });
    return reviewsHTML;
}

function filterProducts(searchTerm, excludeOutOfStock) {
    return products.filter(product => {
        const matchesSearchTerm = product.name.toLowerCase().includes(searchTerm.toLowerCase());
        const isInStock = !excludeOutOfStock || product.stock > 0;
        
        return matchesSearchTerm && isInStock;
    });
}

function filterByID(searchID){
    return products.find(product => product.id === searchID);
}

function calculateMean(reviews) {
    if (reviews.length === 0) return 0;

    const sum = reviews.reduce((acc, review) => acc + review, 0);
    return sum / reviews.length;
}

// GET route for styles.css
app.get('/styles.css', (req, res) => {
    let result = path.join(__dirname, 'styles.css');
    res.sendFile(result, (err) => {
        if (err) {
            res.status(404).send("404 error - file not found :(");
        }
    });
});

app.get('/client.js', (req, res) => {
    let result = path.join(__dirname, 'client.js');
    res.sendFile(result, (err) => {
        if (err) {
            res.status(404).send("404 error - file not found :(");
        }
    });
});


// GET route for search.html
app.get('/search.html',(req,res)=>{
    res.format({
        'text/html' : function(){
            let result = path.join(__dirname, '/search.html');
            console.log(result)
            if (result !== undefined){
                res.sendFile(result);
            }
            else if (result === undefined){
                res.status(404).send("404 error - file not found :(");
            }
            else{
                res.status(500).send("Unkown error occoured. Please try agian.");
            }

        }
    })
})



// GET route for addProduct.html
app.get('/products/addProduct.html',(req,res)=>{
    res.format({
        'text/html' : function(){
            let result = path.join(__dirname, '/addProduct.html');
            console.log(result)
            if (result !== undefined){
                res.sendFile(result);
            }
            else if (result === undefined){
                res.status(404).send("404 error - file not found :(");
            }
            else{
                res.status(500).send("Unkown error occoured. Please try agian.");
            }

        }
    })
})




// Search products by name and inStockOnly boolean
app.get('/products/search', (req, res) => {
    console.log("HI");
    const searchTerm = req.query.name;
    const inStockOnly = req.query.inStock === 'true'; // url is string, had to convert it to a boolean
    if (typeof inStockOnly !== 'boolean') {
        return res.status(400).json({ error: 'inStockOnly should be bool' });
    }
    console.log(searchTerm,inStockOnly);

    const results = filterProducts(searchTerm, inStockOnly); //find all matching products 
    
    if(results !== undefined){
        res.status(200).send(results);
    }
    else if(result === undefined){
        res.status(404).send("404 error - Not found");
    }
    else{
        res.status(500).send("500 error. An unknown error occoured");
    }

});

//get route for specific product page
app.get('/products/product', (req, res) => {
    console.log("prod")
    const productId = parseInt(req.query.id);

    const product = products.find(p => p.id === productId);

     if (product) {
        // Construct HTML as a string
        const html = `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <title>${product.name}</title>
                <!-- <link rel="stylesheet" href="/styles.css"> this stylesheet doesnt work here --> 
                <script src="/client.js" defer></script>
            </head>
            <body>
                <div>
                    <a href="http://localhost:3000/search.html">Return to Search</a>
                </div>

                <h1>${product.name}</h1>
                <p>Price: ${product.price}</p>
                <p>Dimensions: ${product.dimensions.x} x ${product.dimensions.y} x ${product.dimensions.z}</p>
                <p>Stock: ${product.stock}</p>
                <p>Reviews Mean: ${calculateMean(product.reviews)}</p>

                <!-- Link to View Reviews -->
                <a href="http://localhost:3000/products/reviews?id=${product.id}">View Reviews</a>

                <!-- Form for Adding a Review -->
                <form>
                    <label for="reviewInput">Add Review (0-10):</label>
                    <input type="number" id="reviewInput" name="review" min="0" max="10">
                    <button type="button" onclick="addReview(${product.id})">Submit Review</button>
                </form>

            </body>
            </html>
        `;

        res.send(html);
    } else {
        res.status(404).send('Product not found');
    }
})

app.listen(port, () => {
    console.log(`Server listening on PORT: ${port}`)
})

// a get for the search page 
// a post to get specific products based on search term and out of stock which is string and Boolean respectively and those will be in the data{}

// a put to create a new product, no response
app.put('/newProduct', function(req,res, next){
    console.log("new product")
    let newProduct=req.body;
    newProduct.reviews=[]
    console.log(newProduct);

    let highestId = products.reduce((maxId, product) => {
    return (product.id > maxId) ? product.id : maxId;
    }, 0);

    if (newProduct.hasOwnProperty('name') && newProduct.hasOwnProperty('price') && newProduct.hasOwnProperty('dimensions') && newProduct.hasOwnProperty('stock')){
        newProduct.id = highestId+1
        products.push(newProduct);
        res.status(200).send();
    }
    
})

// a get to receive a specific product based on id, use the url for that /products?search=searchTerm

// a put to add a review for a product, so send data{} with id and rating
app.put('/products/addReview', function(req, res, next){
    const productID = parseInt(req.query.id);
    let review = parseInt(req.body.review);
    let product = filterByID(productID);

    if( product){
        product.reviews.push(review);
        res.status(200).send()
    }
    else{
        res.status(404).send("404 error - This product  can't be found");
    }
})

// a get for reviews for specific product ID
app.get('/products/reviews', function(req, res, next){
    const productID = parseInt(req.query.id);
    let product=filterByID(productID);
    let reviewsHTML;
    console.log(product);


     if (product) {
        const acceptHeader = req.get('Accept');
        if (acceptHeader && acceptHeader.includes('application/json')) {
            res.json(product.reviews);
        } else {
            console.log(product.reviews);
            if (product.reviews){
                if (product.reviews.length > 0) {
                    reviewsHTML = generateReviewsList(product.reviews);
                } else {
                    reviewsHTML = '<li>NO REVIEWS FOUND</li>';
                } //list all reviews in new page, with way to return to search
                const html = `
                <!DOCTYPE html>
                <html lang="en">
                <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>${product.name}</title>
                </head>
                <body>
                <div>
                    <a href="http://localhost:3000/search.html">Return to Search</a>
                </div>
                <div>
                    <a href="http://localhost:3000/products/product?id=${productID}">Return to Product</a>
                </div>
                <h1>${product.name}</h1>
                <h2>Reviews:</h2>
                <ul>
                    ${reviewsHTML}
                </ul>
                </body>
                </html>
                `;
                res.status(200).send(html);
            } else {
                res.status(404).send("404 error - This product  has no reviews attribute");
            }
        }
        
    }
    else{
        res.status(404).send("404 error - This product  can't be found");
    }
})