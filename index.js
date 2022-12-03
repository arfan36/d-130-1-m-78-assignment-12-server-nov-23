const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion } = require('mongodb');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 7000;

// middleware
app.use(cors());
app.use(express.json());

// mongoDb
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@clusterarfan36.opuzllc.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run() {
    try {
        const categoryCollection = client.db('assignment12').collection('homeCategories');
        const phoneCollection = client.db('assignment12').collection('allPhone');

        // Read all home categories
        app.get('/categories', async (req, res) => {
            res.send(await categoryCollection.find({}).toArray());
        });

        // read specific category item
        app.get('/category/:id', async (req, res) => {
            res.send(await phoneCollection.find({ categoryId: req.params.id }).toArray());
        });
    }
    finally {

    }
}

run().catch(err => console.log(err));


app.get('/', (req, res) => {
    res.send('Server running');
});

app.listen(port, () => {
    console.log(`Listening to port ${port}`);
});
