const express = require('express')
const app = express()
const port = 3000
const products = require("./products.json") //import our json data
const path = require('path');


app.use(express.json()) // body-parser middleware


function filterProducts(searchTerm, excludeOutOfStock) {
    return products.filter(product => {
        const matchesSearchTerm = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                 product.id === parseInt(searchTerm);
        const isInStock = !excludeOutOfStock || product.stock > 0;
        
        return matchesSearchTerm && isInStock;
    });
}

function filterByID(searchID){
    return products.find(product => product.id === searchID);
}


app.get('/', (req,res)=>{
    res.send("Hello World!");
})

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

// GET route for reviews.html
app.get('/reviews.html',(req,res)=>{
    res.format({
        'text/html' : function(){
            let result = path.join(__dirname, '/reviews.html');
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

//GET method for getting all products in the store or querying all products by ID
app.get('/products',(req,res)=>{
    console.log("GET request for /products");

    let searchID = req.query.id

    if(searchID !== undefined){
        let result = filterByID(parseInt(searchID));
        if(result !== undefined){
            res.status(200).send(result);
        }
        else if(result === undefined){
            res.status(404).send(`404 error. Product with id ${searchID} not found`);
        }
        else{
            res.status(500).send("500 error. An unknown error occoured");
        }
    }
    else{
        let result = products;
        if(result !== undefined){
            res.status(200).send(result);
        }
        else if(result === undefined){
            res.status(404).send("404 error - Not found");
        }
        else{
            res.status(500).send("500 error. An unknown error occoured");
        }
    }
    
})


// TODO changes need to be made to handle the data of search term and a boolean stock value.
app.get('/products/search', function(req,res, next){
    let searchTerm = req.query.name
    let result = filterProducts(searchTerm, excludeOutOfStock);
    if(result !== undefined){
        res.status(200).send(result);
    }
    else if(result === undefined){
        res.status(404).send("404 error - Not found");
    }
    else{
        res.status(500).send("500 error. An unknown error occoured");
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
app.put('/addReview', function(req, res, next){
    let data=req.body;
    let product=filterByID(data.id);

    if( product){
        product.review=data.rate;
        res.status(200).send()
    }
    else{
        res.status(404).send("404 error - This product  can't be found");
    }
})

// a get for reviews for specific product ID
app.get('/getReview', function(req, res, next){
    let productID=req.query.id;
    let product=filterByID(productID);

    if( product){
        
        res.status(200).send(product.review);
    }
    else{
        res.status(404).send("404 error - This product  can't be found");
    }
})