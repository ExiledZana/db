const fs = require('fs');
const { getRandomSender, getRandomReceiver, getRandomAmount } = require('./generator.js');
const { MongoClient } = require('mongodb');
const  dotenv = require('dotenv');
dotenv.config();

const uri = process.env.link;
const client = new MongoClient(uri);
const db = client.db('default_db');
const balanceCollection = db.collection('leo__accounts');


const balance = {};
let fileCount = countFiles();
const queue = [];

async function wait(){
  try{
    await client.connect();
  }
  catch(err){
    console.error(err);
  }
}

async function generateRandom() {
  const sender = getRandomSender();
  const receiver = getRandomReceiver();
  const amount = getRandomAmount();
  const currentDate = new Date();
  const comission = Math.round(amount * 0.01);
  const total = amount + comission;

  const balanceSender = await balanceCollection.findOne({ id: sender });
  const balanceReceiver = await balanceCollection.findOne({ id: receiver });


  if (balanceSender === null || balanceReceiver === null) {
    fullBalanceScan(sender);
    fullBalanceScan(receiver);
    createBalanceFile(sender);
    createBalanceFile(receiver);
  }

  if (balanceSender === null){
    fullBalanceScan(sender);
    createBalanceFile(sender);
  }

  if (balanceReceiver === null) {
    fullBalanceScan(receiver);
    createBalanceFile(receiver);
  }

  parseBalance(sender);
  parseBalance(receiver);
  transaction(sender, receiver, amount, comission, currentDate, total);
  return [sender, receiver];
}

async function createBalanceFile(person){
  balanceCollection.insertOne({
    id: person,
    balance: 500
  })
}

async function fullBalanceScan(person){
  let currentBalance = 0;

  const documents = await balanceCollection.find({ id: person }).toArray();
  documents.forEach((document) => {
    if (document.sender === person) {
      currentBalance -= document.amount;
      currentBalance -= document.commission;
    }
    
    if (document.receiver === person) {
      currentBalance += document.amount;
    }
  });

  balance[person] = currentBalance;
}

async function parseBalance(person) {
  if (typeof balance[person] === 'undefined'){
    const balanceCheck = await balanceCollection.findOne({ id: person });
    balance[person] = balanceCheck.balance;
  }
  else {
    return;
  }
}

async function countFiles() {
 const testDoc = await balanceCollection.find().sort({ id: -1});
 return testDoc.id;

}

function transaction(sender, receiver, amount, comission, currentDate, total){
  if (balance[sender] < total) {
    console.log(`${sender}'s balance is too low. Current Balance: ${balance[sender]}. Required amount: ${total}`);
    return;
  }

  if (sender === receiver) {
    console.log(`Mr. ${sender}, you cannot send tokens to yourself.`);
    return;
  }

  const data = {
    id: fileCount,
    sender: sender,
    receiver: receiver,
    amount: amount,
    type: 'transfer',
    date: currentDate,
    comission: comission
  };

  queue.push(data);
  console.log(`Successful operation: ${amount} sent from ${sender} to ${receiver}. Comission is ${comission}.`);


  balance[sender] -= total;
  balance[receiver] += amount;
  fileCount++;
}

async function saveBalance(){
  Object.keys(balance).forEach(async key => {    
    await balanceCollection.updateOne({ id: key }, { $set: {balance: balance[key]} })
    console.log(`New user ${key} balance = ${balance[key]}`);
    })
    await client.close();

  };



async function question (){
  const readline = require('readline');
  const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

  rl.question('Enter the number of times to generate a transaction: ', (answer) => {
  const numberOfTimes = parseInt(answer);
  if (!isNaN(numberOfTimes)) {
    for (let i = 0; i < numberOfTimes; i++) {
      generateRandom();
    }
  } else {
    console.log('Please enter a number.');
  }
  rl.close();
  saveTrans()
})}

async function saveTrans(){
    try{
          
        const result = await db.collection('leo__transactions').insertMany(queue);
        console.log(`${result.insertedCount} transactions were added to database`)
        }

    catch(err){
        console.error(err)
    }
}

wait();
question ();
saveBalance();
