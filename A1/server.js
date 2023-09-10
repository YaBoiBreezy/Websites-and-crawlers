const express = require('express')
const app = express()
const port = 3000
const products = require("./products.json") //import our json data

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

app.put('/newProduct', function(req,res, next){
    console.log("new product")
    let newProduct=req.body;
    console.log(newProduct);

    if (newProduct.id!=undefined){
        if(filterByID(newProduct.id)){
            res.status(404).send("The product ID already exist");
        }
    }
    else (newProduct.hasOwnProperty('name') && newProduct.hasOwnProperty('price') && newProduct.hasOwnProperty('dimensions') && newProduct.hasOwnProperty('stock'));{
        products.push(newProduct);
        res.status(200).send();
    }
    
})


app.listen(port, () => {
    console.log(`Server listening on PORT: ${port}`)
})

// a get for the search page 
// a post to get specific products based on search term and out of stock which is string and Boolean respectively and those will be in the data{}
// a put to create a new product, no response
// a get to receive a specific product based on id, use the url for that /products?search=searchTerm
// a put to add a review for a product, so send data{} with id and rating
// a get for reviews for specific product ID