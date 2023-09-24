//Required module (install via NPM - npm install crawler)
import Crawler from "crawler";

// Now you can use the Crawler module as you normally would


const c = new Crawler({
    maxConnections : 10, //use this for parallel, rateLimit for individual
    //rateLimit: 1000,

    // This will be called for each crawled page
    callback : function (error, res, done) {
        if(error){
            console.log(error);
        }else{
            let $ = res.$; //get cheerio data, see cheerio docs for info
            let links = $("a") //get all links from page
            $(links).each(function(i, link){
              //Log out links
              //In real crawler, do processing, decide if they need to be added to queue
              console.log($(link).text() + ':  ' + $(link).attr('href'));
            });
        }
        done();
    }
});

//Perhaps a useful event
//Triggered when the queue becomes empty
//There are some other events, check crawler docs
c.on('drain',function(){
    console.log("Done.");
});

//Queue a URL, which starts the crawl
c.queue('https://people.scs.carleton.ca/~davidmckenney/fruitgraph/N-0.html');
