module.exports = {
    getRandomSender,
    getRandomReceiver,
    getRandomAmount
  };


function getRandomSender() {
    return Math.floor(Math.random() * 10) + 1;
}

function getRandomReceiver() {
    return Math.floor(Math.random() * 10) + 1;
}

function getRandomAmount() {
    return Math.floor(Math.random() * 700) + 1;
}