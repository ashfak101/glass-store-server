const { MongoClient, Admin } = require('mongodb');
const express = require('express')
const cors= require('cors')
const app = express()
require('dotenv').config()
const ObjectId =require('mongodb').ObjectId;
const port = process.env.PORT || 5000
const admin = require("firebase-admin");

//connect to firebase

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});


//Middleware
app.use(cors())
app.use(express.json());
// ---------------//
// Connect To DataBase
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.d7g1b.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
// console.log(uri);
// creating api


// 
      async function verifyToken (req,res,next){
            if(req.headers?.authorization?.startsWith('Bearer ')) {
              const token=req.headers.authorization.split(' ')[1];
              try{
                  const decodedUser= await admin.auth().verifyIdToken(token);
                  req.decodedEmail=decodedUser.email
              }
              catch{

              }
            }       
          next()
      }

async function run(){
          try{  
                await client.connect();

                const   database = client.db("glassStore");
                const   productsCollection = database.collection("products")
                const   ordersCollection = database.collection("orders")
                const   usersCollection = database.collection("users")
                const  reviewCollection=database.collection("reviews")
                //Get The APi
                app.get('/products',async(req,res)=>{
                  const cursor = productsCollection.find({})
                  const products =await cursor.toArray();
                  res.send(products)
                })
                  // Get Buying Product
                app.get('/products/:id',async(req,res)=>{
                  const id =req.params.id
                  const query={_id: ObjectId(id)}
                  const result = await productsCollection.findOne(query);
                  res.json(result)
                })
                app.delete('/products/:id',async(req,res)=>{
                  const id =req.params.id;
                  const  query ={_id:ObjectId(id)}
                  const result =await  productsCollection.deleteOne(query)
                  res.json(result)
                })

                // ----Post Method
                app.post('/products',async(req,res)=>{
                  const product = req.body;
                  const result = await productsCollection.insertOne(product)
                  
                  res.json(result);
                })
                // ---------------------------
                app.get('/orders',async(req,res)=>{
                  const cursor = ordersCollection.find({})
                  const orders=await cursor.toArray();
                  res.json(orders)
                })
                
                app.get('/orders/:email',async(req,res)=>{
                  const email=req.params.email;
                  const query={email:email}
                  const cursor =ordersCollection.find(query)
                  const result =await cursor.toArray();
                  res.json(result)
                })
                
                app.post('/orders',async(req,res)=>{
                  const order=req.body;
              
                  order.status='pending';
                  const result=await ordersCollection.insertOne(order)
                  res.json(result)

                })
                // 
                app.delete('/orders/:id',async(req,res)=>{
                  const id =req.params.id;
                  const  query ={_id:ObjectId(id)}
                  const result =await ordersCollection.deleteOne(query)
                  res.json(result)
                })
                app.put('/orders/:id',async(req,res)=>{
                  const id =req.params.id;
                  
                  const  query ={_id:ObjectId(id)}
                  
                  const order =await ordersCollection.findOne(query)
                  const option={upsert:true};
                
                const updoc={
                 $set:{status:'Shipped'}
                }
                const result =await ordersCollection.updateOne(order,updoc,option)

                  res.json(result)
                })
                // ----------
                  app.get('/users/:email',async(req,res)=>{
                    const email =req.params.email;
                    const query ={email:email}
                    const user =await usersCollection.findOne(query)
                    let isAdmin=false;
                    if(user?.role === 'admin'){
                      isAdmin=true
                    }
                    res.json({admin:isAdmin})
                  })
                // -----------
                app.post('/users',async(req,res)=>{
                  const user=req.body;
                  const result=await usersCollection.insertOne(user)
                  res.json(result)
                })
                // ----------
                app.put('/users',verifyToken,async(req,res)=>{
                  const user=req.body;
                  const requestPerson =req.decodedEmail

                  if(requestPerson){
                    const requestPersonAccount=await usersCollection.findOne({email:requestPerson});
                    if(requestPersonAccount.role==='admin'){
                      const filter ={email:user.email}
                      const upDoc ={$set:{role:'admin'}}
                      const result =await usersCollection.updateOne(filter,upDoc);
                      res.json(result)
                    }
                  }

                    else{
                      res.status(403).json({message:'Make Sure You have Admin access'})
                    }
                 
                })
                // 
                app.get('/reviews',async(req,res)=>{
                  const cursor = reviewCollection.find({})
                  const reviews=await cursor.toArray();
                  res.send(reviews)
                })
                app.post('/reviews',async(req,res)=>{
                  const reviews = req.body;
                  const result = await reviewCollection.insertOne(reviews)
                  
                  res.json(result);
                })

          }
          finally{
            // await client.close();
          }
} 
run().catch(console.dir);

//--------------------------------///
app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
})