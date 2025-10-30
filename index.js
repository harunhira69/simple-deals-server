const express = require('express');
const app = express()
const cors = require('cors');
const port = process.env.PORT||3000;
app.use(cors());
app.use(express.json());
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = "mongodb+srv://simpleDesiDB:9Pkhiht30KSWEdKh@cluster0.irtmkrl.mongodb.net/?appName=Cluster0";

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


app.get('/products/:id',async(req,res)=>{
  const id = req.params.id;
  const query = {_id: new ObjectId(id)};
  const result = await productsCollection.findOne(query);
  res.send(result)
});


app.get('/products',async(req,res)=>{
  const cursor = productsCollection.find();
  const result = await cursor.toArray();
  res.send(result)
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
})



    await client.db("admin").command({ ping: 1 });
    console.log("simple desiDeals successfully connected to MongoDB!");
  } finally {
 
  }
}
run().catch(console.dir);

app.listen(port,()=>{
    console.log(`smart server is running on port ${port}`)
})