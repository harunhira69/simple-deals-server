const express = require('express');
const app = express()
const cors = require('cors');
require('dotenv').config()
const jwt = require('jsonwebtoken');
const port = process.env.PORT||3000;



const admin = require("firebase-admin");

const serviceAccount = require("./smart-deals-b92ea-firebase-adminsdk.json")

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});




// middleware
app.use(cors());
app.use(express.json());

const logger = (req,res,next)=>{
  console.log('logging Information');
  next()
}

const verifyFirebaseToken = async(req,res,next)=>{
  if(!req.headers.authorization){

    return res.status(401).send({message:'unauthorized access'})
  }
  const token = req.headers.authorization.split(' ')[1]
  if(!token){
       return res.status(401).send({message:'unauthorized access'})
  }
  try{
   const tokenInfo =  await admin.auth().verifyIdToken(token)
   req.token_email = tokenInfo.email;
   console.log('after token validation',tokenInfo)
     next()
  }
  catch{
return res.status(401).send({message:'unauthorized access'})
  }
 
}

// const verifyJwtToken = async(req,res,next)=>{
//   const authorization = req.headers.authorization;
//   if(!authorization){
//     return res.status(401).send({message:'unauthorized access'})
//   }
//   const token = authorization.split(" ")[1];
//   if(!token){
//         return res.status(401).send({message:'unauthorized access'})
//   }
//   jwt.verify(token,process.env.JWT_SECRET,(err,decode)=>{
//     if(err){
//          return res.status(401).send({message:'unauthorized access'})
//     }
//     console.log('after decoded',decode)
//     next()

//   })
// }



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

// JWT Related Api

app.post('/getToken',(req,res)=>{
  const loggedUser = req.body;
  const token =jwt.sign({
  email:loggedUser
}, process.env.JWT_SECRET, { expiresIn: '1h' });
res.send({token:token})

})


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

app.post('/products', verifyFirebaseToken,async(req,res)=>{
  console.log('after axios secure',req.headers)
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



// app.get('/bids',verifyJwtToken, async(req,res)=>{
//   const email = req.query.email;
//   const query ={};
//   if(email){
//     query.buyer_email = email; 
    
//   }
//   const cursor = bidsCollection.find(query);
//   const result =await cursor.toArray();
//   res.send(result)

// })

// bids with firebase verify
app.get('/bids',logger,verifyFirebaseToken, async(req,res)=>{
  console.log('headed',req.headers)
     const email = req.query.email;
     const token_email = req.token_email;

    const query = {};
    if(email){
      if(email !== token_email){
        return res.status(403).send({message:'Forbidden access'})
      }
     query.buyer_email = email;
    }

  const cursor = bidsCollection.find(query)
  const result = await cursor.toArray();
  res.send(result)
    console.log(req.query)
 

});
app.get('/product/bids/:productId',verifyFirebaseToken, async(req,res)=>{
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