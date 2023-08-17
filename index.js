//import express
import express from 'express';
import { parseString, parseStringPromise } from 'xml2js';
import https from 'node:https';
import Slam  from './models/slam.js';
import { promisify } from 'node:util';
// fetch rss news articles and create a collection of slam objects for any articles containing "slam" https://search.cnbc.com/rs/search/combinedcms/view.xml?partnerId=wrss01&id=100003114
//const slamItems = await GetSlams();

const app = express();
const port = 3000;
// start the server
app.listen(port, () => console.log(`Listening on port ${port}`));
//make src folder available at root
app.use(express.static('src'));

// make slamJson available at api/slam
app.get('/api/slam', async (req, res) => {
    res.header('Content-Type', 'application/json');
    const slams = await GetSlams();
    res.json(slams);
});

async function GetCnbcSlams() {
    const slamItems = [];
    const requestOptions = {
        method: 'GET',
        headers: {
            'Content-Type': 'application/xml',
        },
        redirect: 'follow'
    };

   await fetch('https://search.cnbc.com/rs/search/combinedcms/view.xml?partnerId=wrss01&id=100003114', requestOptions)
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.text();
    })
    .then(rssText => {
        return parseStringPromise(rssText);
    })
    .then(result => {
        result.rss.channel[0].item.forEach((item) => {
            console.log(item.title);
            if (item.title[0].toLowerCase().includes('fed')) {
                const slamItem = new Slam({
                    title: item.title[0],
                    description: item.description[0],
                    url: item.link[0]
                });
                slamItems.push(slamItem);
            }
        });
    });
    return slamItems;
}

// array of rss urls
const rssUrls = [
    'http://rss.cnn.com/rss/cnn_topstories.rss',
    'http://rss.cnn.com/rss/cnn_world.rss',
    'http://rss.cnn.com/rss/cnn_us.rss',
    'http://rss.cnn.com/rss/cnn_allpolitics.rss'
];

// fetch rss news articles and create a collection of slam objects for any articles containing "slam"
async function GetSlams() {
    const slamItems = [];
    const requestOptions = {
        method: 'GET',
        headers: {
            'Content-Type': 'application/xml',
        },
        redirect: 'follow'
    };
    // for each rss url
    for (const url of rssUrls) {
        // fetch the rss feed
        await fetch(url, requestOptions)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.text();
            })
            .then(rssText => {
                // parse the rss text
                return parseStringPromise(rssText);
            })
            .then(result => {
                // for each item in the rss feed
                result.rss.channel[0].item.forEach((item) => {
                    // if the title contains "slam"
                    if (item.title[0].toLowerCase().includes('slam')) {
                        // create a new slam object and add it to the collection
                        const slamItem = new Slam({
                            title: item.title[0],
                            description: item.description[0],
                            url: item.link[0]
                        });
                        slamItems.push(slamItem);
                    }
                });
            });
    }
    return slamItems;
}
