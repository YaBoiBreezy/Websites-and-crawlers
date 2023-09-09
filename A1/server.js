const express = require('express')
const app = express()
const port = 3000
const products = require("./products.json") //import our json data

app.use(express.json()) // body-parser middleware


searchName = function(name){
    return products.find(product => product.name === name)
}



app.get('/', (req,res)=>{
    res.send("Hello World!");
})

app.get('/products',(req,res)=>{
    console.log("GET request for /products");
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
})

app.get('/products/search', function(req,res, next){
    let searchTerm = req.query.name
    let result = searchName(searchTerm);
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