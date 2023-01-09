const express = require('express');
const cors = require('cors');
require('dotenv').config();
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const { query } = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const app = express();
const port = process.env.PORT || 7000;

// middleware
app.use(cors());
app.use(express.json());

// mongoDb
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@clusterarfan36.opuzllc.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

// jwt token middleware
function verifyJWT(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).send('unauthorized access');
    }
    const token = authHeader.split(' ')[1];
    jwt.verify(token, process.env.ACCESS_TOKEN, function (err, decoded) {
        if (err) {
            return res.status(403).send({ message: 'forbidden access' });
        }
        req.decoded = decoded;
        next();
    });
}

async function run() {
    try {
        const categoryCollection = client.db('assignment12').collection('homeCategories');
        const phoneCollection = client.db('assignment12').collection('allPhone');
        const usersCollection = client.db('assignment12').collection('users');

        // middleware verify admin
        // make sure you use verifyAdmin after verifyJWT
        const verifyAdmin = async (req, res, next) => {
            const decodedEmail = req.decoded.email;
            const query = { email: decodedEmail };
            const user = await usersCollection.findOne(query);
            if (user.userType !== 'admin') {
                return res.status(403).send({ message: 'forbidden access' });
            }
            next();
        };

        // create and send jwt token
        app.get('/jwt', async (req, res) => {
            const email = req.query.email;
            const query = { email: email };
            const user = await usersCollection.findOne(query);
            if (user) {
                const token = jwt.sign({ email }, process.env.ACCESS_TOKEN, { expiresIn: '7d' });
                return res.send({ accessToken: token });
            }
            res.status(403).send({ accessToken: '' });
        });

        // read user info by email
        app.get('/users', async (req, res) => {
            const query = {
                email: req.query.email,
            };
            const checkUser = await usersCollection.findOne(query);
            if (checkUser) {
                return res.send(checkUser);
            }
            res.send({ userType: "not found" });
        });

        // save user info by insertOne
        app.post('/users', async (req, res) => {
            const user = req.body;
            const alreadySaved = await usersCollection.find({ email: user.email }).toArray();

            if (alreadySaved.length) {
                return res.send({ message: 'User already Saved as a Buyer' });
            }
            const result = await usersCollection.insertOne(user);
            res.send(result);
        });

        // read, verify isAdmin, and send boolean
        app.get('/users/admin/:email', async (req, res) => {
            const email = req.params.email;
            const user = await usersCollection.findOne({ email });
            if (!user) {
                return res.send({ isAdmin: false });
            }
            res.send({ isAdmin: user.userType === 'admin' });
        });

        // Read all category
        app.get('/category', async (req, res) => {
            res.send(await categoryCollection.find({}).toArray());
        });

        // read only categoryName(property)
        app.get('/category-names', async (req, res) => {
            res.send(await categoryCollection.find({}).project({ categoryName: 1 }).toArray());
        });

        // read all, same categoryName, product info
        app.get('/products/:id', async (req, res) => {
            res.send(await phoneCollection.find({ categoryName: req.params.id }).toArray());
        });

        // seller: read all added product by current user
        app.get('/products', async (req, res) => {
            const sellerEmail = {
                sellerEmail: req.query.sellerEmail
            };
            if (sellerEmail) {
                return res.send(await phoneCollection.find(sellerEmail).toArray());
            }
            res.send([]);
        });

        // update phoneCollection by //# advertise button
        app.post('/products/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: ObjectId(id) };
            const update = {
                $set: {
                    advertised: true
                }
            };
            res.send(await phoneCollection.updateOne(filter, update));
        });

        // seller: Add A Product
        app.post('/products', async (req, res) => {
            const product = req.body;
            const result = await phoneCollection.insertOne(product);
            res.send(result);
        });

        // delete product : delete one
        app.delete('/products/:id', async (req, res) => {
            res.send(await phoneCollection.deleteOne({ _id: ObjectId(req.params.id) }));
        });

        // get advertised product
        app.get('/advertised', async (req, res) => {
            res.send(await phoneCollection.find({ advertised: true, paid: null }).toArray());
        });

        // limit(2) get advertised product
        app.get('/advertised-limit', async (req, res) => {
            res.send(await phoneCollection.find({ advertised: true, paid: null }).limit(2).toArray());
        });

        // temporary to update field
        // // @ not recommended
        // app.get('/change', async (req, res) => {
        //     const filter = { brandName: "Samsung" };
        //     const options = { upsert: true };
        //     const updatedDoc = {
        //         $set: {
        //             categoryName: "Samsung"
        //         }
        //     };
        //     const result = await phoneCollection.updateMany(filter, updatedDoc, options);
        //     res.send(result);
        // });

        // app.get('/change', async (req, res) => {
        //     const result = await phoneCollection.updateMany(
        //         {},
        //         { $unset: { brandName: "" } }
        //     );
        //     res.send(result);
        // });

        // app.get('/change', async (req, res) => {
        //     const filter = { email: { $regex: "ka@ka.com" } };
        //     const result = await bookingsCollection.deleteMany(filter);
        //     res.send(result);
        // });

        // app.get('/change', async (req, res) => {
        //     const result = await phoneCollection.deleteMany({}.categoryId);
        //     res.send(result);
        // });



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
