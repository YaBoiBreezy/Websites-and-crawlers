function addProduct(){
    var name = document.getElementById("name").value;
    var price = parseFloat(document.getElementById("price").value);
    var x = parseInt(document.getElementById("x").value);
    var y = parseInt(document.getElementById("y").value);
    var z = parseInt(document.getElementById("z").value);
    var stock = parseInt(document.getElementById("stock").value);

    var dimensions = { "x": x, "y": y, "z": z };

    var product = {
        "name": name,
        "price": price,
        "dimensions": dimensions,
        "stock": stock
    };

    console.log(product);
    event.preventDefault(); //prevents it from just submitting the form

   fetch('http://localhost:3000/newProduct', {
        method: 'PUT',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(product),
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        console.log('New product added!');
    })
    .catch(error => console.error('Error adding product:', error));
}


function searchProduct() {
    const searchTerm = document.getElementById('search').value;
    const inStockOnly = document.getElementById('inStock').checked;

    fetch(`http://localhost:3000/products/search?name=${searchTerm}&inStock=${inStockOnly}`)   //this isn't working, but it was, wtf
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => displayResults(data))
        .catch(error => console.error('Error fetching results:', error));
}

//this takes search results and makes them into an html list
function displayResults(results) {
    console.log(results);
    const resultsDiv = document.getElementById('results');
    resultsDiv.innerHTML = ''; //prevents weird bug

    results.forEach(product => {
        const productDiv = document.createElement('div');
        productDiv.classList.add('product'); //for css

        const productName = document.createElement('h2');
        const productNameA = document.createElement('a');
        productNameA.textContent = `${product.name}`;
        productNameA.href = `http://localhost:3000/products/product?id=${product.id}`;
        productName.appendChild(productNameA);

        const productStock = document.createElement('p');
        productStock.textContent = `Stock: ${product.stock}`;

        const productDimensions = document.createElement('p');
        productDimensions.textContent = `Dimensions: ${product.dimensions.x}x${product.dimensions.y}x${product.dimensions.z}`;

        const productPrice = document.createElement('p');
        productPrice.textContent = `Price: ${product.price}`;

        const productId = document.createElement('p');
        productId.textContent = `ID: ${product.id}`;

        productDiv.appendChild(productName);
        productDiv.appendChild(productStock);
        productDiv.appendChild(productDimensions);
        productDiv.appendChild(productPrice);
        productDiv.appendChild(productId);

        resultsDiv.appendChild(productDiv);
    });
}

function addReview(productId) {
    const reviewInput = document.getElementById('reviewInput');
    const reviewValue = parseInt(reviewInput.value);

    if (!isNaN(reviewValue) && reviewValue >= 0 && reviewValue <= 10) {
        console.log(`Adding review ${reviewValue} for product ID ${productId}`);
        fetch(`http://localhost:3000/products/addReview?id=${productId}`, {
            method: 'PUT',
            headers: {'Content-Type': 'application/json',},
            body: JSON.stringify({ review: reviewValue }),
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            console.log('Review added successfully');
        })
        .catch(error => console.error('Error adding review:', error));
    } else {
        alert('Please enter value between 0 and 10.');
    }
}