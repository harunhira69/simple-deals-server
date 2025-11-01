const express = require('express');
const app = express()
const cors = require('cors');
require('dotenv').config()
const port = process.env.PORT||3000;
app.use(cors());
app.use(express.json());
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.irtmkrl.mongodb.net/?appName=Cluster0`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});
app.get('/',(req,res)=>{
    res.send('DesiDeals Server runninng')

})

async function run() {
  try {
    
    await client.connect();
 const myDB = client.db("smart_db");
const productsCollection = myDB.collection("products");
const bidsCollection = myDB.collection('bids');
const userCollection = myDB.collection('users')

// users api
app.post('/users',async(req,res)=>{
  const newUser = req.body;
  const email = req.body.email;
  const query = {email:email}
  const existingEmail = await userCollection.findOne(query)
  if(existingEmail){
    res.send('user already exist')
  }
  else{
  const result = await userCollection.insertOne(newUser)
  res.send(result)
  }


})
// latest-product api
app.get('/latest-product',async(req,res)=>{
  const cursor = productsCollection.find().sort({created_at: -1}).limit(6);
  const result = await cursor.toArray();
  res.send(result)

})

// products api


app.get('/products/:id',async(req,res)=>{
  const id = req.params.id;
  const query = {_id: new ObjectId(id)};
  const result = await productsCollection.findOne(query);
  res.send(result)
});


app.get('/products',async(req,res)=>{
     const email = req.query.email;
    const query = {};
    if(email){
      query.email=email;
    }

  const cursor = productsCollection.find(query)
  const result = await cursor.toArray();
  res.send(result)
    console.log(req.query)
 

});

app.post('/products',async(req,res)=>{
    const newProducts = req.body;
    const result = await productsCollection.insertOne(newProducts);
    res.send(result);
});

app.patch('/products/:id',async(req,res)=>{
  const id = req.params.id;
  const updatedCard = req.body;
    const query = { _id: new ObjectId(id) };
  const updateDoc = {
    $set:{
      name:updatedCard.name,
      price:updatedCard.price
    }
  }
  const result = await productsCollection.updateOne(query,updateDoc)
  res.send(result)
});

app.delete('/products:id',async(req,res)=>{
  const id = req.params.id;
const query = {_id: new ObjectId(id)}
const result = await productsCollection.deleteOne(query)
  res.send(result)
});


// bids related 
app.get('/bids',async(req,res)=>{
     const email = req.query.email;
    const query = {};
    if(email){
     query.buyer_email = email;
    }

  const cursor = bidsCollection.find(query)
  const result = await cursor.toArray();
  res.send(result)
    console.log(req.query)
 

});
app.get('/product/bids/:productId', async(req,res)=>{
  const productId = req.params.productId;
   const query = {product:productId};
   const cursor =  bidsCollection.find(query).sort({bid_price:-1})
   const result = await cursor.toArray();
   res.send(result)
  
});

app.delete('/bids/:id',async(req,res)=>{
  const id = req.params.id;
  const query = {_id:new ObjectId(id)};
  const result = await bidsCollection.deleteOne(query);
  res.send(result)


})




app.post('/bids',async(req,res)=>{
    const newProducts = req.body;
    const result = await bidsCollection.insertOne(newProducts);
    res.send(result);
});


// to get bids
// app.get('/bids',async(req,res)=>{
//   const query = {};
//    if (query.email) {
//       query.buyer_email = email;
//     }
//   const cursor = bidsCollection.find(query);
//   const result = await cursor.toArray();
//   res.send(result)
// })


app.delete('/bids/:id',async(req,res)=>{
  const id = req.params.id;
const query = {_id: new ObjectId(id)}
const result = await bidsCollection.deleteOne(query)
  res.send(result)
});
app.patch('/bids/:id',async(req,res)=>{
  const id = req.params.id;
  const updatedCard = req.body;
    const query = { _id: new ObjectId(id) };
  const updateDoc = {
    $set:{
      name:updatedCard.name,
      price:updatedCard.price
    }
  }
  const result = await bidsCollection.updateOne(query,updateDoc)
  res.send(result)
});





    await client.db("admin").command({ ping: 1 });
    console.log("simple desiDeals successfully connected to MongoDB!");
  } finally {
 
  }
}
run().catch(console.dir);

app.listen(port,()=>{
    console.log(`smart server is running on port ${port}`)
})