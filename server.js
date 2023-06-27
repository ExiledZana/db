import express from 'express';
import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const uri = process.env.link;
const client = new MongoClient(uri);
const db = client.db('default_db');
const app = express();
const port = 3000;

app.use(express.json());

app.post('/newuser', async (req, res) => {
  try{
    await client.connect();
    const newUser = await req.body.user;
    const newBalance = await req.body.balance;
    const newUserNumber = parseInt(newUser);
    const newBalanceNumber = parseInt(newBalance);
    await db.collection('leo__accounts').insertOne({ id: newUserNumber, balance: newBalanceNumber });
    console.log('Document inserted successfully')

  }

  catch(err){
    console.error(err);
    res.status(500).send('An error occurred');
  }

  finally{
    await client.close();
    console.log('Disconnected from MongoDB');
  }
})





  app.get('/users/:userId', async (req, res) => {

    try{
      await client.connect();
      console.log('Connected to MongoDB');
      const userId = req.params.userId;
      const requestId = parseInt(userId);
      const foundUser = await db.collection('leo__accounts').find({id: requestId}).toArray();
      const changeUser = foundUser.map(obj => {
        const finalUser = { ...obj };
        delete finalUser._id;
        return finalUser;
      });

      const userData = {
        data: changeUser
      }
      console.log(userData.data);
      res.send(userData.data);
    }

    catch(err){
        console.error(err);
        res.status(500).send('An error occurred');
    }

    finally{
        await client.close();
        console.log('Disconnected from MongoDB');
    }
})


app.get('/users', async (req, res) => {

  try{
    await client.connect();
    console.log('Connected to MongoDB');
    const { limit, offset } = req.query;
    const limitValue = parseInt(limit);
    const offsetValue = parseInt(offset);
    const foundUsers = await db.collection('leo__accounts').find().skip(offsetValue).limit(limitValue).toArray();
    const changeUsers = foundUsers.map(obj => {
      const finalUsers = { ...obj };
      delete finalUsers._id;
      return finalUsers;
    });

    
    const usersData = {
      data: changeUsers
    }

    
    console.log(usersData.data);
    res.json(usersData.data);
  }

  catch(err){
      console.error(err);
      res.status(500).send('An error occurred');
  }

  finally{
      await client.close();
      console.log('Disconnected from MongoDB');
  }
})





app.listen(port, () => {
    console.log(`Server is listening on port ${port}`);
  });
